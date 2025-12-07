"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Save, 
  User
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/Language/LanguageProvider"
import BasicInfoForm from "./components/BasicInfoForm"
import ProfileImagesSection from "./components/ProfileImagesSection"
import PasswordSection from "./components/PasswordSection"
import EmailManagementSection from "./components/EmailManagementSection"
import AccountStatusSection from "./components/AccountStatusSection"
import NotificationsSection from "./components/NotificationsSection"
import UserStats from "./components/UserStats"

// Translation object
const translations = {
  ar: {
    title: "تعديل المستخدم",
    back: "العودة إلى تفاصيل المستخدم",
    save: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    saved: "تم حفظ التغييرات بنجاح",
    error: "حدث خطأ ما",
    loading: "جاري التحميل...",
    userNotFound: "لم يتم العثور على المستخدم",
    userStatistics: "إحصائيات المستخدم",
    viewFullProfile: "عرض الملف الشخصي الكامل",
    // Added missing translation keys
    requiredField: "هذا الحقل مطلوب",
    invalidEmail: "صيغة البريد الإلكتروني غير صحيحة",
    passwordsNotMatch: "كلمات المرور غير متطابقة",
    passwordTooShort: "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
  },
  en: {
    title: "Edit User",
    back: "Back to User Details",
    save: "Save Changes",
    saving: "Saving...",
    saved: "Changes saved successfully",
    error: "Something went wrong",
    loading: "Loading...",
    userNotFound: "User not found",
    userStatistics: "User Statistics",
    viewFullProfile: "View Full Profile",
    // Added missing translation keys
    requiredField: "This field is required",
    invalidEmail: "Invalid email format",
    passwordsNotMatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 8 characters"
  }
};

// تعريف واجهة للمستخدم
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  image?: string;
  banner?: string;
  isActive: boolean;
  banned: boolean;
  emailVerified: boolean;
  createdAt?: string;
  lastLogin?: string;
  secondaryEmails?: Array<{
    _id: string;
    email: string;
    isVerified: boolean;
    verificationToken?: string;
    verificationTokenExpiry?: Date;
  }>;
  loginCount?: number;
  lastActivity?: string;
  verificationMethod?: string;
}

// تعريف واجهة للإحصائيات
interface UserStats {
  totalLogins: number;
  lastLoginDate?: string;
  loginHistory?: Array<{
    date: string;
    ip?: string;
    device?: string;
  }>;
  verificationAttempts?: number;
  passwordResets?: number;
  emailChanges?: number;
}

// تعريف واجهة للأخطاء
interface FormErrors {
  [key: string]: string | null;
}

// تعريف واجهة لبيانات الإشعارات
interface NotificationData {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  sendEmail: boolean;
  emailSubject: string;
  emailMessage: string;
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  // فك params باستخدام use
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const router = useRouter()
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  
  const [user, setUser] = useState<User | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user",
    bio: "",
    image: "",
    banner: "",
    isActive: true,
    banned: false,
    emailVerified: false,
    newPassword: "",
    confirmPassword: ""
  })
  const [secondaryEmails, setSecondaryEmails] = useState<Array<{_id: string, email: string, isVerified: boolean, verificationToken?: string, verificationTokenExpiry?: Date}>>([])
  const [errors, setErrors] = useState<FormErrors>({})
  
  // Section visibility states
  const [basicInfoSection, setBasicInfoSection] = useState(false)
  const [profileInfoSection, setProfileInfoSection] = useState(false)
  const [passwordSection, setPasswordSection] = useState(false)
  const [contactInfoSection, setContactInfoSection] = useState(false)
  const [accountStatusSection, setAccountStatusSection] = useState(false)
  const [notificationsSection, setNotificationsSection] = useState(false)
  
  // Notification states
  const [notificationData, setNotificationData] = useState<NotificationData>({
    title: "",
    message: "",
    type: "info",
    sendEmail: false,
    emailSubject: "",
    emailMessage: ""
  })
  
  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Image upload states
  const [isUploadingProfile, setIsUploadingProfile] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [imageError, setImageError] = useState("")
  const [bannerError, setBannerError] = useState("")
  const [showConfirmImageDialog, setShowConfirmImageDialog] = useState(false)
  const [showConfirmBannerDialog, setShowConfirmBannerDialog] = useState(false)

  // استخدام useCallback لتثبيت الدالة
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${id}`)
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          role: userData.role || "user",
          bio: userData.bio || "",
          image: userData.image || "",
          banner: userData.banner || "",
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          banned: userData.banned !== undefined ? userData.banned : false,
          emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : false,
          newPassword: "",
          confirmPassword: ""
        })
        setSecondaryEmails(userData.secondaryEmails || [])
        
        // Fetch user statistics
        const statsResponse = await fetch(`/api/admin/users/${id}/stats`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setUserStats(statsData)
        }
      } else {
        console.error("Failed to fetch user")
        setUser(null)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // مسح الخطأ عند تغيير القيمة
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors: FormErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = t.requiredField || "This field is required"
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t.requiredField || "This field is required"
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = t.invalidEmail || "Invalid email format"
    }
    
    // التحقق من كلمة المرور إذا تم إدخالها
    if (formData.newPassword && formData.newPassword.length < 8) {
      newErrors.newPassword = t.passwordTooShort || "Password must be at least 8 characters"
    }
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t.passwordsNotMatch || "Passwords do not match"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          bio: formData.bio,
          image: formData.image,
          banner: formData.banner,
          isActive: formData.isActive,
          banned: formData.banned,
          emailVerified: formData.emailVerified,
          secondaryEmails: secondaryEmails,
          // إضافة كلمة المرور فقط إذا تم إدخالها
          ...(formData.newPassword && { password: formData.newPassword })
        })
      })
      
      if (response.ok) {
        alert(t.saved)
        router.push(`/admin/users/${id}`)
      } else {
        const data = await response.json()
        alert(data.error || t.error)
      }
    } catch (error) {
      console.error("Error updating user:", error)
      alert(t.error)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (field: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return
      
      // Validate file size
      const maxSize = field === 'profile' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for profile, 10MB for banner
      if (file.size > maxSize) {
        if (field === 'profile') {
          setImageError("Image too large (max 5MB)")
        } else {
          setBannerError("Banner too large (max 10MB)")
        }
        return
      }
      
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
        if (field === 'profile') {
          setImageError("Invalid file type (please upload JPEG, PNG, or WebP)")
        } else {
          setBannerError("Invalid file type (please upload JPEG, PNG, or WebP)")
        }
        return
      }
      
      // Clear errors
      if (field === 'profile') {
        setImageError("")
        setIsUploadingProfile(true)
      } else {
        setBannerError("")
        setIsUploadingBanner(true)
      }
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', field)
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const data = await response.json()
          setFormData(prev => ({
            ...prev,
            [field]: data.url
          }))
          
          // Show success message
          if (field === 'profile') {
            alert("Profile image updated successfully")
          } else {
            alert("Banner updated successfully")
          }
        } else {
          if (field === 'profile') {
            setImageError('Failed to upload image')
          } else {
            setBannerError('Failed to upload image')
          }
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        if (field === 'profile') {
          setImageError('Error uploading image')
        } else {
          setBannerError('Error uploading image')
        }
      } finally {
        if (field === 'profile') {
          setIsUploadingProfile(false)
        } else {
          setIsUploadingBanner(false)
        }
      }
    }
    
    input.click()
  }

  const handleRemoveImage = async (field: string) => {
    try {
      setFormData(prev => ({
        ...prev,
        [field]: ""
      }))
      
      if (field === 'image') {
        setShowConfirmImageDialog(false)
        alert("Profile image updated successfully")
      } else {
        setShowConfirmBannerDialog(false)
        alert("Banner updated successfully")
      }
    } catch (error) {
      console.error(`Error removing ${field}:`, error)
      alert(t.error)
    }
  }

  const handleAddSecondaryEmail = (email: string) => {
    if (!email.trim()) return
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      alert("Invalid email format")
      return
    }
    
    const newEmail = {
      _id: Date.now().toString(),
      email: email,
      isVerified: false
    }
    
    setSecondaryEmails(prev => [...prev, newEmail])
  }

  const handleMakePrimaryEmail = async (emailId: string) => {
    try {
      const email = secondaryEmails.find(e => e._id === emailId)
      if (!email) return
      
      // Swap primary and secondary emails
      const updatedSecondaryEmails = [
        ...secondaryEmails.filter(e => e._id !== emailId),
        { _id: Date.now().toString(), email: formData.email, isVerified: formData.emailVerified }
      ]
      
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.email,
          emailVerified: email.isVerified,
          secondaryEmails: updatedSecondaryEmails
        })
      })
      
      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          email: email.email,
          emailVerified: email.isVerified
        }))
        setSecondaryEmails(updatedSecondaryEmails)
        alert("Email made primary successfully")
      } else {
        const data = await response.json()
        alert(data.error || t.error)
      }
    } catch (error) {
      console.error("Error making email primary:", error)
      alert(t.error)
    }
  }

  const handleRemoveSecondaryEmail = async (emailId: string) => {
    try {
      const updatedSecondaryEmails = secondaryEmails.filter(e => e._id !== emailId)
      
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          secondaryEmails: updatedSecondaryEmails
        })
      })
      
      if (response.ok) {
        setSecondaryEmails(updatedSecondaryEmails)
        alert("Email removed successfully")
      } else {
        const data = await response.json()
        alert(data.error || t.error)
      }
    } catch (error) {
      console.error("Error removing email:", error)
      alert(t.error)
    }
  }

  const handleVerifyEmailDirectly = async (emailId: string) => {
    try {
      const email = secondaryEmails.find(e => e._id === emailId)
      if (!email) return
      
      const updatedSecondaryEmails = secondaryEmails.map(e => 
        e._id === emailId ? { ...e, isVerified: true } : e
      )
      
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          secondaryEmails: updatedSecondaryEmails
        })
      })
      
      if (response.ok) {
        setSecondaryEmails(updatedSecondaryEmails)
        alert("Email verified successfully")
      } else {
        const data = await response.json()
        alert(data.error || t.error)
      }
    } catch (error) {
      console.error("Error verifying email:", error)
      alert(t.error)
    }
  }

  const handleBanUser = async (reason: string, notifyUser: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${id}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason,
          notifyUser
        })
      })
      
      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          banned: true
        }))
        alert("User banned successfully")
      } else {
        const data = await response.json()
        alert(data.error || t.error)
      }
    } catch (error) {
      console.error("Error banning user:", error)
      alert(t.error)
    }
  }

  const handleUnbanUser = async (reason: string, notifyUser: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${id}/unban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason,
          notifyUser
        })
      })
      
      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          banned: false
        }))
        alert("User unbanned successfully")
      } else {
        const data = await response.json()
        alert(data.error || t.error)
      }
    } catch (error) {
      console.error("Error unbanning user:", error)
      alert(t.error)
    }
  }

  const handleSendNotification = async (notificationData: NotificationData) => {
    try {
      const response = await fetch(`/api/admin/users/${id}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(notificationData)
      })
      
      if (response.ok) {
        alert("Message sent successfully")
        // Reset notification form
        setNotificationData({
          title: "",
          message: "",
          type: "info",
          sendEmail: false,
          emailSubject: "",
          emailMessage: ""
        })
      } else {
        const data = await response.json()
        alert(data.error || t.error)
      }
    } catch (error) {
      console.error("Error sending notification:", error)
      alert(t.error)
    }
  }

  const handleResetPassword = async () => {
    try {
      const response = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        alert("Password reset email sent successfully")
      } else {
        const data = await response.json()
        alert(data.error || t.error)
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      alert(t.error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">{t.loading}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.userNotFound}</h1>
          <Link href="/admin/users">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              {t.back}
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'} pt-16`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <Link href={`/admin/users/${id}`} className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t.back}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              form="edit-user-form"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  {t.saving}
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  {t.save}
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* User Statistics */}
        {userStats && (
          <UserStats userStats={userStats} user={user} />
        )}

        <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <BasicInfoForm
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            isOpen={basicInfoSection}
            toggleOpen={() => setBasicInfoSection(!basicInfoSection)}
          />

          {/* Profile Images */}
          <ProfileImagesSection
            formData={formData}
            isOpen={profileInfoSection}
            toggleOpen={() => setProfileInfoSection(!profileInfoSection)}
            handleImageUpload={handleImageUpload}
            handleRemoveImage={handleRemoveImage}
            isUploadingProfile={isUploadingProfile}
            isUploadingBanner={isUploadingBanner}
            imageError={imageError}
            bannerError={bannerError}
            showConfirmImageDialog={showConfirmImageDialog}
            showConfirmBannerDialog={showConfirmBannerDialog}
            setShowConfirmImageDialog={setShowConfirmImageDialog}
            setShowConfirmBannerDialog={setShowConfirmBannerDialog}
          />

          {/* Password Section */}
          <PasswordSection
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            isOpen={passwordSection}
            toggleOpen={() => setPasswordSection(!passwordSection)}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            handleResetPassword={handleResetPassword}
          />

          {/* Email Management */}
          <EmailManagementSection
            formData={formData}
            secondaryEmails={secondaryEmails}
            handleInputChange={handleInputChange}
            handleAddSecondaryEmail={handleAddSecondaryEmail}
            handleMakePrimaryEmail={handleMakePrimaryEmail}
            handleRemoveSecondaryEmail={handleRemoveSecondaryEmail}
            handleVerifyEmailDirectly={handleVerifyEmailDirectly}
            isOpen={contactInfoSection}
            toggleOpen={() => setContactInfoSection(!contactInfoSection)}
          />

          {/* Account Status */}
          <AccountStatusSection
            formData={formData}
            handleInputChange={handleInputChange}
            handleBanUser={handleBanUser}
            handleUnbanUser={handleUnbanUser}
            isOpen={accountStatusSection}
            toggleOpen={() => setAccountStatusSection(!accountStatusSection)}
          />

          {/* Notifications Section */}
          <NotificationsSection
            notificationData={notificationData}
            setNotificationData={setNotificationData}
            handleSendNotification={handleSendNotification}
            isOpen={notificationsSection}
            toggleOpen={() => setNotificationsSection(!notificationsSection)}
          />
        </form>
      </div>
    </div>
  )
}