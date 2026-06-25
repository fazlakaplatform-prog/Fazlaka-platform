"use client";
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  FaTrash, FaBan, FaExclamationTriangle, FaEnvelope, FaSpinner, 
  FaComments, FaEdit, FaSearch, FaUser, FaNewspaper, FaPlay 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { pusherClient } from '@/lib/pusher';

interface User { id: string; name: string | null; email: string | null; image: string | null; role: string; }
interface Content { title: string; slug: string; }
interface CommentItem {
  id: string; content: string; createdAt: string; isEdited: boolean;
  userRelation: User | null; episode?: Content | null; article?: Content | null;
  _count?: { likes: number; replies: number };
}
interface Report {
  id: string; reason: string; createdAt: string;
  comment: CommentItem | null; // <= التعديل هنا: قد يكون null
  user: { name: string } | null; // المبلغ
}

export default function AdminCommentsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'all' | 'reported'>('all');
  const [data, setData] = useState<CommentItem[] | Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // حالات النوافذ والإدخال
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'episodes' | 'articles'>('all');
  const [editModal, setEditModal] = useState<{ id: string; content: string } | null>(null);
  const [actionModal, setActionModal] = useState<{ id: string; type: 'warn' | 'ban' | 'delete' } | null>(null);
  const [reason, setReason] = useState("");

  // جلب البيانات
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/admin/comments?';
      if (activeTab === 'reported') {
        url += 'tab=reported';
      } else {
        url += `tab=${filter}`;
        if (search) url += `&search=${search}`;
      }
      
      const res = await fetch(url);
      const result = await res.json();
      setData(result.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeTab, filter, search]);

  useEffect(() => {
    if (session) fetchData();
  }, [session, fetchData]);

  // الاستماع لتحديثات Pusher
  useEffect(() => {
    const channel = pusherClient.subscribe('admin-dashboard');
    channel.bind('refresh', () => {
      console.log("Admin data refreshed via Pusher");
      fetchData();
    });
    return () => { channel.unbind_all(); channel.unsubscribe(); };
  }, [fetchData]);

  // تنفيذ الإجراءات
  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(actionModal.id);
    
    try {
      const res = await fetch(`/api/admin/comments/${actionModal.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionModal.type, reason })
      });
      
      if (res.ok) {
        setActionModal(null);
        setReason("");
        fetchData();
      } else {
        alert("فشل في الإجراء");
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  // تحديث التعليق
  const handleEdit = async () => {
    if(!editModal) return;
    setActionLoading(editModal.id);
    try {
        await fetch(`/api/admin/comments/${editModal.id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'edit', newContent: editModal.content })
        });
        setEditModal(null);
        fetchData();
    } catch(e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const renderTabs = () => (
    <div className="flex gap-2 mb-6 border-b dark:border-gray-700 pb-4">
      <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
        <FaComments /> كل التعليقات
      </button>
      <button onClick={() => setActiveTab('reported')} className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${activeTab === 'reported' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
        <FaExclamationTriangle /> البلاغات
      </button>
    </div>
  );

  const renderFilters = () => (
    activeTab === 'all' && (
      <div className="flex flex-wrap gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <div className="flex-1 relative min-w-[200px]">
            <FaSearch className="absolute top-3 right-3 text-gray-400" />
            <input 
                type="text" 
                placeholder="ابحث في التعليقات أو أسماء المستخدمين..." 
                className="w-full p-2 pr-8 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <select 
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'episodes' | 'articles')}
        >
            <option value="all">الكل</option>
            <option value="episodes">الحلقات</option>
            <option value="articles">المقالات</option>
        </select>
      </div>
    )
  );

  const renderItem = (item: CommentItem | Report) => {
    const isReport = activeTab === 'reported';
    // التعامل مع حالة Report
    const comment = isReport ? (item as Report)?.comment : (item as CommentItem);
    const reportMeta = isReport ? (item as Report) : null;

    // --- إصلاح الخطأ هنا: التحقق من وجود التعليق ---
    if (!comment) {
      return (
        <motion.div 
          key={item.id} 
          layout 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
        >
          <div className="flex justify-between items-center">
            <div className="text-red-600 dark:text-red-400 text-sm font-medium">
                <FaExclamationTriangle className="inline ml-2" />
                تعليق محذوف (البلاغ رقم: {item.id})
            </div>
            {/* زر لحذف البلاغ لأن التعليق غير موجود */}
            <button 
                onClick={() => handleDirectDeleteReport(item.id)} 
                className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
                إزالة البلاغ
            </button>
          </div>
        </motion.div>
      );
    }

    // دالة مساعدة لحذف البلاغات التي لا تملك تعليقات
    const handleDirectDeleteReport = async (_reportId: string) => {
        if(!confirm("هل تريد حذف هذا البلاغ لعدم وجود التعليق؟")) return;
        // هنا تحتاج لـ Endpoint لحذف البلاغ، أو يمكنك إعادة استخدام action بحذر
        // للتبسيط سنقوم بعمل طلب DELETE مباشر إذا كان API يدعم ذلك أو تجاهلها
        alert("يتطلب هذا الإجراء API مخصص لحذف البلاغات");
    };

    return (
      <motion.div 
        key={item.id} 
        layout
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden"
      >
        {/* رأس التعليق */}
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center overflow-hidden">
                    {comment.userRelation?.image ? (
                        <img src={comment.userRelation.image} className="w-full h-full object-cover" alt="User" />
                    ) : <FaUser className="text-indigo-500" />}
                </div>
                <div>
                    <h4 className="font-bold text-sm dark:text-white">{comment.userRelation?.name || "مجهول"}</h4>
                    <p className="text-xs text-gray-500">
                        {comment.episode && <span className="text-blue-500 flex items-center gap-1"><FaPlay size={10}/> {comment.episode.title}</span>}
                        {comment.article && <span className="text-green-500 flex items-center gap-1"><FaNewspaper size={10}/> {comment.article.title}</span>}
                    </p>
                </div>
            </div>
            <div className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleDateString('ar-EG')}
            </div>
        </div>

        {/* محتوى البلاغ (إذا وجد) */}
        {reportMeta && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 text-xs text-red-600 dark:text-red-300 border-b dark:border-gray-700">
                <strong>سبب البلاغ:</strong> {reportMeta.reason} <br/>
                <span className="opacity-70">بواسطة: {reportMeta.user?.name || "مجهول"}</span>
            </div>
        )}

        {/* محتوى التعليق */}
        <div className="p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {comment.content}
        </div>

        {/* إجراءات */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap gap-2 justify-end border-t dark:border-gray-700">
            <button onClick={() => setEditModal({ id: comment.id, content: comment.content })} className="text-xs px-3 py-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1 transition-colors">
                <FaEdit /> تعديل
            </button>
            <button onClick={() => setActionModal({ id: comment.id, type: 'delete' })} className="text-xs px-3 py-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors">
                <FaTrash /> حذف
            </button>
            <button onClick={() => setActionModal({ id: comment.id, type: 'warn' })} className="text-xs px-3 py-1.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 dark:bg-orange-900/50 dark:text-orange-300 flex items-center gap-1 transition-colors">
                <FaEnvelope /> تنبيه
            </button>
            <button onClick={() => setActionModal({ id: comment.id, type: 'ban' })} className="text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 flex items-center gap-1 transition-colors">
                <FaBan /> حظر
            </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white flex items-center gap-3">
        <FaComments className="text-indigo-500" />
        إدارة التعليقات والتفاعلات
      </h1>

      {renderTabs()}
      {renderFilters()}

      {loading ? (
        <div className="flex justify-center py-10"><FaSpinner className="animate-spin text-3xl text-indigo-500" /></div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl text-gray-500">
            لا توجد بيانات للعرض حالياً.
        </div>
      ) : (
        <div className="space-y-4">
            <AnimatePresence>
                {data.map(item => renderItem(item))}
            </AnimatePresence>
        </div>
      )}

      {/* نافذة التعديل */}
      <AnimatePresence>
        {editModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-xl">
                    <h3 className="font-bold mb-4 dark:text-white">تعديل التعليق</h3>
                    <textarea 
                        value={editModal.content} 
                        onChange={(e) => setEditModal({ ...editModal, content: e.target.value })}
                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 h-32 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2 mt-4 justify-end">
                        <button onClick={() => setEditModal(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded dark:text-white transition-colors">إلغاء</button>
                        <button onClick={handleEdit} disabled={actionLoading === editModal.id} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50">
                            {actionLoading === editModal.id ? <FaSpinner className="animate-spin" /> : "حفظ التعديل"}
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة الإجراءات */}
      <AnimatePresence>
        {actionModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-xl">
                    <h3 className="font-bold mb-4 capitalize dark:text-white">
                        {actionModal.type === 'delete' ? 'حذف التعليق' : actionModal.type === 'warn' ? 'تنبيه المستخدم' : 'حظر المستخدم'}
                    </h3>
                    
                    {actionModal.type !== 'delete' && (
                        <div className="mb-4">
                            <label className="block text-sm mb-1 dark:text-gray-300">السبب / الرسالة:</label>
                            <textarea 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 h-24 outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="اكتب سبب الإجراء هنا..."
                            />
                        </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setActionModal(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded dark:text-white transition-colors">إلغاء</button>
                        <button onClick={handleAction} disabled={actionLoading === actionModal.id} className={`px-4 py-2 text-white rounded transition-colors disabled:opacity-50 ${actionModal.type === 'ban' ? 'bg-red-600 hover:bg-red-700' : actionModal.type === 'warn' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-800 hover:bg-gray-900'}`}>
                            {actionLoading === actionModal.id ? <FaSpinner className="animate-spin" /> : "تأكيد"}
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}