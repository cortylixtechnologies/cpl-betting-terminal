

# CPL CTF Betting Terminal with Live Leaderboard

## Overview
Build the complete CPL CTF Betting Terminal from scratch — a cyberpunk-themed betting app with authentication, match betting, admin panel, and a live leaderboard. Since no backend exists yet, we'll use Lovable Cloud for database and auth.

## Step 1: Enable Lovable Cloud Backend
Set up Lovable Cloud for Supabase (auth + database). This gives us auth and a Postgres database without needing an external Supabase project.

## Step 2: Database Schema (Migrations)

**Tables to create:**

- `profiles` — `id (uuid, FK auth.users)`, `username`, `balance (default 10000)`, `created_at`
- `user_roles` — `id`, `user_id (FK auth.users)`, `role (app_role enum: admin/user)`
- `matches` — `id`, `match_code`, `team_a`, `team_b`, `odds_a`, `odds_b`, `status (UPCOMING/LIVE/FINISHED)`, `winner`, `created_at`
- `bets` — `id`, `user_id (FK auth.users)`, `match_id (FK matches)`, `team_picked`, `stake`, `potential_payout`, `status (PENDING/WON/LOST)`, `created_at`

RLS policies for each table. `has_role()` security definer function for admin checks.

**Seed data:** Two matches (CPL-001: UniCyberClub vs Warrior DIT, CPL-002: Salvatore vs Titans).

## Step 3: Cyberpunk Design System
Update `index.css` with dark cyberpunk theme:
- Background: deep dark navy/black
- Neon cyan (`180 100% 50%`), green, purple accents
- Scanline overlay CSS animation
- Glowing border utilities

## Step 4: Auth Pages
- `src/pages/Auth.tsx` — Login/Register form with username, email, password
- Auto-create profile with 10,000 TSH on signup (via DB trigger)
- Auth context/hook for session management

## Step 5: Core Components & Pages

| Component | Purpose |
|-----------|---------|
| `Navbar` | Navigation, balance display, logout |
| `MatchCard` | Show match info, odds, bet form |
| `BetHistory` | Table of user's bets with status badges |
| `Leaderboard` | Top bettors ranked by total winnings |
| `AdminPanel` | Match status control, bet settlement |

**Pages:**
- `/` — Home with match cards + betting
- `/leaderboard` — Live leaderboard
- `/admin` — Admin panel (role-gated)

## Step 6: Leaderboard (the requested feature)
- Query profiles joined with settled bets to compute total winnings
- Rank by total winnings descending, show top 20
- Display: rank, username, total winnings, number of bets won, win rate
- Real-time subscription on bets table to auto-refresh
- Cyberpunk-styled table with neon accents, animated rank badges for top 3

## Step 7: Betting Engine
- Select team on match card, enter stake amount
- Show potential payout (stake × odds)
- Deduct balance on bet placement
- Admin can settle: mark winner, update bet statuses, credit winners

## Technical Details
- Supabase client via `@supabase/supabase-js` (to be installed)
- Supabase realtime subscriptions for live updates on matches and bets
- React Query for data fetching/caching
- All existing shadcn/ui components will be reused
- Lucide icons for UI elements

