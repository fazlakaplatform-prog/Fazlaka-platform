import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  interests?: string[];
  createdAt: Date;
}

export async function fetchUserData(userId: string): Promise<UserData | null> {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return null;
    }
    
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      location: user.location,
      website: user.website,
      interests: user.interests || [],
      createdAt: user.createdAt
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function updateUserInterests(userId: string, interests: string[]): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { interests } }
    );
    
    return result.matchedCount > 0;
  } catch (error) {
    console.error('Error updating user interests:', error);
    return false;
  }
}