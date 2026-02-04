# UI Redesign Plan: NYU Study App

## TL;DR

> **Quick Summary**: Redesign the entire UI while keeping all backend and API behavior unchanged by limiting edits to UI-only files, introducing a new design system (colors/type/spacing), and updating each page and shared component in a controlled sequence.
>
> **Deliverables**:
> - New global design tokens in `src/app/globals.css`
> - Updated layout + navigation (`src/app/layout.tsx`, `src/components/layout/Navigation.tsx`)
> - Redesigned pages and widgets across all routes
> - Manual verification checklist + clean build

**Estimated Effort**: Large
**Parallel Execution**: NO (UI consistency requires sequential passes)
**Critical Path**: Tokens → Layout → Core pages → Secondary pages → Polish

---

## Context

### Original Request
Complete UI overhaul using Pencil.dev, while preserving all backend functionality and avoiding any API/DB changes.

### Confirmed Decisions
- Scope: all pages (full UI overhaul)
- Keep ShadCN + Tailwind; restyle only
- Manual verification only (no new tests)

### UI Surface Map (current)
**Pages (src/app/**/page.tsx)**:
- `/` (landing)
- `/login`, `/signup`
- `/dashboard`
- `/leaderboard`, `/leaderboard/[location]`
- `/friends`
- `/classes`
- `/chat`, `/chat/room/[id]`
- `/search`
- `/settings/profile`
- `/users/[id]`
- `/admin`

**Shared Components**:
- `src/components/layout/Navigation.tsx`
- `src/components/timer/TimerContainer.tsx`
- `src/components/location/LocationSelector.tsx`
- `src/components/leaderboard/LeaderboardTable.tsx`
- `src/components/dashboard/DashboardLeaderboardWidget.tsx`
- `src/components/dashboard/DashboardFriendsWidget.tsx`

**Design Tokens**:
- `src/app/globals.css` (Tailwind v4 + CSS variables)

---

## Work Objectives

### Core Objective
Deliver a fully redesigned UI across the entire app while preserving all backend behavior and API contracts.

### Must NOT Change (Guardrails)
- `src/app/api/**`
- `prisma/**`
- `src/lib/**` (unless it is purely UI-related)
- Response/request shapes of existing API endpoints

### Must Have
- All pages visually consistent with a new design system
- No 404s introduced by UI-only changes
- `npm run build` succeeds

---

## Verification Strategy (Manual Only)

**Build Checks**:
1. `npm run build`
2. `npm run lint`

**Manual Smoke Checks**:
- Login and signup screens render correctly
- Dashboard loads (timer, widgets, selectors)
- Leaderboards load and remain functional
- Friends list loads; chat button works
- Classes list loads; class chat opens correctly
- Chat list and chat room render
- Profile settings page loads and saves
- User profile page renders
- Search and Admin pages render

---

## Step-by-Step Execution Plan

### 0. UI-Only Guardrails (Pre-Work)
**Goal**: Prevent accidental backend changes.

**Steps**:
- Define allowlist of UI directories:
  - `src/app/**/page.tsx`
  - `src/components/**`
  - `src/app/globals.css`
- If Pencil.dev supports file scoping: restrict edits to allowlist paths.
- If Pencil.dev does NOT support scoping: run `git status` after every batch and revert changes outside allowlist.

**Acceptance**:
- No diffs under `src/app/api/**` or `prisma/**` throughout the redesign.

---

### 1. Visual Direction Selection
**Goal**: Choose one of 2–3 proposed UI directions before deep edits.

**Deliverable**: A single selected direction (palette, typography, spacing, mood).

---

### 2. Design Tokens + Global Styling
**Files**:
- `src/app/globals.css`

**Steps**:
- Define new palette (backgrounds, surfaces, text, accent)
- Set typography (font pairing, size scale)
- Adjust radius and spacing tokens

**Acceptance**:
- Base components update visually without breaking layout

---

### 3. Layout + Navigation
**Files**:
- `src/app/layout.tsx`
- `src/components/layout/Navigation.tsx`

**Steps**:
- Update layout shell and spacing
- Redesign nav interactions and hierarchy

**Acceptance**:
- Navigation still routes correctly

---

### 4. Landing + Auth
**Files**:
- `src/app/page.tsx`
- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`

**Acceptance**:
- Forms remain functional; no API changes

---

### 5. Dashboard + Widgets
**Files**:
- `src/app/dashboard/page.tsx`
- `src/components/timer/TimerContainer.tsx`
- `src/components/location/LocationSelector.tsx`
- `src/components/dashboard/DashboardLeaderboardWidget.tsx`
- `src/components/dashboard/DashboardFriendsWidget.tsx`

**Acceptance**:
- Timer controls still work
- Widgets render correctly and remain clickable

---

### 6. Classes
**Files**:
- `src/app/classes/page.tsx`

**Acceptance**:
- Join/leave and chat buttons still work

---

### 7. Leaderboards
**Files**:
- `src/app/leaderboard/page.tsx`
- `src/app/leaderboard/[location]/page.tsx`
- `src/components/leaderboard/LeaderboardTable.tsx`

**Acceptance**:
- Rankings render correctly; no data regressions

---

### 8. Friends
**Files**:
- `src/app/friends/page.tsx`

**Acceptance**:
- Friend search, requests, and chat button work

---

### 9. Chat
**Files**:
- `src/app/chat/page.tsx`
- `src/app/chat/room/[id]/page.tsx`

**Acceptance**:
- Chat list and message UI render correctly

---

### 10. Profile + User Pages
**Files**:
- `src/app/settings/profile/page.tsx`
- `src/app/users/[id]/page.tsx`

**Acceptance**:
- Save profile works; no validation regressions

---

### 11. Search + Admin
**Files**:
- `src/app/search/page.tsx`
- `src/app/admin/page.tsx`

**Acceptance**:
- Search results render; admin page loads

---

### 12. Final Polish + Responsive Pass
**Steps**:
- Check mobile/tablet layouts across core pages
- Adjust spacing/typography for consistency

**Acceptance**:
- `npm run build` passes
- Manual smoke checks all pass

---

## Execution Notes for Pencil.dev

- Restrict edits to UI allowlist only.
- After each batch, check `git status` to ensure no backend files changed.
- If backend files are touched, revert them before continuing.

---

## Handoff

Plan ready for execution by Sisyphus.
