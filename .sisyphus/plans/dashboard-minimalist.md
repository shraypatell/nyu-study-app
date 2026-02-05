# Plan: Minimalist Dashboard + Global Typography/Color Alignment

## Goal
Make the dashboard (and global styling) match the minimalist reference: crisp white background, light-grey accent surfaces, lighter red/blue/yellow blocks, and a single font family matching the provided React example ("Helvetica Neue", Helvetica, Arial, sans-serif).

## Scope
In scope:
- Global typography: set all text to the same font family as the example.
- Global background: crisp white across the app.
- Accent surfaces: light-grey panels/cards/inputs/buttons/dropdowns.
- Dashboard: minimalist timer block and three equal-size color tiles with black text; lighter color tones.

Out of scope:
- Backend/API logic changes.
- New dependencies.

## Files to Update
- `src/app/globals.css` (fonts, background, component surface colors)
- `src/app/layout.tsx` (font variables if needed)
- `src/app/dashboard/page.tsx` (tile colors, layout if needed)
- `src/components/timer/TimerContainer.tsx` (timer typography and minimal controls)
- `src/components/dashboard/DashboardLeaderboardWidget.tsx`
- `src/components/dashboard/DashboardFriendsWidget.tsx`

## Steps
1. Global typography
   - Set `--font-sans` to "Helvetica Neue", Helvetica, Arial, sans-serif.
   - Ensure body and headings use the same font family.
2. Global background
   - Set `body` background to pure white (`#ffffff`).
3. Accent surfaces
   - Update `.glass-card`, `.glass-panel`, `.glass-chip`, `.glass-input`, `.glass-select`, `.glass-tablist` to light grey (`#f4f4f4`) with border `#e5e5e5`.
   - Remove remaining shadows/gradients (if any).
4. Dashboard tiles
   - Update three tiles to lighter red/blue/yellow (pastel) and black text.
5. Verify
   - Sanity check in dashboard for layout alignment and readability.

## Acceptance Criteria
- All text uses the same font family as the reference.
- Background is crisp white across the app.
- Surfaces are light grey, no gradients or shadows.
- Dashboard tiles are lighter colors and equal size with black text.

## Risks / Decisions Needed
- Exact pastel hex values for red/blue/yellow if you want precise matching.
