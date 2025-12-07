import { NextRequest, NextResponse } from 'next/server';
import { fetchArticleBySlug, updateArticle, deleteArticle } from '@/services/articles';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const article = await fetchArticleBySlug(slug, language);
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error in article API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const articleData = await request.json();
    
    const updatedArticle = await updateArticle(slug, articleData);
    
    if (!updatedArticle) {
      return NextResponse.json(
        { error: 'Article not found or update failed' },
        { status: 404 }
      );
    }
    
    // إرسال إشعار بالتغيير
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stream/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'change',
          operation: 'update',
          collection: 'articles',
          data: updatedArticle
        })
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json({ article: updatedArticle });
  } catch (error) {
    console.error('Error in article API:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const success = await deleteArticle(slug);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Article not found or deletion failed' },
        { status: 404 }
      );
    }
    
    // إرسال إشعار بالتغيير
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stream/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'change',
          operation: 'delete',
          collection: 'articles',
          data: { slug }
        })
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in article API:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}