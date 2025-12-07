// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from 'bcryptjs'

// GET - لجلب قائمة المستخدمين مع البحث والتصفية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    
    const client = await clientPromise;
    const db = client.db();
    
    // بناء استعلام البحث
    const query: Record<string, unknown> = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status === 'active') {
      query.isActive = true;
      query.banned = false;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'banned') {
      query.banned = true;
    }
    
    // حساب عدد المستخدمين
    const totalUsers = await db.collection('users').countDocuments(query);
    
    // جلب المستخدمين مع التصفح
    const users = await db.collection('users')
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    
    // إزالة الحقول الحساسة
    const sanitizedUsers = users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, verificationToken, resetToken, magicToken, otpCode, emailChangeCode, ...rest } = user;
      return rest;
    });
    
    return NextResponse.json({
      users: sanitizedUsers,
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
    const { name, email, password, role = "user" } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    const client = await clientPromise;
    const db = client.db();
    
    // التحقق من وجود المستخدم
    const existingUser = await db.collection('users').findOne({ email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // إنشاء مستخدم جديد
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      banned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    // إزالة كلمة المرور من الاستجابة
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: removedPassword, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({
      message: "User created successfully",
      user: {
        _id: result.insertedId,
        ...userWithoutPassword
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}