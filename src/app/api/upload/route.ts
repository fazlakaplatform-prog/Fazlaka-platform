// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const type = data.get('type') as string; // 'profile' or 'banner'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file size (max 5MB for profile, 10MB for banner)
    const maxSize = type === 'banner' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeText = type === 'banner' ? '10MB' : '5MB';
      return NextResponse.json(
        { error: `Image too large (max ${sizeText})` },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      return NextResponse.json(
        { error: 'Invalid file type (please upload JPEG, PNG, or WebP)' },
        { status: 400 }
      );
    }

    // Convert file to Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Prepare data for ImgBB
    const formData = new FormData();
    formData.append('key', process.env.IMGBB_API_KEY || '');
    formData.append('image', base64Image);

    // Send image to ImgBB
    const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!imgbbResponse.ok) {
      throw new Error('Failed to upload to ImgBB');
    }

    const imgbbData = await imgbbResponse.json();
    
    // Extract image URL from ImgBB response
    const imageUrl = imgbbData.data.url;

    return NextResponse.json({ url: imageUrl });

  } catch (error) {
    console.error('Error uploading file to ImgBB:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}