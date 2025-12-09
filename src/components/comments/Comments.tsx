// app/components/Comments.tsx

"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaComment, FaReply, FaTrash } from "react-icons/fa";
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
  parentComment?: string;
  article?: string;
  episode?: string;
}

// Define the User interface - updated to allow null values
interface User {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

interface CommentsProps {
  contentId: string;
  type: "article" | "episode";
}

interface CommentFormData {
  content: string;
  name: string;
  email: string;
  userId?: string;
  userFirstName?: string;
  userLastName?: string;
  userImageUrl?: string;
  parentComment?: string;
  article?: string;
  episode?: string;
}

export default function Comments({ contentId, type }: CommentsProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // تعريف دالة fetchComments باستخدام useCallback
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?${type}Id=${contentId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  }, [type, contentId]);

  // إعداد اتصال SSE
  useEffect(() => {
    const setupEventSource = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(`/api/comments/stream?contentId=${contentId}&type=${type}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'update') {
            console.log('New comments detected, fetching...');
            fetchComments();
            setSuccessMsg("تمت إضافة تعليقات جديدة");
            setTimeout(() => setSuccessMsg(null), 3000);
          } else if (data.type === 'error') {
            console.error('Server reported an error:', data.message);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        eventSource.close();
        
        // محاولة إعادة الاتصال بعد فترة
        setTimeout(() => {
          console.log('Attempting to reconnect SSE...');
          setupEventSource();
        }, 5000);
      };
    };

    setupEventSource();

    // تنظيف الاتصال عند تفكيك المكون
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [contentId, type, fetchComments]);

  useEffect(() => {
    // تحميل التعليقات عند تحميل المكون
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (!content.trim()) {
      setErrorMsg("اكتب تعليقاً قبل الإرسال.");
      return;
    }

    if (status !== "authenticated" || !session?.user) {
      setErrorMsg("يجب تسجيل الدخول لكي تتمكن من إرسال تعليق.");
      return;
    }

    setLoading(true);

    try {
      const commentData: CommentFormData = {
        content,
        name: session.user.name || "مستخدم",
        email: session.user.email || "",
        userId: session.user.id,
        userFirstName: session.user.name?.split(' ')[0] || "",
        userLastName: session.user.name?.split(' ').slice(1).join(' ') || "",
        userImageUrl: session.user.image || "",
        [type]: contentId,
      };

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      if (response.ok) {
        setContent(""); // مسح حقل الإدخال
        // لا حاجة لتحديث التعليقات يدوياً، سيفعل SSE ذلك
        setSuccessMsg("جاري إرسال تعليقك...");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create comment");
      }
    } catch (err: unknown) {
      console.error("Error sending comment:", err);
      if (err instanceof Error) {
        setErrorMsg(`حدث خطأ غير متوقع أثناء الإرسال: ${err.message}`);
      } else {
        setErrorMsg("حدث خطأ غير متوقع أثناء الإرسال");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId: string, replyContent: string) => {
    if (status !== "authenticated" || !session?.user) {
      setErrorMsg("يجب تسجيل الدخول لكي تتمكن من الرد.");
      return;
    }

    try {
      const replyData: CommentFormData = {
        content: replyContent,
        name: session.user.name || "مستخدم",
        email: session.user.email || "",
        userId: session.user.id,
        userFirstName: session.user.name?.split(' ')[0] || "",
        userLastName: session.user.name?.split(' ').slice(1).join(' ') || "",
        userImageUrl: session.user.image || "",
        parentComment: parentId,
        [type]: contentId,
      };

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(replyData),
      });

      if (response.ok) {
        // لا حاجة لتحديث التعليقات يدوياً، سيفعل SSE ذلك
        setSuccessMsg("تم إرسال الرد بنجاح");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create reply");
      }
    } catch (err: unknown) {
      console.error("Error replying to comment:", err);
      if (err instanceof Error) {
        setErrorMsg(`حدث خطأ غير متوقع أثناء الإرسال: ${err.message}`);
      } else {
        setErrorMsg("حدث خطأ غير متوقع أثناء الإرسال");
      }
    }
  };

  const handleDelete = async (commentId: string) => {
    if (status !== "authenticated" || !session?.user) {
      setErrorMsg("يجب تسجيل الدخول لكي تتمكن من الحذف.");
      return;
    }

    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMsg("تم حذف التعليق بنجاح");
        // لا حاجة لتحديث التعليقات يدوياً، سيفعل SSE ذلك
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete comment");
      }
    } catch (err: unknown) {
      console.error("Error deleting comment:", err);
      if (err instanceof Error) {
        setErrorMsg(`حدث خطأ غير متوقع أثناء الحذف: ${err.message}`);
      } else {
        setErrorMsg("حدث خطأ غير متوقع أثناء الحذف");
      }
    }
  };

  const getCurrentUserImage = (): string => {
    if (session?.user?.image) {
      return session.user.image;
    }
    const displayName = session?.user?.name || "مستخدم";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff`;
  };

  const getCurrentUserDisplayName = () => {
    return session?.user?.name || "مستخدم";
  };

  // مكون فرعي للتعليق الواحد
  const CommentItem = ({ 
    comment, 
    onReply, 
    onDelete, 
    currentUser,
    contentId,
    type
  }: {
    comment: Comment;
    onReply: (parentId: string, content: string) => Promise<void>;
    onDelete: (commentId: string) => Promise<void>;
    currentUser: User | null;
    contentId: string;
    type: "article" | "episode";
  }) => {
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
    
    const handleReplySubmit = async (e: React.FormEvent) => {
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
    
    const handleDeleteComment = async () => {
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
    
    // تحديد رابط الملف الشخصي
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
                <form onSubmit={handleReplySubmit}>
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
                  onClick={handleDeleteComment}
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
  };

  return (
    <div className="mt-6 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          التعليقات ({comments.length})
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isConnected ? 'متصل' : 'غير متصل'}
          </span>
        </div>
      </div>
      
      {status !== "authenticated" && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="mb-2 text-blue-800 dark:text-blue-200">
            يجب تسجيل الدخول لكي تتمكن من إرسال تعليق.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            تسجيل الدخول
          </Link>
        </div>
      )}
      
      {status === "authenticated" && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Link href={`/users/${session?.user?.id}`} className="block hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-700 cursor-pointer">
                  <Image
                    src={getCurrentUserImage()}
                    alt={getCurrentUserDisplayName()}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
            </div>
            
            <div className="flex-grow">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full border p-3 rounded-lg mb-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="اكتب تعليقك هنا..."
                required
                disabled={loading}
                aria-label="تعليق"
              />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {errorMsg && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
                  )}
                  {successMsg && (
                    <p className="text-sm text-green-600 dark:text-green-400">{successMsg}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
                    loading || !content.trim()
                      ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                      : "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 shadow-md hover:shadow-lg"
                  }`}
                  aria-busy={loading}
                >
                  {loading ? "جاري الإرسال..." : "أرسل التعليق"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
      
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaComment className="text-4xl mx-auto mb-2 opacity-50" />
            <p>لا توجد تعليقات بعد.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onReply={handleReply}
              onDelete={handleDelete}
              currentUser={session?.user || null}
              contentId={contentId}
              type={type}
            />
          ))
        )}
      </div>
    </div>
  );
}