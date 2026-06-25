"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, User, Camera, Trash2, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

// Text translations
const translations = {
  ar: {
    editProfile: "تعديل الملف الشخصي",
    name: "الاسم",
    bio: "نبذة شخصية",
    save: "حفظ",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    profileUpdated: "تم تحديث الملف الشخصي بنجاح",
    updateFailed: "فشل تحديث الملف الشخصي",
    noBio: "لا توجد نبذة شخصية",
    user: "مستخدم",
    changeProfilePicture: "تغيير الصورة الشخصية",
    uploading: "جاري الرفع...",
    uploadFailed: "فشل رفع الصورة",
    imageTooLarge: "حجم الصورة كبير جدًا (الحد الأقصى 5 ميجابايت)",
    bannerTooLarge: "حجم البانر كبير جدًا (الحد الأقصى 10 ميجابايت)",
    invalidImageType: "نوع الملف غير مدعوم (يرجى رفع صورة بصيغة JPEG, PNG, أو WebP)",
    imageUpdated: "تم تحديث الصورة الشخصية بنجاح",
    bannerUpdated: "تم تحديث البانر بنجاح",
    personalInfo: "المعلومات الشخصية",
    profilePicture: "الصورة الشخصية",
    profileBanner: "صورة البانر",
    chooseImage: "اختر صورة",
    removeImage: "إزالة الصورة",
    removeBanner: "إزالة البانر",
    confirmRemove: "هل أنت متأكد من أنك تريد إزالة الصورة الشخصية؟",
    confirmRemoveBanner: "هل أنت متأكد من أنك تريد إزالة البانر؟",
    yes: "نعم",
    no: "لا",
  },
  en: {
    editProfile: "Edit Profile",
    name: "Name",
    bio: "Bio",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    profileUpdated: "Profile updated successfully",
    updateFailed: "Failed to update profile",
    noBio: "No bio available",
    user: "User",
    changeProfilePicture: "Change Profile Picture",
    uploading: "Uploading...",
    uploadFailed: "Failed to upload image",
    imageTooLarge: "Image too large (max 5MB)",
    bannerTooLarge: "Banner too large (max 10MB)",
    invalidImageType: "Invalid file type (please upload JPEG, PNG, or WebP)",
    imageUpdated: "Profile image updated successfully",
    bannerUpdated: "Banner updated successfully",
    personalInfo: "Personal Information",
    profilePicture: "Profile Picture",
    profileBanner: "Profile Banner",
    chooseImage: "Choose Image",
    removeImage: "Remove Image",
    removeBanner: "Remove Banner",
    confirmRemove: "Are you sure you want to remove your profile picture?",
    confirmRemoveBanner: "Are you sure you want to remove your banner?",
    yes: "Yes",
    no: "No",
  }
};

export default function ProfileSettings() {
  const { data: session, status, update } = useSession()
  const { language } = useLanguage()
  const t = translations[language]
  
  // States for profile editing
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [image, setImage] = useState("")
  const [banner, setBanner] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [profileMessage, setProfileMessage] = useState("")
  const [profileError, setProfileError] = useState("")
  const [imageError, setImageError] = useState("")
  const [bannerError, setBannerError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showConfirmBannerDialog, setShowConfirmBannerDialog] = useState(false)
  
  // Accordion states for profile editing
  const [profilePictureSection, setProfilePictureSection] = useState(false)
  const [profileBannerSection, setProfileBannerSection] = useState(false)
  const [personalInfoSection, setPersonalInfoSection] = useState(false)

  // Fetch user data
  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user/${session!.user.id}`)
        if (response.ok) {
          const userData = await response.json()
          setName(userData.name || "")
          setBio(userData.bio || "")
          setImage(userData.image || session.user?.image || "")
          setBanner(userData.banner || "")
        }
      } catch {
        console.error("Error fetching user data")
      }
    }

    fetchUserData()
  }, [session, status])

  // Profile editing functions
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setImageError(t.imageTooLarge)
      return
    }

    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      setImageError(t.invalidImageType)
      return
    }

    setImageError("")
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "profile")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const imageUrl = data.url
        
        setImage(imageUrl)
        
        const updateResponse = await fetch(`/api/user/${session!.user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: imageUrl,
          }),
        })

        if (updateResponse.ok) {
          await update({
            ...session!,
            user: {
              ...session!.user,
              image: imageUrl,
            }
          })
          
          setProfileMessage(t.imageUpdated)
          setTimeout(() => setProfileMessage(""), 3000)
        } else {
          setImageError(t.updateFailed)
        }
      } else {
        setImageError(t.uploadFailed)
      }
    } catch {
      setImageError(t.uploadFailed)
    } finally {
      setIsUploading(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setBannerError(t.bannerTooLarge)
      return
    }

    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      setBannerError(t.invalidImageType)
      return
    }

    setBannerError("")
    setIsUploadingBanner(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "banner")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const bannerUrl = data.url
        
        setBanner(bannerUrl)
        
        const updateResponse = await fetch(`/api/user/${session!.user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            banner: bannerUrl,
          }),
        })

        if (updateResponse.ok) {
          setProfileMessage(t.bannerUpdated)
          setTimeout(() => setProfileMessage(""), 3000)
        } else {
          setBannerError(t.updateFailed)
        }
      } else {
        setBannerError(t.uploadFailed)
      }
    } catch {
      setBannerError(t.uploadFailed)
    } finally {
      setIsUploadingBanner(false)
    }
  }

  const handleRemoveImage = async () => {
    try {
      const updateResponse = await fetch(`/api/user/${session!.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: "",
        }),
      })

      if (updateResponse.ok) {
        await update({
          ...session!,
          user: {
            ...session!.user,
            image: "",
          }
        })
        
        setImage("")
        setProfileMessage(t.imageUpdated)
        setTimeout(() => setProfileMessage(""), 3000)
        setShowConfirmDialog(false)
      } else {
        setImageError(t.updateFailed)
      }
    } catch {
      setImageError(t.updateFailed)
    }
  }

  const handleRemoveBanner = async () => {
    try {
      const updateResponse = await fetch(`/api/user/${session!.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          banner: "",
        }),
      })

      if (updateResponse.ok) {
        setBanner("")
        setProfileMessage(t.bannerUpdated)
        setTimeout(() => setProfileMessage(""), 3000)
        setShowConfirmBannerDialog(false)
      } else {
        setBannerError(t.updateFailed)
      }
    } catch {
      setBannerError(t.updateFailed)
    }
  }

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    setProfileError("")
    setProfileMessage("")

    try {
      const response = await fetch(`/api/user/${session!.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          bio,
          image,
          banner,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setProfileMessage(t.profileUpdated)
        
        await update({
          ...session!,
          user: {
            ...session!.user,
            name,
            image,
          }
        })
      } else {
        setProfileError(data.error || t.updateFailed)
      }
    } catch {
      setProfileError("An error occurred. Please try again")
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.editProfile}</h2>
        
        {/* Profile Messages */}
        <AnimatePresence>
          {profileMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800/30 flex items-center"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {profileMessage}
            </motion.div>
          )}
          
          {profileError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800/30 flex items-center"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              {profileError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Banner Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm mb-4">
          <button
            onClick={() => setProfileBannerSection(!profileBannerSection)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <ImageIcon className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">{t.profileBanner}</span>
            </div>
            {profileBannerSection ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>
          
          <AnimatePresence>
            {profileBannerSection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div className="w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 relative">
                    {banner ? (
                      <Image
                        src={banner}
                        alt="Profile Banner"
                        width={800}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    {banner && (
                      <button
                        onClick={() => setShowConfirmBannerDialog(true)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors shadow-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      {isUploadingBanner ? t.uploading : t.chooseImage}
                    </button>
                  </div>
                  {bannerError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{bannerError}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Picture Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm mb-4">
          <button
            onClick={() => setProfilePictureSection(!profilePictureSection)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <Camera className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">{t.profilePicture}</span>
            </div>
            {profilePictureSection ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>
          
          <AnimatePresence>
            {profilePictureSection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    {image || session?.user?.image ? (
                      <div className="relative">
                        <Image
                          src={image || session?.user?.image || ""}
                          alt={session?.user?.name || "User"}
                          width={80}
                          height={80}
                          className="rounded-full border-2 border-gray-200 dark:border-gray-700 shadow-md"
                        />
                        <button
                          onClick={() => setShowConfirmDialog(true)}
                          className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors shadow-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-md">
                        <User className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                      >
                        {isUploading ? t.uploading : t.chooseImage}
                      </button>
                      {imageError && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{imageError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Personal Information Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm mb-4">
          <button
            onClick={() => setPersonalInfoSection(!personalInfoSection)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <User className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">{t.personalInfo}</span>
            </div>
            {personalInfoSection ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>
          
          <AnimatePresence>
            {personalInfoSection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.name}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.bio}
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 shadow-md"
          >
            {isSavingProfile ? t.saving : t.save}
          </button>
          <button
            onClick={() => {
              setName(session?.user?.name || "")
              setBio("")
              setProfileError("")
              setProfileMessage("")
            }}
            className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium shadow-md"
          >
            {t.cancel}
          </button>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">{t.confirmRemove}</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleRemoveImage}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  {t.yes}
                </button>
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  {t.no}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmBannerDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowConfirmBannerDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">{t.confirmRemoveBanner}</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleRemoveBanner}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  {t.yes}
                </button>
                <button
                  onClick={() => setShowConfirmBannerDialog(false)}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  {t.no}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}