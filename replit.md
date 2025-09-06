# Mindful Space - Mental Health Support Platform

## Overview

Mindful Space is a comprehensive mental health support platform that provides users with a safe space to share experiences, connect with mental health professionals, track their well-being, and interact with an AI assistant. The application combines community features with professional support tools to create a holistic mental health ecosystem.

The platform enables users to create posts (anonymously or publicly), engage with content through voting and commenting, search and connect with doctors, view analytics about their mental health journey, and chat with an AI-powered mental health assistant.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React with TypeScript, utilizing a modern component-based architecture. The UI is built with shadcn/ui components providing a consistent design system with Material Design icons for visual elements. The application uses Wouter for client-side routing and TanStack Query for state management and API interactions.

Key architectural decisions:
- **Component Structure**: Organized into pages, components/ui, and layout directories for clear separation of concerns
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting both light themes with a focus on accessibility
- **State Management**: TanStack Query handles server state, while local component state manages UI interactions
- **Authentication Flow**: Seamless integration with Replit's OIDC authentication system

### Backend Architecture
The server follows a RESTful API design using Express.js with TypeScript. The architecture emphasizes type safety and clear separation between routes, storage, and external service integrations.

Core architectural components:
- **API Layer**: Express routes handling authentication, posts, comments, tags, doctors, chat, and analytics
- **Database Layer**: Drizzle ORM with PostgreSQL providing type-safe database operations
- **Authentication**: Replit Auth integration with session management using PostgreSQL session store
- **Real-time Features**: WebSocket support for chat functionality
- **Content Moderation**: OpenAI integration for content safety and AI chat responses

### Data Storage Design
The database schema is designed to support the mental health platform's core features while maintaining data privacy and security:

- **Users Table**: Stores user profiles with email, names, and profile images
- **Posts System**: Posts with tags, comments, voting, and anonymous posting capabilities
- **Doctor Network**: Doctor profiles with specializations and connection requests
- **Chat System**: AI chat messages with conversation history
- **Session Management**: Secure session storage for authentication persistence

### Authentication and Authorization
The application uses Replit's OIDC authentication system providing:
- **Single Sign-On**: Seamless authentication through Replit accounts
- **Session Management**: Secure session storage with PostgreSQL backend
- **Authorization Middleware**: Route-level protection ensuring authenticated access
- **User Context**: Consistent user state management across the application

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database for production deployment
- **Drizzle ORM**: Type-safe database operations with schema migrations
- **Session Storage**: PostgreSQL-based session management for authentication persistence

### AI and Content Services
- **OpenAI GPT-5**: Powers the mental health AI assistant with empathetic, professional responses
- **Content Moderation**: OpenAI moderation API ensures safe community interactions
- **Real-time Chat**: WebSocket implementation for instant AI responses

### Authentication Services
- **Replit Auth**: OIDC-based authentication system providing secure user management
- **Express Session**: Session middleware with PostgreSQL store for persistence

### Frontend Libraries
- **React Ecosystem**: Core framework with TypeScript for type safety
- **TanStack Query**: Server state management and API interaction handling
- **Wouter**: Lightweight client-side routing solution
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom theming

### Development Tools
- **Vite**: Fast build tool with HMR for development
- **TypeScript**: Static typing across the entire codebase
- **ESBuild**: Fast bundling for production builds
- **Material Symbols**: Icon system for consistent visual design