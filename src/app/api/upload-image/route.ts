import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // التحقق من حجم الملف (الحد الأقصى 5 ميجابايت)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 })
    }

    // التحقق من نوع الملف
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      return NextResponse.json({ error: "Invalid file type (please upload JPEG, PNG, or WebP)" }, { status: 400 })
    }

    // تحويل الملف إلى Base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    // إعداد البيانات للإرسال إلى ImgBB
    const formData = new FormData()
    formData.append('key', '4fffc5eb098c5e30aa44ee292ad443ce') // مفتاح API الخاص بـ ImgBB
    formData.append('image', base64Image)

    // إرسال الصورة إلى ImgBB
    const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    })

    if (!imgbbResponse.ok) {
      throw new Error('Failed to upload to ImgBB')
    }

    const imgbbData = await imgbbResponse.json()
    
    // استخراج رابط الصورة من استجابة ImgBB
    const imageUrl = imgbbData.data.url

    return NextResponse.json({ url: imageUrl })

  } catch (error) {
    console.error("Error uploading file to ImgBB:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}