// src/app/api/chat/generate-title/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { message, language } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error("Google AI API Key is not configured");
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = language === 'ar' 
      ? `أرجو إنشاء عنوان قصير وموجز (لا يزيد عن 30 حرفاً) للمحادثة التالية. العنوان يجب أن يكون ذكياً ويعبر عن محتوى المحادثة. لا تستخدم علامات الترقيم أو الاقتباسات. المحادثة: "${message}"`
      : `Please generate a short and concise title (no more than 30 characters) for the following conversation. The title should be smart and reflect the content of the conversation. Do not use punctuation or quotation marks. Conversation: "${message}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const title = response.text().trim();

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}