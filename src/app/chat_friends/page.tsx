"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { pusherClient } from "@/lib/pusher";
import {
  User, MessageCircle, UserPlus, Check, X, Loader2, Send, ArrowLeft,
  Edit, Trash2, ImagePlus, Search, ExternalLink, Eye
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// --- Interfaces ---
interface Friend {
  id: string;
  requester: { id: string; name: string | null; image: string | null; };
  receiver: { id: string; name: string | null; image: string | null; };
  status: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  imageUrl?: string;
  createdAt: string;
  isEdited?: boolean;
  sender?: { name: string | null; image: string | null; };
}

interface ChatPartner {
  id: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
  banner?: string | null;
}

interface SearchedUser {
  id: string;
  name: string | null;
  image: string | null;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");

  // --- State Management ---
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const [selectedChat, setSelectedChat] = useState<{
    id: string | null;
    friend: ChatPartner;
  } | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // UI Interaction States
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, messageId: string} | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Add Friend Modal State ---
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendSearch, setAddFriendSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // NEW: Track if search happened
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);

  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Logic & Data Fetching ---

  const fetchFriends = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      const accepted: Friend[] = [];
      const pending: Friend[] = [];
      
      data.forEach((f: Friend) => {
        if (f.status === "ACCEPTED") accepted.push(f);
        if (f.status === "PENDING" && f.receiver.id === session?.user?.id) pending.push(f);
      });
      
      setFriends(accepted);
      setPendingRequests(pending);
    } catch (error) {
      console.error("Error fetching friends", error);
    } finally {
      setLoadingFriends(false);
    }
  }, [session]);

  useEffect(() => {
    fetchFriends();
    if (session?.user?.id) {
      const channel = pusherClient.subscribe(`private-user-${session.user.id}`);
      channel.bind("friend-request", (data: Friend) => {
        setPendingRequests((prev) => [data, ...prev]);
      });
      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    }
  }, [session, fetchFriends]);

  useEffect(() => {
    if (initialUserId && session && !selectedChat) {
      fetch(`/api/user/${initialUserId}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setSelectedChat({ id: null, friend: data });
          }
        });
    }
  }, [initialUserId, session, selectedChat]);

  useEffect(() => {
    const initChat = async () => {
      if (!selectedChat?.friend?.id) return;
      setIsLoadingChat(true);
      setMessages([]);
      setContextMenu(null);
      setEditingMessageId(null);
      
      try {
        const url = selectedChat.id 
          ? `/api/messages?conversationId=${selectedChat.id}` 
          : `/api/messages?friendId=${selectedChat.friend.id}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) {
          setMessages(data.messages || []);
          if (data.conversationId && !selectedChat.id) {
            setSelectedChat(prev => prev ? { ...prev, id: data.conversationId } : null);
          }
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setIsLoadingChat(false);
      }
    };
    initChat();
  }, [selectedChat?.friend?.id, selectedChat?.id]);

  useEffect(() => {
    if (!selectedChat?.id) return;
    const channel = pusherClient.subscribe(`private-conversation-${selectedChat.id}`);
    
    channel.bind("new-message", (newMessage: Message) => {
      setMessages((prev) => prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]);
    });
    channel.bind("message-updated", (updatedMsg: Message) => {
      setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
    });
    channel.bind("message-deleted", (data: { messageId: string }) => {
      setMessages((prev) => prev.filter(m => m.id !== data.messageId));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [selectedChat?.id]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // --- Actions ---

  const handleSend = async (imageUrl?: string) => {
    const content = input.trim();
    if (!content && !imageUrl) return;
    setInput("");
    
    const res = await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ 
        receiverId: selectedChat?.friend.id, 
        content, 
        imageUrl,
        conversationId: selectedChat?.id 
      }),
      headers: { "Content-Type": "application/json" },
    });
    
    if (res.ok) {
      const newMsg = await res.json();
      if (!selectedChat?.id && newMsg.conversationId) {
        setSelectedChat(prev => prev ? { ...prev, id: newMsg.conversationId } : null);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'chat');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) await handleSend(data.url);
      else alert(data.error || "Failed to upload");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAccept = async (requesterId: string) => {
    await fetch('/api/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ requesterId, action: 'ACCEPT' }),
      headers: { 'Content-Type': 'application/json' }
    });
    setPendingRequests(prev => prev.filter(r => r.requester.id !== requesterId));
    fetchFriends(); 
  };
  
  const handleReject = async (requesterId: string) => {
    await fetch('/api/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ requesterId, action: 'REJECT' }),
      headers: { 'Content-Type': 'application/json' }
    });
    setPendingRequests(prev => prev.filter(r => r.requester.id !== requesterId));
  };

  // --- Search Users Logic ---
  const handleSearchUsers = async () => {
    if (!addFriendSearch) return;
    setIsSearchingUsers(true);
    setHasSearched(true); // Set to true when search starts
    try {
      const res = await fetch(`/api/users/search?q=${addFriendSearch}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        body: JSON.stringify({ receiverId }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setSentRequestIds(prev => [...prev, receiverId]);
      } else {
        const data = await res.json();
        alert(data.error || "Error sending request");
      }
    } catch (error) {
      console.error("Error sending request", error);
    }
  };

  const handleEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    await fetch("/api/messages", {
      method: "PUT",
      body: JSON.stringify({ messageId, content: editContent }),
      headers: { "Content-Type": "application/json" },
    });
    setEditingMessageId(null);
    setEditContent("");
    setContextMenu(null);
  };

  const handleDelete = async (messageId: string) => {
    await fetch(`/api/messages?messageId=${messageId}`, { method: "DELETE" });
    setContextMenu(null);
    setDeleteConfirmId(null);
  };

  const canModify = (createdAt: string) => (new Date().getTime() - new Date(createdAt).getTime()) < 10 * 60 * 1000;
  const formatTime = (date: string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- Smart Context Menu Logic ---
  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    const isMe = msg.senderId === session?.user?.id;
    if (!isMe || !canModify(msg.createdAt)) return;
    
    const menuWidth = 200;
    const menuHeight = 120; 
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

    setContextMenu({ x, y, messageId: msg.id });
  };

  const handleTouchStart = (e: React.TouchEvent, msg: Message) => {
    const isMe = msg.senderId === session?.user?.id;
    if (!isMe || !canModify(msg.createdAt)) return;

    longPressTimerRef.current = setTimeout(() => {
      const touch = e.touches[0];
       const menuWidth = 200;
       let x = touch.clientX;
       if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
       
       setContextMenu({ x, y: touch.clientY, messageId: msg.id });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const filteredFriends = friends.filter(f => {
    const friendUser = f.requester.id === session?.user?.id ? f.receiver : f.requester;
    return friendUser.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper to open Add Friend Modal and reset state
  const openAddFriendModal = () => {
    setSearchResults([]);
    setAddFriendSearch("");
    setHasSearched(false);
    setShowAddFriendModal(true);
  };

  // --- UI Render ---
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100 transition-colors duration-300 overflow-x-hidden">
      
      {/* --- Top Gradient Space --- */}
      <div className="w-full h-40 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex-shrink-0 shadow-lg" />

      <div className="flex flex-1 w-full max-w-screen-2xl mx-auto relative z-10 -mt-16 px-2 md:px-0">
        
        {/* --- Sidebar --- */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`w-full md:w-96 border-r border-slate-200/50 dark:border-zinc-800/50 flex flex-col bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl rounded-tl-3xl ${selectedChat ? 'hidden md:flex' : 'flex'}`}
        >
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Messages</h1>
              
              {/* Add Friend Button */}
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={openAddFriendModal}
                className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-indigo-500/40 transition-all"
                title="Add Friend"
              >
                <UserPlus className="w-5 h-5" />
              </motion.button>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-700 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
              />
            </div>
          </div>

          {/* Pending Requests */}
          <AnimatePresence>
            {pendingRequests.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-slate-100 dark:border-zinc-800 overflow-hidden bg-indigo-50/50 dark:bg-indigo-900/10"
              >
                <div className="p-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                  <UserPlus className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Requests ({pendingRequests.length})</span>
                </div>
                <div className="px-4 pb-4 space-y-2">
                  {pendingRequests.map((req) => (
                    <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 p-[2px] shadow-sm">
                          <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-black flex items-center justify-center">
                            {req.requester.image ? <Image src={req.requester.image} alt="" width={40} height={40} className="object-cover"/> : <User className="w-4 h-4 text-slate-400"/>}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-white">{req.requester.name}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleAccept(req.requester.id)} className="p-2 bg-emerald-500 text-white rounded-full shadow-md hover:bg-emerald-600"><Check className="w-4 h-4"/></motion.button>
                        <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleReject(req.requester.id)} className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full hover:bg-rose-200"><X className="w-4 h-4"/></motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Friends List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {loadingFriends ? (
              <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-indigo-600"/></div>
            ) : filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 px-4 text-center">
                <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                <p className="font-medium">No friends found</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredFriends.map((friend, index) => {
                  const friendUser = friend.requester.id === session?.user?.id ? friend.receiver : friend.requester;
                  return (
                    <motion.button
                      key={friend.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => setSelectedChat({ id: null, friend: friendUser })}
                      whileHover={{ scale: 1.01, x: 5, transition: { duration: 0.1 } }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100/20 to-transparent dark:via-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative z-10">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-700 shadow-sm group-hover:ring-2 group-hover:ring-indigo-500 transition-all duration-200">
                          {friendUser.image ? (
                            <Image src={friendUser.image} alt="" width={56} height={56} className="object-cover transition-transform duration-300 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-300 to-purple-300 dark:from-indigo-600 dark:to-purple-700">
                              <User className="w-6 h-6 text-white"/>
                            </div>
                          )}
                        </div>
                        <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900">
                           <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                        </span>
                      </div>
                      <div className="flex-1 text-left z-10">
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-zinc-100">{friendUser.name}</h4>
                        <p className="text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">Tap to chat</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* --- Main Chat Area --- */}
        <div className={`flex-1 flex flex-col relative ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
          
          <AnimatePresence mode="wait">
            {selectedChat ? (
              <motion.div 
                key={selectedChat.friend.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full w-full bg-slate-50 dark:bg-zinc-950 rounded-tr-3xl shadow-2xl overflow-hidden"
              >
                {/* Chat Header */}
                <div className="flex items-center gap-4 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800 z-20">
                  <motion.button 
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setSelectedChat(null)} 
                    className="text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors md:hidden"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileModal(true)} 
                    className="relative group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent group-hover:border-indigo-500 transition-all duration-200 shadow-lg ring-2 ring-white dark:ring-zinc-900">
                      {selectedChat.friend.image ? (
                        <Image src={selectedChat.friend.image} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-lg text-white">
                          {selectedChat.friend.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                  </motion.button>

                  <div className="flex-1">
                    <h2 className="font-bold text-slate-900 dark:text-white">{selectedChat.friend.name}</h2>
                    <p className="text-xs text-emerald-500 font-medium">Online</p>
                  </div>
                </div>

                {/* Messages Area */}
                <div 
                  ref={messagesContainerRef} 
                  className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 bg-slate-100 dark:bg-zinc-950"
                >
                  {isLoadingChat ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin"/></div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.senderId === session?.user?.id;
                      
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: i * 0.02, type: "spring", stiffness: 200, damping: 20 }}
                          className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-white dark:border-zinc-800 shadow-sm">
                              {msg.sender?.image ? <Image src={msg.sender.image} alt="" width={32} height={32}/> : <div className="w-full h-full bg-slate-300 dark:bg-zinc-600 flex items-center justify-center"><User className="w-4 h-4 text-white"/></div>}
                            </div>
                          )}

                          <div className={`relative max-w-[70%] ${isMe ? "order-1" : ""}`}>
                             {editingMessageId === msg.id ? (
                               <motion.div 
                                 initial={{ scale: 0.9 }}
                                 animate={{ scale: 1 }}
                                 className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-xl"
                               >
                                 <input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="bg-transparent w-full outline-none text-sm" autoFocus/>
                                 <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                                   <button onClick={() => setEditingMessageId(null)} className="text-xs text-slate-500 flex items-center gap-1"><X className="w-3 h-3"/> Cancel</button>
                                   <button onClick={() => handleEdit(msg.id)} className="text-xs text-white bg-indigo-600 px-3 py-1 rounded-full flex items-center gap-1"><Check className="w-3 h-3"/> Save</button>
                                 </div>
                               </motion.div>
                             ) : (
                                <div
                                  onContextMenu={(e) => handleContextMenu(e, msg)}
                                  onTouchStart={(e) => handleTouchStart(e, msg)}
                                  onTouchEnd={handleTouchEnd}
                                  onClick={() => msg.imageUrl && setViewingImage(msg.imageUrl)}
                                  className={`rounded-3xl transition-all overflow-hidden relative cursor-pointer ${
                                    isMe
                                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
                                      : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-100 dark:border-zinc-700 shadow-sm hover:shadow-md"
                                  }`}
                                >
                                  {msg.imageUrl && (
                                    <div className="relative w-60 h-60 bg-slate-100 dark:bg-zinc-700">
                                      <Image src={msg.imageUrl} alt="Image" fill className="object-cover"/>
                                    </div>
                                  )}
                                  {msg.content && (
                                    <div className="px-4 py-2.5">
                                      <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                                    </div>
                                  )}
                                </div>
                             )}

                            <div className={`flex items-center gap-1 mt-1 px-2 ${isMe ? "justify-end" : "justify-start"}`}>
                               {msg.isEdited && <span className="text-[10px] text-slate-400 italic">edited</span>}
                               <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 rounded-full px-4 py-2 border border-transparent focus-within:border-indigo-500 focus-within:shadow-lg focus-within:shadow-indigo-500/10 transition-all">
                    
                  <motion.label 
                    whileHover={{ rotate: 15 }}
                    className={`cursor-pointer p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={isUploading}/>
                    {isUploading ? <Loader2 className="w-5 h-5 text-indigo-600 animate-spin"/> : <ImagePlus className="w-5 h-5 text-indigo-500"/>}
                  </motion.label>

                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !editingMessageId && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent outline-none placeholder-slate-400 text-sm"
                  />
                  
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: -10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isUploading}
                    className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-white shadow-lg hover:shadow-indigo-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

            </motion.div>
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="hidden md:flex flex-1 items-center justify-center bg-slate-100 dark:bg-zinc-950 rounded-tr-3xl"
            >
              <div className="text-center p-8">
                <motion.div 
                  animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/20"
                >
                   <MessageCircle className="w-10 h-10 text-white"/>
                </motion.div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-white">Welcome Back!</h3>
                <p className="text-sm text-slate-400 mt-2">Select a friend to start chatting.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

      {/* --- Smart Floating Context Menu --- */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-2 z-[100] w-48 overflow-hidden backdrop-blur-lg"
          >
             <button 
               onClick={() => { 
                 setEditingMessageId(contextMenu.messageId); 
                 const msg = messages.find(m => m.id === contextMenu.messageId); 
                 if(msg) setEditContent(msg.content || ""); 
                 setContextMenu(null); 
               }}
               className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
             >
               <Edit className="w-4 h-4"/> Edit
             </button>
             <button 
               onClick={() => { setDeleteConfirmId(contextMenu.messageId); setContextMenu(null); }}
               className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
             >
               <Trash2 className="w-4 h-4"/> Delete
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Add Friend Modal --- */}
      <AnimatePresence>
        {showAddFriendModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" 
            onClick={() => setShowAddFriendModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.5, y: 100, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.5, y: 100, opacity: 0 }} 
              transition={{ type: "spring", damping: 20 }} 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
               {/* Modal Header */}
               <div className="p-6 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-indigo-500"/>
                        Add New Friend
                     </h3>
                     <motion.button 
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowAddFriendModal(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                     >
                        <X className="w-5 h-5"/>
                     </motion.button>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                     <input 
                        type="text" 
                        placeholder="Search by name or code..."
                        value={addFriendSearch}
                        onChange={(e) => setAddFriendSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                        className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-700 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                     />
                  </div>
               </div>

               {/* Results Area */}
               <div className="p-4 max-h-80 overflow-y-auto">
                  {isSearchingUsers ? (
                     <div className="flex justify-center items-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500"/>
                     </div>
                  ) : searchResults.length > 0 ? (
                     <div className="space-y-2">
                        {searchResults.map((user) => (
                           <motion.div 
                              key={user.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                           >
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-700">
                                    {user.image ? (
                                       <Image src={user.image} alt="" width={40} height={40} className="object-cover"/>
                                    ) : (
                                       <div className="w-full h-full flex items-center justify-center">
                                          <User className="w-5 h-5 text-slate-400"/>
                                       </div>
                                    )}
                                 </div>
                                 <span className="font-medium text-slate-700 dark:text-white">{user.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {/* View Profile Button */}
                                <Link href={`/users/${user.id}`} target="_blank" rel="noopener noreferrer">
                                   <motion.button 
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                                      title="View Profile"
                                   >
                                      <Eye className="w-5 h-5"/>
                                   </motion.button>
                                </Link>

                                {/* Add/Sent Button Logic */}
                                {sentRequestIds.includes(user.id) ? (
                                   <span className="text-xs text-slate-400 bg-slate-200 dark:bg-zinc-700 px-3 py-1.5 rounded-full">Sent</span>
                                ) : friends.some(f => (f.requester.id === user.id || f.receiver.id === user.id)) ? (
                                   <span className="text-xs text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">Friend</span>
                                ) : (
                                   <motion.button 
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleSendFriendRequest(user.id)}
                                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-full font-semibold transition-colors shadow-md"
                                   >
                                      Add
                                   </motion.button>
                                )}
                              </div>
                           </motion.div>
                        ))}
                     </div>
                  ) : (
                     <div className="text-center text-slate-400 text-sm py-10">
                        {/* Fixed Logic */}
                        {hasSearched ? "No users found." : "Enter a name or code to search."}
                     </div>
                  )}
               </div>
               
               {/* Search Button */}
               <div className="p-4 border-t border-slate-100 dark:border-zinc-800">
                  <motion.button 
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={handleSearchUsers}
                     disabled={isSearchingUsers || !addFriendSearch}
                     className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 transition-all"
                  >
                     {isSearchingUsers ? "Searching..." : "Search"}
                  </motion.button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Profile Modal --- */}
      <AnimatePresence>
        {showProfileModal && selectedChat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowProfileModal(false)}>
            <motion.div initial={{ scale: 0.5, y: 100, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.5, y: 100, opacity: 0 }} transition={{ type: "spring", damping: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
              
              {/* Banner & Profile Image Wrapper */}
              <div className="relative h-40 w-full">
                 {selectedChat.friend.banner ? (
                   <Image 
                     src={selectedChat.friend.banner} 
                     alt="Banner" 
                     fill 
                     className="object-cover"
                   />
                 ) : (
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
                 )}
                 
                 {/* Centered Profile Image */}
                 <div className="absolute -bottom-16 inset-x-0 flex justify-center">
                    <motion.div 
                       className="relative cursor-pointer"
                       whileHover={{ scale: 1.05 }}
                       onClick={() => selectedChat.friend.image && setViewingImage(selectedChat.friend.image)}
                    >
                       <div className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden bg-slate-200 dark:bg-zinc-800 shadow-2xl transition-all duration-300 hover:ring-4 hover:ring-indigo-500/50">
                         {selectedChat.friend.image ? (
                            <Image 
                               src={selectedChat.friend.image} 
                               alt="" 
                               width={128} 
                               height={128} 
                               className="object-cover w-full h-full" 
                            />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-white bg-gradient-to-br from-slate-300 to-slate-400 dark:from-zinc-700 dark:to-zinc-800">
                               <User className="w-16 h-16"/>
                            </div>
                         )}
                       </div>
                    </motion.div>
                 </div>
              </div>

              <div className="pt-20 pb-6 px-6 text-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedChat.friend.name}</h3>
                
                {selectedChat.friend.bio && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">&ldquo;{selectedChat.friend.bio}&rdquo;</p>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                   <Link href={`/users/${selectedChat.friend.id}`} passHref>
                     <motion.button 
                       whileHover={{ scale: 1.02 }} 
                       whileTap={{ scale: 0.98 }}
                       className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                       onClick={() => setShowProfileModal(false)}
                     >
                       <ExternalLink className="w-4 h-4"/>
                       View Full Profile
                     </motion.button>
                   </Link>

                   <motion.button 
                     whileHover={{ scale: 1.02 }} 
                     whileTap={{ scale: 0.98 }}
                     onClick={() => setShowProfileModal(false)} 
                     className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-white rounded-full font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                   >
                     Close
                   </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirmId(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7" /></div>
              <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Delete Message?</h3>
              <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-sm text-slate-700 dark:text-white">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-2.5 bg-rose-600 text-white rounded-full font-semibold hover:bg-rose-700 transition-colors text-sm shadow-lg shadow-rose-500/30">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Viewer Lightbox */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 cursor-pointer" 
            onClick={() => setViewingImage(null)}
          >
             <motion.button 
               whileHover={{ scale: 1.1 }}
               className="absolute top-4 right-4 text-white/50 hover:text-white p-2 bg-white/10 rounded-full backdrop-blur-sm z-10"
             >
               <X className="w-6 h-6"/>
             </motion.button>
             <motion.img 
               src={viewingImage} 
               initial={{ scale: 0.5, opacity: 0, rotate: -10 }} 
               animate={{ scale: 1, opacity: 1, rotate: 0 }} 
               exit={{ scale: 0.5, opacity: 0, rotate: 10 }} 
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
             />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}