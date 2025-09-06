import {
  users,
  posts,
  comments,
  tags,
  postTags,
  doctors,
  doctorConnections,
  chatMessages,
  postVotes,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Tag,
  type InsertTag,
  type Doctor,
  type DoctorConnection,
  type InsertDoctorConnection,
  type ChatMessage,
  type InsertChatMessage,
  type PostVote,
  type InsertPostVote,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ilike, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Post operations
  getPosts(limit?: number, offset?: number): Promise<Post[]>;
  getPostsByUser(userId: string): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  searchPosts(query: string): Promise<Post[]>;
  
  // Comment operations
  getCommentsByPost(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Tag operations
  getTags(): Promise<Tag[]>;
  getOrCreateTag(name: string): Promise<Tag>;
  getPostTags(postId: number): Promise<Tag[]>;
  addTagToPost(postId: number, tagId: number): Promise<void>;
  
  // Doctor operations
  getDoctors(specialization?: string): Promise<Doctor[]>;
  getDoctor(id: number): Promise<Doctor | undefined>;
  searchDoctors(query: string): Promise<Doctor[]>;
  
  // Doctor connection operations
  createDoctorConnection(connection: InsertDoctorConnection): Promise<DoctorConnection>;
  getDoctorConnections(userId: string): Promise<DoctorConnection[]>;
  
  // Chat operations
  getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Vote operations
  votePost(userId: string, postId: number, voteType: 'up' | 'down'): Promise<void>;
  getUserPostVote(userId: string, postId: number): Promise<PostVote | undefined>;
  
  // Analytics operations
  getPostAnalytics(): Promise<any>;
  getTagAnalytics(): Promise<any>;
  getUserAnalytics(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Post operations
  async getPosts(limit = 50, offset = 0): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPostsByUser(userId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: number, post: Partial<InsertPost>): Promise<Post> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async searchPosts(query: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(
        or(
          ilike(posts.title, `%${query}%`),
          ilike(posts.content, `%${query}%`)
        )
      )
      .orderBy(desc(posts.createdAt));
  }

  // Comment operations
  async getCommentsByPost(postId: number): Promise<Comment[]> {
    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
    return result as Comment[];
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    
    // Update comment count on post
    await db
      .update(posts)
      .set({ commentCount: sql`comment_count + 1` })
      .where(eq(posts.id, newComment.postId));
    
    return newComment;
  }

  // Tag operations
  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(tags.name);
  }

  async getOrCreateTag(name: string): Promise<Tag> {
    let [tag] = await db.select().from(tags).where(eq(tags.name, name));
    
    if (!tag) {
      [tag] = await db.insert(tags).values({ name }).returning();
    }
    
    return tag;
  }

  async getPostTags(postId: number): Promise<Tag[]> {
    return await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        createdAt: tags.createdAt,
      })
      .from(tags)
      .innerJoin(postTags, eq(tags.id, postTags.tagId))
      .where(eq(postTags.postId, postId));
  }

  async addTagToPost(postId: number, tagId: number): Promise<void> {
    await db.insert(postTags).values({ postId, tagId });
  }

  // Doctor operations
  async getDoctors(specialization?: string): Promise<Doctor[]> {
    const query = db.select().from(doctors);
    
    if (specialization) {
      return await query.where(eq(doctors.specialization, specialization));
    }
    
    return await query.orderBy(doctors.name);
  }

  async getDoctor(id: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor;
  }

  async searchDoctors(query: string): Promise<Doctor[]> {
    return await db
      .select()
      .from(doctors)
      .where(
        or(
          ilike(doctors.name, `%${query}%`),
          ilike(doctors.specialization, `%${query}%`)
        )
      )
      .orderBy(doctors.name);
  }

  // Doctor connection operations
  async createDoctorConnection(connection: InsertDoctorConnection): Promise<DoctorConnection> {
    const [newConnection] = await db
      .insert(doctorConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async getDoctorConnections(userId: string): Promise<DoctorConnection[]> {
    return await db
      .select()
      .from(doctorConnections)
      .where(eq(doctorConnections.userId, userId))
      .orderBy(desc(doctorConnections.createdAt));
  }

  // Chat operations
  async getChatMessages(userId: string, limit = 100): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  // Vote operations
  async votePost(userId: string, postId: number, voteType: 'up' | 'down'): Promise<void> {
    // Check if user already voted
    const [existingVote] = await db
      .select()
      .from(postVotes)
      .where(and(eq(postVotes.userId, userId), eq(postVotes.postId, postId)));

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if same type
        await db
          .delete(postVotes)
          .where(and(eq(postVotes.userId, userId), eq(postVotes.postId, postId)));
        
        // Update post vote count
        const increment = voteType === 'up' ? -1 : 1;
        await db
          .update(posts)
          .set({ votes: sql`votes + ${increment}` })
          .where(eq(posts.id, postId));
      } else {
        // Change vote type
        await db
          .update(postVotes)
          .set({ voteType })
          .where(and(eq(postVotes.userId, userId), eq(postVotes.postId, postId)));
        
        // Update post vote count (difference of 2)
        const increment = voteType === 'up' ? 2 : -2;
        await db
          .update(posts)
          .set({ votes: sql`votes + ${increment}` })
          .where(eq(posts.id, postId));
      }
    } else {
      // Create new vote
      await db.insert(postVotes).values({ userId, postId, voteType });
      
      // Update post vote count
      const increment = voteType === 'up' ? 1 : -1;
      await db
        .update(posts)
        .set({ votes: sql`votes + ${increment}` })
        .where(eq(posts.id, postId));
    }
  }

  async getUserPostVote(userId: string, postId: number): Promise<PostVote | undefined> {
    const [vote] = await db
      .select()
      .from(postVotes)
      .where(and(eq(postVotes.userId, userId), eq(postVotes.postId, postId)));
    return vote;
  }

  // Analytics operations
  async getPostAnalytics(): Promise<any> {
    const [totalPosts] = await db.select({ count: count() }).from(posts);
    const [recentPosts] = await db
      .select({ count: count() })
      .from(posts)
      .where(sql`created_at >= NOW() - INTERVAL '7 days'`);
    
    return {
      totalPosts: totalPosts.count,
      recentPosts: recentPosts.count,
      growth: recentPosts.count > 0 ? ((recentPosts.count / totalPosts.count) * 100).toFixed(1) : 0,
    };
  }

  async getTagAnalytics(): Promise<any> {
    return await db
      .select({
        tagName: tags.name,
        tagColor: tags.color,
        count: count(postTags.id),
      })
      .from(tags)
      .leftJoin(postTags, eq(tags.id, postTags.tagId))
      .groupBy(tags.id, tags.name, tags.color)
      .orderBy(desc(count(postTags.id)))
      .limit(10);
  }

  async getUserAnalytics(): Promise<any> {
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [activeUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`updated_at >= NOW() - INTERVAL '7 days'`);
    
    return {
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      growth: activeUsers.count > 0 ? ((activeUsers.count / totalUsers.count) * 100).toFixed(1) : 0,
    };
  }
}

export const storage = new DatabaseStorage();
