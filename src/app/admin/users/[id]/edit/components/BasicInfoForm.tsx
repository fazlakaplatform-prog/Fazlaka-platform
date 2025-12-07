import { motion, AnimatePresence } from "framer-motion"
import { User, ChevronDown, ChevronUp } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"

const translations = {
  ar: {
    basicInfo: "المعلومات الأساسية",
    name: "الاسم",
    role: "الدور",
    bio: "النبذة الشخصية",
    user: "مستخدم",
    owner: "مالك",
    editor: "محرر",
    admin: "مدير",
    requiredField: "هذا الحقل مطلوب"
  },
  en: {
    basicInfo: "Basic Information",
    name: "Name",
    role: "Role",
    bio: "Bio",
    user: "User",
    owner: "Owner",
    editor: "Editor",
    admin: "Admin",
    requiredField: "This field is required"
  }
};

// Define proper TypeScript interfaces
interface BasicInfoFormData {
  name: string;
  role: string;
  bio: string;
}

interface FormErrors {
  [key: string]: string | null;
}

interface BasicInfoFormProps {
  formData: BasicInfoFormData
  errors: FormErrors
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  isOpen: boolean
  toggleOpen: () => void
}

export default function BasicInfoForm({
  formData,
  errors,
  handleInputChange,
  isOpen,
  toggleOpen
}: BasicInfoFormProps) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
    >
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between text-white"
      >
        <h3 className="text-lg font-medium flex items-center">
          <User className="h-5 w-5 mr-2" />
          {t.basicInfo}
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
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.name} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.role}
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="user">{t.user}</option>
                    <option value="editor">{t.editor}</option>
                    <option value="owner">{t.owner}</option>
                    <option value="admin">{t.admin}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.bio}
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}