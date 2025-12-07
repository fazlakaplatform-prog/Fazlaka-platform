"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaReply, FaTrash } from "react-icons/fa";
import { Session } from "next-auth";
import Link from "next/link";

// Define the Comment interface
interface Comment {
  _id?: string;
  content: string;
  userId?: string;
  email?: string;
  name?: string;
  userFirstName?: string;
  userLastName?: string;
  userImageUrl?: string;
  createdAt?: string;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  currentUser: Session["user"] | null;
  contentId: string;
  type: "article" | "episode";
}

export default function CommentItem({ 
  comment, 
  onReply, 
  onDelete, 
  currentUser,
  contentId,
  type
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newReplyAdded, setNewReplyAdded] = useState(false);
  
  const createdAt = comment.createdAt ? new Date(comment.createdAt) : new Date();
  const isOwner = currentUser && (
    comment.userId === currentUser.id || 
    comment.email === currentUser.email
  );
  
  const getDisplayName = () => {
    if (comment.userFirstName && comment.userLastName) {
      return `${comment.userFirstName} ${comment.userLastName}`;
    }
    return comment.name || "مستخدم";
  };
  
  const getUserImage = (): string => {
    if (comment.userImageUrl) {
      return comment.userImageUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=8b5cf6&color=fff`;
  };
  
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    setReplying(true);
    try {
      await onReply(comment._id!, replyContent);
      setReplyContent("");
      setShowReplyForm(false);
      setNewReplyAdded(true);
      if (!showReplies) {
        setShowReplies(true);
      }
      // إعادة تعيين الحالة بعد فترة
      setTimeout(() => setNewReplyAdded(false), 3000);
    } catch (error) {
      console.error("Error replying to comment:", error);
    } finally {
      setReplying(false);
    }
  };
  
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(comment._id!);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };
  
  // تحديد رابط الملف الشخصي - تم التعديل
  const getProfileLink = () => {
    // إذا كان هناك userId، استخدم المسار الديناميكي
    if (comment.userId) {
      return `/users/${comment.userId}`;
    }
    // إذا لم يكن هناك userId ولكن هناك بريد إلكتروني، استخدمه كبديل
    if (comment.email) {
      return `/users?email=${encodeURIComponent(comment.email)}`;
    }
    // رابط افتراضي إذا لم تتوفر معلومات
    return "/users";
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 mb-4 border ${
        newReplyAdded 
          ? 'border-green-300 dark:border-green-700' 
          : 'border-gray-100 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {/* إضافة رابط حول صورة المستخدم */}
          <Link href={getProfileLink()} className="block hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-700 cursor-pointer">
              <Image
                src={getUserImage()}
                alt={getDisplayName()}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        </div>
        
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-1">
            {/* إضافة رابط حول اسم المستخدم أيضاً */}
            <Link href={getProfileLink()} className="hover:underline">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">{getDisplayName()}</h4>
            </Link>
            <div className="flex items-center gap-2">
              <time dateTime={createdAt.toISOString()} className="text-xs text-gray-500 dark:text-gray-400">
                {createdAt.toLocaleDateString('ar-EG', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
              {isOwner && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="حذف"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-2">{comment.content}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <FaReply className="text-xs" />
              رد
            </button>
            
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showReplies ? 'إخفاء الردود' : 'عرض الردود'} ({comment.replies.length})
              </button>
            )}
          </div>
          
          {showReplyForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <form onSubmit={handleReply}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  className="w-full border p-2 rounded mb-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  placeholder={`اكتب ردك على ${getDisplayName()}...`}
                  required
                  disabled={replying}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReplyForm(false)}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={replying || !replyContent.trim()}
                    className={`px-3 py-1 text-sm rounded text-white ${
                      replying || !replyContent.trim()
                        ? "bg-gray-400 dark:bg-gray-600"
                        : "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
                    } transition-colors`}
                  >
                    {replying ? "جاري الرد..." : "إرسال الرد"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
          
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  onReply={onReply}
                  onDelete={onDelete}
                  currentUser={currentUser}
                  contentId={contentId}
                  type={type}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              هل أنت متأكد من حذف هذا التعليق؟
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`px-3 py-1 text-sm rounded text-white ${
                  deleting
                    ? "bg-gray-400 dark:bg-gray-600"
                    : "bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600"
                } transition-colors`}
              >
                {deleting ? "جاري الحذف..." : "حذف"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}