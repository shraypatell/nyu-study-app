# Draft: Dashboard Minimalist Redesign

## Requirements (confirmed)
- Use minimalist, high-contrast style inspired by provided screenshots.
- Main dashboard timer: minimalist, on white background.
- Remove "Focus Timer" heading and the "Study Timer / Track your study sessions..." copy.
- Total Today should be same font as main timer, smaller, placed under main timer.
- Play button should be minimalist (icon-only).
- Bottom widgets: three equal-size square color blocks; black text; no icons; keep current info.

## Technical Decisions
- Update dashboard layout in `src/app/dashboard/page.tsx`.
- Update timer UI in `src/components/timer/TimerContainer.tsx`.
- Update leaderboard and friends widgets to support minimal square styles in their components.

## Research Findings
- Timer is rendered in `src/components/timer/TimerContainer.tsx`.
- Dashboard layout uses `src/app/dashboard/page.tsx`.
- Widgets in `src/components/dashboard/DashboardLeaderboardWidget.tsx` and `src/components/dashboard/DashboardFriendsWidget.tsx`.

## Open Questions
- None yet.

## Scope Boundaries
- INCLUDE: dashboard page UI changes only; styling updates to matching components.
- EXCLUDE: backend/API changes; functional logic changes.
