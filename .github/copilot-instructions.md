# Copilot Instructions - Peladeiros App

This repository contains a soccer match management app built with modern web technologies.

## Project Overview

**Peladeiros** is a platform for managing soccer matches (peladas) in Brazil, including group creation, match organization, team draw, statistics, and rankings.

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **Database**: Neon (PostgreSQL Serverless)
- **Database Client**: @neondatabase/serverless (Raw SQL, no ORM)
- **Authentication**: NextAuth v5
- **Validation**: Zod
- **Logging**: Pino
- **Deployment**: Vercel
- **Package Manager**: pnpm (packageManager: "pnpm@10.18.1")

### Language and Communication

- **Primary Language**: Brazilian Portuguese (pt-BR)
- All user-facing content, comments, and documentation should be in Portuguese
- Variable names, function names, and code should follow English conventions
- Database column names and table names are in English

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── groups/        # Groups CRUD
│   │   └── events/        # Events CRUD
│   │       └── [eventId]/ # Event-specific endpoints
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── db/                    # Database
│   ├── client.ts         # Neon client setup
│   └── schema.sql        # Database schema
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── logger.ts         # Pino logger
│   ├── utils.ts          # General utilities
│   └── validations.ts    # Zod schemas
└── middleware.ts          # Auth middleware
```

## Development Workflow

### Building

```bash
npm run build
```

Build command runs `next build`. The project must build successfully before deployment.

### Linting

```bash
npm run lint
```

Linting uses ESLint with Next.js configuration (`next/core-web-vitals` and `next/typescript`).

### Running Locally

```bash
npm run dev
```

Starts the development server on http://localhost:3000

### Testing

Currently, there is no test infrastructure set up in the project. Do not add tests unless specifically requested.

## Code Conventions

### TypeScript

- All new files should use TypeScript (`.ts` or `.tsx`)
- Enable strict mode features
- Use type inference where possible
- Prefer interfaces for object shapes
- Use Zod for runtime validation

### React/Next.js

- Use React Server Components by default
- Add `'use client'` directive only when necessary (interactive components, hooks, browser APIs)
- Use App Router conventions (not Pages Router)
- API routes should be in `app/api/` directory
- Follow Next.js file-based routing conventions

### Database

- Use raw SQL queries with the Neon serverless client
- No ORM is used in this project
- Database schema is defined in `src/db/schema.sql`
- Use parameterized queries to prevent SQL injection
- Example query pattern:
  ```typescript
  import { sql } from "@/db/client";
  const result = await sql`SELECT * FROM users WHERE id = ${userId}`;
  ```

### Styling

- Use Tailwind CSS utility classes
- Use shadcn/ui components from `@/components/ui`
- Follow the existing design system and color scheme
- Components should be responsive by default

### API Routes

- Use standard HTTP methods (GET, POST, PATCH, DELETE)
- Return proper HTTP status codes
- Use Zod for request validation
- Include error handling and logging
- Example structure:
  ```typescript
  import { NextRequest, NextResponse } from "next/server";
  import { sql } from "@/db/client";
  import { logger } from "@/lib/logger";
  
  export async function GET(request: NextRequest) {
    try {
      // Implementation
      return NextResponse.json({ data });
    } catch (error) {
      logger.error({ error }, "Error message");
      return NextResponse.json(
        { error: "Error message" },
        { status: 500 }
      );
    }
  }
  ```

### Error Handling

- Use try-catch blocks in API routes and server actions
- Log errors with Pino logger
- Return user-friendly error messages
- Include appropriate HTTP status codes

### Logging

- Use the Pino logger from `@/lib/logger`
- Log important operations and errors
- Include relevant context in log messages
- Example:
  ```typescript
  import { logger } from "@/lib/logger";
  logger.info({ userId, groupId }, "User joined group");
  logger.error({ error, userId }, "Failed to create event");
  ```

## Environment Variables

Required environment variables:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `NEXTAUTH_URL`: Application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Secret key for NextAuth (generate with `openssl rand -base64 32`)

Environment variables should be defined in:
- `.env.local` for local development (not committed)
- Vercel dashboard for production

## Database Schema

The database schema is in `src/db/schema.sql` and includes:

- **users**: User accounts
- **groups**: Soccer groups/communities
- **group_members**: Group membership with roles
- **venues**: Match locations
- **events**: Soccer matches/events
- **event_attendance**: RSVP and attendance tracking
- **teams**: Drawn teams for matches
- **team_members**: Players in teams
- **event_actions**: Match actions (goals, assists, etc.)
- **player_ratings**: Player performance ratings
- **invites**: Group invitation codes
- **wallets**: Group and user wallets
- **charges**: Payment charges
- **transactions**: Financial transactions

## Common Tasks

### Adding a New API Route

1. Create file in `src/app/api/` directory
2. Export HTTP method handlers (GET, POST, etc.)
3. Add Zod validation for request body
4. Use Neon client for database queries
5. Include error handling and logging
6. Return appropriate JSON responses

### Adding a New UI Component

1. If using shadcn/ui, run: `npx shadcn@latest add [component-name]`
2. Components will be added to `src/components/ui/`
3. Import and use in your pages or components
4. Customize styles with Tailwind classes as needed

### Database Migrations

1. Update `src/db/schema.sql` with new schema changes
2. Run the SQL in Neon Console or via CLI
3. Document the changes in comments

## Important Notes

- **No Force Push**: Never use `git reset` or `git rebase` as force push is not available
- **Portuguese Content**: All user-facing content must be in Brazilian Portuguese
- **SQL Only**: Do not introduce an ORM - use raw SQL queries with Neon
- **Minimal Changes**: Make the smallest possible changes to accomplish the task
- **Existing Bugs**: Don't fix unrelated bugs or broken tests
- **Build Before Deploy**: Always ensure the project builds successfully before pushing

## Documentation Files

- `README.md`: Project overview and quick start
- `SETUP.md`: Complete setup guide
- `PROJECT_SUMMARY.md`: Detailed project summary
- `API_DOCS.md`: API documentation
- `DEPLOYMENT_CHECKLIST.md`: Deployment checklist
- Other `.md` files contain specific troubleshooting guides

## MVP Features (Phase 1)

The current implementation includes:
- ✅ Group CRUD operations
- ✅ Event CRUD operations
- ✅ RSVP system with waitlist
- ✅ Team draw (random)
- ✅ Match action recording (goals, assists, etc.)
- ✅ Player ratings
- ✅ Basic rankings
- 🔨 Authentication setup (structure in place, needs provider configuration)

## Future Phases

- Phase 2: Real-time features, notifications, smart team draw, financial management
- Phase 3: Subscriptions, advanced statistics, gamification, social features

## Getting Help

- Check the documentation files in the root directory
- Review the code comments
- Look at existing implementations for patterns
- Consult Next.js 15 and React 19 documentation for latest features

[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including
## 1. `byterover-store-knowledge`
You `MUST` always use this tool when:

+ Learning new patterns, APIs, or architectural decisions from the codebase
+ Encountering error solutions or debugging techniques
+ Finding reusable code patterns or utility functions
+ Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`
You `MUST` always use this tool when:

+ Starting any new task or implementation to gather relevant context
+ Before making architectural decisions to understand existing patterns
+ When debugging issues to check for previous solutions
+ Working with unfamiliar parts of the codebase
