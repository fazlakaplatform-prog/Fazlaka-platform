// src/app/support/page.tsx
"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { 
  FaTicketAlt, FaPlus, FaSearch, FaTimes, FaPaperclip,
  FaTools, FaUser, FaCreditCard, FaFileAlt,
  FaReply, FaSpinner,
  FaEnvelope, FaTrash, FaEye, FaDownload,
  FaQuestionCircle, FaHeadset
} from "react-icons/fa";
import Link from "next/link";

// Create a simple ticket interface for our component
interface SimpleTicket {
  _id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImageUrl: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  subjectEn: string;
  description: string;
  descriptionEn: string;
  attachments: Array<{
    name: string;
    size: number;
    url?: string;
  }>;
  messages: Array<{
    sender: string;
    content: string;
    contentEn?: string;
    createdAt: string;
    attachments: Array<{
      name: string;
      url?: string;
    }>;
  }>;
  assignedTo?: string;
  resolution?: string;
  resolutionEn?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export default function SupportPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [tickets, setTickets] = useState<SimpleTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SimpleTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [isRTL, setIsRTL] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  
  // حالة نموذج التذكرة الجديدة
  const [newTicket, setNewTicket] = useState({
    category: 'technical',
    priority: 'medium',
    subject: '',
    subjectEn: '',
    description: '',
    descriptionEn: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  // حالة إضافة رسالة جديدة
  const [newMessage, setNewMessage] = useState('');
  const [newMessageEn, setNewMessageEn] = useState('');
  const [messageAttachments, setMessageAttachments] = useState<File[]>([]);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Check for language preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
      setIsRTL(savedLanguage === 'ar');
    } else {
      // Use browser language as fallback
      const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || '';
      setIsRTL(browserLang.includes('ar'));
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      
      const response = await fetch(`/api/tickets?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTickets(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'فشل جلب التذاكر');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('حدث خطأ أثناء جلب التذاكر');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchTickets();
    }
  }, [sessionStatus, fetchTickets]);

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      const data = await response.json();
      
      if (data.success) {
        // تحويل البيانات إلى واجهة SimpleTicket عن طريق استخراج الخصائص المطلوبة فقط
        const ticketData: SimpleTicket = {
          _id: data.data._id,
          ticketNumber: data.data.ticketNumber,
          userId: data.data.userId,
          userName: data.data.userName,
          userEmail: data.data.userEmail,
          userImageUrl: data.data.userImageUrl,
          category: data.data.category,
          priority: data.data.priority,
          status: data.data.status,
          subject: data.data.subject,
          subjectEn: data.data.subjectEn,
          description: data.data.description,
          descriptionEn: data.data.descriptionEn,
          attachments: data.data.attachments,
          messages: data.data.messages,
          assignedTo: data.data.assignedTo,
          resolution: data.data.resolution,
          resolutionEn: data.data.resolutionEn,
          createdAt: data.data.createdAt,
          updatedAt: data.data.updatedAt,
          resolvedAt: data.data.resolvedAt,
        };
        
        setSelectedTicket(ticketData);
      } else {
        setError(data.error || 'فشل جلب تفاصيل التذكرة');
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      setError('حدث خطأ أثناء جلب تفاصيل التذكرة');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTicket.subject || !newTicket.description) {
      setFormError(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      setFormError(null);
      
      const formData = new FormData();
      formData.append('category', newTicket.category);
      formData.append('priority', newTicket.priority);
      formData.append('subject', newTicket.subject);
      formData.append('subjectEn', newTicket.subjectEn);
      formData.append('description', newTicket.description);
      formData.append('descriptionEn', newTicket.descriptionEn);
      
      attachments.forEach(file => {
        formData.append('attachment', file);
      });
      
      const response = await fetch('/api/tickets', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormSuccess(isRTL ? 'تم إنشاء التذكرة بنجاح' : 'Ticket created successfully');
        setNewTicket({
          category: 'technical',
          priority: 'medium',
          subject: '',
          subjectEn: '',
          description: '',
          descriptionEn: '',
        });
        setAttachments([]);
        setShowNewTicketForm(false);
        fetchTickets();
      } else {
        setFormError(data.error || 'فشل إنشاء التذكرة');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setFormError(isRTL ? 'حدث خطأ أثناء إنشاء التذكرة' : 'An error occurred while creating the ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage) {
      setMessageError(isRTL ? 'يرجى كتابة رسالة' : 'Please write a message');
      return;
    }
    
    if (!selectedTicket) return;
    
    try {
      setSubmittingMessage(true);
      setMessageError(null);
      
      const formData = new FormData();
      formData.append('message', newMessage);
      formData.append('messageEn', newMessageEn);
      
      messageAttachments.forEach(file => {
        formData.append('attachment', file);
      });
      
      // استخدام typeof للتحقق من نوع _id وتحويله إلى سلسلة نصية
      const ticketId = typeof selectedTicket._id === 'string' 
        ? selectedTicket._id 
        : String(selectedTicket._id);
      
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessageSuccess(isRTL ? 'تم إرسال الرسالة بنجاح' : 'Message sent successfully');
        setNewMessage('');
        setNewMessageEn('');
        setMessageAttachments([]);
        fetchTicketDetails(ticketId);
        fetchTickets();
      } else {
        setMessageError(data.error || 'فشل إرسال الرسالة');
      }
    } catch (err) {
      console.error('Error adding message:', err);
      setMessageError(isRTL ? 'حدث خطأ أثناء إرسال الرسالة' : 'An error occurred while sending the message');
    } finally {
      setSubmittingMessage(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      // استخدام typeof للتحقق من نوع _id وتحويله إلى سلسلة نصية
      const ticketId = typeof selectedTicket._id === 'string' 
        ? selectedTicket._id 
        : String(selectedTicket._id);
        
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // تحديث الحالة محلياً بدون تحديث الكائن بأكمله
        setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
        fetchTickets();
      } else {
        setError(data.error || 'فشل إغلاق التذكرة');
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
      setError(isRTL ? 'حدث خطأ أثناء إغلاق التذكرة' : 'An error occurred while closing the ticket');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setAttachments(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const onMessageDrop = useCallback((acceptedFiles: File[]) => {
    setMessageAttachments(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/zip': ['.zip']
    },
    multiple: true
  });

  const { getRootProps: getMessageRootProps, getInputProps: getMessageInputProps, isDragActive: isMessageDragActive } = useDropzone({
    onDrop: onMessageDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/zip': ['.zip']
    },
    multiple: true
  });

  const removeAttachment = useCallback((index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  }, [attachments]);

  const removeMessageAttachment = useCallback((index: number) => {
    setMessageAttachments(messageAttachments.filter((_, i) => i !== index));
  }, [messageAttachments]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [isRTL]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = searchQuery === '' || 
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.subjectEn && ticket.subjectEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [tickets, searchQuery]);

  // Text translations based on language
  const texts = {
    ar: {
      pageTitle: "الدعم الفني",
      heroTitle: "مركز الدعم الفني",
      heroSubtitle: "نحن هنا لمساعدتك. قم بإنشاء تذكرة دعم فني للإبلاغ عن أي مشكلة تقنية أو الحصول على المساعدة.",
      myTickets: "تذاكري",
      createTicket: "إنشاء تذكرة جديدة",
      ticketNumber: "رقم التذكرة",
      category: "الفئة",
      priority: "الأولوية",
      status: "الحالة",
      subject: "الموضوع",
      lastUpdate: "آخر تحديث",
      open: "مفتوحة",
      inProgress: "قيد المعالجة",
      waitingForUser: "في انتظار رد المستخدم",
      resolved: "تم الحل",
      closed: "مغلقة",
      low: "منخفضة",
      medium: "متوسطة",
      high: "عالية",
      urgent: "عاجلة",
      technical: "تقني",
      account: "حساب",
      billing: "فواتير",
      content: "محتوى",
      other: "أخرى",
      search: "البحث عن تذكرة...",
      filterByStatus: "تصفية حسب الحالة",
      filterByCategory: "تصفية حسب الفئة",
      all: "الكل",
      viewDetails: "عرض التفاصيل",
      closeTicket: "إغلاق التذكرة",
      ticketDetails: "تفاصيل التذكرة",
      description: "الوصف",
      attachments: "المرفقات",
      addMessage: "إضافة رسالة",
      yourMessage: "رسالتك",
      sendMessage: "إرسال الرسالة",
      noTickets: "لا توجد تذاكر",
      noTicketsFound: "لم يتم العثور على تذاكر",
      loadingTickets: "جاري تحميل التذاكر...",
      dragDropText: "اسحب وأفلت الملفات هنا أو انقر للاختيار",
      dragActiveText: "أفلت الملفات هنا",
      allowedFormats: "الصيغ المسموحة: jpg, png, pdf, doc, docx, zip",
      attachedFiles: "الملفات المرفقة:",
      sending: "جاري الإرسال...",
      sendingMessage: "جاري إرسال الرسالة...",
      ticketCreated: "تم إنشاء التذكرة بنجاح",
      messageSent: "تم إرسال الرسالة بنجاح",
      errorCreatingTicket: "فشل إنشاء التذكرة",
      errorSendingMessage: "فشل إرسال الرسالة",
      errorFetchingTickets: "فشل جلب التذاكر",
      errorFetchingTicketDetails: "فشل جلب تفاصيل التذكرة",
      errorClosingTicket: "فشل إغلاق التذكرة",
      requiredField: "هذا الحقل مطلوب",
      selectCategory: "اختر الفئة",
      selectPriority: "اختر الأولوية",
      ticketMessages: "رسائل التذكرة",
      admin: "المسؤول",
      you: "أنت",
      download: "تحميل",
      preview: "معاينة",
      delete: "حذف",
      mustSignIn: "يجب تسجيل الدخول لعرض التذاكر",
      signIn: "تسجيل الدخول",
      platformName: "فذلكه",
      previous: "السابق",
      next: "التالي",
      page: "صفحة",
      of: "من",
      contactDirectly: "تواصل معنا مباشرة",
      contactEmail: "البريد الإلكتروني",
      contactInfo: "معلومات التواصل",
      contactDescription: "إذا لم تكن مسجلاً دخول، يمكنك التواصل معنا مباشرة عبر البريد الإلكتروني",
      email: "fazlaka.contact@gmail.com",
      sendEmail: "إرسال بريد إلكتروني"
    },
    en: {
      pageTitle: "Technical Support",
      heroTitle: "Technical Support Center",
      heroSubtitle: "We're here to help. Create a support ticket to report any technical issue or get assistance.",
      myTickets: "My Tickets",
      createTicket: "Create New Ticket",
      ticketNumber: "Ticket Number",
      category: "Category",
      priority: "Priority",
      status: "Status",
      subject: "Subject",
      lastUpdate: "Last Update",
      open: "Open",
      inProgress: "In Progress",
      waitingForUser: "Waiting for User",
      resolved: "Resolved",
      closed: "Closed",
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent",
      technical: "Technical",
      account: "Account",
      billing: "Billing",
      content: "Content",
      other: "Other",
      search: "Search tickets...",
      filterByStatus: "Filter by Status",
      filterByCategory: "Filter by Category",
      all: "All",
      viewDetails: "View Details",
      closeTicket: "Close Ticket",
      ticketDetails: "Ticket Details",
      description: "Description",
      attachments: "Attachments",
      addMessage: "Add Message",
      yourMessage: "Your Message",
      sendMessage: "Send Message",
      noTickets: "No tickets",
      noTicketsFound: "No tickets found",
      loadingTickets: "Loading tickets...",
      dragDropText: "Drag and drop files here or click to select",
      dragActiveText: "Drop files here",
      allowedFormats: "Allowed formats: jpg, png, pdf, doc, docx, zip",
      attachedFiles: "Attached files:",
      sending: "Sending...",
      sendingMessage: "Sending message...",
      ticketCreated: "Ticket created successfully",
      messageSent: "Message sent successfully",
      errorCreatingTicket: "Failed to create ticket",
      errorSendingMessage: "Failed to send message",
      errorFetchingTickets: "Failed to fetch tickets",
      errorFetchingTicketDetails: "Failed to fetch ticket details",
      errorClosingTicket: "Failed to close ticket",
      requiredField: "This field is required",
      selectCategory: "Select Category",
      selectPriority: "Select Priority",
      ticketMessages: "Ticket Messages",
      admin: "Admin",
      you: "You",
      download: "Download",
      preview: "Preview",
      delete: "Delete",
      mustSignIn: "You must sign in to view tickets",
      signIn: "Sign In",
      platformName: "Falthaka",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      contactDirectly: "Contact Us Directly",
      contactEmail: "Email",
      contactInfo: "Contact Information",
      contactDescription: "If you're not logged in, you can contact us directly via email",
      email: "fazlaka.contact@gmail.com",
      sendEmail: "Send Email"
    }
  };
  
  const t = texts[isRTL ? 'ar' : 'en'];

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30';
      case 'waiting_for_user': return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30';
      case 'closed': return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30';
    }
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30';
      case 'urgent': return 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30';
    }
  }, []);

  const getCategoryIcon = useCallback((category: string) => {
    switch (category) {
      case 'technical': return <FaTools className="text-blue-500" />;
      case 'account': return <FaUser className="text-green-500" />;
      case 'billing': return <FaCreditCard className="text-yellow-500" />;
      case 'content': return <FaFileAlt className="text-purple-500" />;
      case 'other': return <FaQuestionCircle className="text-gray-500" />;
      default: return <FaQuestionCircle className="text-gray-500" />;
    }
  }, []);

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-white/20 dark:border-gray-700/30">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-6 shadow-lg">
                <FaTicketAlt className="text-3xl text-white" />
              </div>
              <h2 className={`text-3xl font-bold mb-4 text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>
                {t.mustSignIn}
              </h2>
              <p className={`mb-8 text-gray-600 dark:text-gray-300 text-lg ${isRTL ? '' : 'font-sans'}`}>
                {isRTL ? "يجب تسجيل الدخول لعرض وإدارة تذاكر الدعم الفني" : "You must sign in to view and manage support tickets"}
              </p>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8 border border-indigo-200/50 dark:border-indigo-700/30">
                <h3 className={`text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200 ${isRTL ? '' : 'font-sans'}`}>
                  {t.contactDirectly}
                </h3>
                <p className={`mb-4 text-gray-600 dark:text-gray-400 ${isRTL ? '' : 'font-sans'}`}>
                  {t.contactDescription}
                </p>
                
                <motion.div 
                  className="inline-flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full ml-4">
                    <FaEnvelope className="text-xl text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${isRTL ? '' : 'font-sans'}`}>{t.contactEmail}</p>
                    <a 
                      href={`mailto:${t.email}`} 
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors"
                    >
                      {t.email}
                    </a>
                  </div>
                </motion.div>
              </div>
              
              <Link 
                href="/sign-in" 
                className="inline-flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {t.signIn}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-6xl">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <FaHeadset className="text-4xl mr-4" />
              </motion.div>
              <h1 className={`text-3xl font-bold ${isRTL ? '' : 'font-sans'}`}>{t.heroTitle}</h1>
            </div>
            <p className={`text-lg opacity-90 ${isRTL ? '' : 'font-sans'}`}>{t.heroSubtitle}</p>
          </div>
        </motion.div>

        {/* Tickets Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-8 border border-white/30 dark:border-gray-700/30"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className={`text-2xl font-bold text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>
              {t.myTickets}
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewTicketForm(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center shadow-lg"
            >
              <FaPlus className="mr-2" />
              {t.createTicket}
            </motion.button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300/50 dark:border-gray-600/50 rounded-lg py-2 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300/50 dark:border-gray-600/50 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white"
              >
                <option value="all">{t.filterByStatus}</option>
                <option value="open">{t.open}</option>
                <option value="in_progress">{t.inProgress}</option>
                <option value="waiting_for_user">{t.waitingForUser}</option>
                <option value="resolved">{t.resolved}</option>
                <option value="closed">{t.closed}</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300/50 dark:border-gray-600/50 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white"
              >
                <option value="all">{t.filterByCategory}</option>
                <option value="technical">{t.technical}</option>
                <option value="account">{t.account}</option>
                <option value="billing">{t.billing}</option>
                <option value="content">{t.content}</option>
                <option value="other">{t.other}</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <span className="mr-3 text-gray-600 dark:text-gray-400">{t.loadingTickets}</span>
            </div>
          ) : error ? (
            <div className="bg-red-500/20 dark:bg-red-900/20 backdrop-blur-sm border border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <FaTicketAlt className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className={`text-xl text-gray-500 dark:text-gray-400 ${isRTL ? '' : 'font-sans'}`}>
                {searchQuery ? t.noTicketsFound : t.noTickets}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                    <th className={`text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>
                      {t.ticketNumber}
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>
                      {t.subject}
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>
                      {t.category}
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>
                      {t.priority}
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>
                      {t.status}
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>
                      {t.lastUpdate}
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>
                      {isRTL ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket, index) => (
                    <motion.tr 
                      key={ticket._id.toString()} 
                      className="border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="py-3 px-4">
                        <span className={`font-mono text-sm ${isRTL ? '' : 'font-sans'}`}>{ticket.ticketNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${isRTL ? '' : 'font-sans'}`}>
                          {isRTL ? ticket.subject : (ticket.subjectEn || ticket.subject)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {getCategoryIcon(ticket.category)}
                          <span className={`mr-2 ${isRTL ? '' : 'font-sans'}`}>
                            {t[ticket.category as keyof typeof t]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)} ${isRTL ? '' : 'font-sans'}`}>
                          {t[ticket.priority as keyof typeof t]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)} ${isRTL ? '' : 'font-sans'}`}>
                          {t[ticket.status as keyof typeof t]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${isRTL ? '' : 'font-sans'}`}>{formatDate(ticket.updatedAt)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => fetchTicketDetails(ticket._id.toString())}
                          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                        >
                          {t.viewDetails}
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded-lg bg-gray-200/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t.previous}
              </motion.button>
              <span className={`px-3 py-1 ${isRTL ? '' : 'font-sans'}`}>
                {t.page} {pagination.page} {t.of} {pagination.pages}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPagination({ ...pagination, page: Math.min(pagination.pages, pagination.page + 1) })}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 rounded-lg bg-gray-200/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t.next}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* New Ticket Form Modal */}
        <AnimatePresence>
          {showNewTicketForm && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/30 dark:border-gray-700/30"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>
                      {t.createTicket}
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowNewTicketForm(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      <FaTimes className="text-xl" />
                    </motion.button>
                  </div>

                  {formError && (
                    <div className="bg-red-500/20 dark:bg-red-900/20 backdrop-blur-sm border border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
                      {formError}
                    </div>
                  )}

                  {formSuccess && (
                    <div className="bg-green-500/20 dark:bg-green-900/20 backdrop-blur-sm border border-green-500/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4">
                      {formSuccess}
                    </div>
                  )}

                  <form onSubmit={handleCreateTicket}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={`block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 ${isRTL ? '' : 'font-sans'}`}>
                          {t.category}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            {getCategoryIcon(newTicket.category)}
                          </div>
                          <select
                            value={newTicket.category}
                            onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                            className="w-full border border-gray-300/50 dark:border-gray-600/50 rounded-lg py-2 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white appearance-none"
                          >
                            <option value="technical">{t.technical}</option>
                            <option value="account">{t.account}</option>
                            <option value="billing">{t.billing}</option>
                            <option value="content">{t.content}</option>
                            <option value="other">{t.other}</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={`block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 ${isRTL ? '' : 'font-sans'}`}>
                          {t.priority}
                        </label>
                        <select
                          value={newTicket.priority}
                          onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                          className="w-full border border-gray-300/50 dark:border-gray-600/50 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white"
                        >
                          <option value="low">{t.low}</option>
                          <option value="medium">{t.medium}</option>
                          <option value="high">{t.high}</option>
                          <option value="urgent">{t.urgent}</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className={`block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 ${isRTL ? '' : 'font-sans'}`}>
                        {t.subject}
                      </label>
                      <input
                        type="text"
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                        className="w-full border border-gray-300/50 dark:border-gray-600/50 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className={`block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 ${isRTL ? '' : 'font-sans'}`}>
                        {t.description}
                      </label>
                      <textarea
                        value={newTicket.description}
                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                        rows={5}
                        className="w-full border border-gray-300/50 dark:border-gray-600/50 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        required
                      ></textarea>
                    </div>

                    <div className="mb-4">
                      <label className={`block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 ${isRTL ? '' : 'font-sans'}`}>
                        {t.attachments}
                      </label>
                      <div 
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
                          isDragActive 
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                            : 'border-gray-300/50 dark:border-gray-600/50 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/50 dark:bg-gray-700/50'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <FaPaperclip className="mx-auto text-4xl text-gray-400 mb-4" />
                        <p className={`text-gray-600 dark:text-gray-400 ${isRTL ? '' : 'font-sans'}`}>
                          {isDragActive ? t.dragActiveText : t.dragDropText}
                        </p>
                        <p className={`text-sm text-gray-500 dark:text-gray-500 mt-2 ${isRTL ? '' : 'font-sans'}`}>{t.allowedFormats}</p>
                      </div>
                      {attachments.length > 0 && (
                        <div className="mt-4">
                          <p className={`text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? '' : 'font-sans'}`}>{t.attachedFiles}</p>
                          <ul className="space-y-2">
                            {attachments.map((file, index) => (
                              <motion.li 
                                key={index} 
                                className="flex items-center justify-between bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm p-2 rounded-lg"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <span className={`text-sm text-gray-700 dark:text-gray-300 truncate ${isRTL ? '' : 'font-sans'}`}>{file.name}</span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={() => removeAttachment(index)}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                >
                                  <FaTrash />
                                </motion.button>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setShowNewTicketForm(false)}
                        className="bg-gray-200/50 hover:bg-gray-300/50 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition-all duration-300 backdrop-blur-sm"
                      >
                        {isRTL ? "إلغاء" : "Cancel"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
                      >
                        {submitting ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            {t.sending}
                          </>
                        ) : (
                          t.createTicket
                        )}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ticket Details Modal */}
        <AnimatePresence>
          {selectedTicket && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/30 dark:border-gray-700/30"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className={`text-xl font-bold text-gray-900 dark:text-white mb-2 ${isRTL ? '' : 'font-sans'}`}>
                        {t.ticketDetails}: {selectedTicket.ticketNumber}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)} ${isRTL ? '' : 'font-sans'}`}>
                          {t[selectedTicket.priority as keyof typeof t]}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)} ${isRTL ? '' : 'font-sans'}`}>
                          {t[selectedTicket.status as keyof typeof t]}
                        </span>
                        <div className="flex items-center">
                          {getCategoryIcon(selectedTicket.category)}
                          <span className={`mr-2 text-xs ${isRTL ? '' : 'font-sans'}`}>
                            {t[selectedTicket.category as keyof typeof t]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedTicket(null)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      <FaTimes className="text-xl" />
                    </motion.button>
                  </div>

                  <div className="mb-6">
                    <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 ${isRTL ? '' : 'font-sans'}`}>{t.subject}</h4>
                    <p className={`text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>
                      {isRTL ? selectedTicket.subject : (selectedTicket.subjectEn || selectedTicket.subject)}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 ${isRTL ? '' : 'font-sans'}`}>{t.description}</h4>
                    <p className={`text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${isRTL ? '' : 'font-sans'}`}>
                      {isRTL ? selectedTicket.description : (selectedTicket.descriptionEn || selectedTicket.description)}
                    </p>
                  </div>

                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div className="mb-6">
                      <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 ${isRTL ? '' : 'font-sans'}`}>{t.attachments}</h4>
                      <ul className="space-y-2">
                        {selectedTicket.attachments.map((attachment, index) => (
                          <motion.li 
                            key={index} 
                            className="flex items-center justify-between bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm p-3 rounded-lg"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.1 }}
                          >
                            <div className="flex items-center">
                              <FaPaperclip className="mr-3 text-gray-500" />
                              <div>
                                <p className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{attachment.name}</p>
                                <p className={`text-xs text-gray-500 dark:text-gray-400 ${isRTL ? '' : 'font-sans'}`}>{formatFileSize(attachment.size)}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {attachment.url && (
                                <motion.a
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                  title={t.preview}
                                >
                                  <FaEye />
                                </motion.a>
                              )}
                              <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                href={attachment.url || '#'}
                                download={attachment.name}
                                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                title={t.download}
                              >
                                <FaDownload />
                              </motion.a>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className={`font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? '' : 'font-sans'}`}>{t.ticketMessages}</h4>
                    <div className="space-y-4">
                      {selectedTicket.messages && selectedTicket.messages.map((message, index) => (
                        <motion.div 
                          key={index} 
                          className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-indigo-100/50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200'
                              : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200'
                          } backdrop-blur-sm`}>
                            <div className="flex items-center mb-1">
                              <span className={`font-semibold text-sm ${isRTL ? '' : 'font-sans'}`}>
                                {message.sender === 'user' ? t.you : t.admin}
                              </span>
                              <span className={`text-xs mr-2 ${isRTL ? '' : 'font-sans'}`}>{formatDate(message.createdAt)}</span>
                            </div>
                            <p className={`text-sm ${isRTL ? '' : 'font-sans'}`}>
                              {isRTL ? message.content : (message.contentEn || message.content)}
                            </p>
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {message.attachments.map((attachment, attIndex) => (
                                  <div key={attIndex} className="flex items-center text-xs">
                                    <FaPaperclip className="mr-1" />
                                    <a
                                      href={attachment.url || '#'}
                                      download={attachment.name}
                                      className="hover:underline"
                                    >
                                      {attachment.name}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {messageError && (
                    <div className="bg-red-500/20 dark:bg-red-900/20 backdrop-blur-sm border border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
                      {messageError}
                    </div>
                  )}

                  {messageSuccess && (
                    <div className="bg-green-500/20 dark:bg-green-900/20 backdrop-blur-sm border border-green-500/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4">
                      {messageSuccess}
                    </div>
                  )}

                  {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                    <form onSubmit={handleAddMessage} className="mb-4">
                      <div className="mb-4">
                        <label className={`block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 ${isRTL ? '' : 'font-sans'}`}>
                          {t.addMessage}
                        </label>
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300/50 dark:border-gray-600/50 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          required
                        ></textarea>
                      </div>

                      <div className="mb-4">
                        <div 
                          {...getMessageRootProps()}
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-300 ${
                            isMessageDragActive 
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                              : 'border-gray-300/50 dark:border-gray-600/50 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/50 dark:bg-gray-700/50'
                          }`}
                        >
                          <input {...getMessageInputProps()} />
                          <FaPaperclip className="mx-auto text-2xl text-gray-400 mb-2" />
                          <p className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? '' : 'font-sans'}`}>
                            {isMessageDragActive ? t.dragActiveText : t.dragDropText}
                          </p>
                        </div>
                        {messageAttachments.length > 0 && (
                          <div className="mt-2">
                            <p className={`text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 ${isRTL ? '' : 'font-sans'}`}>{t.attachedFiles}</p>
                            <ul className="flex flex-wrap gap-2">
                              {messageAttachments.map((file, index) => (
                                <motion.li 
                                  key={index} 
                                  className="flex items-center bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm p-1 rounded text-xs"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <span className={`truncate max-w-[100px] ${isRTL ? '' : 'font-sans'}`}>{file.name}</span>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    onClick={() => removeMessageAttachment(index)}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mr-1 transition-colors"
                                  >
                                    <FaTimes className="text-xs" />
                                  </motion.button>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="submit"
                          disabled={submittingMessage}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
                        >
                          {submittingMessage ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              {t.sendingMessage}
                            </>
                          ) : (
                            <>
                              <FaReply className="mr-2" />
                              {t.sendMessage}
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  )}

                  {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCloseTicket}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 shadow-lg"
                      >
                        {t.closeTicket}
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}