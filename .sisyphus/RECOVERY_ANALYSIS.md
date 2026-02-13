# RALLY PROJECT ANALYSIS & RECOVERY PLAN

## Executive Summary

The git repository has become corrupted due to mixing mobile development files with the web app. The web app has been reverted to an old version (Feb 4), and there are schema/API mismatches preventing builds.

---

## What Went Wrong (Timeline)

### Feb 11-12: Mobile App Development
- Created `rally-mobile/` directory for React Native app
- **MISTAKE**: Also created mobile files at repo root (`.expo/`, `android/`, `ios/`, `node_modules/`, `app.json`)
- These files should ONLY be in `rally-mobile/`

### Feb 12: Git Confusion
- Commits mixed mobile files into web app repo
- Attempted to fix with `git reset` but used wrong syntax
- Lost track of which commits contained what

### Feb 13: Attempted Recovery
- Removed mobile files from root
- Accidentally reverted web app UI to Feb 4 version
- Broke Prisma schema / API route consistency
- Added Bearer token auth support (GOOD) but on broken schema

---

## Current State (CRITICAL ISSUES)

### 1. Build Failure
**Error**: `lastHeartbeatAt` field missing from Prisma schema
**File**: `src/app/api/cron/cleanup-stale-timers/route.ts`
**Cause**: This API route was added for mobile but the Prisma field wasn't added

### 2. Web App Reverted
**Current**: UI from commit `08f3fa3a` (Feb 4)
**Missing**: Recent features added after Feb 4
- Need to identify what features are missing

### 3. Git History Messy
- Multiple "fix" commits that undid each other
- Working tree has uncommitted mobile files
- Hard to trace what was lost

### 4. Schema/API Mismatch
- Some API routes reference fields that don't exist in schema
- Mobile auth helper exists (GOOD) but on wrong base

---

## RECOVERY PLAN

### Phase 1: Fix Immediate Build Error (URGENT)

Option A: Add missing field to Prisma schema
```prisma
model StudySession {
  // ... existing fields
  lastHeartbeatAt DateTime? @map("last_heartbeat_at")
}
```

Option B: Remove the broken API route
- Delete `src/app/api/cron/cleanup-stale-timers/route.ts`
- This was for mobile heartbeat feature

**RECOMMENDATION**: Option A if you want mobile heartbeat, Option B if not

### Phase 2: Restore Missing Web Features

Need to identify what was added between Feb 4 and Feb 11:
- Check commits `08f3fa3a` to `ded759b6`
- List all changed files
- Cherry-pick or re-apply those changes

### Phase 3: Proper Repository Structure

**GOAL**: Web app and mobile app as separate projects

**Current Structure (BAD)**:
```
Rally/                     <- Git repo root
├── nyu-study-app/         <- Web app
├── rally-mobile/          <- Mobile app
├── .expo/                 <- Mobile files in root (WRONG)
├── android/               <- Mobile files in root (WRONG)
└── ...
```

**Recommended Structure (GOOD)**:
```
Rally/                     <- Git repo root (monorepo)
├── apps/
│   ├── web/              <- Move nyu-study-app here
│   └── mobile/           <- Move rally-mobile here
├── packages/
│   └── shared/           <- Shared types, utils
├── .gitignore            <- Root gitignore
└── README.md
```

OR completely separate repos:
```
Rally/                     <- Web app repo
rally-mobile/             <- Mobile app (different folder, not in git)
```

### Phase 4: Mobile Development Strategy

Since mobile needs Bearer token auth (which we added), but web is working with cookies:

**Keep Both**:
- Web: Cookie-based auth (existing)
- Mobile: Bearer token auth (added)
- Backend: Support both (implemented in `auth.ts`)

**Mobile Directory**:
- Keep `rally-mobile/` in this repo
- Update root `.gitignore` to allow it
- Do NOT create mobile files at root level

---

## IMMEDIATE ACTION ITEMS

1. **Fix Build**: Decide on Prisma field or remove broken route
2. **Identify Missing Features**: List commits between Feb 4-11
3. **Test Web App**: Ensure https://rallystudy.app works
4. **Clean Git History**: Squash/fixup the messy commits
5. **Document**: Create clear separation between web and mobile

---

## DECISIONS NEEDED

1. **Do you want the mobile heartbeat feature?**
   - YES: Add `lastHeartbeatAt` to Prisma schema
   - NO: Delete the cleanup-stale-timers route

2. **What features were added after Feb 4?**
   - Need you to check or I can investigate
   - Dashboard improvements? Chat features? Timer changes?

3. **Repository structure preference?**
   - Keep both in one repo (monorepo)
   - Separate mobile to its own repo
   - Keep current structure but clean it up

4. **Deploy priority?**
   - Fix web app first (users are affected)
   - Then continue mobile development
   - Or pause mobile, fix web completely first

---

## WHAT I SHOULD HAVE DONE DIFFERENTLY

1. **Never create mobile files at repo root** - Should have kept everything in `rally-mobile/`
2. **Never use `git checkout` to restore files** - Should have used `git revert` or cherry-pick
3. **Always run build before pushing** - Would have caught the Prisma error
4. **Make smaller, atomic commits** - Easier to undo if something breaks
5. **Communicate better about risks** - Should have warned before major git operations

---

## NEXT STEPS

Awaiting your decisions on:
1. Prisma field (heartbeat feature yes/no)
2. Missing features to restore
3. Repository structure preference
4. Deploy priority

Then I will execute the fix properly with no more git mishaps.
