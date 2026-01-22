# Payload CMS - Vraja Marii Newsletter & Blog Platform

## Project Overview
A custom blog and newsletter management system for Vraja Marii by the Sea bio-hacking center. This CMS handles content creation, blog post management, newsletter sending, and anonymous engagement tracking (likes).

## Project Context
This is a **separate standalone project** from the main Vraja Marii by the Sea website. The Vraja Marii frontend (hosted on Vercel) will fetch blog content from this Payload CMS via API.

**Related Projects:**
- Vraja Marii by the Sea (frontend) - Next.js on Vercel (personal GitHub)

**Repository Management:**
- **Work GitHub Account**: Owns this Payload CMS repository
- **Personal GitHub Account**: Added as collaborator (allows commit/push from personal local setup)
- **Branch Strategy:**
  - `main` - Production (auto-deploys to Vercel)
  - `dev` - Development branch
  - Feature branches as needed

---

## Architecture & Infrastructure

### Deployment Strategy

**Vercel (Work GitHub Account):**
- Payload CMS (Next.js application)
- Production URL: https://vm-blog-newsletter.vercel.app

**NeonDB (via Vercel Integration):**
- PostgreSQL (blog content, likes, subscribers)
- Serverless PostgreSQL with connection pooling

**Upstash (via Vercel Integration):**
- Redis (rate limiting for anonymous likes)

**Cloudflare:**
- R2 Storage (image uploads, 10GB free tier)

**Resend:**
- Email sending service (3,000 emails/month free tier)
- Handles newsletter distribution

### Domain Structure
```
bythesea.vrajamarii.ro → Main website (Vercel)
vm-blog-newsletter.vercel.app → Payload CMS (Vercel) - to be mapped to custom domain
```

---

## Tech Stack

### Core Framework
- **Next.js 15+** (App Router)
- **TypeScript** (strict mode)
- **Payload CMS 3.x** (headless CMS)

### Database & Cache
- **PostgreSQL** (NeonDB - serverless PostgreSQL)
- **Redis** (Upstash - serverless Redis)

### Storage & Email
- **Cloudflare R2** (S3-compatible image storage)
- **Resend** (email delivery service)
- **React Email** (email template rendering)

---

## Core Features & Requirements

### 1. Blog Post Management
- Block-based content editor (Payload's built-in Lexical)
- Rich text with images, embeds, code blocks
- Draft/Published status
- SEO fields (meta title, description, OG image)
- Content reusable for both web and email

### 2. Newsletter System
- Same HTML template for blog posts and newsletters
- Subscriber management (email collection, opt-in/opt-out)
- Newsletter sending via Resend
- Email templates built with React Email
- Preview functionality before sending

### 3. Anonymous Like System
**Requirements:**
- No authentication/account required
- Simple like counter (not nominal)
- IP-based + cookie tracking to prevent spam
- Rate limiting via Redis

### 4. API Endpoints for Vraja Marii Frontend
```
GET /api/posts - List all published posts (pagination)
GET /api/posts/:slug - Get single post
POST /api/posts/:slug/like - Increment like counter
GET /api/posts/:slug/likes - Get like count
```

---

## Development Standards

### Component Naming
- **dash-case** for all components (e.g., `blog-post-card.tsx`, `like-button.tsx`)

### TypeScript
- Proper interfaces for all data structures
- Strict type checking enabled
- No `any` types unless absolutely necessary

---

## Local Development Setup

### Prerequisites
- Node.js 18+ (preferably via nvm)
- pnpm (package manager)
- Vercel CLI (for pulling environment variables)

### Initial Setup
```bash
# Install dependencies
pnpm install

# Pull environment variables from Vercel (recommended)
vercel env pull .env

# Or manually setup environment variables
cp .env.example .env
# Edit .env with NeonDB and Upstash credentials

# Start development server
pnpm dev
```

### Local URLs
- Admin Panel: http://localhost:3000/admin
- API: http://localhost:3000/api
- GraphQL Playground: http://localhost:3000/api/graphql-playground

---

## Collections

### Posts
- title, slug, subtitle, excerpt
- featuredImage (upload)
- content (rich text)
- author (relationship to Users)
- status (draft/published)
- publishedDate
- likes (number, API-managed)
- seo (group: title, description, ogImage)

### Subscribers
- email (unique)
- name (optional)
- status (active/unsubscribed)
- source (website/import/api)
- subscribedAt
- metadata (json)

### Media
- Built-in Payload upload collection
- Supports image uploads

### Users
- Built-in Payload auth collection
- email, password

---

## Budget Considerations

### Free Tier Limits
- **Vercel**: Hobby plan (free)
- **NeonDB**: 0.5 GB storage, 191 compute hours/month (free tier)
- **Upstash**: 10,000 commands/day (free tier)
- **Cloudflare R2**: 10GB storage, unlimited egress
- **Resend**: 3,000 emails/month, 100/day

---

**Last Updated:** January 2026
**Project Status:** Initial setup phase
