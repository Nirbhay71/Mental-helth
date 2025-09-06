import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  serial,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  votes: integer("votes").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  color: varchar("color", { length: 20 }).default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post tags junction table
export const postTags = pgTable("post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
});

// Comments table
export const comments: any = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  parentId: integer("parent_id").references((): any => comments.id),
  votes: integer("votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctors table
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  specialization: varchar("specialization", { length: 255 }).notNull(),
  experience: integer("experience").notNull(),
  rating: integer("rating").default(0), // Store as integer (45 = 4.5 rating)
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  isAvailable: boolean("is_available").default(true),
  nextAvailable: timestamp("next_available"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Doctor connection requests
export const doctorConnections = pgTable("doctor_connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, declined
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages (for AI chatbot)
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isFromUser: boolean("is_from_user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post votes
export const postVotes = pgTable("post_votes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  voteType: varchar("vote_type", { length: 10 }).notNull(), // 'up' or 'down'
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  chatMessages: many(chatMessages),
  postVotes: many(postVotes),
  doctorConnections: many(doctorConnections),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  postTags: many(postTags),
  votes: many(postVotes),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
}));

export const doctorsRelations = relations(doctors, ({ many }) => ({
  connections: many(doctorConnections),
}));

export const doctorConnectionsRelations = relations(doctorConnections, ({ one }) => ({
  user: one(users, {
    fields: [doctorConnections.userId],
    references: [users.id],
  }),
  doctor: one(doctors, {
    fields: [doctorConnections.doctorId],
    references: [doctors.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const postVotesRelations = relations(postVotes, ({ one }) => ({
  user: one(users, {
    fields: [postVotes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [postVotes.postId],
    references: [posts.id],
  }),
}));

// Insert schemas
export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  votes: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  votes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export const insertDoctorConnectionSchema = createInsertSchema(doctorConnections).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertPostVoteSchema = createInsertSchema(postVotes).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = typeof doctors.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type ConnectionRequest = typeof connectionRequests.$inferSelect;
export type PostVote = typeof postVotes.$inferSelect;
export type PostTag = typeof postTags.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Doctor = typeof doctors.$inferSelect;
export type DoctorConnection = typeof doctorConnections.$inferSelect;
export type InsertDoctorConnection = z.infer<typeof insertDoctorConnectionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type PostVote = typeof postVotes.$inferSelect;
export type InsertPostVote = z.infer<typeof insertPostVoteSchema>;
