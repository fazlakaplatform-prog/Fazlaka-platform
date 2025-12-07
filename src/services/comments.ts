import { connectDB } from '@/lib/mongodb';
import Comment, { IComment } from '@/models/Comment';

// Define an extended type that includes replies
export interface CommentWithReplies extends IComment {
  replies?: CommentWithReplies[];
}

// تعريف واجهة للاستعلام
interface CommentQuery {
  article?: string;
  episode?: string;
}

export async function fetchComments(
  articleId?: string,
  episodeId?: string
): Promise<CommentWithReplies[]> {
  try {
    await connectDB();
    
    const query: CommentQuery = {};
    if (articleId) {
      query.article = articleId;
    } else if (episodeId) {
      query.episode = episodeId;
    } else {
      return [];
    }
    
    // Fetch top-level comments (no parent)
    const topLevelComments = await Comment.find({ ...query, parentComment: { $exists: false } })
      .sort({ createdAt: -1 });
    
    // Fetch all replies
    const replies = await Comment.find({ ...query, parentComment: { $exists: true } })
      .sort({ createdAt: 1 });
    
    // Build comment tree
    const commentsWithReplies = topLevelComments.map(comment => {
      const commentObj = comment.toObject();
      const commentReplies = replies.filter(reply => 
        reply.parentComment && reply.parentComment.toString() === comment._id.toString()
      );
      
      return {
        ...commentObj,
        _id: comment._id.toString(),
        replies: commentReplies.map(reply => ({
          ...reply.toObject(),
          _id: reply._id.toString(),
        }))
      };
    });
    
    return commentsWithReplies;
  } catch (error) {
    console.error('Error fetching comments from MongoDB:', error);
    return [];
  }
}

export async function createComment(commentData: Partial<IComment>): Promise<IComment | null> {
  try {
    await connectDB();
    
    const newComment = new Comment(commentData);
    await newComment.save();
    
    // Populate related data for the response
    await newComment.populate('parentComment');
    
    return newComment;
  } catch (error) {
    console.error('Error creating comment in MongoDB:', error);
    return null;
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    await connectDB();
    
    // First, delete all replies to this comment
    await Comment.deleteMany({ parentComment: commentId });
    
    // Then delete the comment itself
    const result = await Comment.findByIdAndDelete(commentId);
    
    return !!result;
  } catch (error) {
    console.error('Error deleting comment from MongoDB:', error);
    return false;
  }
}