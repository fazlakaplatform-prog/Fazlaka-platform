import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File | null

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const apiKey = process.env.IMGBB_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "IMGBB_API_KEY not configured" }, { status: 500 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    // Upload to ImgBB
    const imgbbForm = new FormData()
    imgbbForm.append("key", apiKey)
    imgbbForm.append("image", base64)

    const res = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: imgbbForm,
    })

    const data = await res.json()

    if (!data.success) {
      return NextResponse.json({ error: data.error?.message || "Upload failed" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: data.data.url,
      thumb: data.data.thumb?.url,
      medium: data.data.medium?.url,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
