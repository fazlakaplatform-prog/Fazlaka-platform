import { motion, AnimatePresence } from "framer-motion"
import { Key, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"

const translations = {
  ar: {
    passwordSection: "كلمة المرور",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    sendResetPasswordLink: "إرسال رابط إعادة تعيين كلمة المرور"
  },
  en: {
    passwordSection: "Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    showPassword: "Show Password",
    hidePassword: "Hide Password",
    sendResetPasswordLink: "Send Reset Password Link"
  }
};

// Define proper TypeScript interfaces
interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

interface PasswordFormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

interface PasswordSectionProps {
  formData: PasswordFormData
  errors: PasswordFormErrors
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  isOpen: boolean
  toggleOpen: () => void
  showNewPassword: boolean
  setShowNewPassword: (show: boolean) => void
  showConfirmPassword: boolean
  setShowConfirmPassword: (show: boolean) => void
  handleResetPassword: () => Promise<void>
}

export default function PasswordSection({
  formData,
  errors,
  handleInputChange,
  isOpen,
  toggleOpen,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  handleResetPassword
}: PasswordSectionProps) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
    >
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex items-center justify-between text-white"
      >
        <h3 className="text-lg font-medium flex items-center">
          <Key className="h-5 w-5 mr-2" />
          {t.passwordSection}
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
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.newPassword}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                        errors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.confirmPassword}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
                </div>
              </div>
              
              {/* Reset Password Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
                >
                  <Key className="h-5 w-5 mr-2" />
                  {t.sendResetPasswordLink}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}