"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/Language/LanguageProvider";
import { 
  FaPlay, FaTrash, FaEdit, FaLock, FaPlus, FaSpinner, FaList, 
  FaNewspaper, FaVideo, FaTimes, FaSearch, FaSave, FaCloudUploadAlt, FaGraduationCap, FaBookOpen
} from "react-icons/fa";
import toast from "react-hot-toast";

// --- Interfaces ---
interface Playlist {
  id: string; slug: string; title?: string; titleEn?: string; description?: string; descriptionEn?: string;
  imageUrl?: string; imageUrlEn?: string; userId?: string | null; episodes?: Episode[]; articles?: Article[];
}
interface Episode { id: string; title?: string; titleEn?: string; slug: string; thumbnailUrl?: string; }
interface Article { id: string; title?: string; titleEn?: string; slug: string; featuredImageUrl?: string; }

// --- Translations ---
const translations = {
  ar: {
    loading: "جاري التحميل...", notFound: "القائمة غير موجودة", edit: "تعديل القائمة", delete: "حذف", removeItem: "إزالة",
    private: "قائمة خاصة", addItems: "إضافة محتوى", updated: "تم التحديث", error: "حدث خطأ", empty: "القائمة فارغة. أضف محتوى تعليمي الآن.",
    save: "حفظ", cancel: "إلغاء", titleAr: "العنوان (عربي)", titleEn: "العنوان (إنجليزي)", descAr: "الوصف", descEn: "الوصف (EN)",
    image: "صورة الغلاف", searchItems: "ابحث عن حلقة أو مقال...", episodes: "الحلقات", articles: "المقالات",
    noResults: "لا توجد نتائج.", added: "تمت الإضافة", removed: "تمت الإزالة", uploading: "جاري الرفع...",
    uploadSuccess: "تم رفع الصورة", uploadError: "فشل الرفع", totalItems: "إجمالي العناصر",
    heroSubtitle: "سلسلة تعليمية منظمة"
  },
  en: {
    loading: "Loading...", notFound: "Playlist not found", edit: "Edit Playlist", delete: "Delete", removeItem: "Remove",
    private: "Private Playlist", addItems: "Add Content", updated: "Updated", error: "Error occurred", empty: "This playlist is empty.",
    save: "Save", cancel: "Cancel", titleAr: "Title (Arabic)", titleEn: "Title (English)", descAr: "Description", descEn: "Description (EN)",
    image: "Cover Image", searchItems: "Search episodes or articles...", episodes: "Episodes", articles: "Articles",
    noResults: "No results.", added: "Added", removed: "Removed", uploading: "Uploading...",
    uploadSuccess: "Image uploaded", uploadError: "Upload failed", totalItems: "Total Items",
    heroSubtitle: "Organized educational series"
  }
};

export default function PlaylistDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const slug = resolvedParams.id;
  const { language } = useLanguage();
  const t = translations[language];
  const { data: session } = useSession();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Edit Form
  const [editFormData, setEditFormData] = useState({ title: '', titleEn: '', description: '', descriptionEn: '', imageUrl: '' });
  const [isUploading, setIsUploading] = useState(false);

  // Add Items Logic
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<'episode' | 'article'>('episode');
  
  // We store ALL fetched items here to filter locally instantly
  const [allFetchedItems, setAllFetchedItems] = useState<(Episode | Article)[]>([]);
  const [displayedItems, setDisplayedItems] = useState<(Episode | Article)[]>([]);
  const [isFetchingItems, setIsFetchingItems] = useState(false);

  // Fetch Playlist Data
  const fetchPlaylist = useCallback(async () => {
    try {
      const res = await fetch(`/api/playlists/${slug}?language=${language}`);
      const data = await res.json();
      if (res.ok) {
        setPlaylist(data.playlist);
        setEditFormData({
          title: data.playlist.title || '', titleEn: data.playlist.titleEn || '',
          description: data.playlist.description || '', descriptionEn: data.playlist.descriptionEn || '',
          imageUrl: data.playlist.imageUrl || '',
        });
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [slug, language]);

  useEffect(() => { fetchPlaylist(); }, [fetchPlaylist]);

  const isOwner = session?.user?.id === playlist?.userId;

  // --- Actions ---

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true); toast.success(t.uploading);
    const formData = new FormData();
    formData.append('file', file); formData.append('type', 'playlist');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setEditFormData(prev => ({ ...prev, imageUrl: data.url }));
        toast.success(t.uploadSuccess);
      } else throw new Error(data.error);
    } catch { toast.error(t.uploadError); } 
    finally { setIsUploading(false); }
  };

  const handleUpdatePlaylist = async () => {
    try {
      const res = await fetch(`/api/playlists/${slug}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) { toast.success(t.updated); setIsEditModalOpen(false); fetchPlaylist(); }
      else toast.error(t.error);
    } catch { toast.error(t.error); }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/playlists/${slug}`, { method: 'DELETE' });
      if (res.ok) { toast.success("Deleted"); window.location.href = "/playlists"; }
    } catch { toast.error(t.error); }
  };

  const handleRemoveItem = async (type: 'episode' | 'article', id: string) => {
    if (!playlist) return;
    const prev = { ...playlist };
    // Optimistic update
    if (type === 'episode') setPlaylist(p => p ? { ...p, episodes: p.episodes?.filter(e => e.id !== id) } : null);
    else setPlaylist(p => p ? { ...p, articles: p.articles?.filter(a => a.id !== id) } : null);

    try {
      const currentIds = type === 'episode' ? playlist.episodes?.filter(e => e.id !== id).map(e => e.id) : playlist.articles?.filter(a => a.id !== id).map(a => a.id);
      await fetch(`/api/playlists/${slug}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type === 'episode' ? 'episodes' : 'articles']: currentIds })
      });
      toast.success(t.removed);
    } catch { toast.error(t.error); setPlaylist(prev); }
  };

  // --- Search & Add Logic ---

  // 1. Fetch ALL items when modal opens or type changes
  useEffect(() => {
    if (!isAddModalOpen) return;
    
    const fetchAllItems = async () => {
      setIsFetchingItems(true);
      try {
        const endpoint = searchType === 'episode' ? `/api/episodes` : `/api/articles`;
        const res = await fetch(`${endpoint}?language=${language}`);
        const data = await res.json();
        const items = searchType === 'episode' ? (data.episodes || []) : (data.articles || []);
        setAllFetchedItems(items);
        setDisplayedItems(items); // Initially show all
      } catch (error) {
        console.error("Failed to fetch items", error);
        toast.error(t.error);
      } finally {
        setIsFetchingItems(false);
      }
    };
    
    fetchAllItems();
  }, [isAddModalOpen, searchType, language, t.error]);

  // 2. Filter locally when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setDisplayedItems(allFetchedItems);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = allFetchedItems.filter(item => 
        (item.title?.toLowerCase().includes(lowerTerm)) || 
        (item.titleEn?.toLowerCase().includes(lowerTerm))
      );
      setDisplayedItems(filtered);
    }
  }, [searchTerm, allFetchedItems]);

  const handleAddItem = async (item: Episode | Article) => {
    if (!playlist) return;
    const currentList = searchType === 'episode' ? playlist.episodes : playlist.articles;
    if (currentList?.some(i => i.id === item.id)) { toast("العنصر موجود بالفعل"); return; }

    const updatedList = [...(currentList || []), item];
    const updatedIds = updatedList.map(i => i.id);

    try {
      const res = await fetch(`/api/playlists/${slug}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [searchType === 'episode' ? 'episodes' : 'articles']: updatedIds })
      });
      if (res.ok) {
        toast.success(t.added);
        if (searchType === 'episode') setPlaylist(p => p ? {...p, episodes: updatedList as Episode[]} : null);
        else setPlaylist(p => p ? {...p, articles: updatedList as Article[]} : null);
      }
    } catch { toast.error(t.error); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><FaSpinner className="animate-spin text-blue-600 text-4xl" /></div>;
  if (!playlist) return <div className="min-h-screen flex items-center justify-center text-gray-500">{t.notFound}</div>;

  const totalItems = (playlist.episodes?.length || 0) + (playlist.articles?.length || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Hero Section */}
      <div className="relative h-72 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10" />
        <Image src={playlist.imageUrl || "/placeholder.png"} alt={playlist.title || ''} fill className="object-cover opacity-50 dark:opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-10">
            <div className="container mx-auto flex flex-col md:flex-row items-end gap-6">
                <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="relative w-32 h-32 md:w-44 md:h-44 rounded-2xl shadow-2xl border-4 border-white dark:border-gray-800 overflow-hidden flex-shrink-0 bg-white">
                    <Image src={playlist.imageUrl || "/placeholder.png"} alt={playlist.title || ''} fill className="object-cover" />
                </motion.div>
                <div className="flex-1 mb-2">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        {playlist.userId && (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full mb-2 backdrop-blur-sm border border-blue-400/30">
                                <FaLock /> {t.private}
                            </span>
                        )}
                        <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-2">
                            {language === 'ar' ? playlist.title : playlist.titleEn}
                        </h1>
                        <p className="text-gray-300 md:text-lg max-w-2xl line-clamp-2 flex items-center gap-2">
                            <FaGraduationCap /> {language === 'ar' ? playlist.description : playlist.descriptionEn || t.heroSubtitle}
                        </p>
                    </motion.div>
                </div>
                
                {isOwner && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex gap-3 mb-2">
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg backdrop-blur-sm">
                            <FaPlus /> {t.addItems}
                        </button>
                        <button onClick={() => setIsEditModalOpen(true)} className="p-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/40 transition border border-white/30">
                            <FaEdit />
                        </button>
                        <button onClick={handleDeletePlaylist} className="p-2.5 bg-red-500/20 backdrop-blur-sm text-red-200 rounded-xl hover:bg-red-500/40 transition border border-red-400/30">
                            <FaTrash />
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="container mx-auto px-4 md:px-10 -mt-6 relative z-30">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex justify-around items-center border border-gray-100 dark:border-gray-700">
              <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{playlist.episodes?.length || 0}</div>
                  <div className="text-xs text-gray-500">{t.episodes}</div>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
              <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{playlist.articles?.length || 0}</div>
                  <div className="text-xs text-gray-500">{t.articles}</div>
              </div>
          </div>
      </div>

      {/* Content Grid */}
      <div className="container mx-auto px-4 md:px-10 mt-10">
        {totalItems === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300">
            <FaBookOpen className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-6">{t.empty}</p>
            {isOwner && (
              <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition">
                <FaPlus className="inline mr-2" /> {t.addItems}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlist.episodes?.map((ep, idx) => (
              <motion.div key={ep.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                <Link href={`/episodes/${ep.slug}`} className="block">
                  <div className="aspect-video relative bg-gray-100">
                    {ep.thumbnailUrl ? <Image src={ep.thumbnailUrl} alt={ep.title || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" /> :
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600"><FaPlay className="text-white text-3xl opacity-80" /></div>}
                    <span className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">{language === 'ar' ? 'حلقة' : 'Episode'}</span>
                  </div>
                  <div className="p-3"><h3 className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-2">{language === 'ar' ? ep.title : ep.titleEn}</h3></div>
                </Link>
                {isOwner && <button onClick={() => handleRemoveItem('episode', ep.id)} className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"><FaTimes size={10} /></button>}
              </motion.div>
            ))}
            
            {playlist.articles?.map((art, idx) => (
              <motion.div key={art.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (playlist.episodes?.length || 0 + idx) * 0.03 }} className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                <Link href={`/articles/${art.slug}`} className="block h-full">
                  <div className="h-full flex flex-col justify-center p-5 border-t-4 border-green-500">
                    <div className="flex items-center gap-2 mb-3"><FaNewspaper className="text-green-500" /><span className="text-xs text-gray-500 uppercase">{language === 'ar' ? 'مقال' : 'Article'}</span></div>
                    <h3 className="font-semibold text-gray-800 dark:text-white line-clamp-3">{language === 'ar' ? art.title : art.titleEn}</h3>
                  </div>
                </Link>
                {isOwner && <button onClick={() => handleRemoveItem('article', art.id)} className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"><FaTimes size={10} /></button>}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border dark:border-gray-700">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold dark:text-white">{t.edit}</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"><FaTimes /></button>
              </div>
              
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 group">
                        {editFormData.imageUrl ? <Image src={editFormData.imageUrl} alt="Cover" fill className="object-cover" /> :
                         <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-400"><FaGraduationCap size={32} /></div>}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"><FaCloudUploadAlt className="text-white text-2xl" /></div>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    {isUploading ? <span className="text-xs text-blue-500 animate-pulse">{t.uploading}</span> : <span className="text-xs text-gray-500">{t.image}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">{t.titleAr}</label><input type="text" value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 ring-blue-500 transition" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">{t.titleEn}</label><input type="text" value={editFormData.titleEn} onChange={(e) => setEditFormData({...editFormData, titleEn: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 ring-blue-500 transition" /></div>
                </div>
                
                <div><label className="block text-xs font-medium text-gray-500 mb-1">{t.descAr}</label><textarea value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 ring-blue-500 transition" rows={2} /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">{t.descEn}</label><textarea value={editFormData.descriptionEn} onChange={(e) => setEditFormData({...editFormData, descriptionEn: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 ring-blue-500 transition" rows={2} /></div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium">{t.cancel}</button>
                <button onClick={handleUpdatePlaylist} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition font-medium shadow-lg shadow-blue-500/30 flex items-center gap-2"><FaSave /> {t.save}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Items Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col border dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold dark:text-white">{t.addItems}</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"><FaTimes /></button>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="flex rounded-xl overflow-hidden border dark:border-gray-600 shadow-sm">
                    <button onClick={() => setSearchType('episode')} className={`px-5 py-2.5 text-sm font-medium flex items-center gap-2 transition ${searchType === 'episode' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}><FaVideo /> {t.episodes}</button>
                    <button onClick={() => setSearchType('article')} className={`px-5 py-2.5 text-sm font-medium flex items-center gap-2 transition ${searchType === 'article' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}><FaNewspaper /> {t.articles}</button>
                </div>
                <div className="relative flex-1">
                    <FaSearch className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t.searchItems} className="w-full pl-11 pr-4 py-2.5 rounded-xl border dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 ring-blue-500" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[200px] pr-2 custom-scrollbar">
                {isFetchingItems ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500"><FaSpinner className="animate-spin text-3xl mb-2" /><span>Loading...</span></div>
                ) : displayedItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {displayedItems.map((item) => (
                            <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                                <div className="aspect-video relative">
                                    {(item as Episode).thumbnailUrl || (item as Article).featuredImageUrl ? (
                                        <Image src={(item as Episode).thumbnailUrl || (item as Article).featuredImageUrl || ''} alt={item.title || ''} fill className="object-cover opacity-80" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                            {searchType === 'episode' ? <FaVideo className="text-gray-400" /> : <FaNewspaper className="text-gray-400" />}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => handleAddItem(item)} className="bg-white text-blue-600 p-2 rounded-full hover:scale-110 transition transform"><FaPlus /></button>
                                    </div>
                                </div>
                                <div className="p-2"><span className="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-1">{language === 'ar' ? item.title : item.titleEn}</span></div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center px-4">
                        <FaSearch className="text-4xl mb-3 opacity-50" /><p>{t.noResults}</p>
                    </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}