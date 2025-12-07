// File: app/api/team/slug/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Team from '@/models/Team';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Ensure database connection
    await connectDB();
    
    // Await params since it's a Promise in Next.js 15
    const { slug } = await params;
    
    console.log("Fetching team member with slug:", slug);
    
    // Validate slug
    if (!slug || typeof slug !== 'string') {
      console.error("Invalid slug provided:", slug);
      return NextResponse.json(
        { error: 'Invalid slug parameter' },
        { status: 400 }
      );
    }
    
    // Find team member by slug
    const teamMember = await Team.findOne({ slug });
    
    if (!teamMember) {
      console.log("Team member not found for slug:", slug);
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }
    
    console.log("Team member found:", teamMember.name);
    
    // Return the team member data directly
    return NextResponse.json(teamMember, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Error fetching team member:', error);
    
    // Return a more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch team member',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}