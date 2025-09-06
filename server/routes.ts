import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateAIResponse, moderateContent } from "./openai";
import { insertPostSchema, insertCommentSchema, insertDoctorConnectionSchema, insertChatMessageSchema, insertPostVoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Posts routes
  app.get('/api/posts', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const posts = await storage.getPosts(limit, offset);
      
      // Get tags for each post
      const postsWithTags = await Promise.all(
        posts.map(async (post) => {
          const tags = await storage.getPostTags(post.id);
          return { ...post, tags };
        })
      );
      
      res.json(postsWithTags);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const posts = await storage.getPostsByUser(userId);
      
      const postsWithTags = await Promise.all(
        posts.map(async (post) => {
          const tags = await storage.getPostTags(post.id);
          return { ...post, tags };
        })
      );
      
      res.json(postsWithTags);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: userId,
      });

      // Moderate content
      const moderation = await moderateContent(`${postData.title} ${postData.content}`);
      if (moderation.flagged) {
        return res.status(400).json({ message: "Content violates community guidelines" });
      }

      const post = await storage.createPost({
        ...postData,
        excerpt: postData.content.substring(0, 200) + (postData.content.length > 200 ? '...' : ''),
      });

      // Handle tags
      if (req.body.tags && Array.isArray(req.body.tags)) {
        for (const tagName of req.body.tags) {
          const tag = await storage.getOrCreateTag(tagName.trim());
          await storage.addTagToPost(post.id, tag.id);
        }
      }

      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      
      const post = await storage.getPost(postId);
      if (!post || post.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }

      await storage.deletePost(postId);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.get('/api/posts/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const posts = await storage.searchPosts(query);
      res.json(posts);
    } catch (error) {
      console.error("Error searching posts:", error);
      res.status(500).json({ message: "Failed to search posts" });
    }
  });

  // Post voting routes
  app.post('/api/posts/:id/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const { voteType } = insertPostVoteSchema.parse(req.body) as { voteType: 'up' | 'down' };

      await storage.votePost(userId, postId, voteType);
      res.json({ message: "Vote recorded successfully" });
    } catch (error) {
      console.error("Error voting on post:", error);
      res.status(500).json({ message: "Failed to record vote" });
    }
  });

  // Comments routes
  app.get('/api/posts/:id/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getCommentsByPost(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const commentData = insertCommentSchema.parse({
        ...req.body,
        authorId: userId,
        postId,
      });

      const moderation = await moderateContent(commentData.content as string);
      if (moderation.flagged) {
        return res.status(400).json({ message: "Comment violates community guidelines" });
      }

      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Tags routes
  app.get('/api/tags', async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Doctors routes
  app.get('/api/doctors', async (req, res) => {
    try {
      const specialization = req.query.specialization as string;
      const doctors = await storage.getDoctors(specialization);
      res.json(doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  app.get('/api/doctors/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const doctors = await storage.searchDoctors(query);
      res.json(doctors);
    } catch (error) {
      console.error("Error searching doctors:", error);
      res.status(500).json({ message: "Failed to search doctors" });
    }
  });

  app.post('/api/doctors/:id/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const doctorId = parseInt(req.params.id);
      const connectionData = insertDoctorConnectionSchema.parse({
        ...req.body,
        userId,
        doctorId,
      });

      const connection = await storage.createDoctorConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating doctor connection:", error);
      res.status(500).json({ message: "Failed to create connection request" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/posts', isAuthenticated, async (req, res) => {
    try {
      const analytics = await storage.getPostAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching post analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/analytics/tags', isAuthenticated, async (req, res) => {
    try {
      const analytics = await storage.getTagAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching tag analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/analytics/users', isAuthenticated, async (req, res) => {
    try {
      const analytics = await storage.getUserAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Chat messages routes
  app.get('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getChatMessages(userId, limit);
      res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Save user message
      const userMessage = await storage.createChatMessage({
        userId,
        content,
        isFromUser: true,
      });

      // Generate AI response
      const aiResponse = await generateAIResponse(content);

      // Save AI response
      const aiMessage = await storage.createChatMessage({
        userId,
        content: aiResponse,
        isFromUser: false,
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat' && message.content && message.userId) {
          // Broadcast to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'chat_response',
                content: message.content,
                userId: message.userId,
                timestamp: new Date().toISOString(),
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
