// src/app/admin/users/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Ban, 
  Trash2,
  UserCheck,
  UserX,
  Calendar
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

// تعريف واجهة للمستخدم
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  banned: boolean;
  createdAt: string;
  image?: string;
}

// Translation object
const translations = {
  ar: {
    title: "إدارة المستخدمين",
    subtitle: "إدارة جميع المستخدمين في المنصة",
    searchPlaceholder: "البحث عن مستخدم...",
    filterRole: "فلترة حسب الدور",
    filterStatus: "فلترة حسب الحالة",
    all: "الكل",
    active: "نشط",
    inactive: "غير نشط",
    banned: "محظور",
    user: "مستخدم",
    owner: "مالك",
    editor: "محرر",
    admin: "مدير",
    addUser: "إضافة مستخدم جديد",
    name: "الاسم",
    email: "البريد الإلكتروني",
    role: "الدور",
    status: "الحالة",
    joined: "تاريخ الانضمام",
    actions: "الإجراءات",
    view: "عرض",
    edit: "تعديل",
    ban: "حظر",
    unban: "إلغاء الحظر",
    delete: "حذف",
    confirmDelete: "هل أنت متأكد من حذف هذا المستخدم؟",
    confirmBan: "هل أنت متأكد من حظر هذا المستخدم؟",
    confirmUnban: "هل أنت متأكد من إلغاء حظر هذا المستخدم؟",
    userDeleted: "تم حذف المستخدم بنجاح",
    userBanned: "تم حظر المستخدم بنجاح",
    userUnbanned: "تم إلغاء حظر المستخدم بنجاح",
    error: "حدث خطأ ما",
    noUsersFound: "لم يتم العثور على مستخدمين",
    loading: "جاري التحميل...",
    stats: {
      totalUsers: "إجمالي المستخدمين",
      activeUsers: "المستخدمون النشطون",
      bannedUsers: "المستخدمون المحظورون",
      newUsers: "المستخدمون الجدد (30 يوم)"
    }
  },
  en: {
    title: "User Management",
    subtitle: "Manage all users on platform",
    searchPlaceholder: "Search for a user...",
    filterRole: "Filter by role",
    filterStatus: "Filter by status",
    all: "All",
    active: "Active",
    inactive: "Inactive",
    banned: "Banned",
    user: "User",
    owner: "Owner",
    editor: "Editor",
    admin: "Admin",
    addUser: "Add New User",
    name: "Name",
    email: "Email",
    role: "Role",
    status: "Status",
    joined: "Joined",
    actions: "Actions",
    view: "View",
    edit: "Edit",
    ban: "Ban",
    unban: "Unban",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this user?",
    confirmBan: "Are you sure you want to ban this user?",
    confirmUnban: "Are you sure you want to unban this user?",
    userDeleted: "User deleted successfully",
    userBanned: "User banned successfully",
    userUnbanned: "User unbanned successfully",
    error: "Something went wrong",
    noUsersFound: "No users found",
    loading: "Loading...",
    stats: {
      totalUsers: "Total Users",
      activeUsers: "Active Users",
      bannedUsers: "Banned Users",
      newUsers: "New Users (30 days)"
    }
  }
};

export default function UsersManagementPage() {
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    newUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // استخدام useCallback لتثبيت الدالة
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter })
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setTotalPages(data.pagination.pages)
      } else {
        console.error("Failed to fetch users")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, search, roleFilter, statusFilter])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/users/stats")
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalUsers: data.totalUsers,
          activeUsers: data.activeUsers,
          bannedUsers: data.bannedUsers,
          newUsers: data.newUsers
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [fetchUsers])

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        setShowDeleteModal(false)
        fetchUsers()
        fetchStats()
        // إظهار رسالة نجاح
        alert(t.userDeleted)
      } else {
        alert(t.error)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert(t.error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          banned: !selectedUser.banned
        })
      })
      
      if (response.ok) {
        setShowBanModal(false)
        fetchUsers()
        fetchStats()
        // إظهار رسالة نجاح
        alert(selectedUser.banned ? t.userUnbanned : t.userBanned)
      } else {
        alert(t.error)
      }
    } catch (error) {
      console.error("Error banning/unbanning user:", error)
      alert(t.error)
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
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
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t.subtitle}</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className={`ml-4 ${isRTL ? 'mr-4 ml-0' : ''}`}>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.stats.totalUsers}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className={`ml-4 ${isRTL ? 'mr-4 ml-0' : ''}`}>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.stats.activeUsers}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeUsers}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <UserX className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className={`ml-4 ${isRTL ? 'mr-4 ml-0' : ''}`}>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.stats.bannedUsers}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.bannedUsers}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className={`ml-4 ${isRTL ? 'mr-4 ml-0' : ''}`}>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.stats.newUsers}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.newUsers}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isRTL ? 'pr-10 pl-3 text-right' : ''}`}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`appearance-none block pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isRTL ? 'pr-10 pl-8 text-right' : ''}`}
                >
                  <option value="">{t.filterRole}</option>
                  <option value="user">{t.user}</option>
                  <option value="editor">{t.editor}</option>
                  <option value="owner">{t.owner}</option>
                  <option value="admin">{t.admin}</option>
                </select>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`appearance-none block pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isRTL ? 'pr-10 pl-8 text-right' : ''}`}
                >
                  <option value="">{t.filterStatus}</option>
                  <option value="active">{t.active}</option>
                  <option value="inactive">{t.inactive}</option>
                  <option value="banned">{t.banned}</option>
                </select>
              </div>
              
              <Link href="/admin/users/add">
                <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                  <Plus className="h-5 w-5 mr-2" />
                  {t.addUser}
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? 'text-right' : ''}`}>
                    {t.name}
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? 'text-right' : ''}`}>
                    {t.email}
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? 'text-right' : ''}`}>
                    {t.role}
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? 'text-right' : ''}`}>
                    {t.status}
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? 'text-right' : ''}`}>
                    {t.joined}
                  </th>
                  <th scope="col" className={`px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? 'text-left' : ''}`}>
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.length > 0 ? (
                  users.map((user) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.image ? (
                              <Image
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.image}
                                alt={user.name}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-gray-500 dark:text-gray-300 font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={`ml-4 ${isRTL ? 'mr-4 ml-0' : ''}`}>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'owner' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : user.role === 'editor'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : user.role === 'admin'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {user.role === 'owner' ? t.owner : 
                           user.role === 'editor' ? t.editor : 
                           user.role === 'admin' ? t.admin : t.user}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.banned 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {user.banned ? t.banned : 
                           user.isActive ? t.active : t.inactive}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/admin/users/${user._id}`}>
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              <Eye className="h-5 w-5" />
                            </button>
                          </Link>
                          <Link href={`/admin/users/${user._id}/edit`}>
                            <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                              <Edit className="h-5 w-5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowBanModal(true)
                            }}
                            className={`${user.banned ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300' : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'}`}
                          >
                            {user.banned ? <UserCheck className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowDeleteModal(true)
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t.noUsersFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(currentPage * 10, users.length)}</span> of{" "}
                    <span className="font-medium">{stats.totalUsers}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-300'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
                {t.confirmDelete}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedUser?.name} ({selectedUser?.email})
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md w-24 mr-2 hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    t.delete
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Ban/Unban Confirmation Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
          >
            <div className="mt-3 text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${selectedUser?.banned ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                {selectedUser?.banned ? (
                  <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <Ban className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-4">
                {selectedUser?.banned ? t.confirmUnban : t.confirmBan}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedUser?.name} ({selectedUser?.email})
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md w-24 mr-2 hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-white text-base font-medium rounded-md w-24 disabled:opacity-50 ${
                    selectedUser?.banned 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    selectedUser?.banned ? t.unban : t.ban
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}