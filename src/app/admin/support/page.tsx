"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { FaCheckCircle, FaPaperPlane, FaSpinner, FaTimes, FaImage, FaHeadset } from "react-icons/fa";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { pusherClient } from "@/lib/pusher";

// تعريف واجهة للمرفقات
interface Attachment {
  url: string;
  isImage?: boolean;
  name?: string;
}

// تعريف واجهة رسالة موسعة للصفحة الإدارية تتضمن الصورة
interface AdminMessage {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
  senderName?: string;
  senderImage?: string; // الخاصية المطلوبة
  attachments: Attachment[];
}

interface Ticket {
  id: string;
  ticketNumber: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: string;
  messages: AdminMessage[];
  updatedAt: string;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [isRTL, setIsRTL] = useState(true);
  const [filter, setFilter] = useState('all');

  const [reply, setReply] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // جلب الرسائل من الـ Hook
  const { messages } = useRealtimeChat(selected?.id || "", selected?.messages || []);
  
  // تحويل الرسائل إلى النوع الموسع AdminMessage للسماح بالوصول لـ senderImage
  const displayMessages = messages as AdminMessage[];

  useEffect(() => { setIsRTL(localStorage.getItem('language') === 'ar'); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Realtime List Update
  useEffect(() => {
    const ch = pusherClient.subscribe("admin-tickets");
    ch.bind('new-ticket', (t: Ticket) => setTickets(prev => [t, ...prev]));
    return () => { ch.unbind_all(); ch.unsubscribe(); };
  }, []);

  // استخدام useCallback لتحديد الدالة كاعتمادية
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets?status=${filter}`);
      const data = await res.json();
      if (data.success) setTickets(data.data);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const selectTicket = async (t: Ticket) => {
    const res = await fetch(`/api/admin/tickets/${t.id}`);
    const data = await res.json();
    if (data.success) setSelected(data.data);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); const r = new FileReader(); r.onloadend = () => setPreview(r.result as string); r.readAsDataURL(f); }
  };

  const sendReply = async (status?: string) => {
    if ((!reply.trim() && !file) && !status) return;

    setSending(true);
    const formData = new FormData();
    if (reply) formData.append('reply', reply);
    if (file) formData.append('file', file);
    if (status) formData.append('status', status);

    await fetch(`/api/admin/tickets/${selected?.id}`, { method: 'PUT', body: formData });

    setReply(""); setFile(null); setPreview(null);
    fetchTickets();
    if (status) setSelected(null);
    setSending(false);
  };

  const t = isRTL ? { title: "الدعم الفني", resolve: "تم الحل", close: "إغلاق", type: "ردك...", all: "الكل" } : { title: "Support", resolve: "Resolve", close: "Close", type: "Reply...", all: "All" };

  return (
    <div className="min-h-screen pt-20 bg-slate-100 dark:bg-slate-900 flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <div className="w-1/3 bg-white dark:bg-slate-800 border-l dark:border-slate-700 h-[calc(100vh-80px)] flex flex-col">
        <div className="p-4 border-b dark:border-slate-700 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h1 className="font-bold text-xl text-white mb-3">{t.title}</h1>
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`flex-1 py-1 rounded text-xs font-medium ${filter === 'all' ? 'bg-white text-indigo-600 shadow' : 'bg-white/20 text-white hover:bg-white/30'}`}>{t.all}</button>
            <button onClick={() => setFilter('OPEN')} className={`flex-1 py-1 rounded text-xs font-medium ${filter === 'OPEN' ? 'bg-white text-indigo-600 shadow' : 'bg-white/20 text-white hover:bg-white/30'}`}>Open</button>
            <button onClick={() => setFilter('RESOLVED')} className={`flex-1 py-1 rounded text-xs font-medium ${filter === 'RESOLVED' ? 'bg-white text-indigo-600 shadow' : 'bg-white/20 text-white hover:bg-white/30'}`}>Resolved</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="p-4 text-center"><FaSpinner className="animate-spin text-indigo-600 mx-auto" /></div> :
            tickets.map(t => (
              <div key={t.id} onClick={() => selectTicket(t)} className={`p-4 border-b dark:border-slate-700 cursor-pointer transition-colors ${selected?.id === t.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-indigo-500 font-bold">#{t.ticketNumber}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span>
                </div>
                <h3 className="font-semibold text-sm mt-1 truncate text-slate-800 dark:text-white">{t.subject}</h3>
                <p className="text-xs text-slate-400 mt-1">{t.userName}</p>
              </div>
            ))
          }
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
        {selected ? (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 border-b shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-indigo-600 font-bold">
                  {selected.userName.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-white">{selected.userName}</h2>
                  <span className="text-xs text-slate-400">{selected.userEmail}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => sendReply('RESOLVED')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg shadow transition-colors">
                  <FaCheckCircle /> {t.resolve}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {displayMessages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>

                  {/* --- Avatar for User (Sender) --- */}
                  {msg.sender !== 'ADMIN' && (
                    <div className="flex-shrink-0">
                      {msg.senderImage ? (
                        <img
                          src={msg.senderImage}
                          className="w-8 h-8 rounded-full object-cover"
                          alt={msg.senderName || 'User'}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                          {msg.senderName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-md flex flex-col ${msg.sender === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-slate-400 mb-1 px-2">
                      {msg.sender === 'ADMIN' ? (msg.senderName || 'You') : msg.senderName}
                    </span>
                    <div className={`p-3 rounded-2xl ${msg.sender === 'ADMIN'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-none shadow'
                      }`}>
                      {msg.attachments?.map(att => att.isImage && <img key={att.url} src={att.url} className="rounded-lg mb-2 max-h-40" alt="Attachment" />)}
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>

                  {/* --- Avatar for Admin (You) --- */}
                  {msg.sender === 'ADMIN' && (
                    <div className="flex-shrink-0">
                      {msg.senderImage ? (
                        <img
                          src={msg.senderImage}
                          className="w-8 h-8 rounded-full object-cover"
                          alt="Admin"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
                          <FaHeadset />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t">
              {preview && (
                <div className="relative inline-block mb-2">
                  <img src={preview} className="h-16 rounded-lg border-2 border-indigo-300" alt="Preview" />
                  <button onClick={() => { setFile(null); setPreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"><FaTimes /></button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600"><FaImage /></button>
                <input value={reply} onChange={e => setReply(e.target.value)} placeholder={t.type} className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <button onClick={() => sendReply()} disabled={sending} className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50">
                  {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <FaHeadset className="text-6xl mx-auto mb-4 opacity-20" />
              <p>Select a ticket to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}