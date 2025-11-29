# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Peladeiros** is a soccer match management app (peladas) for Brazilian groups. Built with Next.js 15, React 19, and PostgreSQL (Neon), it enables group creation, match organization, team draws, statistics tracking, and player rankings.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Database**: Neon PostgreSQL Serverless with raw SQL (no ORM)
- **Database Client**: `@neondatabase/serverless`
- **Authentication**: NextAuth v5 (Auth.js) with credentials provider
- **Validation**: Zod
- **State Management**: Zustand
- **Logging**: Pino
- **Package Manager**: pnpm (`pnpm@10.18.1`)
- **Deployment**: Vercel

## Language Convention

- **User-facing content**: Brazilian Portuguese (pt-BR)
- **Code**: English (variable names, function names, comments)
- **Database**: English (table names, column names)

## Commands

### Development
```bash
pnpm dev          # Start dev server on http://localhost:3000
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Environment Setup
```bash
npx vercel env pull                        # Pull env vars from Vercel
neon sql < src/db/migrations/schema.sql    # Run migrations (if Neon CLI installed)
openssl rand -base64 32                    # Generate AUTH_SECRET
```

### Database Access
Use Neon Console UI or Neon CLI to execute SQL. The project does not include migration tooling.

## Architecture

### Authentication Flow

NextAuth v5 configuration in `src/lib/auth.ts`:
- **Provider**: Credentials (email/password)
- **Session**: JWT-based, 30-day expiry
- **Password**: bcrypt hashing
- **Helpers**: `getCurrentUser()` and `requireAuth()` in `src/lib/auth-helpers.ts`

API routes use `requireAuth()` to enforce authentication. Middleware in `src/middleware.ts` protects routes and redirects unauthenticated users to `/auth/signin`.

### Database Pattern

All database operations use raw SQL via `@neondatabase/serverless`:

```typescript
import { sql } from "@/db/client";

// Parameterized queries prevent SQL injection
const users = await sql`
  SELECT * FROM users WHERE email = ${email}
`;
```

Key tables:
- **users**: User accounts with password_hash
- **groups**: Soccer groups with privacy settings
- **group_members**: Membership with roles (admin/member), goalkeeper status, base_rating
- **events**: Scheduled matches with max_players limits
- **event_attendance**: RSVP system with waitlist and check-in
- **teams**: Drawn teams per event
- **team_members**: Players assigned to teams
- **event_actions**: Goals, assists, cards
- **votes**: Player voting system (replaces traditional ratings)
- **wallets/charges/transactions**: Financial tracking
- **invites**: Group invitation codes
- **venues**: Match locations

### API Route Pattern

Standard structure for API routes:

```typescript
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireAuth();

    const result = await sql`SELECT * FROM table`;

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "Não autenticado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    logger.error(error, "Error message");
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
```

### Server vs Client Components

- Default to React Server Components
- Add `'use client'` only when needed:
  - Using React hooks (useState, useEffect, etc.)
  - Browser APIs (localStorage, window)
  - Event handlers (onClick, onChange)
  - Third-party libraries requiring client-side rendering

### Middleware Protection

`src/middleware.ts` handles authentication flow:
- Public pages: `/` and `/simple-test`
- Auth pages: `/auth/signin`, `/auth/signup`, `/auth/error`
- Protected pages: All others require authentication
- API routes: Handle their own auth via `requireAuth()`

## Environment Variables

Required in `.env.local` (local) and Vercel (production):

```bash
DATABASE_URL=postgresql://...           # Neon connection string
AUTH_SECRET=...                         # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000     # App URL
```

Alternative names for NextAuth v5 compatibility:
- `AUTH_SECRET` (preferred) or `NEXTAUTH_SECRET`

## File Structure Conventions

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── groups/            # Group CRUD + rankings
│   │   ├── events/            # Event CRUD + RSVP, draw, actions, ratings
│   │   └── auth/              # NextAuth handler + signup endpoint
│   ├── auth/                   # Auth pages (signin, signup, error)
│   ├── dashboard/              # Main dashboard
│   └── groups/                 # Group and event pages (TBD)
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Layout components (headers, etc)
│   └── providers/              # React providers (AuthProvider)
├── db/
│   ├── client.ts              # Neon client export
│   └── migrations/
│       └── schema.sql         # Complete database schema
└── lib/
    ├── auth.ts                # NextAuth configuration
    ├── auth-helpers.ts        # getCurrentUser, requireAuth
    ├── logger.ts              # Pino logger setup
    ├── validations.ts         # Zod schemas
    ├── utils.ts               # Utility functions
    └── stores/                # Zustand stores
```

## Key Implementation Details

### User Registration

Signup endpoint at `src/app/api/auth/signup/route.ts`:
- Validates email/password with Zod
- Hashes password with bcrypt (10 rounds)
- Inserts into `users` table
- Creates user wallet automatically
- Returns success without auto-login (user must sign in)

### Group Creation Flow

When creating a group (`POST /api/groups`):
1. Insert group record
2. Add creator as admin in `group_members`
3. Create group wallet in `wallets`
4. Generate and store invite code in `invites`

### Event RSVP System

RSVP endpoint (`POST /api/events/[eventId]/rsvp`):
- Handles "yes", "no", "waitlist" statuses
- Enforces max_players and max_goalkeepers limits
- Automatically moves waitlist players when spots open
- Tracks order_of_arrival for fairness

### Team Draw Algorithm

Draw endpoint (`POST /api/events/[eventId]/draw`):
- Validates only checked-in players are drawn
- Separates goalkeepers from line players
- Random distribution with seed support for reproducibility
- Creates `teams` and `team_members` records
- Supports custom draw configurations per group (stored in group settings)

Team swap endpoint (`POST /api/events/[eventId]/teams/swap`):
- Allows swapping players between teams after draw
- Validates both players exist and belong to different teams

### Materialized View

`mv_event_scoreboard` provides real-time scoreboard:
- Automatically refreshed via trigger on `event_actions` changes
- Aggregates goals and assists per team
- Query via: `SELECT * FROM mv_event_scoreboard WHERE event_id = $1`

### Voting System

Replaces traditional player ratings with a voting-based system:
- Players vote for teammates after matches
- Statistics endpoints (`/api/groups/[groupId]/stats`, `/api/groups/[groupId]/my-stats`) aggregate votes
- Rankings based on votes received, goals, assists, and match participation

## Development Guidelines

### Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

Components are added to `src/components/ui/` and can be customized with Tailwind.

### Database Changes

1. Update `src/db/migrations/schema.sql`
2. Execute SQL in Neon Console or via CLI
3. Document changes with SQL comments
4. Update relevant types if needed

### Validation

Use Zod schemas from `src/lib/validations.ts`. Define new schemas there for consistency:

```typescript
export const exampleSchema = z.object({
  field: z.string().min(1, "Campo obrigatório"),
});
```

### Logging

Import and use Pino logger:

```typescript
import logger from "@/lib/logger";

logger.info({ userId, action }, "User performed action");
logger.error({ error, context }, "Error message");
```

### Error Handling

- Catch "Não autenticado" errors from `requireAuth()` and return 401
- Log all errors with Pino
- Return user-friendly Portuguese error messages
- Use appropriate HTTP status codes (400, 401, 403, 404, 500)

## Important Constraints

- **No ORM**: Use raw SQL only. Do not introduce Prisma, Drizzle, or other ORMs
- **No Force Push**: Git force push is not available for this repo
- **Portuguese UI**: All user-facing text must be in Brazilian Portuguese
- **Minimal Changes**: Make smallest changes necessary to accomplish tasks
- **No Generic Tests**: Only add tests if explicitly requested
- **Build Required**: Ensure `pnpm build` succeeds before committing

## Current Status (MVP - Phase 1)

Implemented features:
- ✅ User authentication (signup/signin)
- ✅ Group CRUD with roles and invites
- ✅ Event CRUD with venue support
- ✅ RSVP system with waitlist and check-in
- ✅ Admin RSVP management
- ✅ Team draw (random with configurable settings)
- ✅ Team swap functionality
- ✅ Match action recording (goals, assists, cards)
- ✅ Voting system (replaced traditional ratings)
- ✅ Rankings and statistics
- ✅ Financial management (charges, wallets, transactions)
- ✅ User search functionality

Planned (Phase 2+):
- Real-time scoreboard updates
- Push notifications
- Smart team draw (skill-based balancing)
- Advanced statistics and analytics
- Gamification features
- Mobile app

## Documentation References

- `README.md`: Quick start and setup
- `NEON_AUTH_GUIDE.md`: Complete auth setup guide
- `DATABASE_MIGRATION.md`: Migration from Stack Auth
- `.github/copilot-instructions.md`: Detailed conventions (used as source for this file)

## API Endpoints Overview

### Groups
- `POST /api/groups` - Create group
- `GET/PATCH/DELETE /api/groups/[groupId]` - Group CRUD
- `POST /api/groups/join` - Join group with invite code
- `GET /api/groups/[groupId]/members` - List members
- `POST /api/groups/[groupId]/members/create-user` - Create user and add to group
- `PATCH/DELETE /api/groups/[groupId]/members/[userId]` - Manage member
- `GET/POST /api/groups/[groupId]/invites` - Manage invites
- `DELETE /api/groups/[groupId]/invites/[inviteId]` - Delete invite
- `GET /api/groups/[groupId]/stats` - Group statistics
- `GET /api/groups/[groupId]/my-stats` - Current user stats in group
- `GET /api/groups/[groupId]/rankings` - Player rankings
- `GET/PATCH /api/groups/[groupId]/draw-config` - Team draw configuration
- `GET/PATCH /api/groups/[groupId]/event-settings` - Default event settings
- `GET/POST /api/groups/[groupId]/charges` - Financial charges
- `GET/PATCH/DELETE /api/groups/[groupId]/charges/[chargeId]` - Charge management

### Events
- `GET/POST /api/events` - List/create events
- `GET/PATCH/DELETE /api/events/[eventId]` - Event CRUD
- `POST /api/events/[eventId]/rsvp` - User RSVP
- `POST /api/events/[eventId]/admin-rsvp` - Admin manages RSVP for others
- `POST /api/events/[eventId]/draw` - Draw teams
- `GET /api/events/[eventId]/teams` - Get drawn teams
- `POST /api/events/[eventId]/teams/swap` - Swap players between teams
- `GET/POST/DELETE /api/events/[eventId]/actions` - Match actions (goals, assists, cards)
- `GET/POST /api/events/[eventId]/ratings` - Player voting

### Users
- `POST /api/auth/signup` - User registration
- `GET /api/users/search` - Search users by email/name

### Debug
- `GET /api/debug` - Debug endpoint for testing

## Deployment

Deploy via Vercel with Neon integration:
1. Connect GitHub repo to Vercel
2. Add Neon integration in Vercel dashboard
3. Environment variables are auto-configured
4. Run migrations manually in Neon Console
5. Verify build succeeds before deploying