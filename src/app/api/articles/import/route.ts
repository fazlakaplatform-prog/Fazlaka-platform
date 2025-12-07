import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Article from '@/models/Article';
import Season from '@/models/Season';
import Episode from '@/models/Episode';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { articles } = await request.json();
    
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { error: 'No articles provided' },
        { status: 400 }
      );
    }
    
    let imported = 0;
    const errors = [];
    
    for (const articleData of articles) {
      try {
        // Skip if no title or slug
        if (!articleData.title || !articleData.slug) {
          errors.push(`Skipping article with missing title or slug`);
          continue;
        }
        
        // Extract season and episode IDs if they are objects
        let seasonId = articleData.season;
        let episodeId = articleData.episode;
        
        // Handle case where season is an object with _id
        if (articleData.season && typeof articleData.season === 'object' && articleData.season._id) {
          seasonId = articleData.season._id;
          
          // Check if season exists, if not create it
          const existingSeason = await Season.findById(seasonId);
          if (!existingSeason) {
            const newSeason = new Season({
              _id: seasonId,
              title: articleData.season.title,
              titleEn: articleData.season.titleEn || articleData.season.title,
              slug: articleData.season.slug,
              thumbnailUrl: articleData.season.thumbnailUrl,
              thumbnailUrlEn: articleData.season.thumbnailUrlEn || articleData.season.thumbnailUrl
            });
            await newSeason.save();
          }
        }
        
        // Handle case where episode is an object with _id
        if (articleData.episode && typeof articleData.episode === 'object' && articleData.episode._id) {
          episodeId = articleData.episode._id;
          
          // Check if episode exists, if not create it
          const existingEpisode = await Episode.findById(episodeId);
          if (!existingEpisode) {
            const newEpisode = new Episode({
              _id: episodeId,
              title: articleData.episode.title,
              titleEn: articleData.episode.titleEn || articleData.episode.title,
              slug: articleData.episode.slug,
              season: seasonId, // Link to season
              thumbnailUrl: articleData.episode.thumbnailUrl,
              thumbnailUrlEn: articleData.episode.thumbnailUrlEn || articleData.episode.thumbnailUrl
            });
            await newEpisode.save();
          }
        }
        
        // Check if article with this slug already exists
        const existingArticle = await Article.findOne({ slug: articleData.slug });
        
        const articleUpdateData = {
          title: articleData.title,
          titleEn: articleData.titleEn || articleData['Title (EN)'] || articleData.title,
          slug: articleData.slug,
          excerpt: articleData.excerpt || articleData.Excerpt,
          excerptEn: articleData.excerptEn || articleData['Excerpt (EN)'] || articleData.excerpt,
          featuredImageUrl: articleData.featuredImageUrl || articleData['Featured Image URL'],
          featuredImageUrlEn: articleData.featuredImageUrlEn || articleData['Featured Image URL (EN)'] || articleData.featuredImageUrl,
          content: articleData.content,
          contentEn: articleData.contentEn,
          season: seasonId,
          episode: episodeId,
          publishedAt: articleData.publishedAt || articleData['Published At'] ? new Date(articleData.publishedAt || articleData['Published At']) : undefined,
          updatedAt: new Date()
        };
        
        if (existingArticle) {
          // Update existing article
          await Article.updateOne(
            { slug: articleData.slug },
            { $set: articleUpdateData }
          );
          imported++;
        } else {
          // Create new article
          const newArticle = new Article({
            ...articleUpdateData,
            createdAt: articleData.createdAt || articleData['Created At'] ? new Date(articleData.createdAt || articleData['Created At']) : new Date()
          });
          
          await newArticle.save();
          imported++;
        }
      } catch (error) {
        console.error('Error importing article:', error);
        errors.push(`Error importing article: ${articleData.title || articleData.slug || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ 
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Failed to import articles' },
      { status: 500 }
    );
  }
}