"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FaReply, FaTrash, FaUserCircle, FaClock, FaHeart, FaEdit, FaFlag, FaEllipsisV, FaTimes, FaChevronDown, FaChevronUp, FaCheckCircle, FaThumbsDown, FaExclamationTriangle } from "react-icons/fa";
import { Session } from "next-auth";
import Link from "next/link";

interface Comment { id: string; content: string; userId?: string | null; isEdited?: boolean; createdAt: string; userRelation?: { id: string; name: string | null; image: string | null; role?: string } | null; userFirstName?: string | null; userLastName?: string | null; userImageUrl?: string | null; name?: string | null; likes?: { id: string }[]; dislikes?: { id: string }[]; _count?: { likes: number; dislikes: number }; articleId?: string | null; episodeId?: string | null; replies?: Comment[]; }
interface CommentItemProps { comment: Comment; onReply: (parentId: string, content: string) => Promise<void>; onDelete: (commentId: string) => Promise<void>; onUpdate: (commentId: string, content: string) => Promise<void>; onLike: (commentId: string) => Promise<void>; onDislike: (commentId: string) => Promise<void>; onReport: (commentId: string, reason: string) => Promise<void>; currentUser: Session["user"] | null; depth?: number; }

export default function CommentItem({ comment, onReply, onDelete, onUpdate, onLike, onDislike, onReport, currentUser, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // حالة نافذة الحذف
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = currentUser && comment.userId === currentUser.id;
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'OWNER';
  const likeCount = comment._count?.likes || 0;
  const dislikeCount = comment._count?.dislikes || 0;
  const isLiked = comment.likes?.some(l => l.id === currentUser?.id);
  const isDisliked = comment.dislikes?.some(l => l.id === currentUser?.id);
  const replyCount = comment.replies?.length || 0;

  const getDisplayName = () => comment.userRelation?.name || (comment.userFirstName && comment.userLastName ? `${comment.userFirstName} ${comment.userLastName}` : comment.name || "مستخدم");
  const getUserImage = () => comment.userRelation?.image || comment.userImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=6366f1&color=fff`;

  const handleAction = async (action: () => Promise<void>) => {
    setIsSubmitting(true);
    try { await action(); } catch (e) { console.error(e); } finally { setIsSubmitting(false); setShowMenu(false); setShowDeleteModal(false); }
  };

  const handleReportSubmit = async () => {
    if (reportReason.trim().length < 3) return;
    await handleAction(() => onReport(comment.id, reportReason));
    setShowReportModal(false);
    setReportReason("");
    alert("تم إرسال البلاغ");
  };
  
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString); const now = new Date(); const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "الآن";
    const intervals: { [key: string]: number } = { 'سنة': 31536000, 'شهر': 2592000, 'أسبوع': 604800, 'يوم': 86400, 'ساعة': 3600, 'دقيقة': 60 };
    for (const [unit, sec] of Object.entries(intervals)) { const interval = Math.floor(seconds / sec); if (interval >= 1) return `منذ ${interval} ${unit}`; }
    return "الآن";
  };

  return (
    <div className={`relative ${depth > 0 ? 'mr-6 border-r-2 border-indigo-100 dark:border-indigo-900/50 pr-3' : ''}`}>
      {/* التعليق الرئيسي */}
      <div className={`group bg-white dark:bg-gray-800 rounded-xl p-3 ${depth === 0 ? 'border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md' : ''} transition-all duration-200 mt-2`}>
        <div className="flex gap-3">
          <Link href={comment.userId ? `/users/${comment.userId}` : '#'}>
            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-800 ring-indigo-200 dark:ring-indigo-900 flex-shrink-0">
                <Image src={getUserImage()} alt={getDisplayName()} fill className="object-cover" />
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={comment.userId ? `/users/${comment.userId}` : '#'} className="hover:underline">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">{getDisplayName()}</h4>
                </Link>
                {comment.userRelation?.role && ['ADMIN', 'OWNER'].includes(comment.userRelation.role) && (
                  <span className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                    <FaCheckCircle className="w-2.5 h-2.5" /> {comment.userRelation.role === 'OWNER' ? 'المالك' : 'مشرف'}
                  </span>
                )}
                <span className="text-[10px] text-gray-400 flex items-center gap-1"><FaClock className="w-2.5 h-2.5" />{timeAgo(comment.createdAt)}</span>
                {comment.isEdited && <span className="text-[9px] text-gray-400 italic">(معدل)</span>}
              </div>

              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaEllipsisV size={12} />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute left-0 top-full mt-1 w-36 bg-white dark:bg-gray-900 rounded-lg shadow-xl border dark:border-gray-700 z-20 overflow-hidden">
                      {isOwner && (
                        <>
                          <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><FaEdit /> تعديل</button>
                          <button onClick={() => { setShowDeleteModal(true); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><FaTrash /> حذف</button>
                        </>
                      )}
                      {!isOwner && currentUser && (
                        <button onClick={() => { setShowReportModal(true); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"><FaFlag /> إبلاغ</button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {isEditing ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1">
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows={2} />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">إلغاء</button>
                  <button onClick={() => handleAction(() => onUpdate(comment.id, editContent))} disabled={isSubmitting || !editContent.trim()} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">حفظ التعديل</button>
                </div>
              </motion.div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
            )}

            {/* أزرار التفاعل */}
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-50 dark:border-gray-700/50">
              <button onClick={() => currentUser && onLike(comment.id)} disabled={!currentUser}
                className={`flex items-center gap-1.5 text-xs transition-all duration-200 group ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500 dark:text-gray-400'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                <motion.div whileTap={{ scale: 1.3 }} className={`p-1 rounded-full ${isLiked ? 'bg-red-50 dark:bg-red-900/30' : 'group-hover:bg-red-50 dark:group-hover:bg-red-900/20'}`}>
                    <FaHeart className={`${isLiked ? 'fill-current' : ''}`} />
                </motion.div>
                <span className="font-medium">{likeCount}</span>
              </button>

              <button onClick={() => currentUser && onDislike(comment.id)} disabled={!currentUser}
                className={`flex items-center gap-1.5 text-xs transition-all duration-200 group ${isDisliked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500 dark:text-gray-400'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                <motion.div whileTap={{ scale: 1.3 }} className={`p-1 rounded-full ${isDisliked ? 'bg-blue-50 dark:bg-blue-900/30' : 'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'}`}>
                    <FaThumbsDown size={12} className={`${isDisliked ? 'fill-current' : ''}`} />
                </motion.div>
              </button>

              <button onClick={() => setShowReplyForm(!showReplyForm)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors ml-auto">
                <FaReply size={10} /> <span>رد</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* نموذج الرد */}
      <AnimatePresence>
        {showReplyForm && currentUser && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mr-4 mt-2">
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
              <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder={`الرد على ${getDisplayName()}...`} className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-gray-400" rows={2} />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setShowReplyForm(false)} className="px-3 py-1 text-xs text-gray-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">إلغاء</button>
                <button onClick={async () => { if(!replyContent.trim()) return; await onReply(comment.id, replyContent); setReplyContent(""); setShowReplyForm(false); setIsExpanded(true); }}
                  className="px-4 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 shadow-sm font-medium">إرسال</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* الردود */}
      {replyCount > 0 && (
        <div className="mt-1">
          <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 py-1 px-2 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors mb-1">
            {isExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
            <span>{isExpanded ? 'إخفاء الردود' : `عرض ${replyCount} ردود`}</span>
          </button>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1 overflow-hidden">
                {comment.replies?.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} onUpdate={onUpdate} onLike={onLike} onDislike={onDislike} onReport={onReport} currentUser={currentUser} depth={depth + 1} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* نافذة تأكيد الحذف */}
      <AnimatePresence>
          {showDeleteModal && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
                   <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700 text-center" onClick={e => e.stopPropagation()}>
                       <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                           <FaExclamationTriangle className="text-red-500 text-2xl" />
                       </div>
                       <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">تأكيد الحذف</h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">هل أنت متأكد من حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء.</p>
                       <div className="flex gap-3">
                           <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">إلغاء</button>
                           <button onClick={() => handleAction(() => onDelete(comment.id))} className="flex-1 px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm">حذف</button>
                       </div>
                   </motion.div>
               </motion.div>
          )}
      </AnimatePresence>

      {/* نافذة الإبلاغ */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl border dark:border-gray-700" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">الإبلاغ عن تعليق</h3>
                  <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="يرجى كتابة سبب البلاغ..." className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-orange-500 outline-none" rows={4} />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">إلغاء</button>
                <button onClick={handleReportSubmit} disabled={isSubmitting || reportReason.length < 3} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg shadow-sm disabled:opacity-50 font-medium">إرسال البلاغ</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}