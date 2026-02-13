# Learnings: NYU Study App

## Task 2.3: Automatic Pause on Disconnect (Feb 11, 2026)

### Implementation Overview
Implemented a robust automatic pause system for study timer sessions to handle disconnects, crashes, and network issues.

### Key Changes

#### 1. Database Schema (`prisma/schema.prisma`)
- Added `lastHeartbeatAt` field to `StudySession` model to track client connectivity
- Added compound index on `[isActive, lastHeartbeatAt]` for efficient stale session queries
- Migration required: Run `npx prisma migrate dev --name add_last_heartbeat_at`

#### 2. Session Start (`src/app/api/timer/start/route.ts`)
- Initialize `lastHeartbeatAt` to current timestamp when starting a new session
- Ensures sessions have a baseline heartbeat timestamp from creation

#### 3. Heartbeat Endpoint (`src/app/api/timer/heartbeat/route.ts`)
- Updates `lastHeartbeatAt` timestamp for active sessions
- Client sends heartbeat every 30 seconds (already implemented in TimerContainer.tsx)
- Lightweight operation - only updates timestamp, no heavy computation

#### 4. Cleanup Job (`src/app/api/timer/cleanup/route.ts`)
- Fixed flawed logic that would pause ALL sessions older than 2 minutes
- Now correctly identifies stale sessions using heartbeat timestamps
- Pauses sessions where:
  - `lastHeartbeatAt` is older than 2 minutes, OR
  - `lastHeartbeatAt` is null AND `startedAt` is older than 2 minutes (fallback for legacy data)
- Properly calculates session duration and updates daily stats

#### 5. Cron Configuration (`vercel.json`)
- Added cron job to run cleanup every 2 minutes: `*/2 * * * *`
- Ensures stale timers are detected and paused quickly
- Balances responsiveness with API call limits (free tier friendly)

### How It Works

1. **Normal Operation**:
   - User starts timer → `lastHeartbeatAt` set to now
   - Every 30 seconds → heartbeat updates `lastHeartbeatAt`
   - User manually pauses → session ends normally

2. **Browser Close (Graceful)**:
   - `beforeunload` event fires → attempts to pause timer
   - If successful, no cleanup needed

3. **Browser Crash/Network Loss (Ungraceful)**:
   - Heartbeat stops being sent
   - After 2 minutes, cleanup cron job detects stale session
   - Session automatically paused with duration calculated
   - Daily stats updated correctly

4. **Mobile Browser Background**:
   - iOS/Android may suspend background tabs
   - Heartbeat stops → cleanup job catches it
   - No data loss, session paused at last known state

### Technical Decisions

1. **Why 30-second heartbeat interval?**
   - Balance between responsiveness and API call limits
   - 30s × 2 = 60 API calls per hour worst case (acceptable for free tier)
   - 2-minute stale threshold gives 4× heartbeat opportunities

2. **Why check `lastHeartbeatAt` instead of `startedAt`?**
   - Original implementation was flawed - would pause ALL sessions after 2 minutes
   - Heartbeat-based approach correctly identifies truly disconnected clients
   - Allows long study sessions (hours) to work properly

3. **Why fallback to `startedAt` when `lastHeartbeatAt` is null?**
   - Handles legacy sessions created before this feature
   - Handles edge case if session starts but first heartbeat fails
   - After migration + deployment, all new sessions will have `lastHeartbeatAt`

4. **Why not use WebSocket for real-time connection tracking?**
   - Adds infrastructure complexity (WebSocket server)
   - Not necessary - 2-minute detection window is acceptable
   - Polling approach is simpler, more reliable on mobile
   - Free tier friendly

### Testing Checklist

Before deploying to production:
- [ ] Run database migration: `npx prisma migrate deploy`
- [ ] Install dependencies: `npm install` (if not already done)
- [ ] Verify build passes: `npm run build`
- [ ] Test normal timer flow: start, heartbeat, manual pause
- [ ] Test disconnect scenario: start timer, close browser, wait 2+ min, check DB
- [ ] Test mobile: start timer, background app, wait 2+ min
- [ ] Verify cron job runs on Vercel (check deployment logs)

### Known Limitations

1. **Migration Required**:
   - Must run `npx prisma migrate dev` or `npx prisma migrate deploy` before code works
   - Without migration, TypeScript will fail to compile (missing `lastHeartbeatAt` field)

2. **2-Minute Detection Window**:
   - Sessions aren't paused immediately on disconnect
   - Up to 2 minutes of "phantom" active time possible
   - Acceptable tradeoff for simplicity and API call limits

3. **Cron Job Dependency**:
   - Relies on Vercel Cron (or equivalent) running reliably
   - If cron fails, stale sessions accumulate
   - Manual cleanup endpoint available: `POST /api/timer/cleanup`

4. **No Reconnect/Resume Logic**:
   - Once paused by cleanup job, session is ended
   - User must start new session to continue studying
   - Future enhancement: track session continuity for "resume" feature

### Deployment Steps

1. Commit changes to git
2. Push to deployment branch
3. Vercel will automatically:
   - Run `npm run build` (includes `prisma generate`)
   - Apply environment variables
   - Register cron jobs from `vercel.json`
4. After deployment, manually run migration:
   - SSH to database or use Prisma Studio
   - Run: `npx prisma migrate deploy`
   - Or: Use Vercel CLI/UI to run migration command

### Future Enhancements

1. **Session Resume**: Track session UUID in localStorage, allow resuming paused sessions within same day
2. **Better Mobile Handling**: Use Page Visibility API + Service Worker for more reliable mobile detection
3. **Real-time Dashboard**: Add WebSocket for live timer updates visible to friends
4. **Analytics**: Track disconnect frequency to identify network/UX issues
5. **Grace Period**: Add 30-second grace period before pausing (network blips)

### References

- Client-side implementation: `nyu-study-app/src/components/timer/TimerContainer.tsx` (lines 62-85)
- Heartbeat interval: 30 seconds
- Stale threshold: 2 minutes
- Cron interval: Every 2 minutes
## Task 2.3: Automatic Pause on Disconnect

### Implementation Summary (2026-02-11)

Successfully implemented automatic pause on disconnect for the study timer system using a heartbeat mechanism.

### Changes Made

1. **Schema Changes** (prisma/schema.prisma)
   - Added `lastHeartbeatAt DateTime?` field to StudySession model
   - Added composite index `@@index([isActive, lastHeartbeatAt])` for efficient stale session queries
   - Index is filtered for active sessions only to optimize performance

2. **Heartbeat API** (app/api/timer/heartbeat/route.ts)
   - Updated to actually update `lastHeartbeatAt` in database (was just returning success before)
   - Finds active session for authenticated user
   - Returns 404 if no active session exists
   - Updates lastHeartbeatAt timestamp on each heartbeat ping

3. **Session Start** (app/api/timer/start/route.ts)
   - Already initializes `lastHeartbeatAt` to current timestamp when creating session
   - No changes needed (was already implemented correctly)

4. **Cron Job** (app/api/cron/cleanup-stale-timers/route.ts) - NEW FILE
   - Created new cron endpoint with proper authentication using CRON_SECRET
   - Uses GET method (standard for Vercel cron jobs)
   - Finds sessions where `isActive = true` AND (`lastHeartbeatAt` is null OR older than 2 minutes)
   - Automatically pauses stale sessions and updates daily stats
   - Uses batch transaction for atomicity
   - Logs cleanup activity for monitoring

5. **Database Migration** (prisma/migrations/add_heartbeat_tracking.sql) - NEW FILE
   - Adds `last_heartbeat_at` column to study_sessions table
   - Creates filtered index for performance

### Heartbeat Flow

1. User starts timer → `lastHeartbeatAt` initialized to current time
2. Frontend sends heartbeat every 30 seconds (via TimerContainer.tsx - already implemented)
3. Heartbeat endpoint updates `lastHeartbeatAt` in database
4. Cron job runs every 2 minutes (needs to be configured in vercel.json)
5. Cron finds sessions with stale heartbeats (>2 min) and pauses them

### Key Design Decisions

- **30-second heartbeat interval**: Balance between accuracy and API call frequency (Supabase free tier consideration)
- **2-minute stale threshold**: Allows for network hiccups (4 missed heartbeats before considering session stale)
- **Filtered index**: Only indexes active sessions to reduce index size and improve query performance
- **Separate cron endpoint**: Uses CRON_SECRET auth instead of user auth, follows existing pattern from midnight-reset
- **Batch transactions**: Ensures atomic updates to sessions and daily stats

### Existing Frontend Implementation

The frontend (TimerContainer.tsx) already had the necessary implementation:
- beforeunload event listener to pause on browser close
- Heartbeat interval sending requests every 30s
- All frontend code was already correct

### Testing Required Before Deployment

1. Install dependencies: `npm install` in nyu-study-app directory
2. Run migration: Execute add_heartbeat_tracking.sql on Supabase database
3. Set CRON_SECRET environment variable in Vercel
4. Configure Vercel cron job in vercel.json:
   ```json
   {
     "crons": [{
       "path": "/api/cron/cleanup-stale-timers",
       "schedule": "*/2 * * * *"
     }]
   }
   ```
5. Test scenarios:
   - Start timer, close browser, wait 2+ minutes, verify session paused in DB
   - Start timer, lose network for 2+ minutes, verify session paused
   - Start timer, keep active, verify heartbeats updating lastHeartbeatAt
   - Test beforeunload handler with keepalive flag

### Potential Issues & Mitigations

1. **beforeunload unreliable on mobile**: Heartbeat mechanism handles this (cron cleanup)
2. **Network failures**: 2-minute grace period allows temporary failures
3. **Clock skew**: Server-side timestamps used throughout
4. **Race conditions**: Transactions ensure atomic updates

### Performance Considerations

- Filtered index on (isActive, lastHeartbeatAt) keeps index small
- Cron job only queries active sessions
- Batch operations reduce database round trips
- 30s heartbeat interval = max 2 requests/minute per active user

### Files Modified/Created

- Modified: prisma/schema.prisma
- Modified: src/app/api/timer/heartbeat/route.ts
- Created: src/app/api/cron/cleanup-stale-timers/route.ts
- Created: prisma/migrations/add_heartbeat_tracking.sql

### Next Steps

1. Apply database migration
2. Deploy to Vercel with CRON_SECRET configured
3. Configure Vercel cron schedule
4. Monitor logs for cleanup activity
5. Test with real users across different network conditions
