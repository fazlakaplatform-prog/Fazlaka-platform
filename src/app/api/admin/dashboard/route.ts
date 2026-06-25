import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // تأكد من أن لديك ملف prisma.ts في lib

// تعريف واجهة للعناصر المستخدمة في دالة التنسيق
interface ActivityItem {
  id: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();
    
    // تحويل التواريخ
    const start = new Date(startDate);
    const end = new Date(endDate);

    // حساب الفترة السابقة بشكل صحيح (نفس مدة الفترة الحالية تماماً)
    const duration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - duration);
    const previousEnd = start; // نهاية الفترة السابقة هي بداية الفترة الحالية

    // 1. جلب العدادات (الحالية والسابقة) بالتوازي لتحسين السرعة
    const [
      currentCounts,
      previousCounts,
      totalContentTypeCounts
    ] = await Promise.all([
      // عدادات الفترة الحالية
      Promise.all([
        prisma.article.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.episode.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.season.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]),
      // عدادات الفترة السابقة
      Promise.all([
        prisma.article.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),
        prisma.episode.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),
        prisma.season.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),
        prisma.user.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),
      ]),
      // عدادات أنواع المحتوى (الإجمالي)
      Promise.all([
        prisma.article.count(),
        prisma.episode.count(),
        prisma.season.count(),
        prisma.playlist.count(),
      ])
    ]);

    const [articlesCount, episodesCount, seasonsCount, usersCount] = currentCounts;
    const [prevArticles, prevEpisodes, prevSeasons, prevUsers] = previousCounts;
    const [totalArticles, totalEpisodes, totalSeasons, totalPlaylists] = totalContentTypeCounts;

    // حساب نسب التغيير
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const articlesChange = calculateChange(articlesCount, prevArticles);
    const episodesChange = calculateChange(episodesCount, prevEpisodes);
    const seasonsChange = calculateChange(seasonsCount, prevSeasons);
    const usersChange = calculateChange(usersCount, prevUsers);

    // 2. جلب بيانات الرسم البياني (تحسين الأداء)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const interval = Math.max(1, Math.floor(daysDiff / 10)); // عرض 10 نقاط كحد أقصى

    // جلب جميع السجلات ذات الصلة مرة واحدة بدلاً من الاستعلام لكل يوم
    const [articlesForChart, episodesForChart, usersForChart] = await Promise.all([
      prisma.article.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      }),
      prisma.episode.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      }),
    ]);

    // معالجة البيانات في الذاكرة (أسرع من استعلامات قاعدة البيانات المتعددة)
    const chartData = [];
    for (let i = 0; i < daysDiff; i += interval) {
      const dayStart = new Date(start);
      dayStart.setDate(dayStart.getDate() + i);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + interval - 1);
      dayEnd.setHours(23, 59, 59, 999); // ضمان شمل اليوم بالكامل

      const countInRange = (items: { createdAt: Date }[]) => 
        items.filter(item => item.createdAt >= dayStart && item.createdAt <= dayEnd).length;

      chartData.push({
        name: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        nameEn: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        articles: countInRange(articlesForChart),
        episodes: countInRange(episodesForChart),
        users: countInRange(usersForChart)
      });
    }

    // 3. بيانات أنواع المحتوى
    const contentTypeData = [
      { name: 'المقالات', nameEn: 'Articles', value: totalArticles, color: '#3b82f6' },
      { name: 'الحلقات', nameEn: 'Episodes', value: totalEpisodes, color: '#10b981' },
      { name: 'المواسم', nameEn: 'Seasons', value: totalSeasons, color: '#f59e0b' },
      { name: 'قوائم التشغيل', nameEn: 'Playlists', value: totalPlaylists, color: '#ef4444' }
    ];

    // 4. النشاط الأخير
    const [
      recentArticles, recentEpisodes, recentSeasons, recentPlaylists,
      recentTeam, recentFaqs, recentTerms, recentPrivacy, recentUsers
    ] = await Promise.all([
      prisma.article.findMany({ orderBy: { createdAt: 'desc' }, take: 2 }),
      prisma.episode.findMany({ orderBy: { createdAt: 'desc' }, take: 2 }),
      prisma.season.findMany({ orderBy: { createdAt: 'desc' }, take: 1 }),
      prisma.playlist.findMany({ orderBy: { createdAt: 'desc' }, take: 1 }),
      prisma.team.findMany({ orderBy: { createdAt: 'desc' }, take: 1 }),
      prisma.fAQ.findMany({ orderBy: { createdAt: 'desc' }, take: 1 }), // model FAQ in schema
      prisma.terms.findMany({ orderBy: { updatedAt: 'desc' }, take: 1 }), // using updatedAt for terms
      prisma.privacy.findMany({ orderBy: { updatedAt: 'desc' }, take: 1 }), // using updatedAt for privacy
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 1 }),
    ]);

    // دمج وتنسيق النشاط الأخير
    // تم تحديث النوع ليكون أكثر تحديداً بدلاً من any
    const formatActivity = (items: ActivityItem[], type: string, titleField: string, titleEnField: string, timeField: string = 'createdAt') => {
      return items.map(item => ({
        id: item.id,
        type,
        title: String(item[titleField] || 'N/A'),
        titleEn: String(item[titleEnField] || item[titleField] || 'N/A'),
        timestamp: item[timeField]
      }));
    };

    const recentActivity = [
      ...formatActivity(recentArticles, 'article', 'title', 'titleEn'),
      ...formatActivity(recentEpisodes, 'episode', 'title', 'titleEn'),
      ...formatActivity(recentSeasons, 'season', 'title', 'titleEn'),
      ...formatActivity(recentPlaylists, 'playlist', 'title', 'titleEn'),
      ...formatActivity(recentTeam, 'team', 'name', 'nameEn'),
      ...formatActivity(recentFaqs, 'faq', 'question', 'questionEn'),
      ...formatActivity(recentTerms, 'terms', 'title', 'titleEn', 'updatedAt'),
      ...formatActivity(recentPrivacy, 'privacy', 'title', 'titleEn', 'updatedAt'),
      ...formatActivity(recentUsers, 'user', 'name', 'name'), // Users might not have nameEn, fallback to name/email
    ]
    .sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime())
    .slice(0, 10);

    return NextResponse.json({
      stats: {
        articles: articlesCount,
        episodes: episodesCount,
        seasons: seasonsCount,
        users: usersCount,
        articlesChange,
        episodesChange,
        seasonsChange,
        usersChange,
        articlesChangeType: articlesChange >= 0 ? 'increase' : 'decrease',
        episodesChangeType: episodesChange >= 0 ? 'increase' : 'decrease',
        seasonsChangeType: seasonsChange >= 0 ? 'increase' : 'decrease',
        usersChangeType: usersChange >= 0 ? 'increase' : 'decrease'
      },
      chartData,
      contentTypeData,
      recentActivity
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}