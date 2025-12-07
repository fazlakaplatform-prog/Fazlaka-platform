// src/app/admin/support/page.tsx
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  FaTicketAlt, FaSearch, FaUser, FaClock, FaCheckCircle, 
  FaSpinner, FaExclamationTriangle, FaTools,
  FaUserCog, FaChartBar, FaTimes
} from "react-icons/fa";

// تعريف واجهة للرسائل داخل التذكرة
interface Message {
  content: string;
  contentEn?: string;
  sender: string;
  attachments: Array<{
    name: string;
    size: number;
    type: string;
    url: string | null;
    isImage: boolean;
  }>;
  createdAt: string;
}

// تعريف واجهة للتذكرة
interface AdminTicket {
  _id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  subjectEn?: string;
  description: string;
  descriptionEn?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  messages?: Message[];
}

// Mock list of support agents
const supportAgents = [
  { id: 'agent1', name: 'أحمد علي', nameEn: 'Ahmed Ali' },
  { id: 'agent2', name: 'سارة محمد', nameEn: 'Sara Mohammed' },
  { id: 'agent3', name: 'خالد حسن', nameEn: 'Khaled Hassan' },
];

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [isRTL, setIsRTL] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  
  // State for updating ticket
  const [newStatus, setNewStatus] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [adminReply, setAdminReply] = useState('');
  const [updating, setUpdating] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    setIsRTL(localStorage.getItem('language') === 'ar');
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (assigneeFilter !== 'all') params.append('assignedTo', assigneeFilter);

      const response = await fetch(`/api/admin/tickets?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTickets(data.data);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('An error occurred while fetching tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, assigneeFilter]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTickets();
    }
  }, [status, fetchTickets]);

  const handleUpdateTicket = async (ticketId: string) => {
    if (!newStatus && !newAssignee && !adminReply) {
      setError('Please select a status, assignee, or write a reply to update.');
      return;
    }
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          assignedTo: newAssignee,
          reply: adminReply,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form
        setNewStatus('');
        setNewAssignee('');
        setAdminReply('');
        setSelectedTicket(null);
        fetchTickets(); // Refresh list
      } else {
        setError(data.error || 'Failed to update ticket');
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('An error occurred while updating the ticket');
    } finally {
      setUpdating(false);
    }
  };

  // Text translations (similar to user page)
  const t = {
    ar: {
      pageTitle: "لوحة تحكم الدعم الفني",
      heroTitle: "إدارة تذاكر الدعم",
      totalTickets: "إجمالي التذاكر",
      openTickets: "تذاكر مفتوحة",
      inProgressTickets: "قيد المعالجة",
      resolvedTickets: "تم حلها",
      search: "البحث...",
      filterByStatus: "الحالة",
      filterByCategory: "الفئة",
      filterByPriority: "الأولوية",
      filterByAssignee: "المسند إليه",
      all: "الكل",
      ticketNumber: "رقم التذكرة",
      user: "المستخدم",
      subject: "الموضوع",
      category: "الفئة",
      priority: "الأولوية",
      status: "الحالة",
      assignedTo: "المسند إليه",
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
      unassigned: "غير مسندة",
      viewDetails: "عرض التفاصيل",
      updateTicket: "تحديث التذكرة",
      addReply: "إضافة رد",
      selectStatus: "اختر الحالة",
      selectAssignee: "اختر المسؤول",
      yourReply: "ردك...",
      update: "تحديث",
      close: "إغلاق",
      loadingTickets: "جاري تحميل التذاكر...",
      unauthorized: "غير مصرح لك بالوصول إلى هذه الصفحة",
      errorFetching: "فشل جلب التذاكر",
      errorUpdating: "فشل تحديث التذكرة",
    },
    en: {
      pageTitle: "Admin Support Dashboard",
      heroTitle: "Manage Support Tickets",
      totalTickets: "Total Tickets",
      openTickets: "Open Tickets",
      inProgressTickets: "In Progress",
      resolvedTickets: "Resolved",
      search: "Search...",
      filterByStatus: "Status",
      filterByCategory: "Category",
      filterByPriority: "Priority",
      filterByAssignee: "Assignee",
      all: "All",
      ticketNumber: "Ticket #",
      user: "User",
      subject: "Subject",
      category: "Category",
      priority: "Priority",
      status: "Status",
      assignedTo: "Assigned To",
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
      unassigned: "Unassigned",
      viewDetails: "View Details",
      updateTicket: "Update Ticket",
      addReply: "Add Reply",
      selectStatus: "Select Status",
      selectAssignee: "Select Agent",
      yourReply: "Your reply...",
      update: "Update",
      close: "Close",
      loadingTickets: "Loading tickets...",
      unauthorized: "You are not authorized to view this page",
      errorFetching: "Failed to fetch tickets",
      errorUpdating: "Failed to update ticket",
    }
  };
  
  const text = t[isRTL ? 'ar' : 'en'];

  if (status === "loading" || !session) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <FaSpinner className="animate-spin text-4xl text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'waiting_for_user': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <FaTools className="text-blue-500 dark:text-blue-400" />;
      case 'account': return <FaUser className="text-green-500 dark:text-green-400" />;
      case 'billing': return <FaUserCog className="text-yellow-500 dark:text-yellow-400" />;
      case 'content': return <FaTicketAlt className="text-purple-500 dark:text-purple-400" />;
      case 'other': return <FaExclamationTriangle className="text-gray-500 dark:text-gray-400" />;
      default: return <FaExclamationTriangle className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <h1 className={`text-3xl font-bold mb-2 ${isRTL ? '' : 'font-sans'}`}>{text.heroTitle}</h1>
          <p className={`text-lg ${isRTL ? '' : 'font-sans'}`}>{isRTL ? "مرحباً بك في لوحة تحكم الدعم الفني" : "Welcome to admin support dashboard"}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FaChartBar className="text-3xl text-indigo-500 dark:text-indigo-400 mr-4" />
              <div>
                <p className={`text-gray-500 dark:text-gray-400 text-sm ${isRTL ? '' : 'font-sans'}`}>{text.totalTickets}</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>{stats.total}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FaTicketAlt className="text-3xl text-blue-500 dark:text-blue-400 mr-4" />
              <div>
                <p className={`text-gray-500 dark:text-gray-400 text-sm ${isRTL ? '' : 'font-sans'}`}>{text.openTickets}</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>{stats.open}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FaClock className="text-3xl text-yellow-500 dark:text-yellow-400 mr-4" />
              <div>
                <p className={`text-gray-500 dark:text-gray-400 text-sm ${isRTL ? '' : 'font-sans'}`}>{text.inProgressTickets}</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>{stats.inProgress}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FaCheckCircle className="text-3xl text-green-500 dark:text-green-400 mr-4" />
              <div>
                <p className={`text-gray-500 dark:text-gray-400 text-sm ${isRTL ? '' : 'font-sans'}`}>{text.resolvedTickets}</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>{stats.resolved}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute right-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder={text.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg py-2 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{text.filterByStatus}</option>
                <option value="open">{text.open}</option>
                <option value="in_progress">{text.inProgress}</option>
                <option value="resolved">{text.resolved}</option>
              </select>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)} 
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{text.filterByCategory}</option>
                <option value="technical">{text.technical}</option>
                <option value="account">{text.account}</option>
                <option value="billing">{text.billing}</option>
                <option value="content">{text.content}</option>
                <option value="other">{text.other}</option>
              </select>
              <select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value)} 
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{text.filterByPriority}</option>
                <option value="low">{text.low}</option>
                <option value="medium">{text.medium}</option>
                <option value="high">{text.high}</option>
                <option value="urgent">{text.urgent}</option>
              </select>
              <select 
                value={assigneeFilter} 
                onChange={(e) => setAssigneeFilter(e.target.value)} 
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{text.filterByAssignee}</option>
                <option value="">{text.unassigned}</option>
                {supportAgents.map(agent => (
                  <option key={agent.id} value={agent.id}>{isRTL ? agent.name : agent.nameEn}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <FaSpinner className="animate-spin text-4xl text-indigo-600 dark:text-indigo-400 mr-3" />
              <span className="text-gray-700 dark:text-gray-300">{text.loadingTickets}</span>
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{text.ticketNumber}</th>
                    <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{text.user}</th>
                    <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{text.subject}</th>
                    <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{text.category}</th>
                    <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{text.priority}</th>
                    <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{text.status}</th>
                    <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{text.assignedTo}</th>
                    <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{text.lastUpdate}</th>
                    <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{isRTL ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-300">{ticket.ticketNumber}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{ticket.userName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.userEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-300">{isRTL ? ticket.subject : (ticket.subjectEn || ticket.subject)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {getCategoryIcon(ticket.category)}
                          <span className="mr-2 text-gray-900 dark:text-gray-300">{text[ticket.category as keyof typeof text]}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {text[ticket.priority as keyof typeof text]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {text[ticket.status as keyof typeof text]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-300">
                        {ticket.assignedTo ? supportAgents.find(a => a.id === ticket.assignedTo)?.[isRTL ? 'name' : 'nameEn'] : text.unassigned}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300">{formatDate(ticket.updatedAt)}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setNewStatus(ticket.status);
                            setNewAssignee(ticket.assignedTo || '');
                          }}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                        >
                          {text.viewDetails}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Update Ticket Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className={`text-xl font-bold text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>
                    {text.updateTicket}: {selectedTicket.ticketNumber}
                  </h3>
                  <button 
                    onClick={() => setSelectedTicket(null)} 
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <div className="mb-4">
                  <p className={`font-semibold text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>{text.subject}:</p>
                  <p className={`text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{isRTL ? selectedTicket.subject : (selectedTicket.subjectEn || selectedTicket.subject)}</p>
                </div>
                
                <div className="mb-4">
                  <p className={`font-semibold text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>{text.user}:</p>
                  <p className={`text-gray-700 dark:text-gray-300 ${isRTL ? '' : 'font-sans'}`}>{selectedTicket.userName} ({selectedTicket.userEmail})</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${isRTL ? '' : 'font-sans'}`}>{text.selectStatus}</label>
                    <select 
                      value={newStatus} 
                      onChange={(e) => setNewStatus(e.target.value)} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">{text.selectStatus}</option>
                      <option value="open">{text.open}</option>
                      <option value="in_progress">{text.inProgress}</option>
                      <option value="waiting_for_user">{text.waitingForUser}</option>
                      <option value="resolved">{text.resolved}</option>
                      <option value="closed">{text.closed}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${isRTL ? '' : 'font-sans'}`}>{text.selectAssignee}</label>
                    <select 
                      value={newAssignee} 
                      onChange={(e) => setNewAssignee(e.target.value)} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">{text.selectAssignee}</option>
                      {supportAgents.map(agent => (
                        <option key={agent.id} value={agent.id}>{isRTL ? agent.name : agent.nameEn}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${isRTL ? '' : 'font-sans'}`}>{text.addReply}</label>
                  <textarea
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={text.yourReply}
                  ></textarea>
                </div>

                {error && <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">{error}</div>}

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => setSelectedTicket(null)} 
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    {text.close}
                  </button>
                  <button
                    onClick={() => handleUpdateTicket(selectedTicket._id)}
                    disabled={updating}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {updating && <FaSpinner className="animate-spin" />}
                    {text.update}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}