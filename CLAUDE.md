# CLAUDE.md — Artfolio

## Project Vision

Artfolio is an AI-free artist portfolio and social platform — a hybrid of LinkedIn (professional showcase), Substack (long-form content), and Reddit (interest communities). All uploaded content must pass AI detection: **Sightengine** for images, **Dedalus AI (Claude Opus 4.5)** for text/essays.

The core philosophy: **empower human creators, not replace them.**

---

## Tech Stack

| Layer        | Choice                               | Notes                                     |
| ------------ | ------------------------------------ | ----------------------------------------- |
| Frontend     | Next.js 14 (App Router)              | TypeScript, Tailwind, shadcn/ui           |
| Database     | Supabase (PostgreSQL 15)             | Auth + realtime                           |
| Auth         | Supabase Auth                        | OAuth providers (Google, GitHub, Discord) |
| Storage      | AWS Amplify Storage (S3)             | Images/media via Amplify Gen 2            |
| AI Detection | Sightengine (images), Dedalus/Claude (text) | Pre-upload validation                     |
| Deployment   | AWS Amplify                          | Auto-deploy from Git                      |

---

## Architecture Principles

### 1. Start Simple, Design for Change

- Using Next.js API routes for backend logic (no separate backend yet)
- Use **service layer abstraction** so implementations can be swapped
- Every external dependency gets a wrapper class (AI detectors, storage)

### 2. Vertical Slices Over Horizontal Layers

- Organize by **feature**, not by technical layer
- Each feature folder contains its routes and components
- Shared utilities live in `lib/`

### 3. Database as Source of Truth

- Business logic lives in API routes and client components
- Use Supabase RLS for authorization, validate in API routes too
- Migrations via SQL files in `supabase/migrations/`

### 4. Fail Fast on AI Detection

- Check content **before** storing anything
- Rejected uploads should never touch storage or database
- Store detection scores for audit trail

### 5. Full-Stack Next.js

- API routes handle server-side logic
- Server components for data fetching
- Client components marked with `'use client'`

---

## Project Structure

```
artfolio/
├── CLAUDE.md                    # You are here
├── README.md
│
├── amplify/                     # AWS Amplify Gen 2 backend
│   ├── auth/resource.ts         # Amplify Auth config
│   ├── data/resource.ts         # Amplify Data config
│   ├── storage/resource.ts      # Amplify Storage (S3) config
│   └── backend.ts               # Backend definition
│
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout (with AmplifyProvider)
│   ├── page.tsx                 # Landing page (/)
│   │
│   ├── (auth)/                  # Auth group (no layout)
│   │   └── login/
│   │       └── page.tsx         # Login page with OAuth buttons
│   │
│   ├── api/
│   │   ├── validate-image/
│   │   │   └── route.ts         # POST - Sightengine AI detection for images
│   │   ├── validate-text/
│   │   │   └── route.ts         # POST - Dedalus/Claude AI detection for essays
│   │   └── works/[id]/
│   │       └── route.ts         # DELETE - Work deletion API
│   │
│   ├── auth/
│   │   └── signout/
│   │       └── route.ts         # POST /auth/signout - signs out user
│   │
│   ├── oauth/
│   │   └── consent/
│   │       └── route.ts         # OAuth callback - routes new users to /newuser
│   │
│   ├── newuser/
│   │   └── page.tsx             # New user onboarding (username + avatar)
│   │
│   ├── feed/
│   │   └── page.tsx             # Main feed (prioritizes followed users)
│   │
│   ├── upload/
│   │   └── page.tsx             # Upload artwork (with AI detection)
│   │
│   ├── work/[id]/
│   │   ├── page.tsx             # Work detail page (essays, images)
│   │   ├── delete-button.tsx    # Delete work client component
│   │   └── comments-section.tsx # Comments (WIP)
│   │
│   └── profile/
│       ├── page.tsx             # Own profile (protected)
│       ├── edit/
│       │   └── page.tsx         # Edit profile page
│       └── [username]/
│           ├── page.tsx         # Public profile view
│           └── follow-button.tsx # Follow/unfollow client component
│
├── components/
│   ├── providers/
│   │   └── amplify-provider.tsx # Amplify initialization wrapper
│   └── ui/                      # shadcn/ui primitives
│
├── lib/
│   ├── amplify/
│   │   ├── config.ts            # Amplify configuration
│   │   └── storage.ts           # Amplify Storage utilities
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   ├── server.ts            # Server Supabase client + getUser/getSession
│   │   └── middleware.ts        # Route protection middleware
│   ├── api/
│   │   └── types.ts             # Shared API types
│   └── utils.ts
│
├── types/
│   └── index.ts                 # Global type definitions
│
├── supabase/
│   └── migrations/              # Database migrations
│
├── middleware.ts                # Next.js middleware (calls updateSession)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Coding Conventions

### TypeScript

```typescript
// Explicit return types on functions
function formatDate(date: Date): string {
  ...
}

// API responses typed with shared types
import type { Work, User } from '@/lib/api/types';

// React components: named exports, props interface
interface WorkCardProps {
  work: Work;
  onLike?: () => void;
}

export function WorkCard({ work, onLike }: WorkCardProps) {
  ...
}

// Prefer server components, mark client explicitly
'use client';

// Use React Query for server state
const { data: works, isLoading } = useQuery({
  queryKey: ['works', username],
  queryFn: () => api.works.getByUser(username),
});
```

### Naming Conventions

| Thing            | Convention         | Example                          |
| ---------------- | ------------------ | -------------------------------- |
| TS/React files   | kebab-case         | `work-card.tsx`                  |
| React components | PascalCase         | `WorkCard`                       |
| Utility files    | kebab-case         | `storage.ts`                     |
| Database tables  | snake_case, plural | `works`, `community_members`     |
| API endpoints    | kebab-case, plural | `/api/works`, `/api/validate-image` |
| Environment vars | SCREAMING_SNAKE    | `SIGHTENGINE_API_KEY`            |

---

## Utility Patterns

### Amplify Storage Wrapper

External dependencies are wrapped in utility functions for easy swapping and testing.

```typescript
// lib/amplify/storage.ts
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

export interface UploadResult {
  path: string;
  url: string;
}

export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const fullPath = `media/${path}`;

  const result = await uploadData({
    path: fullPath,
    data: file,
    options: {
      contentType: file.type,
      onProgress: (event) => {
        if (onProgress && event.totalBytes) {
          onProgress((event.transferredBytes / event.totalBytes) * 100);
        }
      },
    },
  }).result;

  const urlResult = await getUrl({ path: result.path });

  return {
    path: result.path,
    url: urlResult.url.toString(),
  };
}

export async function deleteFile(path: string): Promise<void> {
  await remove({ path });
}
```

### AI Detection (API Routes)

AI detection is handled directly in API routes:
- `/api/validate-image` - Sightengine for image AI detection
- `/api/validate-text` - Dedalus (Claude) for text AI detection

---

## Database Conventions

### Migrations

Store SQL migrations in `supabase/migrations/` with numbered prefixes.

```bash
# Create a new migration file
touch supabase/migrations/00005_add_new_table.sql

# Apply via Supabase Dashboard or CLI
supabase db push
```

### Common Patterns

```sql
-- Every table gets these columns
id uuid primary key default gen_random_uuid(),
created_at timestamptz default now(),
updated_at timestamptz default now()

-- Soft deletes where needed
deleted_at timestamptz default null

-- Use enums for fixed categories
create type work_type as enum ('image', 'essay', 'text_post');

-- Junction tables for many-to-many
create table work_tags (
  work_id uuid references works(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (work_id, tag_id)
);

-- Indexes on foreign keys and common queries
create index idx_works_author_id on works(author_id);
create index idx_works_created_at on works(created_at desc);
```

### Row Level Security

RLS policies handle authorization at the database level. Backend still validates, but RLS is the safety net.

```sql
-- Users can only update their own profile
create policy "Users can update own profile"
on profiles for update
using (auth.uid() = id);

-- Works are publicly readable if published
create policy "Published works are public"
on works for select
using (is_published = true);

-- Only author can delete their work
create policy "Authors can delete own works"
on works for delete
using (auth.uid() = author_id);
```

---

## API Design

### Response Format

```json
// Success (single resource)
{
  "data": { "id": "...", "title": "..." }
}

// Success (list)
{
  "data": [...],
  "pagination": {
    "next_cursor": "...",
    "has_more": true
  }
}

// Error
{
  "error": {
    "code": "AI_CONTENT_DETECTED",
    "message": "This content appears to be AI-generated.",
    "details": { "confidence": 0.87 }
  }
}
```

### Pagination

Use cursor-based pagination for feeds (not offset). More efficient and handles real-time inserts.

```typescript
// In server component or API route
const { data, error } = await supabase
  .from('works')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(20);
```

---

## Error Handling

API routes return consistent error responses:

```typescript
// In API route
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

if (!validateResult.passed) {
  return NextResponse.json({
    error: "AI_CONTENT_DETECTED",
    message: "This content appears to be AI-generated",
    score: validateResult.score,
  }, { status: 400 });
}
```

---

## Testing Strategy

Use Vitest + React Testing Library. Mock API calls with MSW.

```typescript
// Example test
import { render, screen } from '@testing-library/react';
import { WorkCard } from '@/components/work-card';

test('renders work title', () => {
  render(<WorkCard work={mockWork} />);
  expect(screen.getByText('Test Artwork')).toBeInTheDocument();
});
```

---

## Development Workflow

### Local Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local  # Fill in values

# Run dev server
npm run dev
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://oaooikqeqijrlfzdwdfs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# AI Detection (required for uploads)
SIGHTENGINE_API_USER=...
SIGHTENGINE_API_SECRET=...
DEDALUS_API_KEY=...  # For essay/text detection via Claude

# Future: when FastAPI backend is added
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Current Phase: Foundation

We're in **Phase 1**. Focus on:

1. ✅ Project structure setup
2. ✅ Supabase project + initial schema
3. ✅ Supabase Auth integration (Google OAuth)
4. ✅ Basic profile CRUD (read + update)
5. ✅ Next.js app with auth flow
6. ✅ Image upload with AI detection
7. ✅ Follow system
8. ✅ Feed with follow prioritization
9. ✅ AWS Amplify Storage migration

BEFORE TESTING make sure types compile: px tsc --noEmit 2>&1 | head -100

**Completed in this phase:**

- Supabase project: `oaooikqeqijrlfzdwdfs.supabase.co`
- `profiles` table with RLS policies (public read, owner update/insert)
- `works` table for artwork uploads
- `follows` table for one-way follow relationships
- `likes` and `bookmarks` tables (schema ready, UI pending)
- Auto-create profile trigger on user signup (pulls name + avatar from OAuth)
- Google OAuth configured and working
- Protected routes: `/feed`, `/profile`, `/upload`, `/newuser`
- OAuth flow: `/login` → Google → `/oauth/consent` → `/newuser` (new users) or `/feed` (existing)
- New user onboarding: `/newuser` page for username + avatar setup
- Sign out button in header → POST `/auth/signout` → `/login`
- Public profiles: `/profile/[username]` with follow button
- Follow/unfollow functionality with follower/following counts
- Feed prioritizes works from followed users
- Image upload with Sightengine AI detection (rejects AI-generated images)
- Google profile images use `referrerPolicy="no-referrer"` to load correctly
- Essay/text post support with cover images
- Work detail page at `/work/[id]` for viewing essays and images
- Text AI detection via Dedalus (Claude Opus 4.5) - rejects AI-generated essays
- "+ New" button replaces "Upload" across app
- Profile edit page at `/profile/edit`
- AWS Amplify Storage for all media uploads (artworks, avatars)
- Work deletion with storage cleanup

**Do not build yet:**

- Communities
- Comments (schema exists, UI pending)
- Notifications
- Search
- Likes/bookmarks UI (schema exists)

Keep the scope minimal. Core loop working: auth → onboarding → upload → feed → follow.

---

## Commands Reference

```bash
# Next.js
npm run dev                              # Run dev server
npm run build                            # Production build
npm run lint                             # Lint

# AWS Amplify
npx ampx sandbox                         # Start local Amplify backend
npx ampx sandbox delete                  # Clean up sandbox resources

# Supabase
supabase start                           # Start local instance
supabase stop                            # Stop local instance
supabase db push                         # Push migrations
supabase gen types typescript --local    # Generate TS types
```

---

## Decision Log

| Date       | Decision                           | Rationale                                     |
| ---------- | ---------------------------------- | --------------------------------------------- |
| 2025-02-06 | FastAPI over Flask                 | Async-first, auto OpenAPI, better typing      |
| 2025-02-06 | Supabase over raw Postgres         | Auth + Storage + Realtime bundled, faster MVP |
| 2025-02-06 | Sightengine for images             | Best-in-class AI image detection              |
| 2025-02-06 | Feature folders over layer folders | Easier to reason about, scales better         |
| 2025-02-06 | Cursor pagination                  | Handles real-time feeds, no offset drift      |
| 2026-02-06 | Next.js-first MVP                  | Defer FastAPI until we need custom backend logic |
| 2026-02-06 | OAuth callback at `/oauth/consent` | Clearer naming, separate from auth group      |
| 2026-02-06 | Profile auto-creation via trigger  | No extra API call needed on first login       |
| 2026-02-06 | New user onboarding at `/newuser`  | Separate username setup from OAuth flow       |
| 2026-02-06 | One-way follows (not mutual)       | Twitter-style, simpler than friend requests   |
| 2026-02-06 | Feed prioritizes followed users    | Client-side sort after fetch, simple for MVP  |
| 2026-02-06 | AI detection via Next.js API route | Keep secrets server-side, validate before storage |
| 2026-02-06 | 75% threshold for AI rejection     | Balance false positives vs letting AI through |
| 2026-02-06 | Dedalus + Claude Opus for text     | LLM-based detection, no GPTZero API needed    |
| 2026-02-06 | 65% threshold for text AI rejection | Lower threshold for text vs images            |
| 2026-02-07 | Amplify Storage over Supabase Storage | Consolidate on AWS, reduce external deps     |

---

## Open Questions

- [x] What OAuth providers beyond Google? → GitHub and Discord buttons exist, need to configure in Supabase Dashboard
- [x] New user onboarding flow? → `/newuser` page after first OAuth login
- [x] How to handle Google profile image loading? → `referrerPolicy="no-referrer"` on img tags
- [x] Profile edit page implementation? → `/profile/edit` page complete
- [x] Storage provider? → Migrated from Supabase Storage to AWS Amplify Storage (S3)
- [ ] Storage limits per user?
- [ ] Appeals process for false positive AI detection?
- [ ] Monetization model? (affects schema for subscriptions)
- [ ] Mobile app timeline? (affects API design)
- [ ] Likes/bookmarks UI implementation?
- [ ] Comments UI implementation?
