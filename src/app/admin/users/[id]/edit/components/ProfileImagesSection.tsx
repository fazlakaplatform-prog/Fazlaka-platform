import { motion, AnimatePresence } from "framer-motion"
import { Camera, ChevronDown, ChevronUp, Upload, Trash2, User, ImageIcon } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

const translations = {
  ar: {
    profileInfo: "معلومات الملف الشخصي",
    profileImage: "صورة الملف الشخصي",
    bannerImage: "صورة البانر",
    uploadImage: "رفع صورة",
    uploading: "جاري الرفع...",
    imageTooLarge: "حجم الصورة كبير جدًا (الحد الأقصى 5 ميجابايت)",
    bannerTooLarge: "حجم البانر كبير جدًا (الحد الأقصى 10 ميجابايت)",
    invalidImageType: "نوع الملف غير مدعوم (يرجى رفع صورة بصيغة JPEG, PNG, أو WebP)",
    confirmRemove: "هل أنت متأكد من أنك تريد إزالة الصورة الشخصية؟",
    confirmRemoveBanner: "هل أنت متأكد من أنك تريد إزالة البانر؟",
    yes: "نعم",
    no: "لا"
  },
  en: {
    profileInfo: "Profile Information",
    profileImage: "Profile Image",
    bannerImage: "Banner Image",
    uploadImage: "Upload Image",
    uploading: "Uploading...",
    imageTooLarge: "Image too large (max 5MB)",
    bannerTooLarge: "Banner too large (max 10MB)",
    invalidImageType: "Invalid file type (please upload JPEG, PNG, or WebP)",
    confirmRemove: "Are you sure you want to remove the profile picture?",
    confirmRemoveBanner: "Are you sure you want to remove the banner?",
    yes: "Yes",
    no: "No"
  }
};

// Define proper TypeScript interfaces
interface ProfileImagesFormData {
  image: string;
  banner: string;
}

interface ProfileImagesSectionProps {
  formData: ProfileImagesFormData
  isOpen: boolean
  toggleOpen: () => void
  handleImageUpload: (field: string) => void
  handleRemoveImage: (field: string) => void
  isUploadingProfile: boolean
  isUploadingBanner: boolean
  imageError: string
  bannerError: string
  showConfirmImageDialog: boolean
  showConfirmBannerDialog: boolean
  setShowConfirmImageDialog: (show: boolean) => void
  setShowConfirmBannerDialog: (show: boolean) => void
}

export default function ProfileImagesSection({
  formData,
  isOpen,
  toggleOpen,
  handleImageUpload,
  handleRemoveImage,
  isUploadingProfile,
  isUploadingBanner,
  imageError,
  bannerError,
  showConfirmImageDialog,
  showConfirmBannerDialog,
  setShowConfirmImageDialog,
  setShowConfirmBannerDialog
}: ProfileImagesSectionProps) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
      >
        <button
          type="button"
          onClick={toggleOpen}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between text-white"
        >
          <h3 className="text-lg font-medium flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            {t.profileInfo}
          </h3>
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.profileImage}
                    </label>
                    <div className="flex items-center space-x-4">
                      {formData.image ? (
                        <div className="relative">
                          <Image
                            src={formData.image}
                            alt="Profile"
                            width={80}
                            height={80}
                            className="rounded-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmImageDialog(true)}
                            className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleImageUpload('image')}
                        disabled={isUploadingProfile}
                        className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        {isUploadingProfile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-500 mr-2"></div>
                            {t.uploading}
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {t.uploadImage}
                          </>
                        )}
                      </button>
                    </div>
                    {imageError && <p className="mt-2 text-sm text-red-500">{imageError}</p>}
                  </div>
                  
                  {/* Banner Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.bannerImage}
                    </label>
                    <div className="flex items-center space-x-4">
                      {formData.banner ? (
                        <div className="relative">
                          <Image
                            src={formData.banner}
                            alt="Banner"
                            width={120}
                            height={80}
                            className="rounded object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmBannerDialog(true)}
                            className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-20 w-32 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleImageUpload('banner')}
                        disabled={isUploadingBanner}
                        className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        {isUploadingBanner ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-500 mr-2"></div>
                            {t.uploading}
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {t.uploadImage}
                          </>
                        )}
                      </button>
                    </div>
                    {bannerError && <p className="mt-2 text-sm text-red-500">{bannerError}</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Remove Profile Image Modal */}
      {showConfirmImageDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
          >
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-4">
                {t.confirmRemove}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'سيتم إزالة صورة الملف الشخصي الحالية' : 'The current profile picture will be removed'}
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowConfirmImageDialog(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md w-24 mr-2 hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  {t.no}
                </button>
                <button
                  onClick={() => handleRemoveImage('image')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-base font-medium rounded-md w-24"
                >
                  {t.yes}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Remove Banner Modal */}
      {showConfirmBannerDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
          >
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-4">
                {t.confirmRemoveBanner}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'سيتم إزالة صورة البانر الحالية' : 'The current banner will be removed'}
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowConfirmBannerDialog(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md w-24 mr-2 hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  {t.no}
                </button>
                <button
                  onClick={() => handleRemoveImage('banner')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-base font-medium rounded-md w-24"
                >
                  {t.yes}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}