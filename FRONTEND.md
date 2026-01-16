# Frontend Integration Guide

Instructions for integrating the Vraja Marii by the Sea frontend with this Payload CMS.

---

## API Base URL

```
Development: http://localhost:3000/api
Production: https://cms.vrajamarii.ro/api
```

Set this in your frontend `.env`:
```bash
NEXT_PUBLIC_CMS_URL=http://localhost:3000
```

---

## Fetching Posts

### List All Published Posts

```typescript
// lib/api.ts
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL

interface Post {
  id: string
  title: string
  slug: string
  subtitle?: string
  excerpt?: string
  featuredImage?: {
    url: string
    alt: string
    width: number
    height: number
  }
  content: any // Lexical rich text content
  author: {
    id: string
    firstName: string
    avatar?: {
      url: string
    }
  }
  status: 'draft' | 'published'
  publishedDate: string
  readTime: number
  likes: number
  seo?: {
    title?: string
    description?: string
    ogImage?: {
      url: string
    }
  }
  createdAt: string
  updatedAt: string
}

interface PostsResponse {
  docs: Post[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

export async function getPosts(options?: {
  limit?: number
  page?: number
  sort?: string
}): Promise<PostsResponse> {
  const { limit = 10, page = 1, sort = '-publishedDate' } = options || {}

  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
    sort,
    'where[status][equals]': 'published',
    depth: '2', // Include related documents (author, images)
  })

  const response = await fetch(`${CMS_URL}/api/posts?${params}`, {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  })

  if (!response.ok) {
    throw new Error('Failed to fetch posts')
  }

  return response.json()
}
```

### Get Single Post by Slug

```typescript
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    'where[status][equals]': 'published',
    depth: '2',
    limit: '1',
  })

  const response = await fetch(`${CMS_URL}/api/posts?${params}`, {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch post')
  }

  const data: PostsResponse = await response.json()
  return data.docs[0] || null
}
```

### Get All Post Slugs (for Static Generation)

```typescript
export async function getAllPostSlugs(): Promise<string[]> {
  const params = new URLSearchParams({
    'where[status][equals]': 'published',
    limit: '1000',
    depth: '0',
  })

  const response = await fetch(`${CMS_URL}/api/posts?${params}`)
  const data: PostsResponse = await response.json()

  return data.docs.map((post) => post.slug)
}
```

---

## Implementing Likes

### Like a Post

```typescript
export async function likePost(slug: string): Promise<{ likes: number }> {
  const response = await fetch(`${CMS_URL}/api/posts/${slug}/like`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to like post')
  }

  return response.json()
}
```

### Get Like Count

```typescript
export async function getLikeCount(slug: string): Promise<number> {
  const post = await getPostBySlug(slug)
  return post?.likes || 0
}
```

### React Like Button Component

```tsx
// components/like-button.tsx
'use client'

import { useState, useEffect } from 'react'
import { likePost } from '@/lib/api'

interface LikeButtonProps {
  slug: string
  initialLikes: number
}

export function LikeButton({ slug, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [hasLiked, setHasLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user already liked (from localStorage)
  useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')
    setHasLiked(likedPosts.includes(slug))
  }, [slug])

  const handleLike = async () => {
    if (hasLiked || isLoading) return

    setIsLoading(true)
    try {
      const result = await likePost(slug)
      setLikes(result.likes)
      setHasLiked(true)

      // Save to localStorage
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')
      localStorage.setItem('likedPosts', JSON.stringify([...likedPosts, slug]))
    } catch (error) {
      console.error('Failed to like post:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={hasLiked || isLoading}
      className={`like-button ${hasLiked ? 'liked' : ''}`}
    >
      ❤️ {likes}
    </button>
  )
}
```

---

## Rendering Rich Text Content

Payload uses Lexical editor. Use the `@payloadcms/richtext-lexical/react` package to render:

```bash
pnpm add @payloadcms/richtext-lexical
```

```tsx
// components/rich-text.tsx
import { RichText } from '@payloadcms/richtext-lexical/react'

interface RichTextRendererProps {
  content: any
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) return null

  return (
    <div className="prose prose-lg">
      <RichText data={content} />
    </div>
  )
}
```

---

## Example Blog Page

```tsx
// app/blog/page.tsx
import { getPosts } from '@/lib/api'
import Image from 'next/image'
import Link from 'next/link'

export default async function BlogPage() {
  const { docs: posts } = await getPosts({ limit: 10 })

  return (
    <main>
      <h1>Blog</h1>
      <div className="posts-grid">
        {posts.map((post) => (
          <article key={post.id} className="post-card">
            {post.featuredImage && (
              <Image
                src={post.featuredImage.url}
                alt={post.featuredImage.alt}
                width={400}
                height={250}
              />
            )}
            <h2>
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>
            {post.subtitle && <p className="subtitle">{post.subtitle}</p>}
            {post.excerpt && <p>{post.excerpt}</p>}
            <div className="meta">
              <span>{post.readTime} min read</span>
              <span>❤️ {post.likes}</span>
              <span>
                By {post.author.firstName}
              </span>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
```

---

## Example Single Post Page

```tsx
// app/blog/[slug]/page.tsx
import { getPostBySlug, getAllPostSlugs } from '@/lib/api'
import { RichTextRenderer } from '@/components/rich-text'
import { LikeButton } from '@/components/like-button'
import Image from 'next/image'
import { notFound } from 'next/navigation'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props) {
  const post = await getPostBySlug(params.slug)
  if (!post) return {}

  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    openGraph: {
      title: post.seo?.title || post.title,
      description: post.seo?.description || post.excerpt,
      images: post.seo?.ogImage?.url || post.featuredImage?.url,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <article>
      <header>
        <h1>{post.title}</h1>
        {post.subtitle && <p className="subtitle">{post.subtitle}</p>}
        <div className="meta">
          <div className="author">
            {post.author.avatar && (
              <Image
                src={post.author.avatar.url}
                alt={post.author.firstName}
                width={40}
                height={40}
                className="avatar"
              />
            )}
            <span>{post.author.firstName}</span>
          </div>
          <time>{new Date(post.publishedDate).toLocaleDateString('ro-RO')}</time>
          <span>{post.readTime} min read</span>
        </div>
      </header>

      {post.featuredImage && (
        <Image
          src={post.featuredImage.url}
          alt={post.featuredImage.alt}
          width={1200}
          height={630}
          className="featured-image"
          priority
        />
      )}

      <div className="content">
        <RichTextRenderer content={post.content} />
      </div>

      <footer>
        <LikeButton slug={post.slug} initialLikes={post.likes} />
      </footer>
    </article>
  )
}
```

---

## Newsletter Subscription

### Subscribe Endpoint

```typescript
export async function subscribe(email: string): Promise<{ success: boolean }> {
  const response = await fetch(`${CMS_URL}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      status: 'active',
      source: 'website',
      subscribedAt: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to subscribe')
  }

  return { success: true }
}
```

### Subscribe Form Component

```tsx
// components/subscribe-form.tsx
'use client'

import { useState } from 'react'
import { subscribe } from '@/lib/api'

export function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      await subscribe(email)
      setStatus('success')
      setMessage('Thanks for subscribing!')
      setEmail('')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </button>
      {message && <p className={status}>{message}</p>}
    </form>
  )
}
```

---

## CORS & Environment

Make sure your frontend domain is allowed in CORS. The CMS is configured to allow:

- `https://vrajamarii.ro`
- `https://www.vrajamarii.ro`
- Value of `NEXT_PUBLIC_FRONTEND_URL` env variable

For local development, set `NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001` in the CMS `.env`.

---

## TODO: Like System API

The like endpoint (`POST /api/posts/:slug/like`) needs to be implemented as a custom endpoint in this CMS. Currently, likes are stored in the posts collection but there's no dedicated API route for incrementing them with rate limiting.

Implementation needed in CMS:
1. Create `/src/app/api/posts/[slug]/like/route.ts`
2. Add Redis rate limiting
3. Hash IP + User Agent for spam prevention

---

**Last Updated:** January 2026
