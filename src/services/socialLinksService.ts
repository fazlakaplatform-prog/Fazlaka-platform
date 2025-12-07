import { getDatabase } from '@/lib/mongodb';
import { SocialLink } from '@/models/socialLinks';
import { ObjectId, UpdateFilter, PushOperator, Filter, PullOperator } from 'mongodb';

// تعريف واجهة للمستند الذي يحتوي على الروابط الاجتماعية
interface SocialLinkDocument {
  _id: ObjectId;
  _type?: string;
  links?: SocialLinkDB[];
  createdAt?: Date;
  updatedAt?: Date;
}

// تعريف واجهة للرابط الاجتماعي في قاعدة البيانات
interface SocialLinkDB {
  _id: ObjectId;
  platform: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  order?: number;
}

// تعريف واجهة لنتيجة تحديث المستند
interface UpdateResult {
  value?: SocialLinkDocument;
  ok?: number;
}

// جلب جميع الروابط الاجتماعية
export async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    const db = await getDatabase();
    const socialLinksDoc = await db.collection('socialLinks').findOne({}) as SocialLinkDocument;
    
    if (!socialLinksDoc || !socialLinksDoc.links) {
      console.log('No social links document found in MongoDB');
      return [];
    }
    
    // تحويل الروابط إلى الشكل المتوقع
    return socialLinksDoc.links.map(link => {
      const result: SocialLink = {
        _id: link._id, // الاحتفاظ بـ ObjectId
        platform: link.platform,
        url: link.url,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        isActive: link.isActive ?? true, // استخدام قيمة افتراضية إذا لم يتم تحديدها
        order: link.order ?? 0 // استخدام قيمة افتراضية إذا لم يتم تحديدها
      };
      return result;
    });
  } catch (error) {
    console.error('Error fetching social links from MongoDB:', error);
    return [];
  }
}

// إنشاء رابط اجتماعي جديد
export async function createSocialLink(linkData: Omit<SocialLink, '_id' | 'createdAt' | 'updatedAt'>): Promise<SocialLink> {
  try {
    const db = await getDatabase();
    const newLink: SocialLinkDB = {
      ...linkData,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: linkData.isActive ?? true, // استخدام قيمة افتراضية إذا لم يتم تحديدها
      order: linkData.order ?? 0 // استخدام قيمة افتراضية إذا لم يتم تحديدها
    };
    
    // استخدام updateOne مع $push للإضافة إلى مصفوفة الروابط
    await db.collection('socialLinks').updateOne(
      {} as Filter<SocialLinkDocument>, 
      { 
        $push: { links: newLink } as PushOperator<SocialLinkDocument>,
        $setOnInsert: { 
          _type: 'socialLinks',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    return {
      _id: newLink._id, // الاحتفاظ بـ ObjectId
      platform: newLink.platform,
      url: newLink.url,
      createdAt: newLink.createdAt,
      updatedAt: newLink.updatedAt,
      isActive: newLink.isActive ?? true,
      order: newLink.order ?? 0
    };
  } catch (error) {
    console.error('Error creating social link in MongoDB:', error);
    throw error;
  }
}

// تحديث رابط اجتماعي
export async function updateSocialLink(linkId: string, linkData: Partial<SocialLink>): Promise<SocialLink | null> {
  try {
    const db = await getDatabase();
    const updateData = {
      ...linkData,
      updatedAt: new Date()
    };
    
    const result = await db.collection('socialLinks').findOneAndUpdate(
      { "links._id": new ObjectId(linkId) } as Filter<SocialLinkDocument>,
      { 
        $set: { 
          "links.$": updateData,
          updatedAt: new Date()
        } as UpdateFilter<SocialLinkDocument>
      },
      { returnDocument: 'after' }
    ) as UpdateResult;
    
    if (!result.value) {
      return null;
    }
    
    // العثور على الرابط المحدث في المصفوفة
    const updatedDoc = await db.collection('socialLinks').findOne({}) as SocialLinkDocument;
    const updatedLink = updatedDoc?.links?.find(link => link._id?.toString() === linkId);
    
    if (!updatedLink) return null;
    
    return {
      _id: updatedLink._id, // الاحتفاظ بـ ObjectId
      platform: updatedLink.platform,
      url: updatedLink.url,
      createdAt: updatedLink.createdAt,
      updatedAt: updatedLink.updatedAt,
      isActive: updatedLink.isActive ?? true,
      order: updatedLink.order ?? 0
    };
  } catch (error) {
    console.error('Error updating social link in MongoDB:', error);
    throw error;
  }
}

// حذف رابط اجتماعي
export async function deleteSocialLink(linkId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.collection('socialLinks').updateOne(
      {}, 
      { 
        $pull: { links: { _id: new ObjectId(linkId) } } as PullOperator<SocialLinkDocument>,
        $set: { updatedAt: new Date() }
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error deleting social link in MongoDB:', error);
    throw error;
  }
}