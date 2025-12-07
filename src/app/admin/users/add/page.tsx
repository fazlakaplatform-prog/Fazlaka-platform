"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Save, 
  User, 
  Upload
} from "lucide-react" // إزالة الأيقونات غير المستخدمة
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

// Translation object
const translations = {
  ar: {
    title: "إضافة مستخدم جديد",
    back: "العودة إلى قائمة المستخدمين",
    save: "حفظ المستخدم",
    saving: "جاري الحفظ...",
    saved: "تم إضافة المستخدم بنجاح",
    error: "حدث خطأ ما",
    loading: "جاري التحميل...",
    basicInfo: "المعلومات الأساسية",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    role: "الدور",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    banned: "محظور",
    user: "مستخدم",
    owner: "مالك",
    editor: "محرر",
    admin: "مدير",
    bio: "النبذة الشخصية",
    location: "الموقع",
    website: "الموقع الإلكتروني",
    profileImage: "صورة الملف الشخصي",
    bannerImage: "صورة البانر",
    uploadImage: "رفع صورة",
    accountStatus: "حالة الحساب",
    isActive: "الحساب نشط",
    isBanned: "الحساب محظور",
    isEmailVerified: "البريد الإلكتروني موثق",
    passwordsNotMatch: "كلمات المرور غير متطابقة",
    requiredField: "هذا الحقل مطلوب"
  },
  en: {
    title: "Add New User",
    back: "Back to Users List",
    save: "Save User",
    saving: "Saving...",
    saved: "User added successfully",
    error: "Something went wrong",
    loading: "Loading...",
    basicInfo: "Basic Information",
    name: "Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    role: "Role",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    banned: "Banned",
    user: "User",
    owner: "Owner",
    editor: "Editor",
    admin: "Admin",
    bio: "Bio",
    location: "Location",
    website: "Website",
    profileImage: "Profile Image",
    bannerImage: "Banner Image",
    uploadImage: "Upload Image",
    accountStatus: "Account Status",
    isActive: "Account is Active",
    isBanned: "Account is Banned",
    isEmailVerified: "Email is Verified",
    passwordsNotMatch: "Passwords do not match",
    requiredField: "This field is required"
  }
};

// تعريف واجهة للأخطاء
interface FormErrors {
  [key: string]: string | null;
}

export default function AddUserPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  
  const [saving, setSaving] = useState(false) // إزالة loading و setLoading
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    bio: "",
    location: "",
    website: "",
    image: "",
    banner: "",
    isActive: true,
    banned: false,
    emailVerified: false
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (status === "loading") return
    
    // تم إزالة التحقق من الجلسة والصلاحيات
  }, [session, status, router])

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
      newErrors.name = t.requiredField
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t.requiredField
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    
    if (!formData.password) {
      newErrors.password = t.requiredField
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t.requiredField
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.passwordsNotMatch
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      setSaving(true)
      const response = await fetch('/api/admin/users', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          image: formData.image,
          banner: formData.banner,
          isActive: formData.isActive,
          banned: formData.banned,
          emailVerified: formData.emailVerified
        })
      })
      
      if (response.ok) {
        alert(t.saved)
        router.push("/admin/users")
      } else {
        const data = await response.json()
        alert(data.error || t.error)
      }
    } catch (error) {
      console.error("Error creating user:", error)
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
        } else {
          alert('Failed to upload image')
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        alert('Error uploading image')
      }
    }
    
    input.click()
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin/users" className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t.back}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          </div>
          <button
            type="submit"
            form="add-user-form"
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

        <form id="add-user-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t.basicInfo}</h3>
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.email} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.password} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.confirmPassword} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
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
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.location}
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
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
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.website}
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </motion.div>

          {/* Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.profileImage}
                </label>
                <div className="flex items-center space-x-4">
                  {formData.image ? (
                    <Image
                      src={formData.image}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleImageUpload('profile')}
                    className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t.uploadImage}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.bannerImage}
                </label>
                <div className="flex items-center space-x-4">
                  {formData.banner ? (
                    <Image
                      src={formData.banner}
                      alt="Banner"
                      width={120}
                      height={80}
                      className="rounded object-cover"
                    />
                  ) : (
                    <div className="h-20 w-32 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">No Banner</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleImageUpload('banner')}
                    className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t.uploadImage}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Account Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t.accountStatus}</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {t.isActive}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="banned"
                  name="banned"
                  type="checkbox"
                  checked={formData.banned}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="banned" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {t.isBanned}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="emailVerified"
                  name="emailVerified"
                  type="checkbox"
                  checked={formData.emailVerified}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="emailVerified" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {t.isEmailVerified}
                </label>
              </div>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  )
}