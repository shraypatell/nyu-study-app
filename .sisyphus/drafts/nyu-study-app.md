# Draft: NYU Study App Planning

## Overview
Building a real-time study timer app for NYU students with social features, leaderboards, class chat, and location tracking.

---

## Confirmed Requirements

### Core Features
1. **Live Timer** - 00:00:00 format, resets at midnight daily
2. **User Accounts** - Sign up with verified NYU email (nyu.edu)
3. **Usernames** - Public usernames for profiles
4. **Daily School Leaderboard** - Ranked by study time, resets daily
5. **Public Profiles** - Live timer, location, classes visible to all
6. **User Search** - Find users by name
7. **Class System** - Join NYU classes, see classmates
8. **Class Chat** - Chat with classmates
9. **Location Tracking** - Home, Bobst, Stern, other NYU spots
10. **Location Leaderboards** - Who's studying where (active now/last hour)

### Technical Stack
- **Frontend**: Next.js (App Router), React, ShadCN UI
- **Backend**: TBD (to be decided)
- **Database**: TBD (to be decided)
- **Real-time**: TBD (to be decided)
- **Auth**: TBD (to be decided)

### Data That Needs to be Uploadable
- NYU class data (Class name, section, class code)
- Study location data (easy to add new spots)

---

## Technical Decisions Needed

### 1. Database Choice
**Options:**
- Supabase (PostgreSQL + Realtime)
- PlanetScale (MySQL)
- Firebase (Firestore)
- Self-hosted PostgreSQL

**Considerations:**
- Real-time requirements
- Cost (student budget)
- Scalability
- Ease of use

### 2. Real-time Architecture
**Options:**
- Supabase Realtime
- Ably/Pusher (managed)
- Custom WebSocket
- Server-Sent Events (SSE)
- Polling

**Considerations:**
- Cost effectiveness
- Battery life (mobile)
- Real-time needs (chat vs timer)

### 3. Authentication Strategy
**Options:**
- NextAuth.js
- Clerk
- Custom JWT
- Supabase Auth

**Considerations:**
- Email domain verification
- Username uniqueness
- Session management

### 4. Chat Architecture
**Options:**
- Supabase Realtime
- Ably/Pusher
- Serverless WebSocket (PartyKit, etc.)
- Custom WebSocket server

**Considerations:**
- Message persistence
- Real-time delivery
- Cost

### 5. Hosting/Deployment
**Options:**
- Vercel
- Railway
- Render
- Self-hosted

---

## Open Questions - ANSWERED

| Question | Answer |
|----------|--------|
| 1. Expected user count? | **1000s of users** |
| 2. Budget constraints? | **Free tier only** |
| 3. Mobile app needed? | **Responsive web only** (mobile app not needed now) |
| 4. Notifications? | **No notifications** |
| 5. Private messaging or only class chat? | **Both** (private DMs + class chat) |
| 6. Timer privacy controls? | **Yes** - Users can toggle timer, classes, location on/off individually |
| 7. Anonymous mode? | **No** - Always public profiles (with toggle controls) |
| 8. Study session history? | **Keep last 30 days** |
| 9. Chat message retention? | **Keep forever** |
| 10. Timer behavior on close? | **Pauses automatically** |
| 11. Manual pause/resume? | **Yes** - Users control throughout day |
| 12. Timer reset behavior? | **Counts up all day**, only resets at midnight |
| 13. Location selection? | **Manually selected** by user |
| 14. Multiple locations? | **No** - Only one location at a time |

---

## Architecture Decisions Made

### Critical Constraints
- **1000s of users** - Need scalable architecture
- **Free tier only** - Must use free-tier services (Supabase free, Vercel hobby, etc.)
- **Real-time features** - Live timer updates, chat, leaderboards
- **Privacy toggles** - Each feature (timer, classes, location) individually toggleable

### Recommendations (pending research results)
- **Database**: Supabase (PostgreSQL + free tier generous limits)
- **Auth**: Supabase Auth (built-in, free tier)
- **Real-time**: Supabase Realtime (free tier) + polling fallback
- **Hosting**: Vercel (hobby tier)
- **ORM**: Prisma (best with Supabase)

## Scope Boundaries

### IN Scope
- User auth with NYU email verification
- Live timer with pause/resume controls
- Daily midnight reset
- Public profiles with privacy toggles
- Daily school leaderboard
- Location-based leaderboards
- Class joining system
- Class chat (real-time)
- Private messaging (real-time)
- User search
- Admin interface for uploading class/location data
- Responsive web UI with ShadCN

### OUT Scope (explicitly excluded)
- Mobile native apps
- Push notifications
- Email notifications
- Automatic location detection (GPS)
- Video/audio chat
- File sharing in chat
- Study session analytics beyond 30 days
- Multiple school support (NYU only for now)
- Dark mode (can add later)
- Gamification beyond leaderboards

---

## Technical Architecture Decisions (To Be Finalized)

### Database Schema Overview
```
users
├── id (uuid)
├── email (verified nyu.edu)
├── username (unique)
├── created_at
└── profile settings (privacy toggles)

study_sessions
├── id
├── user_id
├── started_at
├── ended_at
├── duration_seconds
├── is_active
└── created_date (for daily grouping)

daily_stats
├── id
├── user_id
├── date
├── total_seconds
├── is_public
└── updated_at

locations
├── id
├── name ("Bobst", "Stern", etc.)
├── description
└── is_active

user_locations
├── id
├── user_id
├── location_id
├── is_public
└── updated_at (for "active now" detection)

classes
├── id
├── name
├── section
├── code
└── is_active

user_classes
├── id
├── user_id
├── class_id
├── is_public
└── joined_at

chat_rooms
├── id
├── type ("class" | "dm")
├── class_id (nullable)
├── user_1_id (for DM)
├── user_2_id (for DM)
└── created_at

messages
├── id
├── room_id
├── sender_id
├── content
├── created_at
└── read_by (array of user_ids)

leaderboards (view or cached table)
├── date
├── user_id
├── rank
├── total_seconds
└── location_id (for location boards)
```

### API Routes (Next.js App Router)
- `/api/auth/*` - Auth callbacks
- `/api/users/search` - Search users
- `/api/users/[id]` - Get user profile
- `/api/timer/start` - Start timer
- `/api/timer/pause` - Pause timer
- `/api/timer/status` - Get current timer status
- `/api/leaderboards/school` - Daily school leaderboard
- `/api/leaderboards/location/[id]` - Location leaderboard
- `/api/classes` - List classes
- `/api/classes/join` - Join class
- `/api/chat/rooms` - List chat rooms
- `/api/chat/messages` - Get messages
- `/ws/chat` - WebSocket for real-time chat

### Key Technical Challenges
1. **Midnight Reset Logic** - Cron job or edge function to reset daily stats
2. **"Active Now" Detection** - Heartbeat mechanism or last-updated timestamp
3. **Free Tier Limits** - Optimize queries, use caching, batch operations
4. **Privacy Toggles** - Filter all public queries based on user preferences
5. **Real-time at Scale** - Supabase Realtime has limits, need fallback strategy

---

## Research Results
*To be added when background agents complete*
