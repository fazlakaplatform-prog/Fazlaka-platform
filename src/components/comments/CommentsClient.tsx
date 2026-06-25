"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaPaperPlane, FaSpinner, FaComments, FaLock, FaUserCircle } from "react-icons/fa";
import CommentItem from "./CommentItem";
import { pusherClient } from "@/lib/pusher";

interface User { id: string; name: string | null; image: string | null; role?: string; }
interface Comment {
  id: string; content: string; userId?: string | null; isEdited?: boolean;
  createdAt: string; userRelation?: User | null; userFirstName?: string | null;
  userLastName?: string | null; userImageUrl?: string | null; name?: string | null;
  likes?: { id: string }[]; dislikes?: { id: string }[];
  _count?: { likes: number; dislikes: number }; articleId?: string | null;
  episodeId?: string | null; replies?: Comment[];
}

interface CommentsClientProps { contentId: string; type: "article" | "episode"; }

export default function CommentsClient({ contentId, type }: CommentsClientProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // جلب التعليقات من السيرفر
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?${type}Id=${contentId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      }
    } catch (err) { console.error("Fetch Error:", err); }
  }, [type, contentId]);

  // تهيئة الاتصال مع Pusher
  useEffect(() => {
    fetchComments();

    const channelName = `comments-${contentId}`;
    console.log(`🔌 Subscribing to channel: ${channelName}`);

    const channel = pusherClient.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Pusher Connected!');
      setIsConnected(true);
    });

    channel.bind('pusher:subscription_error', (status: unknown) => {
      console.error('❌ Pusher Connection Failed:', status);
      setIsConnected(false);
    });

    channel.bind('new-comment', (data: unknown) => {
      console.log('📩 Event Received:', data);
      fetchComments(); 
    });

    return () => {
      console.log(`🔌 Unsubscribing from ${channelName}`);
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [contentId, fetchComments]);

  // --- منطق التحديث الفوري (Optimistic UI) ---

  const addOptimisticComment = (newComment: Comment) => {
    setComments(prev => [newComment, ...prev]);
  };

  const removeOptimisticComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  // إرسال تعليق جديد
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || status !== "authenticated" || !session?.user) return;
    
    setLoading(true);
    const tempId = `temp-${Date.now()}`;
    
    const optimisticComment: Comment = {
        id: tempId,
        content: content,
        createdAt: new Date().toISOString(),
        userId: session.user.id,
        userRelation: { 
            id: session.user.id, 
            name: session.user.name || "أنت", 
            image: session.user.image || null 
        },
        likes: [], dislikes: [], _count: { likes: 0, dislikes: 0 },
        replies: []
    };
    addOptimisticComment(optimisticComment);
    setContent("");

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: optimisticComment.content,
          name: session.user.name || "مستخدم",
          email: session.user.email,
          userId: session.user.id,
          userImageUrl: session.user.image,
          [type]: contentId,
        }),
      });
      
      if(!res.ok) throw new Error("Failed to post");
      
      removeOptimisticComment(tempId);
      fetchComments(); 

    } catch (err) {
      console.error("Error posting:", err);
      removeOptimisticComment(tempId);
      setContent(optimisticComment.content); 
    } finally {
      setLoading(false);
    }
  };

  // تحديث فوري للاعجابات
  const handleOptimisticReaction = (commentId: string, isLike: boolean) => {
    if (!session?.user) return;
    
    setComments(prevComments => {
        const updateReplies = (replies: Comment[]): Comment[] => replies.map(r => updateItem(r));
        const updateItem = (c: Comment): Comment => {
            if (c.id === commentId) {
                const isAlready = isLike 
                    ? c.likes?.some(l => l.id === session.user.id)
                    : c.dislikes?.some(l => l.id === session.user.id);

                let newLikes = c.likes || [];
                let newDislikes = c.dislikes || [];
                let countLikes = c._count?.likes || 0;
                let countDislikes = c._count?.dislikes || 0;

                if (isLike) {
                    if (isAlready) {
                        newLikes = newLikes.filter(l => l.id !== session.user.id);
                        countLikes--;
                    } else {
                        newLikes = [...newLikes, { id: session.user.id }];
                        countLikes++;
                        if (c.dislikes?.some(l => l.id === session.user.id)) {
                            newDislikes = newDislikes.filter(l => l.id !== session.user.id);
                            countDislikes--;
                        }
                    }
                } else {
                     if (isAlready) {
                        newDislikes = newDislikes.filter(l => l.id !== session.user.id);
                        countDislikes--;
                    } else {
                        newDislikes = [...newDislikes, { id: session.user.id }];
                        countDislikes++;
                        if (c.likes?.some(l => l.id === session.user.id)) {
                            newLikes = newLikes.filter(l => l.id !== session.user.id);
                            countLikes--;
                        }
                    }
                }
                return { ...c, likes: newLikes, dislikes: newDislikes, _count: { likes: countLikes, dislikes: countDislikes }, replies: c.replies ? updateReplies(c.replies) : [] };
            }
            return { ...c, replies: c.replies ? updateReplies(c.replies) : [] };
        };
        return prevComments.map(c => updateItem(c));
    });
  };

  // تغليف الإجراءات
  const handleAction = async (url: string, method: string = 'POST', body?: Record<string, unknown>, optimisticCallback?: () => void) => {
    if (optimisticCallback) optimisticCallback(); 
    try {
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="w-full py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <FaComments className="text-white text-xl" />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">التعليقات</h3>
                <p className="text-xs text-gray-500">{comments.length} مشاركة</p>
            </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></span>
            <span className="text-gray-500">{isConnected ? 'مباشر' : 'محلي'}</span>
        </div>
      </div>

      {/* Form */}
      {status === "authenticated" ? (
        <motion.form onSubmit={handleSubmit} className="mb-8 bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                    {session?.user?.image ? (
                        <img src={session.user.image} alt="me" className="w-full h-full object-cover" />
                    ) : ( <FaUserCircle className="text-indigo-400 text-2xl" /> )}
                </div>
                <div className="flex-1 relative">
                    <textarea
                        value={content} onChange={(e) => setContent(e.target.value)}
                        placeholder="شاركنا رأيك..."
                        className="w-full bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl p-3 resize-none text-sm border border-transparent focus:border-indigo-500 transition-all"
                        rows={2} disabled={loading}
                    />
                </div>
            </div>
            <div className="flex justify-end items-center mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                <button type="submit" disabled={loading || !content.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md hover:shadow-indigo-200 dark:hover:shadow-indigo-900/50">
                    {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                    <span>نشر</span>
                </button>
            </div>
        </motion.form>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border border-indigo-100 dark:border-gray-700 rounded-2xl p-6 text-center mb-8 shadow-sm">
            <FaLock className="mx-auto text-indigo-400 text-2xl mb-3" />
            <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-1">انضم للمحادثة</h4>
            <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-4">يجب تسجيل الدخول للمشاركة</p>
            <Link href="/sign-in" className="inline-block px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm">
                تسجيل الدخول
            </Link>
        </motion.div>
      )}

      {/* List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {comments.length === 0 && status === "authenticated" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-800/20">
                <FaComments className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">كن أول من يعلق!</p>
            </motion.div>
          ) : (
            comments.map((comment) => (
              <motion.div key={comment.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }}>
                <CommentItem
                  comment={comment}
                  onReply={(parentId, replyContent) => handleAction('/api/comments', 'POST', { content: replyContent, parentComment: parentId, userId: session?.user?.id, [type]: contentId })}
                  // تم إصلاح الخطأ هنا: إضافة return قبل handleAction لضمان إرجاع Promise
                  onDelete={(id) => { removeOptimisticComment(id); return handleAction(`/api/comments/${id}`, 'DELETE'); }}
                  onUpdate={(id, newContent) => handleAction(`/api/comments/${id}`, 'PUT', { content: newContent })}
                  onLike={(id) => handleAction(`/api/comments/${id}/like`, 'POST', {}, () => handleOptimisticReaction(id, true))}
                  onDislike={(id) => handleAction(`/api/comments/${id}/dislike`, 'POST', {}, () => handleOptimisticReaction(id, false))}
                  onReport={(id, reason) => handleAction(`/api/comments/${id}/report`, 'POST', { reason })}
                  currentUser={session?.user || null}
                  depth={0}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}