"use client"

import { useState, useEffect } from "react"
import { useSession, signOut, signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Lock, Mail, Key, Shield, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Plus, Trash2, Star, X, Edit, Info } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/Language/LanguageProvider"

// Text translations
const translations = {
  ar: {
    // General
    accountSettings: "إعدادات الحساب",
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    close: "إغلاق",
    confirm: "تأكيد",
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجاح",
    
    // Password Section
    passwordSecurity: "كلمة المرور والأمان",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور الجديدة",
    changePassword: "تغيير كلمة المرور",
    passwordStrength: "قوة كلمة المرور",
    weak: "ضعيفة",
    medium: "متوسطة",
    good: "جيدة",
    strong: "قوية",
    passwordsMatch: "كلمات المرور متطابقة",
    passwordsNotMatch: "كلمات المرور غير متطابقة",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    
    // Password Instructions
    passwordInstructions: "يرجى اتباع التعليمات التالية لكلمة المرور الجديدة:",
    passwordLength: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
    passwordUppercase: "تحتوي على حرف كبير واحد على الأقل (A-Z)",
    passwordLowercase: "تحتوي على حرف صغير واحد على الأقل (a-z)",
    passwordNumber: "تحتوي على رقم واحد على الأقل (0-9)",
    passwordSpecial: "تحتوي على رمز خاص واحد على الأقل (!@#$%^&*)",
    
    // Password Verification
    verificationMethod: "طريقة التحقق",
    verifyWithPassword: "التحقق بكلمة المرور",
    verifyWithEmail: "التحقق بالبريد الإلكتروني",
    enterCurrentPassword: "أدخل كلمة المرور الحالية للمتابعة",
    sendVerificationCode: "إرسال كود التحقق",
    verificationCode: "كود التحقق",
    enterCode: "أدخل الكود المكون من 6 أرقام",
    verify: "تحقق",
    resend: "إعادة إرسال",
    codeSent: "تم إرسال كود التحقق إلى بريدك الإلكتروني",
    codeVerified: "تم التحقق من الكود بنجاح",
    identityVerified: "تم التحقق من هويتك بنجاح. يمكنك الآن إدخال كلمة المرور الجديدة.",
    
    // Password Messages
    passwordMinLength: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    passwordsNotMatchError: "كلمات المرور الجديدة غير متطابقة",
    passwordChangedSuccess: "تم تغيير كلمة المرور بنجاح",
    failedToSendCode: "فشل في إرسال كود التحقق",
    invalidCode: "كود التحقق غير صحيح أو منتهي الصلاحية",
    failedToChangePassword: "فشل في تغيير كلمة المرور",
    mustVerifyCode: "يجب التحقق من الكود أولاً",
    
    // Email Management
    emailManagement: "إدارة البريد الإلكتروني",
    primaryEmail: "البريد الإلكتروني الأساسي",
    changePrimaryEmail: "تغيير البريد الأساسي",
    newPrimaryEmail: "البريد الإلكتروني الجديد",
    confirmNewPrimaryEmail: "تأكيد البريد الإلكتروني الجديد",
    addSecondaryEmail: "إضافة بريد إلكتروني ثانوي",
    secondaryEmails: "الرسائل البريدية الثانوية",
    secondaryEmailPlaceholder: "أدخل البريد الإلكتروني الثانوي",
    makePrimary: "جعل أساسي",
    delete: "حذف",
    verified: "تم التحقق",
    notVerified: "لم يتم التحقق",
    verifyEmail: "تحقق من البريد",
    verifyEmailTitle: "التحقق من البريد الإلكتروني",
    
    // Email Messages
    emailChangeSent: "تم إرسال كود التحقق إلى بريدك الإلكتروني الجديد",
    emailChanged: "تم تغيير بريدك الإلكتروني بنجاح",
    emailChangeFailed: "فشل تغيير البريد الإلكتروني",
    emailsNotMatch: "البريدان الإلكترونيان غير متطابقين",
    emailAdded: "تم إضافة البريد الإلكتروني بنجاح",
    emailVerified: "تم التحقق من البريد الإلكتروني بنجاح",
    emailDeleted: "تم حذف البريد الإلكتروني بنجاح",
    emailMadePrimary: "تم جعل البريد الإلكتروني أساسيًا بنجاح",
    addEmailSuccess: "تم إرسال كود التحقق إلى بريدك الإلكتروني الثانوي",
    sessionUpdateMessage: "تم تحديث جلستك. قد تحتاج لتسجيل الدخول مرة أخرى.",
    
    // Modal
    enterVerificationCodePlaceholder: "أدخل كود التحقق",
    verifyEmailButton: "تحقق من البريد",
    resendCode: "إعادة إرسال الكود",
    noSecondaryEmails: "لا توجد رسائل بريد إلكتروني ثانوية",
    
    // Terms
    agreeToTerms: "أوافق على",
    termsAndConditions: "الشروط والأحكام",
    and: "و",
    privacyPolicy: "سياسة الخصوصية",
    
    // Instructions
    clickToExpand: "انقر للتوسيع",
    clickToCollapse: "انقر للطي",
    weWillSendCode: "سنرسل كود تحقق إلى بريدك الإلكتروني:",
    instructions: "تعليمات",
    note: "ملاحظة:",
    securityNote: "لأسباب أمنية، يرجى التأكد من أنك في مكان آمن قبل تغيير كلمة المرور",
  },
  en: {
    // General
    accountSettings: "Account Settings",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    close: "Close",
    confirm: "Confirm",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    
    // Password Section
    passwordSecurity: "Password & Security",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    changePassword: "Change Password",
    passwordStrength: "Password Strength",
    weak: "Weak",
    medium: "Medium",
    good: "Good",
    strong: "Strong",
    passwordsMatch: "Passwords match",
    passwordsNotMatch: "Passwords don't match",
    showPassword: "Show Password",
    hidePassword: "Hide Password",
    
    // Password Instructions
    passwordInstructions: "Please follow these instructions for your new password:",
    passwordLength: "Password must be at least 8 characters",
    passwordUppercase: "Contains at least one uppercase letter (A-Z)",
    passwordLowercase: "Contains at least one lowercase letter (a-z)",
    passwordNumber: "Contains at least one number (0-9)",
    passwordSpecial: "Contains at least one special character (!@#$%^&*)",
    
    // Password Verification
    verificationMethod: "Verification Method",
    verifyWithPassword: "Verify with Password",
    verifyWithEmail: "Verify with Email",
    enterCurrentPassword: "Enter your current password to continue",
    sendVerificationCode: "Send Verification Code",
    verificationCode: "Verification Code",
    enterCode: "Enter 6-digit code",
    verify: "Verify",
    resend: "Resend",
    codeSent: "Verification code sent to your email",
    codeVerified: "Code verified successfully",
    identityVerified: "Your identity has been verified. You can now enter a new password.",
    
    // Password Messages
    passwordMinLength: "Password must be at least 8 characters",
    passwordsNotMatchError: "New passwords don't match",
    passwordChangedSuccess: "Password changed successfully",
    failedToSendCode: "Failed to send verification code",
    invalidCode: "Invalid or expired verification code",
    failedToChangePassword: "Failed to change password",
    mustVerifyCode: "You must verify code first",
    
    // Email Management
    emailManagement: "Email Management",
    primaryEmail: "Primary Email",
    changePrimaryEmail: "Change Primary Email",
    newPrimaryEmail: "New Primary Email",
    confirmNewPrimaryEmail: "Confirm New Primary Email",
    addSecondaryEmail: "Add Secondary Email",
    secondaryEmails: "Secondary Emails",
    secondaryEmailPlaceholder: "Enter secondary email",
    makePrimary: "Make Primary",
    delete: "Delete",
    verified: "Verified",
    notVerified: "Not Verified",
    verifyEmail: "Verify Email",
    verifyEmailTitle: "Verify Email Address",
    
    // Email Messages
    emailChangeSent: "Verification code sent to your new email",
    emailChanged: "Your email has been changed successfully",
    emailChangeFailed: "Failed to change email",
    emailsNotMatch: "Emails do not match",
    emailAdded: "Email added successfully",
    emailVerified: "Email verified successfully",
    emailDeleted: "Email deleted successfully",
    emailMadePrimary: "Email made primary successfully",
    addEmailSuccess: "Verification code sent to your secondary email",
    sessionUpdateMessage: "Your session has been updated. You may need to sign in again.",
    
    // Modal
    enterVerificationCodePlaceholder: "Enter verification code",
    verifyEmailButton: "Verify Email",
    resendCode: "Resend Code",
    noSecondaryEmails: "No secondary emails",
    
    // Terms
    agreeToTerms: "I agree to the",
    termsAndConditions: "Terms and Conditions",
    and: "and",
    privacyPolicy: "Privacy Policy",
    
    // Instructions
    clickToExpand: "Click to expand",
    clickToCollapse: "Click to collapse",
    weWillSendCode: "We will send a verification code to your email:",
    instructions: "Instructions",
    note: "Note:",
    securityNote: "For security reasons, please ensure you are in a secure place before changing your password",
  }
};

// Define interface for data
interface ChangePasswordData {
  newPassword: string;
  currentPassword?: string;
  email?: string;
  otpCode?: string;
}

// Define interface for secondary email
interface SecondaryEmail {
  _id: string;
  email: string;
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
  createdAt: Date;
}

export default function SecuritySettings() {
  const { data: session, status, update } = useSession()
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  
  // States for section expansion
  const [isPasswordSectionExpanded, setIsPasswordSectionExpanded] = useState(false)
  const [isEmailSectionExpanded, setIsEmailSectionExpanded] = useState(false)
  
  // States for password change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  
  // States for OTP verification
  const [verificationMethod, setVerificationMethod] = useState<"password" | "otp">("password")
  const [otpStep, setOtpStep] = useState<'verification' | 'newPassword'>('verification')
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  
  // States for email management
  const [secondaryEmails, setSecondaryEmails] = useState<SecondaryEmail[]>([])
  const [newSecondaryEmail, setNewSecondaryEmail] = useState("")
  const [isAddingSecondaryEmail, setIsAddingSecondaryEmail] = useState(false)
  const [emailMessage, setEmailMessage] = useState("")
  const [emailError, setEmailError] = useState("")
  
  // States for changing primary email
  const [newPrimaryEmail, setNewPrimaryEmail] = useState("")
  const [confirmNewPrimaryEmail, setConfirmNewPrimaryEmail] = useState("")
  const [primaryEmailVerificationCode, setPrimaryEmailVerificationCode] = useState("")
  const [isChangingPrimaryEmail, setIsChangingPrimaryEmail] = useState(false)
  const [showPrimaryEmailForm, setShowPrimaryEmailForm] = useState(false)
  const [showPrimaryEmailVerification, setShowPrimaryEmailVerification] = useState(false)
  
  // States for verification modal
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [emailToVerify, setEmailToVerify] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResendingCode, setIsResendingCode] = useState(false)
  
  // States for UI
  const [passwordStrength, setPasswordStrength] = useState(0)

  useEffect(() => {
    // Calculate password strength
    if (newPassword.length === 0) {
      setPasswordStrength(0)
      return
    }
    
    let strength = 0
    if (newPassword.length >= 8) strength += 25
    if (newPassword.length >= 12) strength += 25
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) strength += 25
    if (/[0-9]/.test(newPassword)) strength += 12.5
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 12.5
    
    setPasswordStrength(strength)
  }, [newPassword])

  useEffect(() => {
    // Reset OTP states when switching methods
    setOtpCode('')
    setOtpSent(false)
    setOtpStep('verification')
    setPasswordError('')
    setPasswordSuccess('')
  }, [verificationMethod])

  // Fetch secondary emails
  useEffect(() => {
    if (status === "authenticated") {
      fetchSecondaryEmails()
    }
  }, [status])

  const fetchSecondaryEmails = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const data = await response.json()
        setSecondaryEmails(data.secondaryEmails || [])
      }
    } catch (error) {
      console.error("Error fetching secondary emails:", error)
    }
  }

  // Password change functions
  const handleSendOtp = async () => {
    if (!session?.user?.email) return
    
    setIsSendingOtp(true)
    setPasswordError("")
    setPasswordSuccess("")
    
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          purpose: "change-password",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
        setPasswordSuccess(t.codeSent)
      } else {
        setPasswordError(data.error || t.failedToSendCode)
      }
    } catch {
      setPasswordError(t.error)
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!session?.user?.email || !otpCode) return
    
    setIsVerifyingOtp(true)
    setPasswordError("")
    setPasswordSuccess("")
    
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          otpCode,
          purpose: "change-password",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess(t.codeVerified)
        setTimeout(() => {
            setPasswordSuccess("") // Clear success message before transitioning
            setOtpStep('newPassword')
        }, 1500)
      } else {
        setPasswordError(data.error || t.invalidCode)
      }
    } catch {
      setPasswordError(t.error)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user agreed to terms (only for English)
    if (language === 'en' && !agreeToTerms) {
      setPasswordError("You must agree to terms and conditions")
      return
    }
    
    setIsLoadingPassword(true)
    setPasswordError("")
    setPasswordSuccess("")

    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordsNotMatchError)
      setIsLoadingPassword(false)
      return
    }

    if (newPassword.length < 8) {
      setPasswordError(t.passwordMinLength)
      setIsLoadingPassword(false)
      return
    }

    try {
      // استخدم نقطة النهاية الجديدة
      const endpoint = "/api/change-password"
      const body: ChangePasswordData = {
        newPassword,
      }

      if (verificationMethod === "password") {
        body.currentPassword = currentPassword
      } else {
        body.otpCode = otpCode
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess(t.passwordChangedSuccess)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setOtpCode("")
        setOtpSent(false)
        setOtpStep('verification')
        
        // Close the section after successful password change
        setTimeout(() => {
          setIsPasswordSectionExpanded(false)
        }, 2000)
      } else {
        setPasswordError(data.error || t.failedToChangePassword)
      }
    } catch {
      setPasswordError(t.error)
    } finally {
      setIsLoadingPassword(false)
    }
  }

  // Email management functions
  const handleAddSecondaryEmail = async () => {
    if (!newSecondaryEmail) return
    
    setIsAddingSecondaryEmail(true)
    setEmailError("")
    setEmailMessage("")
    
    try {
      const response = await fetch("/api/user/add-secondary-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newSecondaryEmail,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailMessage(t.addEmailSuccess)
        setNewSecondaryEmail("")
        fetchSecondaryEmails()
        
        // Show verification modal immediately after adding
        setTimeout(() => {
          setEmailToVerify(newSecondaryEmail)
          setShowVerificationModal(true)
        }, 1000)
      } else {
        setEmailError(data.error || t.error)
      }
    } catch {
      setEmailError(t.error)
    } finally {
      setIsAddingSecondaryEmail(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!verificationCode || !emailToVerify) return
    
    setIsVerifying(true)
    setEmailError("")
    setEmailMessage("")
    
    try {
      const response = await fetch("/api/user/verify-secondary-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailToVerify,
          verificationCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailMessage(t.emailVerified)
        setShowVerificationModal(false)
        setVerificationCode("")
        setEmailToVerify("")
        fetchSecondaryEmails()
      } else {
        setEmailError(data.error || t.error)
      }
    } catch {
      setEmailError(t.error)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    if (!emailToVerify) return
    
    setIsResendingCode(true)
    setEmailError("")
    
    try {
      // Use the add-secondary-email endpoint to resend the code
      const response = await fetch("/api/user/add-secondary-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailToVerify,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailMessage(t.addEmailSuccess)
      } else {
        setEmailError(data.error || t.error)
      }
    } catch {
      setEmailError(t.error)
    } finally {
      setIsResendingCode(false)
    }
  }

  const handleMakePrimary = async (email: string) => {
    if (!confirm(`Are you sure you want to make ${email} your primary email?`)) return
    
    setEmailError("")
    setEmailMessage("")
    
    try {
      const response = await fetch("/api/user/make-primary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailMessage(t.emailMadePrimary)
        fetchSecondaryEmails()
        
        // Update session with new email
        await update({
          ...session,
          user: {
            ...session?.user,
            email: email
          }
        })
        
        setEmailMessage(t.sessionUpdateMessage)
      } else {
        setEmailError(data.error || t.error)
      }
    } catch {
      setEmailError(t.error)
    }
  }

  const handleDeleteSecondaryEmail = async (email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return
    
    setEmailError("")
    setEmailMessage("")
    
    try {
      const response = await fetch("/api/user/delete-secondary-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailMessage(t.emailDeleted)
        fetchSecondaryEmails()
      } else {
        setEmailError(data.error || t.error)
      }
    } catch {
      setEmailError(t.error)
    }
  }

  // Primary email change functions
  const handleSendPrimaryEmailVerificationCode = async () => {
    if (newPrimaryEmail !== confirmNewPrimaryEmail) {
      setEmailError(t.emailsNotMatch)
      return
    }

    setEmailError("")
    setEmailMessage("")

    try {
      const response = await fetch("/api/auth/send-email-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentEmail: session?.user?.email,
          newEmail: newPrimaryEmail,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowPrimaryEmailVerification(true)
        setEmailMessage(t.emailChangeSent)
      } else {
        setEmailError(data.error || t.error)
      }
    } catch {
      setEmailError(t.error)
    }
  }

  const handleVerifyPrimaryEmailCode = async () => {
    if (!primaryEmailVerificationCode) {
      setEmailError(t.enterCode)
      return
    }

    setEmailError("")
    setEmailMessage("")
    setIsChangingPrimaryEmail(true)

    try {
      const response = await fetch("/api/auth/verify-email-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentEmail: session?.user?.email,
          newEmail: newPrimaryEmail,
          verificationCode: primaryEmailVerificationCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailMessage(t.emailChanged)
        
        // Update session with new email
        await update({
          ...session,
          user: {
            ...session?.user,
            email: newPrimaryEmail
          }
        })
        
        setEmailMessage(t.sessionUpdateMessage)
        
        // Reset form after a short delay
        setTimeout(() => {
          setShowPrimaryEmailForm(false)
          setShowPrimaryEmailVerification(false)
          setNewPrimaryEmail("")
          setConfirmNewPrimaryEmail("")
          setPrimaryEmailVerificationCode("")
        }, 2000)
      } else {
        setEmailError(data.error || t.invalidCode)
      }
    } catch {
      setEmailError(t.error)
    } finally {
      setIsChangingPrimaryEmail(false)
    }
  }

  // Open verification modal
  const openVerificationModal = (email: string) => {
    setEmailToVerify(email)
    setVerificationCode("")
    setEmailError("")
    setEmailMessage("")
    setShowVerificationModal(true)
  }

  // Close verification modal
  const closeVerificationModal = () => {
    setShowVerificationModal(false)
    setEmailToVerify("")
    setVerificationCode("")
    setEmailError("")
    setEmailMessage("")
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "bg-red-500"
    if (passwordStrength < 50) return "bg-orange-500"
    if (passwordStrength < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return t.weak
    if (passwordStrength < 50) return t.medium
    if (passwordStrength < 75) return t.good
    return t.strong
  }

  const getPasswordRequirements = () => {
    const requirements = [
      { text: t.passwordLength, met: newPassword.length >= 8 },
      { text: t.passwordUppercase, met: /[A-Z]/.test(newPassword) },
      { text: t.passwordLowercase, met: /[a-z]/.test(newPassword) },
      { text: t.passwordNumber, met: /[0-9]/.test(newPassword) },
      { text: t.passwordSpecial, met: /[^A-Za-z0-9]/.test(newPassword) },
    ]
    return requirements
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t.accountSettings}</h1>
      
      {/* Password & Security Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          onClick={() => setIsPasswordSectionExpanded(!isPasswordSectionExpanded)}
          title={isPasswordSectionExpanded ? t.clickToCollapse : t.clickToExpand}
        >
          <div className="flex items-center">
            <Lock className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t.passwordSecurity}</h2>
          </div>
          <div className="flex items-center">
            {isPasswordSectionExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
        
        <AnimatePresence>
          {isPasswordSectionExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6">
                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800/30 flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                    <span>{passwordError}</span>
                  </motion.div>
                )}

                {passwordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800/30 flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                    <span>{passwordSuccess}</span>
                  </motion.div>
                )}

                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t.securityNote}
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {/* Verification Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {t.verificationMethod}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setVerificationMethod("password")}
                        className={`flex items-center justify-center px-4 py-3 border rounded-xl transition-all ${
                          verificationMethod === "password"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-md"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                        title={t.verifyWithPassword}
                      >
                        <Lock className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                        {t.verifyWithPassword}
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setVerificationMethod("otp")}
                        className={`flex items-center justify-center px-4 py-3 border rounded-xl transition-all ${
                          verificationMethod === "otp"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-md"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                        title={t.verifyWithEmail}
                      >
                        <Mail className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                        {t.verifyWithEmail}
                      </motion.button>
                    </div>
                  </div>

                  {/* Verification Fields */}
                  <AnimatePresence mode="wait">
                    {verificationMethod === "password" && (
                      <motion.div
                        key="password-method"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div>
                          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t.currentPassword}
                          </label>
                          <div className="relative">
                            <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                              <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              required
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className={`appearance-none block w-full ${isRTL ? 'pl-10 pr-10' : 'pr-10 pl-10'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                              placeholder={t.enterCurrentPassword}
                            />
                            <button
                              type="button"
                              className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center`}
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              title={showCurrentPassword ? t.hidePassword : t.showPassword}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {verificationMethod === "otp" && otpStep === 'verification' && (
                      <motion.div
                        key="otp-verification-step"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
                          <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {t.weWillSendCode} <span className="font-semibold">{session?.user?.email}</span>
                          </p>
                        </div>
                        {!otpSent ? (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSendOtp}
                            disabled={isSendingOtp}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition"
                            title={t.sendVerificationCode}
                          >
                            {isSendingOtp ? (
                              <span className="flex items-center">
                                <svg className="animate-spin" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t.loading}
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Mail className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                                {t.sendVerificationCode}
                              </span>
                            )}
                          </motion.button>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.verificationCode}
                              </label>
                              <div className="relative">
                                <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                                  <Key className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  id="otpCode"
                                  type="text"
                                  required
                                  value={otpCode}
                                  onChange={(e) => setOtpCode(e.target.value)}
                                  className={`appearance-none block w-full ${isRTL ? 'pl-10' : 'pr-10'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                                  placeholder={t.enterCode}
                                />
                              </div>
                            </div>
                            <div className={`flex space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleVerifyOtp}
                                disabled={isVerifyingOtp}
                                className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition"
                                title={t.verify}
                              >
                                {isVerifyingOtp ? (
                                  <span className="flex items-center">
                                    <svg className="animate-spin" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t.loading}
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <CheckCircle className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                                    {t.verify}
                                  </span>
                                )}
                              </motion.button>
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSendOtp}
                                disabled={isSendingOtp}
                                className="flex-1 flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition"
                                title={t.resend}
                              >
                                {isSendingOtp ? (
                                  <span className="flex items-center">
                                    <svg className="animate-spin" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t.loading}
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <Mail className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                                    {t.resend}
                                  </span>
                                )}
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {verificationMethod === "otp" && otpStep === 'newPassword' && (
                      <motion.div
                        key="otp-new-password-step"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/30">
                          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {t.identityVerified}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Password Fields */}
                  {(verificationMethod === "password" || otpStep === 'newPassword') && (
                    <motion.div
                      key="password-fields"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.newPassword}
                        </label>
                        <div className="relative">
                          <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`appearance-none block w-full ${isRTL ? 'pl-10 pr-10' : 'pr-10 pl-10'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                            placeholder={t.newPassword}
                          />
                          <button
                            type="button"
                            className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center`}
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            title={showNewPassword ? t.hidePassword : t.showPassword}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        {/* Password Requirements */}
                        {newPassword.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t.passwordInstructions}
                            </p>
                            <ul className="space-y-1">
                              {getPasswordRequirements().map((req, index) => (
                                <li key={index} className={`flex items-center text-sm ${req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {req.met ? (
                                    <CheckCircle className="w-3 h-3 mr-2 flex-shrink-0" />
                                  ) : (
                                    <div className="w-3 h-3 mr-2 rounded-full border border-gray-400 flex-shrink-0" />
                                  )}
                                  {req.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Password Strength Indicator */}
                        {newPassword.length > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{t.passwordStrength}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{getPasswordStrengthText()}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <motion.div
                                className={`h-2 rounded-full ${getPasswordStrengthColor()}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${passwordStrength}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.confirmPassword}
                        </label>
                        <div className="relative">
                          <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`appearance-none block w-full ${isRTL ? 'pl-10 pr-10' : 'pr-10 pl-10'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                            placeholder={t.confirmPassword}
                          />
                          <button
                            type="button"
                            className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center`}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            title={showConfirmPassword ? t.hidePassword : t.showPassword}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        {/* Password Match Indicator */}
                        {confirmPassword.length > 0 && (
                          <div className="mt-2 flex items-center">
                            {newPassword === confirmPassword ? (
                              <div className={`flex items-center text-green-500 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <CheckCircle className="w-3 h-3" style={isRTL ? { marginLeft: '0.25rem' } : { marginRight: '0.25rem' }} />
                                <span>{t.passwordsMatch}</span>
                              </div>
                            ) : (
                              <div className={`flex items-center text-red-500 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <svg className="w-3 h-3" style={isRTL ? { marginLeft: '0.25rem' } : { marginRight: '0.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>{t.passwordsNotMatch}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Terms and Conditions Checkbox for English only */}
                  {language === 'en' && (verificationMethod === "password" || otpStep === 'newPassword') && (
                    <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <input
                        id="agreeToTerms"
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="agreeToTerms" className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'} leading-relaxed`}>
                        <span className="inline-flex flex-wrap items-center gap-x-1">
                          <span>{t.agreeToTerms}</span>
                          <Link href="/terms-conditions" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">
                            {t.termsAndConditions}
                          </Link>
                          <span>{t.and}</span>
                          <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">
                            {t.privacyPolicy}
                          </Link>
                        </span>
                      </label>
                    </div>
                  )}

                  <div>
                    <motion.button
                      type="submit"
                      disabled={isLoadingPassword || (verificationMethod === "otp" && otpStep !== 'newPassword')}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition hover:scale-105"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      title={t.changePassword}
                    >
                      {isLoadingPassword ? (
                        <span className="flex items-center">
                          <svg className="animate-spin" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t.loading}
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Shield className="w-4 h-4" style={isRTL ? { marginLeft: '0.5rem' } : { marginRight: '0.5rem' }} />
                          {t.changePassword}
                        </span>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Email Management Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          onClick={() => setIsEmailSectionExpanded(!isEmailSectionExpanded)}
          title={isEmailSectionExpanded ? t.clickToCollapse : t.clickToExpand}
        >
          <div className="flex items-center">
            <Mail className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t.emailManagement}</h2>
          </div>
          <div className="flex items-center">
            {isEmailSectionExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
        
        <AnimatePresence>
          {isEmailSectionExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6">
                {emailMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800/30 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {emailMessage}
                  </motion.div>
                )}
                
                {emailError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800/30 flex items-center"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {emailError}
                  </motion.div>
                )}
                
                <div className="space-y-6">
                  {/* Primary Email Display and Change */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t.primaryEmail}</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">{session?.user?.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPrimaryEmailForm(!showPrimaryEmailForm)}
                        className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                        title={t.changePrimaryEmail}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Primary Email Change Form */}
                    <AnimatePresence>
                      {showPrimaryEmailForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 space-y-4"
                        >
                          {!showPrimaryEmailVerification ? (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {t.newPrimaryEmail}
                                </label>
                                <input
                                  type="email"
                                  value={newPrimaryEmail}
                                  onChange={(e) => setNewPrimaryEmail(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                                  placeholder={t.newPrimaryEmail}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {t.confirmNewPrimaryEmail}
                                </label>
                                <input
                                  type="email"
                                  value={confirmNewPrimaryEmail}
                                  onChange={(e) => setConfirmNewPrimaryEmail(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                                  placeholder={t.confirmNewPrimaryEmail}
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={handleSendPrimaryEmailVerificationCode}
                                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm shadow-sm"
                                  title={t.sendVerificationCode}
                                >
                                  {t.sendVerificationCode}
                                </button>
                                <button
                                  onClick={() => setShowPrimaryEmailForm(false)}
                                  className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm shadow-sm"
                                  title={t.cancel}
                                >
                                  {t.cancel}
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {t.verificationCode}
                                </label>
                                <input
                                  type="text"
                                  value={primaryEmailVerificationCode}
                                  onChange={(e) => setPrimaryEmailVerificationCode(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                                  placeholder={t.enterCode}
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={handleVerifyPrimaryEmailCode}
                                  disabled={isChangingPrimaryEmail}
                                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50 shadow-sm"
                                  title={t.verify}
                                >
                                  {isChangingPrimaryEmail ? t.loading : t.verify}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowPrimaryEmailForm(false)
                                    setShowPrimaryEmailVerification(false)
                                  }}
                                  className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm shadow-sm"
                                  title={t.cancel}
                                >
                                  {t.cancel}
                                </button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Add Secondary Email Form */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.addSecondaryEmail}</h3>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newSecondaryEmail}
                        onChange={(e) => setNewSecondaryEmail(e.target.value)}
                        placeholder={t.secondaryEmailPlaceholder}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                      />
                      <button
                        onClick={handleAddSecondaryEmail}
                        disabled={isAddingSecondaryEmail || !newSecondaryEmail}
                        className="py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50 shadow-sm flex items-center"
                        title={t.addSecondaryEmail}
                      >
                        {isAddingSecondaryEmail ? (
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {t.addSecondaryEmail}
                      </button>
                    </div>
                  </div>
                  
                  {/* Secondary Emails List */}
                  {secondaryEmails.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.secondaryEmails}</h3>
                      <div className="space-y-2">
                        {secondaryEmails.map((email) => (
                          <div key={email._id || email.email} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{email.email}</p>
                                  <p className={`text-xs ${email.isVerified ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                    {email.isVerified ? t.verified : t.notVerified}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {!email.isVerified && (
                                  <button
                                    onClick={() => openVerificationModal(email.email)}
                                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                                    title={t.verifyEmail}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                                {email.isVerified && (
                                  <button
                                    onClick={() => handleMakePrimary(email.email)}
                                    className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 transition-colors"
                                    title={t.makePrimary}
                                  >
                                    <Star className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteSecondaryEmail(email.email)}
                                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                                  title={t.delete}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">{t.noSecondaryEmails}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={closeVerificationModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.verifyEmailTitle}</h3>
                <button
                  onClick={closeVerificationModal}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title={t.close}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t.enterVerificationCodePlaceholder} <span className="font-medium">{emailToVerify}</span>
                </p>
                
                {emailMessage && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                    {emailMessage}
                  </div>
                )}
                
                {emailError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                    {emailError}
                  </div>
                )}
              </div>
              
              {/* Verification Code Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.verificationCode}
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder={t.enterVerificationCodePlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                  autoFocus
                />
              </div>
              
              {/* Modal Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleVerifyEmail}
                  disabled={isVerifying || !verificationCode}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50 shadow-sm"
                  title={t.verifyEmailButton}
                >
                  {isVerifying ? t.loading : t.verifyEmailButton}
                </button>
                <button
                  onClick={handleResendCode}
                  disabled={isResendingCode}
                  className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm disabled:opacity-50 shadow-sm"
                  title={t.resendCode}
                >
                  {isResendingCode ? t.loading : t.resendCode}
                </button>
                <button
                  onClick={closeVerificationModal}
                  className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm shadow-sm"
                  title={t.cancel}
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}