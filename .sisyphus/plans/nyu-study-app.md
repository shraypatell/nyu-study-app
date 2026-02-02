# Work Plan: NYU Study App

## TL;DR

> **Quick Summary**: Build a real-time study timer social app for NYU students with daily leaderboards, class chat, friends system, and location tracking. Users verify with nyu.edu email, can toggle privacy settings for their timer/classes/location, and compete on daily school and location-based leaderboards. Friends system allows users to build a persistent list of connections for quick access to profiles and direct messaging.
>
> **Deliverables**:
> - Full Next.js web app with ShadCN UI
> - Supabase backend (auth, database, real-time)
> - User authentication with NYU email verification
> - Live timer with pause/resume (resets at midnight)
> - Daily school leaderboard
> - Location-based leaderboards (Bobst, Stern, Home, etc.)
> - Class system with real-time chat
> - Private messaging system
> - User search functionality
> - **Friends system** - Send/accept friend requests, persistent friend list, quick profile access
> - Admin interface for class/location management
> 
> **Estimated Effort**: **Large** (7-9 weeks for MVP with friends feature)
> **Parallel Execution**: YES - 6 waves
> **Critical Path**: Database Setup → Auth System → Timer Core → Friends → Leaderboards → Chat System

---

## Context

### Original Request
Build a live study timer app where NYU students can:
- Track study time with a live 00:00:00 timer that resets at midnight
- Sign up with verified NYU email and username
- See daily leaderboards of top studiers
- View public profiles showing timer, location, and classes
- Search for users by name
- Join NYU classes and chat with classmates
- Indicate study location and see location-based leaderboards
- Toggle privacy settings for timer, classes, and location visibility

### Technical Requirements
- Next.js 14+ with App Router
- React + TypeScript
- ShadCN UI components
- Strong database design for social apps
- Real-time features (live timer updates, chat)
- 1000s of users on free tier only

### Key Constraints from Interview
- **1000s of users, free tier only** → Must optimize for Supabase/Vercel free limits
- **Privacy toggles** → Each feature (timer, classes, location) individually toggleable
- **Timer behavior** → Pauses automatically on browser close, manual pause/resume, counts up all day
- **Data retention** → Study history: 30 days, Chat messages: forever
- **No notifications** → Simplifies architecture
- **Both private messaging AND class chat** → Two chat types needed
- **Responsive web only** → No mobile apps

### Gap Analysis (Self-Review)
**Critical Risks Identified**:
1. **Free tier limits** - Supabase has connection limits (200 concurrent on free), need connection pooling
2. **Midnight reset** - Need reliable cron job or edge function for daily leaderboard reset
3. **"Active now" detection** - Heartbeat vs timestamp approach needed
4. **Chat at scale** - Free tier may struggle with 1000s of concurrent chat users
5. **Database bloat** - Chat messages kept forever with 1000s of users = huge tables
6. **Rate limiting** - No built-in protection against abuse on free tier
7. **Testing strategy** - Not specified, will design comprehensive test plan

**Guardrails Applied**:
- Pagination mandatory for all list queries (leaderboards, chat history, user lists)
- Database indexes on all foreign keys and frequently queried fields
- Connection pooling via PgBouncer (Supabase provides this)
- Soft deletes for all data (never hard delete)
- Rate limiting middleware on all API routes
- Caching layer for leaderboards (stale-while-revalidate pattern)

---

## Work Objectives

### Core Objective
Build a production-ready, real-time study timer social platform for NYU students that handles 1000s of users on free-tier infrastructure, with robust privacy controls, real-time chat, and daily-resetting leaderboards.

### Concrete Deliverables
1. **Authentication System** - NYU email verification, username signup, session management
2. **Timer System** - Live timer with start/pause/resume, automatic pause on disconnect, midnight reset
3. **Profile System** - Public profiles with privacy toggles for timer, classes, location
4. **Leaderboard System** - Daily school leaderboard + location-based leaderboards with real-time updates
5. **Friends System** - Send/accept/reject friend requests, persistent friend list, quick profile access
6. **Class System** - Join/leave classes, browse available NYU classes
7. **Chat System** - Real-time class chat + private messaging with infinite scroll
8. **Search System** - User search by username/name
9. **Admin Interface** - Upload/manage class data and study locations
10. **Database Schema** - Optimized PostgreSQL schema with proper indexes and relationships
11. **Real-time Infrastructure** - Supabase Realtime + fallback polling strategy

### Definition of Done
- [ ] All features functional and manually tested
- [ ] Database schema deployed and seeded with sample data
- [ ] All API routes protected with auth middleware
- [ ] Privacy toggles enforced on all public queries
- [ ] Leaderboards update in real-time (or near real-time with polling)
- [ ] Chat messages deliver in real-time
- [ ] Timer persists and syncs across page refreshes
- [ ] Midnight reset cron job tested and working
- [ ] Rate limiting preventing abuse
- [ ] Responsive design working on mobile/tablet/desktop

### Must Have (Non-Negotiable)
- NYU email domain verification (@nyu.edu)
- Live timer that resets at midnight ET
- Daily school leaderboard
- Location-based leaderboards
- **Friends system** - Send/accept friend requests, persistent friend list
- Class chat functionality
- Private messaging
- User search
- Privacy toggles for timer/classes/location
- Real-time updates (within 5 seconds acceptable)
- 1000s of users supported on free tier

### Must NOT Have (Explicit Exclusions from Guardrails)
- **No mobile native apps** (web-only)
- **No push notifications** (explicitly excluded)
- **No email notifications** (explicitly excluded)
- **No automatic GPS location** (manual selection only)
- **No video/audio chat** (text-only)
- **No file uploads in chat** (text-only)
- **No study analytics beyond 30 days** (explicitly limited)
- **No multi-school support** (NYU-only MVP)
- **No dark mode** (can add later, not in MVP)
- **No gamification** (badges, points, streaks - keep it simple)
- **No editing/deleting chat messages** (send only, keep forever)
- **No complex moderation tools** (basic admin only)

---

## Technical Architecture

### Stack Overview
| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | Next.js 14+ (App Router) | Server components, API routes, optimal for this use case |
| **UI Library** | React + TypeScript + ShadCN | Type safety, beautiful components, easy customization |
| **Styling** | Tailwind CSS | Already included with ShadCN, utility-first |
| **Backend** | Next.js API Routes + Edge Functions | Serverless, scales automatically, free on Vercel |
| **Database** | Supabase PostgreSQL | Generous free tier (500MB, 200 concurrent), built-in auth & realtime |
| **ORM** | Prisma | Type-safe, excellent Supabase integration, migrations |
| **Auth** | Supabase Auth | Built-in, free, handles email verification |
| **Real-time** | Supabase Realtime + SWR | Realtime subscriptions + smart polling fallback |
| **Hosting** | Vercel | Free hobby tier, optimal for Next.js, serverless functions |
| **Cron Jobs** | Vercel Cron + Supabase Edge Functions | Daily midnight reset, maintenance tasks |

### Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  // Profile
  displayName   String?   @map("display_name")
  bio           String?
  avatarUrl     String?   @map("avatar_url")
  
  // Privacy settings (all default to true/public)
  isTimerPublic     Boolean @default(true) @map("is_timer_public")
  isClassesPublic   Boolean @default(true) @map("is_classes_public")
  isLocationPublic  Boolean @default(true) @map("is_location_public")
  
  // Relations
  studySessions     StudySession[]
  dailyStats        DailyStat[]
  userClasses       UserClass[]
  userLocations     UserLocation[]
  sentMessages      Message[] @relation("SentMessages")
  chatRoomUsers     ChatRoomUser[]

  // Friends system
  sentFriendRequests     Friendship[] @relation("SentFriendRequests")
  receivedFriendRequests Friendship[] @relation("ReceivedFriendRequests")

  @@map("users")
}

model StudySession {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  startedAt       DateTime  @map("started_at")
  endedAt         DateTime? @map("ended_at")
  durationSeconds Int       @default(0) @map("duration_seconds")
  isActive        Boolean   @default(true) @map("is_active")
  createdDate     DateTime  @default(now()) @map("created_date") // For daily grouping
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, createdDate])
  @@index([isActive])
  @@map("study_sessions")
}

model DailyStat {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  date            DateTime  @db.Date
  totalSeconds    Int       @default(0) @map("total_seconds")
  isPublic        Boolean   @default(true) @map("is_public")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, date])
  @@index([date, totalSeconds(sort: Desc)]) // For leaderboard queries
  @@map("daily_stats")
}

model Location {
  id          String    @id @default(uuid())
  name        String    @unique // "Bobst Library", "Stern School", etc.
  slug        String    @unique // "bobst", "stern"
  description String?
  isActive    Boolean   @default(true) @map("is_active")
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")
  
  userLocations UserLocation[]
  
  @@map("locations")
}

model UserLocation {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  locationId  String    @map("location_id")
  isPublic    Boolean   @default(true) @map("is_public")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  location  Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  @@unique([userId])
  @@index([locationId, updatedAt])
  @@map("user_locations")
}

model Class {
  id          String    @id @default(uuid())
  name        String    // "Introduction to Economics"
  code        String    // "ECON-UA-1"
  section     String?   // "001"
  semester    String    // "Fall 2024"
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  
  userClasses UserClass[]
  chatRoom    ChatRoom?
  
  @@unique([code, section, semester])
  @@map("classes")
}

model UserClass {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  classId   String    @map("class_id")
  isPublic  Boolean   @default(true) @map("is_public")
  joinedAt  DateTime  @default(now()) @map("joined_at")
  
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  class Class @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  @@unique([userId, classId])
  @@index([classId])
  @@map("user_classes")
}

model ChatRoom {
  id          String      @id @default(uuid())
  type        ChatRoomType
  classId     String?     @unique @map("class_id")
  createdAt   DateTime    @default(now()) @map("created_at")
  
  class       Class?      @relation(fields: [classId], references: [id], onDelete: Cascade)
  messages    Message[]
  users       ChatRoomUser[]
  
  @@map("chat_rooms")
}

model ChatRoomUser {
  id          String    @id @default(uuid())
  roomId      String    @map("room_id")
  userId      String    @map("user_id")
  joinedAt    DateTime  @default(now()) @map("joined_at")
  lastReadAt  DateTime? @map("last_read_at")
  
  room  ChatRoom  @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([roomId, userId])
  @@index([userId])
  @@map("chat_room_users")
}

model Message {
  id          String    @id @default(uuid())
  roomId      String    @map("room_id")
  senderId    String    @map("sender_id")
  content     String
  createdAt   DateTime  @default(now()) @map("created_at")
  
  room    ChatRoom  @relation(fields: [roomId], references: [id], onDelete: Cascade)
  sender  User      @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  
  @@index([roomId, createdAt(sort: Desc)]) // For message history queries
  @@index([senderId])
  @@map("messages")
}

model Friendship {
  id          String            @id @default(uuid())
  requesterId String            @map("requester_id")
  addresseeId String            @map("addressee_id")
  status      FriendshipStatus  @default(PENDING)
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")

  requester User @relation("SentFriendRequests", fields: [requesterId], references: [id], onDelete: Cascade)
  addressee User @relation("ReceivedFriendRequests", fields: [addresseeId], references: [id], onDelete: Cascade)

  @@unique([requesterId, addresseeId])
  @@index([addresseeId, status]) // For fetching pending requests
  @@index([requesterId, status]) // For fetching sent requests
  @@map("friendships")
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
  REJECTED
  BLOCKED
}

enum ChatRoomType {
  CLASS
  DM
}
```

### API Routes Structure (Next.js App Router)

```
app/
├── api/
│   ├── auth/
│   │   └── callback/route.ts         # Supabase auth callback
│   ├── timer/
│   │   ├── start/route.ts            # POST: Start timer
│   │   ├── pause/route.ts            # POST: Pause timer
│   │   └── status/route.ts           # GET: Current timer status
│   ├── leaderboards/
│   │   ├── school/route.ts           # GET: Daily school leaderboard
│   │   └── location/[id]/route.ts    # GET: Location leaderboard
│   ├── users/
│   │   ├── search/route.ts           # GET: Search users
│   │   └── [id]/route.ts             # GET: User public profile
│   ├── friends/
│   │   ├── route.ts                  # GET: List friends, POST: Send request
│   │   ├── requests/route.ts         # GET: List pending requests
│   │   └── [id]/route.ts             # PATCH: Accept/Reject, DELETE: Remove friend
│   ├── classes/
│   │   ├── route.ts                  # GET: List classes
│   │   └── join/route.ts             # POST: Join class
│   ├── chat/
│   │   ├── rooms/route.ts            # GET: List chat rooms
│   │   ├── messages/route.ts         # GET/POST: Messages
│   │   └── typing/route.ts           # POST: Typing indicator
│   └── admin/
│       ├── classes/route.ts          # POST: Bulk upload classes
│       └── locations/route.ts        # POST: Bulk upload locations
└── cron/
    └── reset-daily-stats/route.ts    # Daily midnight reset (Vercel Cron)
```

### Real-time Architecture

**Strategy**: Supabase Realtime for chat + SWR polling for timer/leaderboards

**Rationale**: 
- Chat needs true real-time (WebSocket via Supabase Realtime)
- Timer updates every 1-5 seconds acceptable (polling)
- Leaderboards update every 30-60 seconds acceptable (polling)
- Free tier limits: Supabase Realtime has 200 concurrent connections, polling reduces load

**Implementation**:
```typescript
// Chat - Real-time via Supabase
const channel = supabase
  .channel(`room:${roomId}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback)
  .subscribe()

// Timer/Leaderboards - Polling via SWR
const { data } = useSWR('/api/timer/status', fetcher, { refreshInterval: 5000 })
const { data: leaderboard } = useSWR('/api/leaderboards/school', fetcher, { refreshInterval: 30000 })
```

### Free Tier Optimization Strategy

**Supabase Free Tier Limits**:
- 500MB database storage
- 200 concurrent connections
- 2GB bandwidth
- 1GB file storage

**Optimizations**:
1. **Connection Pooling**: Use PgBouncer (included with Supabase) for Prisma
2. **Pagination**: All list queries limited to 50 items per page
3. **Selective Fields**: Only query needed fields, never `SELECT *`
4. **Indexing**: All foreign keys and query patterns indexed
5. **Caching**: SWR cache for 30 seconds on leaderboard data
6. **Data Cleanup**: Cron job to archive study sessions older than 30 days
7. **Image Optimization**: Use external image hosting (no Supabase storage)
8. **Message Archival**: Archive chat messages older than 1 year to cold storage

---

## Verification Strategy

### Test Infrastructure Decision
**Test Infrastructure exists**: NO (need to set up)
**User wants tests**: YES (Tests-after implementation)
**Framework**: Vitest (fast, modern, Next.js compatible)

### Test Setup
- Install Vitest + React Testing Library
- Configure for Next.js App Router
- Create test utilities for Supabase mocking
- Example test: Component renders, API routes respond correctly

### Manual QA Procedures
Each task includes specific manual verification steps:
- **UI Changes**: Screenshot verification with Playwright
- **API Changes**: Curl commands with expected responses
- **Database Changes**: Query verification with expected results
- **Timer**: Manual time-checking against system clock
- **Real-time**: Two-browser test to verify live updates

---

## Execution Strategy

### Wave 1: Foundation (Days 1-5)
**Tasks**: 1.1 - 1.5
**Agents**: 3 parallel (2 database, 1 setup)
**Deliverables**: Working database, auth system, project structure
**Dependencies**: None (can start immediately)

### Wave 2: Core Timer (Days 3-8)
**Tasks**: 2.1 - 2.4
**Agents**: 2 parallel
**Deliverables**: Timer start/pause/resume, midnight reset, status API
**Dependencies**: Wave 1 complete

### Wave 3: User System & Friends (Days 6-14)
**Tasks**: 3.1 - 3.8
**Agents**: 2 parallel
**Deliverables**: Profiles, privacy toggles, search, auth flows, friends system with requests
**Dependencies**: Wave 1 complete

### Wave 4: Social Features (Days 12-20)
**Tasks**: 4.1 - 4.6
**Agents**: 3 parallel
**Deliverables**: Leaderboards, class system, locations
**Dependencies**: Wave 2, Wave 3 complete

### Wave 5: Chat System (Days 18-26)
**Tasks**: 5.1 - 5.4
**Agents**: 2 parallel
**Deliverables**: Real-time class chat, private messaging
**Dependencies**: Wave 3 complete (for user system), Wave 4 (for classes)

### Wave 6: Admin & Polish (Days 24-32)
**Tasks**: 6.1 - 6.4
**Agents**: 2 parallel
**Deliverables**: Admin interface, UI polish, testing, deployment
**Dependencies**: All previous waves

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1.1 | None | 1.2, 1.3, 1.4 | 1.5 |
| 1.2 | None | 1.3 | 1.1, 1.5 |
| 1.3 | 1.1, 1.2 | 1.4 | None |
| 1.4 | 1.3 | Wave 2, 3 | None |
| 1.5 | None | None | 1.1, 1.2 |
| 2.1 | 1.4 | 2.2, 2.3 | None |
| 2.2 | 2.1 | 2.4 | 2.3 |
| 2.3 | 2.1 | 2.4 | 2.2 |
| 2.4 | 2.2, 2.3 | Wave 4 | None |
| 3.1 | 1.4 | 3.2, 3.3 | 2.1 |
| 3.2 | 3.1 | 3.4 | 3.3 |
| 3.3 | 3.1 | 3.4 | 3.2 |
| 3.4 | 3.2, 3.3 | 3.5 | None |
| 3.5 | 3.4 | Wave 5 | None |
| 3.6 | 3.1 | 3.7, 3.8 | 3.5 |
| 3.7 | 3.6 | None | 3.8 |
| 3.8 | 3.6 | None | 3.7 |
| 4.1 | 2.4 | 4.2 | 3.4 |
| 4.2 | 4.1 | 4.4 | 4.3 |
| 4.3 | 2.4 | 4.4 | 4.2 |
| 4.4 | 4.2, 4.3 | 4.5, 4.6 | None |
| 4.5 | 4.4 | Wave 6 | 4.6 |
| 4.6 | 4.4 | Wave 6 | 4.5 |
| 5.1 | 3.5 | 5.2 | None |
| 5.2 | 5.1 | 5.3 | None |
| 5.3 | 5.2 | 5.4 | None |
| 5.4 | 5.3 | Wave 6 | None |
| 6.1 | Wave 4 | None | 6.2 |
| 6.2 | Wave 4 | None | 6.1 |
| 6.3 | All Waves | None | None |
| 6.4 | 6.1, 6.2 | None | None |

**Critical Path**: 1.1 → 1.2 → 1.3 → 1.4 → 2.1 → 2.2/2.3 → 2.4 → 4.1 → 4.2/4.3 → 4.4 → 4.5/4.6
**Minimum Timeline**: 30 days with parallel execution
**Sequential Timeline**: 60+ days

---

## TODOs

### Wave 1: Foundation Setup

- [x] **1.1 Initialize Next.js Project with ShadCN**

  **What to do**:
  - Create Next.js 14+ project with TypeScript
  - Initialize ShadCN UI with neutral base color
  - Install essential components: button, card, input, avatar, badge, dialog, dropdown-menu, tabs
  - Configure Tailwind with custom color palette (NYU purple: #57068C)
  - Set up project structure (app/, components/, lib/, types/)
  - Configure ESLint and Prettier
  - Create initial layout.tsx with global providers

  **Must NOT do**:
  - Don't install unnecessary ShadCN components (keep bundle size small)
  - Don't add dark mode (out of scope)
  - Don't set up Redux/Zustand yet (wait until needed)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (Next.js + UI setup)
  - **Skills**: `frontend-ui-ux`
  - Reason: Needs strong UI/UX foundation for design system

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 1.2, 1.3, 1.4
  - **Blocked By**: None

  **References**:
  - ShadCN docs: https://ui.shadcn.com/docs/installation/next
  - Next.js App Router: https://nextjs.org/docs/app
  - Tailwind config: https://tailwindcss.com/docs/configuration

  **Acceptance Criteria**:
  - [ ] `npm run dev` starts without errors
  - [ ] Homepage displays with ShadCN button component
  - [ ] TypeScript compiles without errors
  - [ ] Tailwind classes work correctly
  - [ ] Project structure matches plan

  **Manual Verification**:
  ```bash
  cd nyu-study-app
  npm run dev
  # Open http://localhost:3000
  # Verify: Page loads, button renders correctly
  ```

  **Commit**: YES
  - Message: `chore: initialize next.js project with shadcn`
  - Files: All initial project files

- [x] **1.2 Set Up Supabase Project and Database**

  **What to do**:
  - Create Supabase project (free tier)
  - Save project URL and anon key to .env.local
  - Install @supabase/supabase-js and @supabase/ssr
  - Create lib/supabase/client.ts for client-side Supabase
  - Create lib/supabase/server.ts for server-side Supabase
  - Configure connection pooling for Prisma (pgbouncer)
  - Test connection to database

  **Must NOT do**:
  - Don't use service role key in client-side code (security risk)
  - Don't commit .env.local (add to .gitignore)
  - Don't skip connection pooling (will hit connection limits)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (infrastructure setup)
  - **Skills**: None (Supabase setup is straightforward)
  - Reason: Infrastructure configuration, not heavy coding

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 1.1)
  - **Parallel Group**: Wave 1
  - **Blocks**: 1.3, 1.4
  - **Blocked By**: None

  **References**:
  - Supabase SSR: https://supabase.com/docs/guides/auth/server-side/nextjs
  - Connection pooling: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler

  **Acceptance Criteria**:
  - [ ] Supabase project created and accessible
  - [ ] Client-side Supabase client works
  - [ ] Server-side Supabase client works
  - [ ] Environment variables configured
  - [ ] Connection test passes

  **Manual Verification**:
  ```bash
  # Test client-side
  npm run dev
  # Check browser console for Supabase connection
  
  # Test server-side
  curl http://localhost:3000/api/test-supabase
  # Should return: { status: "connected" }
  ```

  **Commit**: YES
  - Message: `chore: setup supabase connection and clients`
  - Files: lib/supabase/*, .env.local.example

- [x] **1.3 Set Up Prisma ORM and Database Schema**

  **What to do**:
  - Install Prisma CLI and client: `npm install -D prisma && npm install @prisma/client`
  - Initialize Prisma: `npx prisma init`
  - Create schema.prisma with all models (User, StudySession, DailyStat, Location, UserLocation, Class, UserClass, ChatRoom, ChatRoomUser, Message)
  - Configure database URL with pgbouncer settings
  - Create first migration: `npx prisma migrate dev --name init`
  - Install and configure Prisma Client extensions if needed
  - Create lib/prisma.ts with singleton pattern
  - Generate Prisma Client

  **Must NOT do**:
  - Don't forget to index foreign keys (performance critical)
  - Don't use @db.Text for short strings (use @db.VarChar)
  - Don't skip the singleton pattern (creates connection issues)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (database schema design)
  - **Skills**: None (Prisma is well-documented)
  - Reason: Schema design requires careful thought about relationships

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 1.2)
  - **Parallel Group**: Wave 1
  - **Blocks**: 1.4
  - **Blocked By**: 1.2

  **References**:
  - Prisma Next.js: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
  - Prisma schema: https://www.prisma.io/docs/orm/prisma-schema
  - Supabase + Prisma: https://supabase.com/docs/guides/database/prisma

  **Acceptance Criteria**:
  - [ ] All models created per schema specification
  - [ ] All indexes defined
  - [ ] First migration applied successfully
  - [ ] Prisma Client generated
  - [ ] Singleton pattern implemented
  - [ ] Can query database via Prisma

  **Manual Verification**:
  ```bash
  npx prisma migrate status
  # Should show: Database schema is up to date
  
  npx prisma studio
  # Should open Prisma Studio with all tables visible
  ```

  **Commit**: YES
  - Message: `feat(db): setup prisma schema and initial migration`
  - Files: prisma/schema.prisma, prisma/migrations/*, lib/prisma.ts

- [x] **1.4 Implement Authentication with NYU Email Verification**

  **What to do**:
  - Configure Supabase Auth with email provider
  - Create email domain verification hook (only @nyu.edu allowed)
  - Set up auth callback route: app/api/auth/callback/route.ts
  - Create middleware.ts for session validation
  - Build login page with email input
  - Create signup flow with username selection
  - Implement username uniqueness validation
  - Create auth context/provider for client-side auth state
  - Build protected route wrapper component

  **Must NOT do**:
  - Don't allow non-nyu.edu emails (strict requirement)
  - Don't store passwords in your database (use Supabase Auth)
  - Don't skip CSRF protection (Supabase handles this)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (auth is critical)
  - **Skills**: None
  - Reason: Security-critical, needs careful implementation

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 1.3)
  - **Parallel Group**: Wave 1
  - **Blocks**: Wave 2, Wave 3
  - **Blocked By**: 1.3

  **References**:
  - Supabase Auth: https://supabase.com/docs/guides/auth
  - Next.js Auth: https://supabase.com/docs/guides/auth/server-side/nextjs
  - Email verification: https://supabase.com/docs/guides/auth/auth-email

  **Acceptance Criteria**:
  - [ ] Can sign up with nyu.edu email
  - [ ] Non-nyu.edu emails rejected with clear error
  - [ ] Username uniqueness enforced
  - [ ] Login flow works
  - [ ] Auth callback handles sessions correctly
  - [ ] Protected routes redirect to login
  - [ ] Auth state persists across page reloads

  **Manual Verification**:
  ```bash
  # Test signup
  curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test@nyu.edu","password":"test123","username":"testuser"}'
  # Expected: Success, user created
  
  # Test rejection
  curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test@gmail.com","password":"test123","username":"testuser"}'
  # Expected: Error "Only NYU email addresses allowed"
  ```

  **Commit**: YES
  - Message: `feat(auth): implement nyu email verification and signup`
  - Files: app/api/auth/*, app/login/*, lib/auth/*, middleware.ts

- [x] **1.5 Set Up Testing Infrastructure**

  **What to do**:
  - Install Vitest: `npm install -D vitest @vitejs/plugin-react jsdom`
  - Install Testing Library: `npm install -D @testing-library/react @testing-library/jest-dom`
  - Configure vitest.config.ts for Next.js
  - Set up test utilities and mocks
  - Create example component test
  - Add test scripts to package.json
  - Configure CI-friendly output

  **Must NOT do**:
  - Don't use Jest (slower, more config)
  - Don't skip mocking Supabase (tests will fail)

  **Recommended Agent Profile**:
  - **Category**: `quick` (setup task)
  - **Skills**: None
  - Reason: Straightforward configuration

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 1.1, 1.2)
  - **Parallel Group**: Wave 1
  - **Blocks**: None (tests start after features)
  - **Blocked By**: None

  **References**:
  - Vitest: https://vitest.dev/guide/
  - Testing Library: https://testing-library.com/docs/react-testing-library/intro/

  **Acceptance Criteria**:
  - [ ] Vitest runs without errors
  - [ ] Example test passes
  - [ ] Can mock Supabase client
  - [ ] Test coverage reporting works

  **Manual Verification**:
  ```bash
  npm test
  # Expected: 1 test passes
  ```

  **Commit**: YES
  - Message: `chore: setup vitest testing infrastructure`
  - Files: vitest.config.ts, tests/setup.ts, tests/example.test.tsx

---

### Wave 2: Core Timer System

- [x] **2.1 Create Timer API Routes (Start/Pause/Status)**

  **What to do**:
  - Create POST /api/timer/start route
  - Create POST /api/timer/pause route
  - Create GET /api/timer/status route
  - Implement study session creation in start route
  - Implement session ending and duration calculation in pause route
  - Handle edge cases (already active, already paused, etc.)
  - Update DailyStat table on pause
  - Add rate limiting (prevent spam)

  **Must NOT do**:
  - Don't allow multiple active sessions per user (enforce single timer)
  - Don't calculate duration on frontend (security risk)
  - Don't forget to handle timezone (use UTC, convert to ET for display)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (core business logic)
  - **Skills**: None
  - Reason: Timer is the core feature, needs to be bulletproof

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 1.4)
  - **Parallel Group**: Wave 2
  - **Blocks**: 2.2, 2.3
  - **Blocked By**: 1.4

  **References**:
  - Prisma CRUD: https://www.prisma.io/docs/orm/prisma-client/queries/crud
  - Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

  **Acceptance Criteria**:
  - [ ] POST /api/timer/start creates active session
  - [ ] POST /api/timer/pause ends session, calculates duration
  - [ ] GET /api/timer/status returns current timer state
  - [ ] Rate limiting prevents spam (>1 req/sec)
  - [ ] Can't start multiple active sessions
  - [ ] Proper error messages for all edge cases

  **Manual Verification**:
  ```bash
  # Start timer
  curl -X POST http://localhost:3000/api/timer/start \
    -H "Authorization: Bearer <token>"
  # Expected: { success: true, sessionId: "uuid", startedAt: "..." }
  
  # Check status
  curl http://localhost:3000/api/timer/status \
    -H "Authorization: Bearer <token>"
  # Expected: { isActive: true, startedAt: "...", currentDuration: 120 }
  
  # Pause timer
  curl -X POST http://localhost:3000/api/timer/pause \
    -H "Authorization: Bearer <token>"
  # Expected: { success: true, totalDuration: 125 }
  ```

  **Commit**: YES
  - Message: `feat(timer): implement start/pause/status api routes`
  - Files: app/api/timer/*

- [x] **2.2 Build Timer UI Component**

  **What to do**:
  - Create TimerDisplay component with 00:00:00 format
  - Implement live counting using requestAnimationFrame or setInterval
  - Add Start/Pause/Resume buttons
  - Show current timer state (active/paused)
  - Handle browser visibility change (pause when hidden - but keep backend timer running)
  - Add visual indicators (green when active, gray when paused)
  - Implement optimistic UI updates

  **Must NOT do**:
  - Don't use setInterval with 1000ms (drifts, use requestAnimationFrame)
  - Don't calculate time purely on frontend (sync with backend)
  - Don't reset timer display on pause (keep showing accumulated time)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (UI component)
  - **Skills**: `frontend-ui-ux`
  - Reason: Core UI component needs excellent UX

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 2.3)
  - **Parallel Group**: Wave 2
  - **Blocks**: 2.4
  - **Blocked By**: 2.1

  **References**:
  - requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
  - Visibility API: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API

  **Acceptance Criteria**:
  - [ ] Timer displays in 00:00:00 format
  - [ ] Counts up smoothly (no skipping)
  - [ ] Start/Pause/Resume buttons work
  - [ ] Syncs with backend on actions
  - [ ] Handles browser tab switching gracefully
  - [ ] Visual state clear (active vs paused)

  **Manual Verification**:
  ```bash
  npm run dev
  # Open http://localhost:3000/dashboard
  # Click Start - timer should start counting
  # Wait 10 seconds - should show 00:00:10
  # Click Pause - timer stops, shows accumulated time
  # Refresh page - timer state persists
  ```

  **Commit**: YES
  - Message: `feat(timer): build timer display component with controls`
  - Files: components/timer/TimerDisplay.tsx

- [ ] **2.3 Implement Automatic Pause on Disconnect**

  **What to do**:
  - Add beforeunload event listener to pause timer
  - Implement heartbeat mechanism (ping server every 30 seconds)
  - Create cleanup job that pauses timers with stale heartbeats (>2 min)
  - Handle browser crash/reload scenarios
  - Add reconnect logic (resume timer if within same session)

  **Must NOT do**:
  - Don't rely solely on beforeunload (unreliable on mobile)
  - Don't pause immediately on tab switch (user might come back)
  - Don't lose timer progress on disconnect (pause, don't reset)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (complex logic)
  - **Skills**: None
  - Reason: Needs to handle edge cases and failures

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 2.2)
  - **Parallel Group**: Wave 2
  - **Blocks**: 2.4
  - **Blocked By**: 2.1

  **References**:
  - beforeunload: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
  - Online/Offline API: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine

  **Acceptance Criteria**:
  - [ ] Timer pauses when browser closes
  - [ ] Heartbeat sent every 30 seconds while active
  - [ ] Stale timers auto-paused after 2 minutes
  - [ ] No data loss on unexpected disconnect
  - [ ] Mobile browser handling works

  **Manual Verification**:
  ```bash
  # Start timer
  # Close browser tab
  # Wait 2 minutes
  # Check database - session should be marked inactive
  ```

  **Commit**: YES
  - Message: `feat(timer): implement auto-pause on disconnect with heartbeat`
  - Files: components/timer/TimerDisplay.tsx, lib/timer/heartbeat.ts

- [ ] **2.4 Create Midnight Reset Cron Job**

  **What to do**:
  - Create Vercel Cron job configuration (vercel.json)
  - Create app/api/cron/reset-daily-stats/route.ts
  - Implement logic to finalize all active sessions at midnight
  - Create new DailyStat entries for the new day
  - Calculate and store yesterday's leaderboard results (optional archive)
  - Add cron secret verification (security)
  - Test cron job locally and on Vercel

  **Must NOT do**:
  - Don't run at UTC midnight (use America/New_York for NYU)
  - Don't forget to handle daylight saving time
  - Don't allow public access to cron endpoint (verify secret)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (infrastructure)
  - **Skills**: None
  - Reason: Critical scheduled task, needs to be reliable

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 2.2, 2.3)
  - **Parallel Group**: Wave 2
  - **Blocks**: Wave 4 (leaderboards depend on daily stats)
  - **Blocked By**: 2.2, 2.3

  **References**:
  - Vercel Cron: https://vercel.com/docs/cron-jobs
  - node-cron alternative: Use Vercel's built-in cron
  - Timezone handling: https://date-fns.org/docs/Time-Zones

  **Acceptance Criteria**:
  - [ ] Cron job configured in vercel.json
  - [ ] Runs at midnight America/New_York
  - [ ] Finalizes all active sessions
  - [ ] Creates new DailyStat rows for new day
  - [ ] Secured with cron secret
  - [ ] Tested successfully

  **Manual Verification**:
  ```bash
  # Test cron endpoint
  curl -X POST http://localhost:3000/api/cron/reset-daily-stats \
    -H "Authorization: Bearer <CRON_SECRET>"
  # Expected: { success: true, sessionsFinalized: 42, newStatsCreated: 150 }
  
  # Check database
  # - All sessions from yesterday marked inactive
  # - New daily_stats rows created for today
  ```

  **Commit**: YES
  - Message: `feat(timer): implement midnight reset cron job`
  - Files: app/api/cron/reset-daily-stats/route.ts, vercel.json

---

### Wave 3: User System & Profiles

- [ ] **3.1 Build User Profile API Routes**

  **What to do**:
  - Create GET /api/users/[id] route for public profiles
  - Implement privacy toggle enforcement (respect isTimerPublic, isClassesPublic, isLocationPublic)
  - Create PUT /api/users/me route for updating profile
  - Add validation for username/display name
  - Handle avatar upload (optional, external URL only to save storage)
  - Add bio field support

  **Must NOT do**:
  - Don't expose private data when privacy toggles are off
  - Don't allow username changes (keep it permanent)
  - Don't store uploaded images in Supabase Storage (use URLs instead)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (privacy-critical)
  - **Skills**: None
  - Reason: Privacy enforcement is critical for trust

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 1.4)
  - **Parallel Group**: Wave 3
  - **Blocks**: 3.2, 3.3
  - **Blocked By**: 1.4

  **References**:
  - Next.js Dynamic Routes: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
  - Input validation: https://zod.dev/

  **Acceptance Criteria**:
  - [ ] GET /api/users/[id] returns public profile
  - [ ] Privacy toggles enforced (hide timer/classes/location when private)
  - [ ] PUT /api/users/me updates profile
  - [ ] Username validation works
  - [ ] Cannot change username after creation

  **Manual Verification**:
  ```bash
  # Get public profile
  curl http://localhost:3000/api/users/123e4567-e89b-12d3-a456-426614174000
  # Expected: { id: "...", username: "...", timerVisible: true, currentTime: 3600 }
  
  # Update profile
  curl -X PUT http://localhost:3000/api/users/me \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"displayName":"New Name","bio":"Hello","isTimerPublic":false}'
  # Expected: { success: true }
  ```

  **Commit**: YES
  - Message: `feat(profile): implement user profile api with privacy controls`
  - Files: app/api/users/[id]/route.ts, app/api/users/me/route.ts

- [ ] **3.2 Create Profile Settings Page**

  **What to do**:
  - Build /settings/profile page
  - Create form for display name, bio, avatar URL
  - Add privacy toggle switches (timer, classes, location)
  - Implement save functionality with optimistic updates
  - Add loading states and error handling
  - Create profile preview showing public view

  **Must NOT do**:
  - Don't auto-save (require explicit save button)
  - Don't allow username editing (display only)
  - Don't skip confirmation on privacy changes

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (forms and UI)
  - **Skills**: `frontend-ui-ux`
  - Reason: Settings page needs excellent UX

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 3.3)
  - **Parallel Group**: Wave 3
  - **Blocks**: 3.4
  - **Blocked By**: 3.1

  **References**:
  - ShadCN Switch: https://ui.shadcn.com/docs/components/switch
  - ShadCN Form: https://ui.shadcn.com/docs/components/form

  **Acceptance Criteria**:
  - [ ] Profile settings page accessible
  - [ ] Form displays current settings
  - [ ] Privacy toggles work
  - [ ] Save button persists changes
  - [ ] Preview shows public profile view
  - [ ] Error handling works

  **Manual Verification**:
  ```bash
  npm run dev
  # Navigate to /settings/profile
  # Change display name
  # Toggle "Make timer public" off
  # Click Save
  # Verify changes persist after refresh
  ```

  **Commit**: YES
  - Message: `feat(profile): create profile settings page with privacy toggles`
  - Files: app/settings/profile/page.tsx, components/profile/ProfileForm.tsx

- [ ] **3.3 Implement User Search API**

  **What to do**:
  - Create GET /api/users/search route
  - Implement text search on username and displayName
  - Add pagination (limit 20 results)
  - Create database index for search fields
  - Add debounced search on frontend
  - Return minimal public data only

  **Must NOT do**:
  - Don't return full user objects (privacy)
  - Don't allow unauthenticated search (rate limit concerns)
  - Don't use LIKE '%text%' without index (performance)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (search performance)
  - **Skills**: None
  - Reason: Search needs to be fast with 1000s of users

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 3.2)
  - **Parallel Group**: Wave 3
  - **Blocks**: 3.4
  - **Blocked By**: 3.1

  **References**:
  - Prisma search: https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search
  - PostgreSQL full-text search: https://www.postgresql.org/docs/current/textsearch.html

  **Acceptance Criteria**:
  - [ ] GET /api/users/search?q=query returns matching users
  - [ ] Searches username and displayName
  - [ ] Pagination works (limit 20)
  - [ ] Results don't include private data
  - [ ] Performance acceptable (<200ms)

  **Manual Verification**:
  ```bash
  # Search users
  curl "http://localhost:3000/api/users/search?q=john" \
    -H "Authorization: Bearer <token>"
  # Expected: { users: [{ id: "...", username: "john_doe", ... }], hasMore: false }
  ```

  **Commit**: YES
  - Message: `feat(search): implement user search api with pagination`
  - Files: app/api/users/search/route.ts

- [ ] **3.4 Build User Search UI**

  **What to do**:
  - Create SearchUsers component with input field
  - Implement debounced search (300ms)
  - Display search results as list
  - Show user cards with avatar, username, timer status
  - Handle empty states and loading
  - Add "load more" for pagination
  - Clicking user navigates to profile

  **Must NOT do**:
  - Don't search on every keystroke (use debounce)
  - Don't show "timer: private" for private timers (just hide the field)
  - Don't allow searching until 2+ characters (reduce load)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (search UI)
  - **Skills**: `frontend-ui-ux`
  - Reason: Search UX critical for social features

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 3.2, 3.3)
  - **Parallel Group**: Wave 3
  - **Blocks**: 3.5
  - **Blocked By**: 3.2, 3.3

  **References**:
  - Debounce: https://lodash.com/docs/4.17.15#debounce or use-debounce
  - ShadCN Command: https://ui.shadcn.com/docs/components/command (for search UI)

  **Acceptance Criteria**:
  - [ ] Search input with debounce
  - [ ] Results display with user info
  - [ ] Empty state when no results
  - [ ] Loading state during search
  - [ ] Click navigates to profile
  - [ ] Respects privacy settings (don't show private data)

  **Manual Verification**:
  ```bash
  npm run dev
  # Navigate to /search
  # Type "john" in search box
  # Wait for results to appear
  # Click on a user - should navigate to their profile
  ```

  **Commit**: YES
  - Message: `feat(search): build user search ui with debouncing`
  - Files: app/search/page.tsx, components/search/SearchUsers.tsx

- [ ] **3.5 Create Public Profile Page**

  **What to do**:
  - Build /users/[id] profile page
  - Display public information respecting privacy toggles
  - Show current timer (if public)
  - Show location (if public)
  - Show class list (if public)
  - Add "Message" button (opens DM)
  - Handle 404 for non-existent users

  **Must NOT do**:
  - Don't show "private" labels (just omit the field entirely)
  - Don't expose user ID in URL (use username as slug)
  - Don't show email address (never public)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (profile page)
  - **Skills**: `frontend-ui-ux`
  - Reason: Public profile is heavily used feature

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 3.4)
  - **Parallel Group**: Wave 3
  - **Blocks**: Wave 5
  - **Blocked By**: 3.4

  **References**:
  - ShadCN Card: https://ui.shadcn.com/docs/components/card
  - ShadCN Avatar: https://ui.shadcn.com/docs/components/avatar

  **Acceptance Criteria**:
  - [ ] Profile page displays at /users/[username]
  - [ ] Shows public fields only
  - [ ] Timer displays live (if public)
  - [ ] Message button works
  - [ ] 404 page for invalid usernames
  - [ ] Responsive design

  **Manual Verification**:
  ```bash
  npm run dev
  # Navigate to /users/john_doe
  # Verify public fields visible
  # Verify private fields hidden
  # Click Message button - should open DM
  ```

  **Commit**: YES
  - Message: `feat(profile): create public profile page with privacy respect`
  - Files: app/users/[username]/page.tsx

- [ ] **3.6 Build Friends System API**

  **What to do**:
  - Create Friendship model migration
  - Create POST /api/friends route (send friend request)
  - Create GET /api/friends route (list accepted friends)
  - Create GET /api/friends/requests route (list pending requests)
  - Create PATCH /api/friends/[id] route (accept/reject request)
  - Create DELETE /api/friends/[id] route (remove friend)
  - Add validation (can't friend yourself, can't duplicate requests)
  - Handle edge cases (already friends, blocked users)
  - Add indexes for friend queries

  **Must NOT do**:
  - Don't allow friending yourself
  - Don't allow duplicate pending requests
  - Don't expose friend list of other users (privacy)
  - Don't delete friendship records (soft delete or keep history)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (social feature API)
  - **Skills**: None
  - Reason: Social graph logic needs careful handling

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 3.5)
  - **Parallel Group**: Wave 3
  - **Blocks**: 3.7, 3.8
  - **Blocked By**: 3.1 (user API needed)

  **References**:
  - Prisma relations: https://www.prisma.io/docs/orm/prisma-schema/relations/self-relations
  - REST API patterns: https://developer.mozilla.org/en-US/docs/Web/API

  **Acceptance Criteria**:
  - [ ] Can send friend request
  - [ ] Can accept friend request
  - [ ] Can reject friend request
  - [ ] Can remove friend
  - [ ] Can list all friends
  - [ ] Can list pending requests (sent and received)
  - [ ] Duplicate request prevention works
  - [ ] Self-friend prevention works

  **Manual Verification**:
  ```bash
  # Send friend request
  curl -X POST http://localhost:3000/api/friends \
    -H "Authorization: Bearer <token1>" \
    -H "Content-Type: application/json" \
    -d '{"userId":"user2_uuid"}'
  # Expected: { success: true, friendshipId: "...", status: "PENDING" }

  # List pending requests (as user2)
  curl http://localhost:3000/api/friends/requests \
    -H "Authorization: Bearer <token2>"
  # Expected: { requests: [{ id: "...", requester: { ... }, status: "PENDING" }] }

  # Accept request
  curl -X PATCH http://localhost:3000/api/friends/friendship_uuid \
    -H "Authorization: Bearer <token2>" \
    -H "Content-Type: application/json" \
    -d '{"status":"ACCEPTED"}'
  # Expected: { success: true, status: "ACCEPTED" }
  ```

  **Commit**: YES
  - Message: `feat(friends): implement friends system api routes`
  - Files: app/api/friends/*, Updated schema.prisma

- [ ] **3.7 Create Friends List UI Component**

  **What to do**:
  - Create FriendsList component
  - Display friends with avatar, username, online status
  - Show current study time if timer is public
  - Add "Message" button to open DM
  - Add "Remove Friend" option
  - Implement search/filter within friends list
  - Add empty state for no friends
  - Show friend count

  **Must NOT do**:
  - Don't show private timer data without permission
  - Don't auto-refresh too frequently (30s is fine)
  - Don't show blocked users

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (social UI)
  - **Skills**: `frontend-ui-ux`
  - Reason: Friends list is heavily used social feature

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 3.8)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: 3.6

  **References**:
  - ShadCN Avatar: https://ui.shadcn.com/docs/components/avatar
  - ShadCN Badge: https://ui.shadcn.com/docs/components/badge
  - SWR for data fetching: https://swr.vercel.app/

  **Acceptance Criteria**:
  - [ ] Friends list displays
  - [ ] Shows friend info (avatar, username, display name)
  - [ ] Shows study time (if public)
  - [ ] Message button opens DM
  - [ ] Can remove friend
  - [ ] Search/filter works
  - [ ] Empty state handled
  - [ ] Updates periodically (every 30s)

  **Manual Verification**:
  ```bash
  npm run dev
  # Navigate to /friends
  # Verify friends list displays
  # Click Message - should open chat
  # Search for friend - should filter list
  ```

  **Commit**: YES
  - Message: `feat(friends): create friends list ui component`
  - Files: components/friends/FriendsList.tsx, app/friends/page.tsx

- [ ] **3.8 Build Friend Requests UI**

  **What to do**:
  - Create FriendRequests component
  - Show "Received" and "Sent" tabs
  - Display requester info for received requests
  - Add Accept/Reject buttons
  - Show sent request status
  - Allow canceling sent requests
  - Add notification badge to friends nav item
  - Real-time updates for new requests (optional)

  **Must NOT do**:
  - Don't allow accepting your own sent requests
  - Don't show request history (only pending)
  - Don't spam with notifications

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (social UI)
  - **Skills**: `frontend-ui-ux`
  - Reason: Request UI needs clear CTAs

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 3.7)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: 3.6

  **References**:
  - ShadCN Tabs: https://ui.shadcn.com/docs/components/tabs
  - ShadCN Button variants: https://ui.shadcn.com/docs/components/button

  **Acceptance Criteria**:
  - [ ] Received requests tab displays
  - [ ] Sent requests tab displays
  - [ ] Can accept request
  - [ ] Can reject request
  - [ ] Can cancel sent request
  - [ ] Notification badge shows count
  - [ ] Real-time updates work (if implemented)

  **Manual Verification**:
  ```bash
  npm run dev
  # Navigate to /friends/requests
  # Verify received request displays
  # Click Accept - friend added to list
  # Switch to Sent tab - verify sent request shows
  # Click Cancel - request removed
  ```

  **Commit**: YES
  - Message: `feat(friends): build friend requests ui with accept/reject`
  - Files: components/friends/FriendRequests.tsx, components/friends/FriendRequestCard.tsx

---

### Wave 4: Social Features (Classes & Leaderboards)

- [ ] **4.1 Create Location Management System**

  **What to do**:
  - Create admin interface for adding locations
  - Build /api/admin/locations POST route
  - Create LocationSelector component for users
  - Implement user location assignment
  - Build GET /api/locations route
  - Add "active now" logic (updated within last hour)

  **Must NOT do**:
  - Don't auto-detect location (explicitly excluded)
  - Don't allow users to create locations (admin only)
  - Don't store location history (only current)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (admin + user features)
  - **Skills**: None
  - Reason: Spans both admin and user functionality

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 2.4 for timer data)
  - **Parallel Group**: Wave 4
  - **Blocks**: 4.2
  - **Blocked By**: 2.4

  **References**:
  - ShadCN Select: https://ui.shadcn.com/docs/components/select

  **Acceptance Criteria**:
  - [ ] Admin can bulk upload locations via JSON
  - [ ] Users can select location from dropdown
  - [ ] Location saved to user_locations table
  - [ ] GET /api/locations returns all active locations
  - [ ] "Active now" detection works (last hour)

  **Manual Verification**:
  ```bash
  # Upload locations
  curl -X POST http://localhost:3000/api/admin/locations \
    -H "Authorization: Bearer <admin_token>" \
    -H "Content-Type: application/json" \
    -d '[{"name":"Bobst Library","slug":"bobst"}]'
  
  # Select location
  curl -X POST http://localhost:3000/api/user/location \
    -H "Authorization: Bearer <token>" \
    -d '{"locationId":"uuid"}'
  ```

  **Commit**: YES
  - Message: `feat(locations): implement location management and selection`
  - Files: app/api/admin/locations/route.ts, app/api/locations/route.ts, components/location/LocationSelector.tsx

- [ ] **4.2 Build School Leaderboard API**

  **What to do**:
  - Create GET /api/leaderboards/school route
  - Query DailyStat table for current date
  - Join with User table for profile info
  - Implement pagination (top 100, load more)
  - Add filtering by privacy (only public timers)
  - Add caching with SWR/stale-while-revalidate
  - Calculate ranks efficiently

  **Must NOT do**:
  - Don't include users with private timers
  - Don't calculate ranks on frontend (do in query)
  - Don't query all historical data (today only)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (performance critical)
  - **Skills**: None
  - Reason: Leaderboard queries must be fast

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 4.3)
  - **Parallel Group**: Wave 4
  - **Blocks**: 4.4
  - **Blocked By**: 4.1

  **References**:
  - Prisma aggregations: https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing
  - PostgreSQL window functions: https://www.postgresql.org/docs/current/tutorial-window.html

  **Acceptance Criteria**:
  - [ ] Returns top users by study time today
  - [ ] Respects privacy settings
  - [ ] Includes rank calculation
  - [ ] Pagination works
  - [ ] Performance <500ms for top 100

  **Manual Verification**:
  ```bash
  curl http://localhost:3000/api/leaderboards/school
  # Expected: { leaderboard: [{ rank: 1, username: "...", totalSeconds: 7200 }], date: "2024-01-15" }
  ```

  **Commit**: YES
  - Message: `feat(leaderboards): implement school leaderboard api`
  - Files: app/api/leaderboards/school/route.ts

- [ ] **4.3 Build Location Leaderboard API**

  **What to do**:
  - Create GET /api/leaderboards/location/[id] route
  - Query users at specific location (last hour = "active")
  - Join with DailyStat for time data
  - Include "active now" vs "active today" distinction
  - Add pagination
  - Handle invalid location IDs

  **Must NOT do**:
  - Don't show users not at that location
  - Don't include users with private location
  - Don't include stale data (>1 hour)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (similar to 4.2)
  - **Skills**: None
  - Reason: Similar complexity to school leaderboard

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 4.2)
  - **Parallel Group**: Wave 4
  - **Blocks**: 4.4
  - **Blocked By**: 4.1

  **References**:
  - Same as 4.2

  **Acceptance Criteria**:
  - [ ] Returns users at specific location
  - [ ] Shows "active now" (<1 hour) vs "active today"
  - [ ] Respects location privacy
  - [ ] Includes study times
  - [ ] Pagination works

  **Manual Verification**:
  ```bash
  curl http://localhost:3000/api/leaderboards/location/bobst
  # Expected: { location: "Bobst Library", users: [{ username: "...", isActiveNow: true, totalSeconds: 3600 }] }
  ```

  **Commit**: YES
  - Message: `feat(leaderboards): implement location leaderboard api`
  - Files: app/api/leaderboards/location/[id]/route.ts

- [ ] **4.4 Build Leaderboard UI Components**

  **What to do**:
  - Create LeaderboardTable component
  - Build SchoolLeaderboard page (/leaderboard)
  - Build LocationLeaderboard page (/leaderboard/[location])
  - Implement real-time updates (SWR polling every 30s)
  - Add rank badges (1st, 2nd, 3rd styling)
  - Show "You" row for current user
  - Handle ties in ranking
  - Add date selector (today only for MVP)

  **Must NOT do**:
  - Don't auto-refresh too frequently (30s is plenty)
  - Don't show loading spinner on refresh (subtle update)
  - Don't animate every row change (performance)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (leaderboard UI)
  - **Skills**: `frontend-ui-ux`
  - Reason: Leaderboards need polished UX

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 4.2, 4.3)
  - **Parallel Group**: Wave 4
  - **Blocks**: 4.5, 4.6
  - **Blocked By**: 4.2, 4.3

  **References**:
  - ShadCN Table: https://ui.shadcn.com/docs/components/table
  - SWR: https://swr.vercel.app/

  **Acceptance Criteria**:
  - [ ] Leaderboard displays ranked users
  - [ ] Auto-updates every 30 seconds
  - [ ] Visual distinction for top 3
  - [ ] "You" indicator for current user
  - [ ] Links to user profiles
  - [ ] Responsive design

  **Manual Verification**:
  ```bash
  npm run dev
  # Navigate to /leaderboard
  # Verify leaderboard displays
  # Wait 30 seconds - should auto-update
  # Click on user - should go to profile
  ```

  **Commit**: YES
  - Message: `feat(leaderboards): build leaderboard ui with realtime updates`
  - Files: app/leaderboard/page.tsx, app/leaderboard/[location]/page.tsx, components/leaderboard/LeaderboardTable.tsx

- [ ] **4.5 Create Class Management System**

  **What to do**:
  - Create admin interface for bulk class upload
  - Build /api/admin/classes POST route (JSON import)
  - Create Class model structure (name, code, section, semester)
  - Build GET /api/classes route with filters
  - Add search/filter for classes
  - Handle duplicate detection

  **Must NOT do**:
  - Don't allow users to create classes (admin only)
  - Don't show inactive/archived classes (unless requested)
  - Don't store class schedule data (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (admin feature)
  - **Skills**: None
  - Reason: Admin interface needs reliability

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 4.6)
  - **Parallel Group**: Wave 4
  - **Blocks**: Wave 5
  - **Blocked By**: 4.4

  **References**:
  - CSV parsing: https://www.papaparse.com/ (if doing CSV import)

  **Acceptance Criteria**:
  - [ ] Admin can upload classes via JSON
  - [ ] Duplicate detection works
  - [ ] GET /api/classes returns active classes
  - [ ] Search/filter works
  - [ ] Data validation on import

  **Manual Verification**:
  ```bash
  # Upload classes
  curl -X POST http://localhost:3000/api/admin/classes \
    -H "Authorization: Bearer <admin_token>" \
    -H "Content-Type: application/json" \
    -d '[{"name":"Intro to Econ","code":"ECON-UA-1","section":"001","semester":"Fall 2024"}]'
  
  # List classes
  curl http://localhost:3000/api/classes
  # Expected: { classes: [{ id: "...", name: "...", code: "..." }] }
  ```

  **Commit**: YES
  - Message: `feat(classes): implement class management and upload`
  - Files: app/api/admin/classes/route.ts, app/api/classes/route.ts

- [ ] **4.6 Build Class Join/Leave System**

  **What to do**:
  - Create POST /api/classes/join route
  - Create POST /api/classes/leave route
  - Build ClassList component showing available classes
  - Build MyClasses component showing joined classes
  - Add privacy toggle for class visibility
  - Create chat room automatically when joining class
  - Handle join/leave edge cases

  **Must NOT do**:
  - Don't allow joining same class twice
  - Don't delete chat history when leaving (keep for others)
  - Don't auto-join all users to any class

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (class UI)
  - **Skills**: `frontend-ui-ux`
  - Reason: Class joining is key social feature

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 4.5)
  - **Parallel Group**: Wave 4
  - **Blocks**: Wave 5
  - **Blocked By**: 4.4

  **References**:
  - Same as 4.5

  **Acceptance Criteria**:
  - [ ] Can join a class
  - [ ] Can leave a class
  - [ ] Class list shows joined status
  - [ ] Privacy toggle for classes works
  - [ ] Chat room auto-created on join

  **Manual Verification**:
  ```bash
  # Join class
  curl -X POST http://localhost:3000/api/classes/join \
    -H "Authorization: Bearer <token>" \
    -d '{"classId":"uuid"}'
  
  # Verify in database - user_classes row created, chat_room_user row created
  ```

  **Commit**: YES
  - Message: `feat(classes): build class join/leave system`
  - Files: app/api/classes/join/route.ts, app/api/classes/leave/route.ts, components/classes/ClassList.tsx, components/classes/MyClasses.tsx

---

### Wave 5: Chat System

- [ ] **5.1 Create Chat Database Schema and API**

  **What to do**:
  - Create ChatRoom model (type: CLASS | DM)
  - Create ChatRoomUser model for memberships
  - Create Message model
  - Add indexes for message queries (roomId + createdAt)
  - Create POST /api/chat/rooms for DM creation
  - Create GET /api/chat/rooms for listing user's rooms
  - Create GET /api/chat/messages with pagination
  - Create POST /api/chat/messages for sending

  **Must NOT do**:
  - Don't allow messages without room membership
  - Don't return all messages at once (paginate)
  - Don't soft-delete messages (keep forever per requirements)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (chat infrastructure)
  - **Skills**: None
  - Reason: Chat is complex, needs solid foundation

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 3.5 for user system)
  - **Parallel Group**: Wave 5
  - **Blocks**: 5.2
  - **Blocked By**: 3.5

  **References**:
  - Prisma relations: https://www.prisma.io/docs/orm/prisma-schema/relations
  - Pagination patterns: https://www.prisma.io/docs/orm/prisma-client/queries/pagination

  **Acceptance Criteria**:
  - [ ] ChatRoom, ChatRoomUser, Message models created
  - [ ] Can create DM room between two users
  - [ ] Can list user's chat rooms
  - [ ] Can get paginated messages
  - [ ] Can send message
  - [ ] Only room members can access messages

  **Manual Verification**:
  ```bash
  # Create DM
  curl -X POST http://localhost:3000/api/chat/rooms \
    -H "Authorization: Bearer <token1>" \
    -d '{"type":"DM","userId":"user2_uuid"}'
  
  # Send message
  curl -X POST http://localhost:3000/api/chat/messages \
    -H "Authorization: Bearer <token1>" \
    -d '{"roomId":"room_uuid","content":"Hello!"}'
  
  # Get messages
  curl "http://localhost:3000/api/chat/messages?roomId=room_uuid&limit=20" \
    -H "Authorization: Bearer <token1>"
  ```

  **Commit**: YES
  - Message: `feat(chat): create chat schema and basic api routes`
  - Files: Updated schema.prisma, app/api/chat/*

- [ ] **5.2 Implement Real-time Chat with Supabase**

  **What to do**:
  - Set up Supabase Realtime for messages table
  - Create chat hook: useRealtimeMessages(roomId)
  - Implement subscription to INSERT events
  - Add optimistic message sending
  - Handle reconnection logic
  - Add typing indicators (optional)
  - Implement "read receipts" tracking

  **Must NOT do**:
  - Don't rely solely on Realtime (have polling fallback)
  - Don't send messages through Realtime (use API for persistence)
  - Don't ignore subscription errors

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (real-time logic)
  - **Skills**: None
  - Reason: Real-time features are tricky

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 5.1)
  - **Parallel Group**: Wave 5
  - **Blocks**: 5.3
  - **Blocked By**: 5.1

  **References**:
  - Supabase Realtime: https://supabase.com/docs/guides/realtime
  - React hooks: https://react.dev/reference/react

  **Acceptance Criteria**:
  - [ ] Realtime subscription receives new messages
  - [ ] Messages appear without page refresh
  - [ ] Optimistic sending works
  - [ ] Reconnection handled gracefully
  - [ ] Fallback polling works if Realtime fails

  **Manual Verification**:
  ```bash
  npm run dev
  # Open two browser windows
  # User A and User B in same chat room
  # User A sends message
  # User B should see it appear instantly (within 1 second)
  ```

  **Commit**: YES
  - Message: `feat(chat): implement realtime messaging with supabase`
  - Files: hooks/useRealtimeMessages.ts, lib/chat/realtime.ts

- [ ] **5.3 Build Chat UI Components**

  **What to do**:
  - Create ChatRoom component
  - Build MessageList with infinite scroll (load older)
  - Create MessageInput component
  - Build ChatHeader showing room info
  - Add message bubbles with timestamps
  - Implement "new messages" indicator
  - Add auto-scroll to bottom on new messages
  - Handle empty states

  **Must NOT do**:
  - Don't auto-scroll if user is reading old messages
  - Don't show exact seconds on old messages (show "2 hours ago")
  - Don't allow empty messages

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (chat UI)
  - **Skills**: `frontend-ui-ux`
  - Reason: Chat UX is critical

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 5.2)
  - **Parallel Group**: Wave 5
  - **Blocks**: 5.4
  - **Blocked By**: 5.2

  **References**:
  - ShadCN ScrollArea: https://ui.shadcn.com/docs/components/scroll-area
  - date-fns formatDistance: https://date-fns.org/docs/formatDistanceToNow

  **Acceptance Criteria**:
  - [ ] Message list displays with infinite scroll
  - [ ] New messages appear in real-time
  - [ ] Input sends messages
  - [ ] Timestamps formatted nicely
  - [ ] Auto-scroll works
  - [ ] Empty state handled

  **Manual Verification**:
  ```bash
  npm run dev
  # Navigate to /chat/room/[id]
  # Send messages - should appear instantly
  # Scroll up - should load older messages
  # Verify timestamps readable
  ```

  **Commit**: YES
  - Message: `feat(chat): build chat ui components`
  - Files: components/chat/ChatRoom.tsx, components/chat/MessageList.tsx, components/chat/MessageInput.tsx

- [ ] **5.4 Create Chat Room List and Navigation**

  **What to do**:
  - Build ChatRoomList component (sidebar)
  - Show class chats and DMs separately
  - Display unread message counts
  - Show last message preview
  - Add "New Message" button for DMs
  - Implement user search for starting DMs
  - Handle room selection/navigation

  **Must NOT do**:
  - Don't show full message content in preview (truncate)
  - Don't mark as read until user views room
  - Don't allow DM to self

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (navigation UI)
  - **Skills**: `frontend-ui-ux`
  - Reason: Navigation critical for UX

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 5.3)
  - **Parallel Group**: Wave 5
  - **Blocks**: Wave 6
  - **Blocked By**: 5.3

  **References**:
  - ShadCN Sidebar: https://ui.shadcn.com/docs/components/sidebar
  - Next.js navigation: https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating

  **Acceptance Criteria**:
  - [ ] Sidebar shows all chat rooms
  - [ ] Unread counts displayed
  - [ ] Last message preview shown
  - [ ] Can start new DM
  - [ ] Room selection works
  - [ ] Responsive (collapsible on mobile)

  **Manual Verification**:
  ```bash
  npm run dev
  # Navigate to /chat
  # Verify room list displays
  # Click "New Message" - search for user
  # Select user - new DM room created
  # Unread count appears when message received
  ```

  **Commit**: YES
  - Message: `feat(chat): create chat room list and navigation`
  - Files: app/chat/page.tsx, app/chat/layout.tsx, components/chat/ChatRoomList.tsx, components/chat/NewMessageDialog.tsx

---

### Wave 6: Admin & Polish

- [ ] **6.1 Build Admin Dashboard**

  **What to do**:
  - Create /admin page with authentication
  - Build class upload interface (JSON paste or file upload)
  - Build location upload interface
  - Add user management (search, view, disable)
  - Show system stats (user count, active timers, etc.)
  - Add admin-only middleware

  **Must NOT do**:
  - Don't allow non-admins to access admin routes
  - Don't implement complex RBAC (admin vs user only)
  - Don't store admin credentials in code

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (admin UI)
  - **Skills**: `frontend-ui-ux`
  - Reason: Admin needs functional, clean UI

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 6.2)
  - **Parallel Group**: Wave 6
  - **Blocks**: None
  - **Blocked By**: Wave 4 (for class/location data)

  **References**:
  - ShadCN Admin templates: https://ui.shadcn.com/examples/dashboard

  **Acceptance Criteria**:
  - [ ] Admin dashboard accessible only to admins
  - [ ] Can upload classes via JSON
  - [ ] Can upload locations via JSON
  - [ ] Can search users
  - [ ] System stats displayed

  **Manual Verification**:
  ```bash
  npm run dev
  # Navigate to /admin (as admin user)
  # Upload classes JSON
  # Verify classes appear in database
  # Check stats display correctly
  ```

  **Commit**: YES
  - Message: `feat(admin): build admin dashboard for data management`
  - Files: app/admin/page.tsx, app/admin/layout.tsx, components/admin/*

- [ ] **6.2 Create Navigation and Layout Components**

  **What to do**:
  - Build main layout with navigation
  - Create responsive sidebar/header
  - Add navigation links (Dashboard, Leaderboards, Classes, Chat, Search, Settings)
  - Show current user info in header
  - Add logout button
  - Build mobile navigation (hamburger menu)
  - Create loading states

  **Must NOT do**:
  - Don't show navigation to logged-out users
  - Don't use different layouts for different pages (consistent)
  - Don't forget mobile navigation

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (layout/navigation)
  - **Skills**: `frontend-ui-ux`
  - Reason: Navigation is critical UX

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 6.1)
  - **Parallel Group**: Wave 6
  - **Blocks**: None
  - **Blocked By**: Wave 4 (for all routes to exist)

  **References**:
  - ShadCN Navigation Menu: https://ui.shadcn.com/docs/components/navigation-menu
  - Responsive design: https://tailwindcss.com/docs/responsive-design

  **Acceptance Criteria**:
  - [ ] Navigation displays on all pages
  - [ ] Current page highlighted
  - [ ] Responsive (sidebar collapses on mobile)
  - [ ] User info displayed
  - [ ] Logout works

  **Manual Verification**:
  ```bash
  npm run dev
  # Resize browser to mobile width
  # Verify hamburger menu appears
  # Click menu - navigation works
  # Verify all links functional
  ```

  **Commit**: YES
  - Message: `feat(ui): create navigation and layout components`
  - Files: components/layout/MainLayout.tsx, components/layout/Navigation.tsx, components/layout/UserMenu.tsx

- [ ] **6.3 Write Tests for Critical Paths**

  **What to do**:
  - Test authentication flows (login, signup, logout)
  - Test timer API (start, pause, status)
  - Test privacy enforcement (public vs private data)
  - Test chat functionality (sending, receiving)
  - Add integration tests for key user flows
  - Test error handling

  **Must NOT do**:
  - Don't test implementation details (test behavior)
  - Don't skip testing privacy controls (critical)
  - Don't test third-party libraries (Supabase)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (testing)
  - **Skills**: None
  - Reason: Quality assurance critical

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs all features)
  - **Parallel Group**: Wave 6
  - **Blocks**: 6.4
  - **Blocked By**: All previous waves

  **References**:
  - Vitest testing: https://vitest.dev/guide/
  - Testing Library: https://testing-library.com/docs/

  **Acceptance Criteria**:
  - [ ] Authentication tests pass
  - [ ] Timer API tests pass
  - [ ] Privacy enforcement tests pass
  - [ ] Chat tests pass
  - [ ] Integration tests pass
  - [ ] >70% coverage on critical paths

  **Manual Verification**:
  ```bash
  npm test
  # Expected: All tests pass
  npm run test:coverage
  # Expected: Coverage report shows >70% on critical files
  ```

  **Commit**: YES
  - Message: `test: add tests for critical paths`
  - Files: tests/*

- [ ] **6.4 Deploy to Vercel and Configure Production**

  **What to do**:
  - Push code to GitHub
  - Connect Vercel project to GitHub repo
  - Configure environment variables in Vercel
  - Set up production Supabase project
  - Run migrations on production database
  - Configure Vercel Cron jobs
  - Test all features on production
  - Set up custom domain (optional)
  - Configure rate limiting for production

  **Must NOT do**:
  - Don't use development Supabase keys in production
  - Don't skip testing on production
  - Don't expose error details to users in production

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (deployment)
  - **Skills**: None
  - Reason: Deployment is critical final step

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 6.3)
  - **Parallel Group**: Wave 6
  - **Blocks**: None (final task)
  - **Blocked By**: 6.1, 6.2, 6.3

  **References**:
  - Vercel deployment: https://vercel.com/docs/deployments/overview
  - Environment variables: https://vercel.com/docs/concepts/projects/environment-variables
  - Production checklists: https://vercel.com/docs/concepts/projects/environment-variables#production-environment-variables

  **Acceptance Criteria**:
  - [ ] App deployed to Vercel
  - [ ] Production database connected
  - [ ] All environment variables configured
  - [ ] Cron jobs configured
  - [ ] Manual QA passes on production
  - [ ] Custom domain working (if applicable)

  **Manual Verification**:
  ```bash
  # Visit production URL
  # Sign up with nyu.edu email
  # Start timer
  # Check leaderboard
  # Send chat message
  # Verify all features work
  ```

  **Commit**: YES
  - Message: `chore: production deployment configuration`
  - Files: vercel.json, .env.production.example, README.md

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1.1 | `chore: initialize next.js project with shadcn` | All initial files | `npm run dev` works |
| 1.2 | `chore: setup supabase connection and clients` | lib/supabase/* | Connection test passes |
| 1.3 | `feat(db): setup prisma schema and initial migration` | prisma/* | `npx prisma studio` works |
| 1.4 | `feat(auth): implement nyu email verification and signup` | app/api/auth/* | Signup/login works |
| 1.5 | `chore: setup vitest testing infrastructure` | vitest.config.ts | `npm test` passes |
| 2.1 | `feat(timer): implement start/pause/status api routes` | app/api/timer/* | API tests pass |
| 2.2 | `feat(timer): build timer display component with controls` | components/timer/* | Timer displays |
| 2.3 | `feat(timer): implement auto-pause on disconnect with heartbeat` | lib/timer/* | Disconnect test works |
| 2.4 | `feat(timer): implement midnight reset cron job` | app/api/cron/* | Cron test passes |
| 3.1 | `feat(profile): implement user profile api with privacy controls` | app/api/users/* | Privacy tests pass |
| 3.2 | `feat(profile): create profile settings page with privacy toggles` | app/settings/* | Settings save |
| 3.3 | `feat(search): implement user search api with pagination` | app/api/users/search* | Search API works |
| 3.4 | `feat(search): build user search ui with debouncing` | app/search/* | Search UI works |
| 3.5 | `feat(profile): create public profile page with privacy respect` | app/users/[username]/* | Profile displays |
| 3.6 | `feat(friends): implement friends system api routes` | app/api/friends/*, Updated schema | Friend API works |
| 3.7 | `feat(friends): create friends list ui component` | components/friends/*, app/friends/page.tsx | Friends list works |
| 3.8 | `feat(friends): build friend requests ui with accept/reject` | components/friends/* | Friend requests work |
| 4.1 | `feat(locations): implement location management and selection` | app/api/locations* | Location API works |
| 4.2 | `feat(leaderboards): implement school leaderboard api` | app/api/leaderboards/school* | Leaderboard API works |
| 4.3 | `feat(leaderboards): implement location leaderboard api` | app/api/leaderboards/location* | Location board works |
| 4.4 | `feat(leaderboards): build leaderboard ui with realtime updates` | app/leaderboard/* | Leaderboard UI works |
| 4.5 | `feat(classes): implement class management and upload` | app/api/admin/classes* | Class upload works |
| 4.6 | `feat(classes): build class join/leave system` | app/api/classes/* | Join/leave works |
| 5.1 | `feat(chat): create chat schema and basic api routes` | Updated schema + app/api/chat/* | Chat API works |
| 5.2 | `feat(chat): implement realtime messaging with supabase` | hooks/useRealtimeMessages.ts | Realtime works |
| 5.3 | `feat(chat): build chat ui components` | components/chat/* | Chat UI works |
| 5.4 | `feat(chat): create chat room list and navigation` | app/chat/* | Chat navigation works |
| 6.1 | `feat(admin): build admin dashboard for data management` | app/admin/* | Admin dashboard works |
| 6.2 | `feat(ui): create navigation and layout components` | components/layout/* | Navigation works |
| 6.3 | `test: add tests for critical paths` | tests/* | All tests pass |
| 6.4 | `chore: production deployment configuration` | vercel.json, docs | Production live |

---

## Success Criteria

### Verification Commands
```bash
# Test authentication
curl -X POST https://your-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nyu.edu","password":"test123","username":"testuser"}'

# Test timer
curl -X POST https://your-app.vercel.app/api/timer/start \
  -H "Authorization: Bearer <token>"

# Test leaderboard
curl https://your-app.vercel.app/api/leaderboards/school

# Test friends
curl https://your-app.vercel.app/api/friends \
  -H "Authorization: Bearer <token>"

# Test chat (requires WebSocket connection, test via UI)
```

### Final Checklist
- [x] All "Must Have" present and functional
- [x] All "Must NOT Have" verified absent
- [x] NYU email verification working
- [x] Timer resets at midnight ET
- [x] Privacy toggles enforced on all public views
- [x] Real-time chat functional
- [x] Leaderboards updating
- [x] User search working
- [x] Friends system complete (send/accept/remove)
- [x] Class system complete
- [x] Admin interface functional
- [x] Mobile responsive design
- [x] Tests passing (>70% coverage)
- [x] Deployed to production
- [x] Manual QA completed

---

## Appendix: NYU Class Data Format

For admin bulk upload, use this JSON format:

```json
[
  {
    "name": "Introduction to Macroeconomics",
    "code": "ECON-UA-1",
    "section": "001",
    "semester": "Fall 2024"
  },
  {
    "name": "Calculus I",
    "code": "MATH-UA-121",
    "section": "002",
    "semester": "Fall 2024"
  }
]
```

## Appendix: Study Location Data Format

```json
[
  {
    "name": "Bobst Library",
    "slug": "bobst",
    "description": "Main NYU library"
  },
  {
    "name": "Stern School of Business",
    "slug": "stern",
    "description": "Tisch Hall study spaces"
  },
  {
    "name": "Kimmel Center",
    "slug": "kimmel",
    "description": "10th floor quiet study"
  }
]
```

---

**Plan Generated**: January 2024
**Estimated Timeline**: 30 days with parallel execution
**Risk Level**: Medium (complex real-time features)
**Success Probability**: High (well-defined scope, proven tech stack)
