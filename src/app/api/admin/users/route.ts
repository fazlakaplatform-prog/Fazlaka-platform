// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, Role } from "@prisma/client"
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// GET - لجلب قائمة المستخدمين مع البحث والتصفية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    
    // بناء استعلام البحث
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.role = role as Role;
    }
    
    if (status === 'active') {
      where.isActive = true;
      where.banned = false;
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'banned') {
      where.banned = true;
    }
    
    // حساب عدد المستخدمين
    const totalUsers = await prisma.user.count({ where });
    
    // جلب المستخدمين مع التصفح
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        banner: true,
        bio: true,
        location: true,
        website: true,
        isActive: true,
        role: true,
        banned: true,
        googleId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        secondaryEmails: true
      }
    });
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - لإنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role = "USER" } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }
    
    // التحقق من صحة قيمة الدور
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }
    
    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // إنشاء مستخدم جديد
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
        isActive: true,
        banned: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        banner: true,
        bio: true,
        location: true,
        website: true,
        isActive: true,
        role: true,
        banned: true,
        googleId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        secondaryEmails: true
      }
    });
    
    return NextResponse.json({
      message: "User created successfully",
      user: newUser
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}