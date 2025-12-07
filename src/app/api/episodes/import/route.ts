// app/api/episodes/import/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Episode from '@/models/Episode';
import Season from '@/models/Season';
import Article from '@/models/Article';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { episodes } = await request.json();
    
    if (!episodes || !Array.isArray(episodes) || episodes.length === 0) {
      return NextResponse.json(
        { error: 'No episodes provided' },
        { status: 400 }
      );
    }
    
    let imported = 0;
    const errors = [];
    
    for (const episodeData of episodes) {
      try {
        // Skip if no title or slug
        if (!episodeData.title || !episodeData.slug) {
          errors.push(`Skipping episode with missing title or slug`);
          continue;
        }
        
        // Extract season and article IDs if they are objects
        let seasonId = episodeData.season;
        let articleIds = episodeData.articles;
        
        // Handle case where season is an object with _id
        if (episodeData.season && typeof episodeData.season === 'object' && episodeData.season._id) {
          seasonId = episodeData.season._id;
          
          // Check if season exists, if not create it
          const existingSeason = await Season.findById(seasonId);
          if (!existingSeason) {
            const newSeason = new Season({
              _id: seasonId,
              title: episodeData.season.title,
              titleEn: episodeData.season.titleEn || episodeData.season.title,
              slug: episodeData.season.slug,
              thumbnailUrl: episodeData.season.thumbnailUrl,
              thumbnailUrlEn: episodeData.season.thumbnailUrlEn || episodeData.season.thumbnailUrl
            });
            await newSeason.save();
          }
        }
        
        // Handle case where articles is an array of objects
        if (episodeData.articles && Array.isArray(episodeData.articles)) {
          articleIds = [];
          
          for (const article of episodeData.articles) {
            let articleId;
            
            if (typeof article === 'object' && article._id) {
              articleId = article._id;
              
              // Check if article exists, if not create it
              const existingArticle = await Article.findById(articleId);
              if (!existingArticle) {
                const newArticle = new Article({
                  _id: articleId,
                  title: article.title,
                  titleEn: article.titleEn || article.title,
                  slug: article.slug,
                  featuredImageUrl: article.featuredImageUrl,
                  featuredImageUrlEn: article.featuredImageUrlEn || article.featuredImageUrl
                });
                await newArticle.save();
              }
            } else {
              articleId = article;
            }
            
            articleIds.push(articleId);
          }
        }
        
        // Check if episode with this slug already exists
        const existingEpisode = await Episode.findOne({ slug: episodeData.slug });
        
        const episodeUpdateData = {
          title: episodeData.title,
          titleEn: episodeData.titleEn || episodeData['Title (EN)'] || episodeData.title,
          slug: episodeData.slug,
          description: episodeData.description || episodeData.Description,
          descriptionEn: episodeData.descriptionEn || episodeData['Description (EN)'] || episodeData.description,
          videoUrl: episodeData.videoUrl || episodeData['Video URL'],
          videoUrlEn: episodeData.videoUrlEn || episodeData['Video URL (EN)'] || episodeData.videoUrl,
          thumbnailUrl: episodeData.thumbnailUrl || episodeData['Thumbnail URL'],
          thumbnailUrlEn: episodeData.thumbnailUrlEn || episodeData['Thumbnail URL (EN)'] || episodeData.thumbnailUrl,
          content: episodeData.content,
          contentEn: episodeData.contentEn,
          season: seasonId,
          articles: articleIds,
          publishedAt: episodeData.publishedAt || episodeData['Published At'] ? new Date(episodeData.publishedAt || episodeData['Published At']) : undefined,
          updatedAt: new Date()
        };
        
        if (existingEpisode) {
          // Update existing episode
          await Episode.updateOne(
            { slug: episodeData.slug },
            { $set: episodeUpdateData }
          );
          imported++;
        } else {
          // Create new episode
          const newEpisode = new Episode({
            ...episodeUpdateData,
            createdAt: episodeData.createdAt || episodeData['Created At'] ? new Date(episodeData.createdAt || episodeData['Created At']) : new Date()
          });
          
          await newEpisode.save();
          imported++;
        }
      } catch (error) {
        console.error('Error importing episode:', error);
        errors.push(`Error importing episode: ${episodeData.title || episodeData.slug || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ 
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Failed to import episodes' },
      { status: 500 }
    );
  }
}