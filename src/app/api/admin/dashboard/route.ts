import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();
    
    const db = await getDatabase();
    
    // تحويل التواريخ إلى كائنات Date
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // جلب البيانات من المجموعات المختلفة
    const articlesCount = await db.collection('articles').countDocuments({
      createdAt: { $gte: start, $lte: end }
    });
    
    const episodesCount = await db.collection('episodes').countDocuments({
      createdAt: { $gte: start, $lte: end }
    });
    
    const seasonsCount = await db.collection('seasons').countDocuments({
      createdAt: { $gte: start, $lte: end }
    });
    
    const usersCount = await db.collection('users').countDocuments({
      createdAt: { $gte: start, $lte: end }
    });
    
    // حساب التغييرات مقارنة بالفترة السابقة
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - (end.getDate() - start.getDate()));
    
    const previousArticlesCount = await db.collection('articles').countDocuments({
      createdAt: { $gte: previousStart, $lte: start }
    });
    
    const previousEpisodesCount = await db.collection('episodes').countDocuments({
      createdAt: { $gte: previousStart, $lte: start }
    });
    
    const previousSeasonsCount = await db.collection('seasons').countDocuments({
      createdAt: { $gte: previousStart, $lte: start }
    });
    
    const previousUsersCount = await db.collection('users').countDocuments({
      createdAt: { $gte: previousStart, $lte: start }
    });
    
    // حساب نسبة التغيير
    const articlesChange = previousArticlesCount > 0 
      ? Math.round(((articlesCount - previousArticlesCount) / previousArticlesCount) * 100)
      : 0;
    
    const episodesChange = previousEpisodesCount > 0 
      ? Math.round(((episodesCount - previousEpisodesCount) / previousEpisodesCount) * 100)
      : 0;
    
    const seasonsChange = previousSeasonsCount > 0 
      ? Math.round(((seasonsCount - previousSeasonsCount) / previousSeasonsCount) * 100)
      : 0;
    
    const usersChange = previousUsersCount > 0 
      ? Math.round(((usersCount - previousUsersCount) / previousUsersCount) * 100)
      : 0;
    
    // جلب بيانات الرسوم البيانية (آخر 30 يوم)
    const chartData = [];
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const interval = Math.max(1, Math.floor(daysDiff / 10)); // عرض 10 نقاط كحد أقصى
    
    for (let i = 0; i < daysDiff; i += interval) {
      const dayStart = new Date(start);
      dayStart.setDate(dayStart.getDate() + i);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + interval - 1);
      
      const dayArticles = await db.collection('articles').countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });
      
      const dayEpisodes = await db.collection('episodes').countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });
      
      const dayUsers = await db.collection('users').countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });
      
      chartData.push({
        name: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        nameEn: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        articles: dayArticles,
        episodes: dayEpisodes,
        users: dayUsers
      });
    }
    
    // بيانات أنواع المحتوى
    const contentTypeData = [
      {
        name: 'المقالات',
        nameEn: 'Articles',
        value: await db.collection('articles').countDocuments(),
        color: '#3b82f6'
      },
      {
        name: 'الحلقات',
        nameEn: 'Episodes',
        value: await db.collection('episodes').countDocuments(),
        color: '#10b981'
      },
      {
        name: 'المواسم',
        nameEn: 'Seasons',
        value: await db.collection('seasons').countDocuments(),
        color: '#f59e0b'
      },
      {
        name: 'قوائم التشغيل',
        nameEn: 'Playlists',
        value: await db.collection('playlists').countDocuments(),
        color: '#ef4444'
      }
    ];
    
    // النشاط الأخير من جميع المجموعات
    const recentArticles = await db.collection('articles')
      .find({})
      .sort({ createdAt: -1 })
      .limit(2)
      .toArray();
    
    const recentEpisodes = await db.collection('episodes')
      .find({})
      .sort({ createdAt: -1 })
      .limit(2)
      .toArray();
    
    const recentSeasons = await db.collection('seasons')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    const recentPlaylists = await db.collection('playlists')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    const recentTeam = await db.collection('teams')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    const recentFaqs = await db.collection('faqs')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    const recentTerms = await db.collection('termsContent')
      .find({})
      .sort({ updatedAt: -1 })
      .limit(1)
      .toArray();
    
    const recentPrivacy = await db.collection('privacyContent')
      .find({})
      .sort({ updatedAt: -1 })
      .limit(1)
      .toArray();
    
    const recentUsers = await db.collection('users')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    const recentActivity = [
      ...recentArticles.map(article => ({
        id: article._id.toString(),
        type: 'article' as const,
        title: article.title,
        titleEn: article.titleEn || article.title,
        timestamp: article.createdAt
      })),
      ...recentEpisodes.map(episode => ({
        id: episode._id.toString(),
        type: 'episode' as const,
        title: episode.title,
        titleEn: episode.titleEn || episode.title,
        timestamp: episode.createdAt
      })),
      ...recentSeasons.map(season => ({
        id: season._id.toString(),
        type: 'season' as const,
        title: season.title,
        titleEn: season.titleEn || season.title,
        timestamp: season.createdAt
      })),
      ...recentPlaylists.map(playlist => ({
        id: playlist._id.toString(),
        type: 'playlist' as const,
        title: playlist.title,
        titleEn: playlist.titleEn || playlist.title,
        timestamp: playlist.createdAt
      })),
      ...recentTeam.map(member => ({
        id: member._id.toString(),
        type: 'team' as const,
        title: member.name,
        titleEn: member.nameEn || member.name,
        timestamp: member.createdAt
      })),
      ...recentFaqs.map(faq => ({
        id: faq._id.toString(),
        type: 'faq' as const,
        title: faq.question,
        titleEn: faq.questionEn || faq.question,
        timestamp: faq.createdAt
      })),
      ...recentTerms.map(term => ({
        id: term._id.toString(),
        type: 'terms' as const,
        title: term.title || 'Terms Update',
        titleEn: term.titleEn || term.title || 'Terms Update',
        timestamp: term.updatedAt || term.createdAt
      })),
      ...recentPrivacy.map(privacy => ({
        id: privacy._id.toString(),
        type: 'privacy' as const,
        title: privacy.title || 'Privacy Update',
        titleEn: privacy.titleEn || privacy.title || 'Privacy Update',
        timestamp: privacy.updatedAt || privacy.createdAt
      })),
      ...recentUsers.map(user => ({
        id: user._id.toString(),
        type: 'user' as const,
        title: user.name || user.email,
        titleEn: user.nameEn || user.name || user.email,
        timestamp: user.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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