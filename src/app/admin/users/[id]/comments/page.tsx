"use client"

import { useState, useEffect, useCallback, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  MessageSquare, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Ban, 
  Loader2,
  Calendar,
  ThumbsUp,
  MessageCircleReply
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/Language/LanguageProvider"

// --- Interfaces ---
interface ContentInfo {
  id: string;
  title: string;
  slug: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  isEdited: boolean;
  episode?: ContentInfo | null;
  article?: ContentInfo | null;
  _count?: {
    likes: number;
    replies: number;
  };
}

interface Params {
  id: string; // The ID of the user being monitored
}

// --- Translations ---
const translations = {
  ar: {
    title: "إدارة تعليقات المستخدم",
    back: "العودة للملف الشخصي",
    loading: "جاري التحميل...",
    noComments: "لا توجد تعليقات لهذا المستخدم",
    edit: "تعديل",
    delete: "حذف",
    warn: "تنبيه",
    ban: "حظر",
    cancel: "إلغاء",
    save: "حفظ",
    confirm: "تأكيد",
    reasonLabel: "السبب / الرسالة:",
    reasonPlaceholder: "اكتب سبب الإجراء هنا...",
    actionTitle: "تنفيذ إجراء",
    onArticle: "على مقال:",
    onEpisode: "على حلقة:",
    likes: "إعجاب",
    replies: "ردود",
    edited: "تم التعديل",
    deleteConfirm: "هل أنت متأكد من حذف هذا التعليق؟",
    actionSuccess: "تم تنفيذ الإجراء بنجاح",
    actionError: "حدث خطأ أثناء تنفيذ الإجراء"
  },
  en: {
    title: "Manage User Comments",
    back: "Back to Profile",
    loading: "Loading...",
    noComments: "No comments found for this user",
    edit: "Edit",
    delete: "Delete",
    warn: "Warn",
    ban: "Ban",
    cancel: "Cancel",
    save: "Save",
    confirm: "Confirm",
    reasonLabel: "Reason / Message:",
    reasonPlaceholder: "Write the reason here...",
    actionTitle: "Take Action",
    onArticle: "On Article:",
    onEpisode: "On Episode:",
    likes: "Likes",
    replies: "Replies",
    edited: "Edited",
    deleteConfirm: "Are you sure you want to delete this comment?",
    actionSuccess: "Action completed successfully",
    actionError: "An error occurred"
  }
}

export default function UserCommentsPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = use(params)
  const targetUserId = resolvedParams.id
  
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Modal States
  const [editModal, setEditModal] = useState<{ id: string; content: string } | null>(null)
  const [actionModal, setActionModal] = useState<{ id: string; type: 'warn' | 'ban' | 'delete' } | null>(null)
  const [reason, setReason] = useState("")

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/users/${targetUserId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error("Error fetching comments", error)
    } finally {
      setLoading(false)
    }
  }, [targetUserId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // --- Actions Handlers ---
  const handleAction = async () => {
    if (!actionModal) return
    setActionLoading(actionModal.id)
    
    try {
      const res = await fetch(`/api/admin/comments/${actionModal.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionModal.type, reason })
      })
      
      if (res.ok) {
        setActionModal(null)
        setReason("")
        // إذا كان الحذف، أزل التعليق من القائمة محلياً
        if (actionModal.type === 'delete') {
            setComments(prev => prev.filter(c => c.id !== actionModal.id))
        } else {
            fetchComments() // تحديث القائمة في حالة الحظر أو التنبيه
        }
      } else {
        alert(t.actionError)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleEdit = async () => {
    if(!editModal) return
    setActionLoading(editModal.id)
    try {
        const res = await fetch(`/api/admin/comments/${editModal.id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'edit', newContent: editModal.content })
        });
        if (res.ok) {
            setComments(prev => prev.map(c => c.id === editModal.id ? {...c, content: editModal.content, isEdited: true} : c))
            setEditModal(null);
        }
    } catch(e) { console.error(e); }
    finally { setActionLoading(null); }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{comments.length} {language === 'ar' ? 'تعليق' : 'comments'}</p>
            </div>
          </div>

          <Link href={`/admin/users/${targetUserId}`}>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t.back}
            </motion.button>
          </Link>
        </motion.div>

        {/* Comments List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500">
            {t.noComments}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  {/* Comment Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {comment.episode ? (
                        <span>
                          <span className="text-blue-600 dark:text-blue-400">{t.onEpisode}</span>
                          <span className="font-medium mx-1">{comment.episode.title}</span>
                        </span>
                      ) : comment.article ? (
                        <span>
                          <span className="text-green-600 dark:text-green-400">{t.onArticle}</span>
                          <span className="font-medium mx-1">{comment.article.title}</span>
                        </span>
                      ) : (
                        "Unknown Content"
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(comment.createdAt)}
                      {comment.isEdited && <span className="italic">({t.edited})</span>}
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="p-5 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </div>

                  {/* Stats & Actions */}
                  <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/30 flex flex-wrap justify-between items-center gap-3 border-t border-gray-100 dark:border-gray-700">
                    {/* Stats */}
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {comment._count?.likes || 0} {t.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircleReply className="w-3 h-3" /> {comment._count?.replies || 0} {t.replies}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditModal({ id: comment.id, content: comment.content })}
                        className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> {t.edit}
                      </button>
                      <button 
                        onClick={() => setActionModal({ id: comment.id, type: 'delete' })}
                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> {t.delete}
                      </button>
                      <button 
                        onClick={() => setActionModal({ id: comment.id, type: 'warn' })}
                        className="text-xs px-3 py-1.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" /> {t.warn}
                      </button>
                      <button 
                        onClick={() => setActionModal({ id: comment.id, type: 'ban' })}
                        className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                      >
                        <Ban className="w-3 h-3" /> {t.ban}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-xl"
            >
              <h3 className="font-bold mb-4 dark:text-white text-lg">{t.edit}</h3>
              <textarea 
                value={editModal.content} 
                onChange={(e) => setEditModal({ ...editModal, content: e.target.value })}
                className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 h-32 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-2 mt-6 justify-end">
                <button 
                  onClick={() => setEditModal(null)} 
                  className="px-5 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl dark:text-white transition-colors font-medium"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleEdit} 
                  disabled={actionLoading === editModal.id} 
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                >
                  {actionLoading === editModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Modal (Delete/Warn/Ban) */}
      <AnimatePresence>
        {actionModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-xl"
            >
              <h3 className="font-bold mb-4 capitalize dark:text-white text-lg flex items-center gap-2">
                {actionModal.type === 'delete' && <><Trash2 className="w-5 h-5 text-red-500" /> {t.delete}</>}
                {actionModal.type === 'warn' && <><AlertTriangle className="w-5 h-5 text-orange-500" /> {t.warn}</>}
                {actionModal.type === 'ban' && <><Ban className="w-5 h-5 text-red-500" /> {t.ban}</>}
              </h3>
              
              {actionModal.type !== 'delete' && (
                <div className="mb-4">
                  <label className="block text-sm mb-2 font-medium dark:text-gray-300">{t.reasonLabel}</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 h-24 outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    placeholder={t.reasonPlaceholder}
                  />
                </div>
              )}

              {actionModal.type === 'delete' && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t.deleteConfirm}</p>
              )}

              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => { setActionModal(null); setReason(""); }} 
                  className="px-5 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl dark:text-white transition-colors font-medium"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleAction} 
                  disabled={actionLoading === actionModal.id} 
                  className={`px-5 py-2 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px] ${
                    actionModal.type === 'ban' ? 'bg-red-600 hover:bg-red-700' : 
                    actionModal.type === 'warn' ? 'bg-orange-500 hover:bg-orange-600' : 
                    'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                >
                  {actionLoading === actionModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : t.confirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}