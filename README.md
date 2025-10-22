## Peladeiros App (MVP)

Next.js 15 (App Router) + TypeScript + Tailwind CSS + Drizzle ORM + Neon (Postgres) + NextAuth (Email). Dev and build use Turbopack (no Webpack).

### Requirements
- Node.js LTS (>= 18)
- Neon/Postgres connection string

### 1) Configure env

Copy the example and fill values:

```powershell
Copy-Item .env.example .env
```

Set at least `DATABASE_URL`, `AUTH_SECRET`, `AUTH_EMAIL_SERVER`, and `AUTH_EMAIL_FROM`.

### 2) Install deps (pnpm)

```powershell
pnpm install
```

### 3) Database (Drizzle + Neon)

```powershell
pnpm db:push
```

Optional seed:

```powershell
pnpm run seed
```

### 4) Run dev (Turbopack)

```powershell
pnpm run dev
```

Open http://localhost:3000. Health check: http://localhost:3000/api/health

### 5) Build (Turbopack)

```powershell
pnpm run build
pnpm start
```

### Notes
- API routes available:
	- `GET /api/health`
	- `GET /api/groups`, `POST /api/groups`
	- `POST /api/events`, `GET/PATCH /api/events/:id`
	- `POST /api/events/:id/rsvp`, `POST /api/events/:id/draw`, `GET/POST /api/events/:id/actions`
- Tailwind v3 is configured via `tailwind.config.ts` and `src/app/globals.css`.
- Auth uses NextAuth Email; wire SMTP in `.env`.
