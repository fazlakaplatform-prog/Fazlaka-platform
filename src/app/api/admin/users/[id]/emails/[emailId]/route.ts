import { NextRequest, NextResponse } from "next/server"
import { ObjectId, type UpdateFilter } from "mongodb"
import clientPromise from "@/lib/mongodb"

// تعريف واجهة للبريد الإلكتروني الثانوي
interface SecondaryEmail {
  _id: string;
  email: string;
  isVerified: boolean;
}

// تعريف واجهة للمستخدم
interface User {
  _id: ObjectId;
  email: string;
  emailVerified?: boolean | Date;
  secondaryEmails?: SecondaryEmail[];
}

// PUT - لجعل البريد الإلكتروني أساسيًا
export async function PUT(
  request: NextRequest,
  context: { 
    params: Promise<{ id: string; emailId: string }> 
  }
) {
  try {
    const { id, emailId } = await context.params;

    const client = await clientPromise;
    const db = client.db();
    const usersCol = db.collection<User>('users');

    // تحديد نوع المستخدم عند جلبه من قاعدة البيانات
    const user = await usersCol.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // تحديد نوع مصفوفة البريد الإلكتروني الثانوية
    const secondaryEmails: SecondaryEmail[] = user.secondaryEmails || [];

    const emailToMakePrimary = secondaryEmails.find((e: SecondaryEmail) => e._id === emailId);

    if (!emailToMakePrimary) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      )
    }

    // بدء الجلسة (session)
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        // إضافة البريد الإلكتروني الأساسي الحالي إلى القائمة الثانوية
        const newSecondaryEmail: SecondaryEmail = {
          _id: new ObjectId().toString(),
          email: user.email,
          isVerified: !!user.emailVerified // تحويل القيمة إلى boolean
        };

        // استخدام any لإصلاح مشكلة النوع مع $push
        await usersCol.updateOne(
          { _id: new ObjectId(id) },
          { $push: { secondaryEmails: newSecondaryEmail } } as UpdateFilter<User>,
          { session }
        );

        // حذف البريد الإلكتروني من القائمة الثانوية
        await usersCol.updateOne(
          { _id: new ObjectId(id) },
          { $pull: { secondaryEmails: { _id: emailId } } },
          { session }
        );

        // تحديث البريد الإلكتروني الأساسي
        await usersCol.updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: { 
              email: emailToMakePrimary.email,
              emailVerified: emailToMakePrimary.isVerified,
              updatedAt: new Date()
            }
          },
          { session }
        );
      });
    } finally {
      // التأكد من إنهاء الجلسة دائمًا
      await session.endSession();
    }

    return NextResponse.json({
      message: "Email made primary successfully",
      newPrimaryEmail: emailToMakePrimary.email
    });
  } catch (error) {
    console.error("Error making email primary:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - لحذف بريد إلكتروني
export async function DELETE(
  request: NextRequest,
  context: { 
    params: Promise<{ id: string; emailId: string }> 
  }
) {
  try {
    const { id, emailId } = await context.params;

    const client = await clientPromise;
    const db = client.db();
    const usersCol = db.collection<User>('users');

    // التحقق من وجود المستخدم
    const user = await usersCol.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // حذف البريد الإلكتروني
    const result = await usersCol.updateOne(
      { _id: new ObjectId(id) },
      { 
        $pull: { secondaryEmails: { _id: emailId } },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Email deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting email:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
