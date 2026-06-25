import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    // تمت إضافة "as string" لتحويل النوع لتجنب الخطأ
    if (!session?.user || !['ADMIN', 'OWNER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { action, reason, newContent } = await request.json();

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { userRelation: true }
    });

    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    
    // دالة لتحديث الموقع فوراً
    const triggerUpdate = async () => {
        const contentId = comment.articleId || comment.episodeId;
        if (contentId) {
            await pusherServer.trigger(`comments-${contentId}`, 'new-comment', {});
        }
        // إرسال حدث لتحديث لوحة التحكم نفسها إذا لزم الأمر
        await pusherServer.trigger('admin-dashboard', 'refresh', {});
    };

    // 1. تعديل التعليق
    if (action === 'edit') {
        if (!newContent) return NextResponse.json({ error: 'Content empty' }, { status: 400 });
        await prisma.comment.update({
            where: { id },
            data: { content: newContent, isEdited: true }
        });
        await triggerUpdate();
        return NextResponse.json({ success: true, message: 'Comment updated' });
    }

    // 2. حذف التعليق
    if (action === 'delete') {
      await prisma.comment.delete({ where: { id } });
      await triggerUpdate();
      return NextResponse.json({ success: true, message: 'Comment deleted' });
    }

    // 3. تنبيه المستخدم
    if (action === 'warn' && comment.userRelation?.email) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: comment.userRelation.email,
        subject: "تنبيه إداري - فذلكة",
        html: `
          <div dir="rtl" style="font-family: Arial; background: #f4f4f4; padding: 20px; border-radius: 10px;">
            <h3 style="color: #d9534f;">مرحباً ${comment.userRelation.name},</h3>
            <p>لقد قام فريق الإدارة بتنبيهك بخصوص تعليقك:</p>
            <blockquote style="background: #fff; padding: 10px; border-right: 4px solid #d9534f;">${comment.content}</blockquote>
            <p><strong>السبب:</strong> ${reason}</p>
            <p style="color: #888; font-size: 12px;">يرجى الالتزام بقواعد المجتمع لتجنب إيقاف حسابك.</p>
          </div>
        `
      });
      // تحديث حالة البلاغات إن وجدت
      await prisma.commentReport.updateMany({
        where: { commentId: id, status: 'PENDING' },
        data: { status: 'REVIEWED' }
      });
      return NextResponse.json({ success: true, message: 'Warning sent' });
    }

    // 4. حظر المستخدم
    if (action === 'ban' && comment.userRelation) {
      await prisma.user.update({
        where: { id: comment.userId! },
        data: { banned: true }
      });
      await prisma.comment.delete({ where: { id } }); // حذف التعليق المسيء
      await triggerUpdate();

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: comment.userRelation.email,
        subject: "تم حظر حسابك - فذلكة",
        html: `
          <div dir="rtl" style="font-family: Arial;">
            <h3>مرحباً ${comment.userRelation.name},</h3>
            <p style="color: red;">تم حظر حسابك بسبب انتهاك متكرر لشروط الاستخدام.</p>
            <p><strong>السبب:</strong> ${reason}</p>
          </div>
        `
      });
      return NextResponse.json({ success: true, message: 'User banned' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}