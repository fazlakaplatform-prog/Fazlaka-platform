"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaPaperPlane, FaSpinner, FaPlus, FaImage, FaTimes, 
  FaHeadset, FaCheckCircle
} from "react-icons/fa";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";

// --- Interfaces ---
interface Attachment {
  url: string;
  isImage?: boolean;
  name?: string;
}

// تم تعريف الواجهة هنا
interface Message {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
  senderName?: string;
  senderImage?: string; // الخاصية موجودة هنا الآن
  attachments: Attachment[];
}

interface Ticket {
  id: string;
  ticketNumber: string;
  status: string;
  subject: string;
  messages: Message[];
  updatedAt: string;
}

export default function SupportPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);

  // Chat State
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [chatPreview, setChatPreview] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- FIX: Force TypeScript to use the local Message interface ---
  const { messages } = useRealtimeChat(
    activeTicket?.id || "", 
    activeTicket?.messages || []
  ) as { messages: Message[] }; 

  useEffect(() => { setIsRTL(localStorage.getItem('language') === 'ar'); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchTickets = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (data.success) setTickets(data.data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleSelectTicket = async (ticket: Ticket) => {
    // Optimistic update to set active ticket immediately for UI response
    setActiveTicket(ticket);
    
    // Fetch full details
    const res = await fetch(`/api/tickets/${ticket.id}`);
    const data = await res.json();
    if (data.success) setActiveTicket(data.data);
  };

  // --- Logic for sending message ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'chat' | 'new') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'chat') { setChatFile(file); setChatPreview(reader.result as string); }
        else { setNewFile(file); setNewPreview(reader.result as string); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !chatFile) || !activeTicket) return;
    
    setSending(true);
    const formData = new FormData();
    if (messageInput) formData.append('message', messageInput);
    if (chatFile) formData.append('file', chatFile);

    await fetch(`/api/tickets/${activeTicket.id}`, { method: 'POST', body: formData });
    
    setMessageInput(""); setChatFile(null); setChatPreview(null);
    setSending(false);
  };

  // --- Logic for creating ticket ---
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newSubject || !newDesc) return;

    setSending(true);
    const formData = new FormData();
    formData.append('subject', newSubject);
    formData.append('description', newDesc);
    formData.append('category', 'technical');
    if (newFile) formData.append('file', newFile);

    await fetch('/api/tickets', { method: 'POST', body: formData });
    
    setShowModal(false); setNewSubject(""); setNewDesc(""); setNewFile(null); setNewPreview(null);
    fetchTickets();
    setSending(false);
  };

  const t = isRTL ? {
    title: "الدعم الفني", new: "تذكرة جديدة", subject: "الموضوع", desc: "تفاصيل المشكلة", send: "إرسال", placeholder: "اكتب ردك...", select: "اختر محادثة", resolved: "تم الحل"
  } : {
    title: "Support", new: "New Ticket", subject: "Subject", desc: "Problem details", send: "Send", placeholder: "Type reply...", select: "Select chat", resolved: "Resolved"
  };

  return (
    <div className="min-h-screen pt-24 pb-10 bg-slate-50 dark:bg-slate-900 flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <div className="w-96 bg-white dark:bg-slate-800 border-l dark:border-slate-700 h-[calc(100vh-100px)] fixed md:relative flex flex-col shadow-lg">
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
          <h1 className="font-bold text-2xl text-slate-800 dark:text-white">{t.title}</h1>
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full transition-transform hover:scale-110">
            <FaPlus />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="p-4 text-center"><FaSpinner className="animate-spin mx-auto text-indigo-600 text-2xl" /></div> : 
           tickets.map(ticket => (
            <div key={ticket.id} onClick={() => handleSelectTicket(ticket)} 
              className={`p-4 cursor-pointer transition-all border-b dark:border-slate-700 ${activeTicket?.id === ticket.id ? 'bg-indigo-50 dark:bg-indigo-900/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-mono text-indigo-500 font-bold">#{ticket.ticketNumber}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {ticket.status === 'RESOLVED' ? t.resolved : 'Open'}
                </span>
              </div>
              <h3 className="font-semibold text-sm text-slate-700 dark:text-white truncate">{ticket.subject}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900 h-[calc(100vh-100px)] rounded-tl-3xl overflow-hidden">
        {activeTicket ? (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 shadow-sm border-b dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Ticket #{activeTicket.ticketNumber}</span>
                  <h2 className="font-bold text-lg text-slate-800 dark:text-white">{activeTicket.subject}</h2>
                </div>
                {activeTicket.status === 'RESOLVED' && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">
                    <FaCheckCircle /> {t.resolved}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                  
                  {/* Avatar */}
                  {msg.sender !== 'USER' && (
                    <div className="flex-shrink-0">
                      {msg.senderImage ? (
                        <img src={msg.senderImage} className="w-8 h-8 rounded-full object-cover" alt="Support" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
                          <FaHeadset />
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-md flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}>
                    {/* Sender Name */}
                    <span className="text-xs text-slate-400 mb-1 px-2">
                      {msg.sender === 'USER' ? 'أنت' : (msg.senderName || 'فريق الدعم')}
                    </span>
                    
                    <div className={`p-3 rounded-2xl shadow-sm ${
                      msg.sender === 'USER' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-none'
                    }`}>
                      {msg.attachments?.map(att => att.isImage && (
                        <a key={att.url} href={att.url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                          <img src={att.url} className="rounded-lg max-h-48 w-auto object-cover" alt="attachment" />
                        </a>
                      ))}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-2">
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>

                  {/* User Avatar */}
                  {msg.sender === 'USER' && session?.user?.image && (
                    <img src={session.user.image} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="You" />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {activeTicket.status !== 'RESOLVED' && (
              <div className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                {chatPreview && (
                  <div className="relative inline-block mb-2">
                    <img src={chatPreview} className="h-16 rounded-lg border-2 border-indigo-200" alt="Preview" />
                    <button onClick={() => { setChatFile(null); setChatPreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"><FaTimes /></button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input type="file" onChange={(e) => handleFileChange(e, 'chat')} accept="image/*" className="hidden" id="chatFileInput" />
                  <button type="button" onClick={() => document.getElementById('chatFileInput')?.click()} className="p-2 text-slate-400 hover:text-indigo-600"><FaImage /></button>
                  <input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder={t.placeholder} className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2 outline-none text-sm" />
                  <button type="submit" disabled={sending} className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50">{sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}</button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <FaHeadset className="text-6xl mx-auto mb-4 opacity-20" />
              <p>{t.select}</p>
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl dark:text-white">{t.new}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
              </div>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder={t.subject} className="w-full border dark:bg-slate-700 rounded-lg p-2 text-sm" required />
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder={t.desc} className="w-full border dark:bg-slate-700 rounded-lg p-2 text-sm h-24 resize-none" required />
                
                {/* Image Upload in Modal */}
                <div className="border-2 border-dashed dark:border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors" onClick={() => document.getElementById('fileNew')?.click()}>
                  <input type="file" id="fileNew" accept="image/*" onChange={(e) => handleFileChange(e, 'new')} className="hidden" />
                  {newPreview ? (
                    <img src={newPreview} className="h-24 mx-auto object-contain" alt="Preview" />
                  ) : (
                    <div className="text-slate-400">
                      <FaImage className="mx-auto text-2xl mb-1" />
                      <span className="text-xs">Attach Screenshot (Optional)</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm">Cancel</button>
                  <button type="submit" disabled={sending} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                    {sending && <FaSpinner className="animate-spin" />} {t.send}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}