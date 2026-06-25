"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/Language/LanguageProvider";
import { 
  FaPlay, FaList, FaTh, FaSearch, FaTimes, FaHeart, FaFilter, FaUser, FaSignInAlt, FaArrowRight, FaSync, FaPlus, FaLock, FaGlobe, FaTrash, FaCloudUploadAlt, FaMusic
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type Language = 'ar' | 'en';

interface Playlist {
  id: string; 
  title?: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  imageUrlEn?: string;
  episodes?: Episode[] | string[]; 
  articles?: Article[] | string[];
  userId?: string | null;
}

interface Episode { id: string; title?: string; titleEn?: string; slug?: string; thumbnailUrl?: string; }
interface Article { id: string; title?: string; titleEn?: string; slug?: string; featuredImageUrl?: string; }

const translations = {
  ar: {
    loading: "جاري التحميل...",
    noPlaylists: "لا توجد قوائم حالياً",
    noResults: "لا توجد نتائج",
    playlists: "قوائم التشغيل",
    myPlaylists: "قوائمي الشخصية",
    publicPlaylists: "القوائم العامة",
    createNew: "إنشاء قائمة جديدة",
    createSuccess: "تم إنشاء القائمة بنجاح",
    createError: "فشل في الإنشاء",
    deleteSuccess: "تم الحذف",
    deleteError: "فشل الحذف",
    searchPlaceholder: "ابحث في القوائم...",
    items: "عنصر",
    loginPrompt: "سجل دخولك لإنشاء قوائم خاصة بك",
    signIn: "تسجيل الدخول",
    newPlaylistTitle: "عنوان القائمة",
    imageUrlLabel: "صورة الغلاف",
    create: "إنشاء",
    cancel: "إلغاء",
    private: "خاص",
    deleteConfirm: "هل أنت متأكد من الحذف؟",
    uploading: "جاري الرفع...",
    heroTitle: "مكتبة القوائم",
    heroDesc: "نظم حلقاتك ومقالاتك المفضلة في قوائم خاصة وعود إليها متى شئت."
  },
  en: {
    loading: "Loading...",
    noPlaylists: "No playlists available",
    noResults: "No results found",
    playlists: "Playlists",
    myPlaylists: "My Playlists",
    publicPlaylists: "Public Playlists",
    createNew: "Create New Playlist",
    createSuccess: "Playlist created",
    createError: "Failed to create",
    deleteSuccess: "Deleted",
    deleteError: "Failed to delete",
    searchPlaceholder: "Search playlists...",
    items: "items",
    loginPrompt: "Sign in to create your own playlists",
    signIn: "Sign In",
    newPlaylistTitle: "Playlist Title",
    imageUrlLabel: "Cover Image",
    create: "Create",
    cancel: "Cancel",
    private: "Private",
    deleteConfirm: "Are you sure?",
    uploading: "Uploading...",
    heroTitle: "Playlists Library",
    heroDesc: "Organize your favorite episodes and articles in custom lists."
  }
};

function getLocalizedText(arText?: string, enText?: string, language: Language = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}

const PlaylistsPage = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  
  const [searchTerm, setSearchTerm] = useState("");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ title: '', titleEn: '', description: '', imageUrl: '' });
  const [isUploading, setIsUploading] = useState(false);
  
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";
  const currentUserId = session?.user?.id;

  const fetchPlaylistsData = useCallback(async () => {
    try {
      const response = await fetch(`/api/playlists?language=${language}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [language]);
  
  useEffect(() => {
    fetchPlaylistsData();
  }, [fetchPlaylistsData]);

  // Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    toast.success(t.uploading);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'playlist');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setNewPlaylist(prev => ({ ...prev, imageUrl: data.url }));
        toast.success("Upload Success");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error("Upload Failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylist.title) return;
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlaylist,
          titleEn: newPlaylist.titleEn || newPlaylist.title,
          isPublic: false
        })
      });
      if (res.ok) {
        toast.success(t.createSuccess);
        setIsCreateModalOpen(false);
        setNewPlaylist({ title: '', titleEn: '', description: '', imageUrl: '' });
        fetchPlaylistsData();
      } else {
        toast.error(t.createError);
      }
    } catch {
      toast.error(t.createError);
    }
  };

  const handleDeletePlaylist = async (slug: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/playlists/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t.deleteSuccess);
        setPlaylists(prev => prev.filter(p => p.slug !== slug));
      } else {
        toast.error(t.deleteError);
      }
    } catch {
      toast.error(t.deleteError);
    }
  };

  // Filter Logic
  const myPlaylists = useMemo(() => playlists.filter(p => p.userId === currentUserId), [playlists, currentUserId]);
  const publicPlaylists = useMemo(() => playlists.filter(p => !p.userId), [playlists]);
  
  const filterList = (list: Playlist[]) => list.filter(p => {
    const title = getLocalizedText(p.title, p.titleEn, language);
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredPublic = filterList(publicPlaylists);
  const filteredMine = filterList(myPlaylists);

  // Card Component
  const PlaylistCard = ({ playlist, isOwner = false }: { playlist: Playlist; isOwner?: boolean }) => {
    const imageUrl = language === 'en' ? (playlist.imageUrlEn || playlist.imageUrl) : (playlist.imageUrl || playlist.imageUrlEn);
    const title = getLocalizedText(playlist.title, playlist.titleEn, language);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ y: -5 }}
        className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
      >
        <Link href={`/playlists/${playlist.slug}`} className="block">
          <div className="w-full h-48 relative bg-gray-100 dark:bg-gray-700">
            {imageUrl ? (
              <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="300px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                <FaMusic className="text-white text-4xl opacity-80" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <motion.div initial={{ scale: 0 }} whileHover={{ scale: 1 }} className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                 <FaPlay className="text-white text-xl ml-1" />
              </motion.div>
            </div>
             {playlist.userId && (
               <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 border border-white/20">
                 <FaLock size={10} /> {t.private}
               </span>
             )}
          </div>
          <div className="p-5">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 truncate">{title}</h3>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{(playlist.episodes?.length || 0) + (playlist.articles?.length || 0)} {t.items}</span>
            </div>
          </div>
        </Link>
        
        {isOwner && (
          <button 
            onClick={(e) => { e.preventDefault(); handleDeletePlaylist(playlist.slug); }} 
            className="absolute top-3 right-3 bg-red-600 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 shadow-lg transform hover:scale-110"
          >
            <FaTrash size={12} />
          </button>
        )}
      </motion.div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><FaSync className="animate-spin text-blue-600 text-4xl" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 py-20 md:py-32 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl"></div>
            </div>
            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-md">
                    {t.heroTitle}
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.1 }} animate={{ opacity: 1, y: 0 }} className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
                    {t.heroDesc}
                </motion.p>
                
                <div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-xl mx-auto">
                    <div className="relative w-full">
                        <FaSearch className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/95 dark:bg-gray-800/95 shadow-lg outline-none focus:ring-4 ring-white/30 transition text-gray-800 dark:text-white"
                        />
                    </div>
                    {isSignedIn && (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsCreateModalOpen(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition shadow-lg font-medium">
                            <FaPlus /> {t.createNew}
                        </motion.button>
                    )}
                </div>
            </div>
        </div>

        <div className="container mx-auto px-4 mt-12">
            {/* My Playlists Section */}
            {isSignedIn && (
            <section className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                        <FaUser />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.myPlaylists}</h2>
                </div>
                {filteredMine.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500">
                        <FaMusic className="mx-auto text-3xl mb-3 opacity-50" />
                        {searchTerm ? t.noResults : t.noPlaylists}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredMine.map(p => <PlaylistCard key={p.id} playlist={p} isOwner />)}
                    </div>
                )}
            </section>
            )}

            {/* Public Playlists Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg text-green-600 dark:text-green-300">
                        <FaGlobe />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.publicPlaylists}</h2>
                </div>
                {filteredPublic.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-gray-800/50 rounded-2xl border border-dashed text-gray-500">
                        {t.noResults}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredPublic.map(p => <PlaylistCard key={p.id} playlist={p} />)}
                    </div>
                )}
            </section>
        </div>

        {/* Create Modal */}
        <AnimatePresence>
            {isCreateModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl border dark:border-gray-700">
                <h3 className="text-2xl font-bold mb-6 dark:text-white">{t.createNew}</h3>
                
                {/* Image Upload */}
                <div className="flex flex-col items-center mb-6">
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 group cursor-pointer mb-2">
                        {newPlaylist.imageUrl ? (
                            <Image src={newPlaylist.imageUrl} alt="Cover" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-400 group-hover:text-blue-500 transition">
                                <FaCloudUploadAlt className="text-3xl mb-1" />
                                <span className="text-xs">{t.imageUrlLabel}</span>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    {isUploading && <span className="text-xs text-blue-500 animate-pulse">{t.uploading}</span>}
                </div>

                <div className="space-y-4">
                    <input type="text" placeholder={t.newPlaylistTitle + " (AR) *"} value={newPlaylist.title} onChange={(e) => setNewPlaylist({...newPlaylist, title: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 ring-blue-500" />
                    <input type="text" placeholder={t.newPlaylistTitle + " (EN)"} value={newPlaylist.titleEn} onChange={(e) => setNewPlaylist({...newPlaylist, titleEn: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 ring-blue-500" />
                    <textarea placeholder="Description" value={newPlaylist.description} onChange={(e) => setNewPlaylist({...newPlaylist, description: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 ring-blue-500" rows={2} />
                </div>
                
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium dark:text-white">{t.cancel}</button>
                    <button onClick={handleCreatePlaylist} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition font-medium shadow-lg shadow-blue-500/30">{t.create}</button>
                </div>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default PlaylistsPage;