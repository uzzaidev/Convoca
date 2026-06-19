# 02_BUILD_RUNBOOK.md
**Checkpoint Date**: 2026-03-15 (UTC-3)
**Commit**: dad0911079482b15ff5c43e9ef73a44b4c752699
**Branch**: main

---

## Prerequisites

### Required Software

- **Node.js**: >= 18.17.0 (Evidência: `package.json:14-16`)
- **pnpm**: 10.18.1 (Evidência: `package.json:13`)
- **Git**: Any recent version
- **PostgreSQL Client** (optional): Para conectar ao banco Neon

### Install pnpm

```bash
npm install -g pnpm@10.18.1
```

---

## Setup Local Development

### 1. Clone Repository

```bash
git clone <repository-url>
cd Convoca
```

### 2. Install Dependencies

```bash
pnpm install
```

**Expected Output**: Dependencies installed successfully without errors.

### 3. Environment Variables

Create `.env.local` file in root:

```bash
# Required
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
AUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Optional
RESEND_API_KEY=<your-resend-key>
LOG_LEVEL=info
```

**How to get DATABASE_URL**:
1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Copy connection string
4. Ensure it includes `?sslmode=require`

**Generate AUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 4. Database Setup

**Option A: Use Existing Neon Database**

No action needed if `DATABASE_URL` points to existing database with schema.

**Option B: Create New Database**

1. Create Neon project at [console.neon.tech](https://console.neon.tech)
2. Run schema migration:

```bash
# Using Neon SQL Editor (recommended)
# Copy contents of src/db/migrations/schema.sql
# Paste in Neon SQL Editor and run

# OR using psql (if installed)
psql $DATABASE_URL < src/db/migrations/schema.sql
```

**Verify Schema**:

```sql
-- Run in Neon SQL Editor or psql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Output**: Should list 18 tables (users, groups, events, etc.)

### 5. Verify Environment

```bash
pnpm dev
```

**Expected Output**:
```
▲ Next.js 16.1.1
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in X.Xs
```

**Open Browser**: Navigate to http://localhost:3000

**Expected**: Landing page loads without errors.

---

## Development Workflow

### Start Dev Server

```bash
pnpm dev
```

**With Doppler** (if using secrets management):
```bash
pnpm dev:doppler
```

**Dev Server Features**:
- ✅ Hot module replacement
- ✅ Fast refresh
- ✅ TypeScript checking
- ✅ ESLint warnings

### Linting

```bash
pnpm lint
```

**Expected**: No errors (warnings are OK for dev).

### Build for Production

```bash
pnpm build
```

**Build Steps**:
1. TypeScript compilation
2. Linting
3. Next.js optimization
4. Static page generation
5. API routes bundling

**Expected Output**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    XXX kB          XXX kB
└ ...
```

**Success Criteria**: Build completes without errors.

### Start Production Server (Local)

```bash
pnpm start
```

**Note**: Must run `pnpm build` first.

---

## Database Operations

### Backup Database

```bash
pnpm backup
```

**Script**: `src/db/backup-supabase.sh`

**⚠️ Warning**: Script name references Supabase but project uses Neon. Verify script works with Neon.

### Run Manual Migrations

**Neon Console** (Recommended):
1. Go to Neon Console > SQL Editor
2. Paste SQL from migration file
3. Execute

**psql** (Alternative):
```bash
psql $DATABASE_URL < path/to/migration.sql
```

### Connect to Database

**Using psql**:
```bash
psql $DATABASE_URL
```

**Using GUI Tool** (TablePlus, DBeaver, etc):
- Host: Extract from DATABASE_URL
- Port: Usually 5432
- Database: Extract from DATABASE_URL
- SSL: Required

---

## Troubleshooting

### Issue: "AUTH_SECRET not configured"

**Symptom**: Error box in terminal on startup.

**Solution**:
```bash
# Generate secret
openssl rand -base64 32

# Add to .env.local
echo "AUTH_SECRET=<generated-value>" >> .env.local
```

### Issue: "DATABASE_URL not defined"

**Symptom**: Application crashes on startup.

**Solution**:
1. Check `.env.local` exists
2. Verify `DATABASE_URL` is set
3. Restart dev server

### Issue: "Cannot connect to database"

**Symptom**: Database queries fail.

**Diagnosis**:
```bash
# Test connection with psql
psql $DATABASE_URL -c "SELECT 1"
```

**Solutions**:
- Check DATABASE_URL format: `postgresql://user:pass@host/db?sslmode=require`
- Verify Neon project is active (not hibernated)
- Check firewall/network

### Issue: "Schema not found"

**Symptom**: Queries fail with "relation does not exist".

**Solution**: Run schema migration (see Database Setup).

### Issue: Build fails with TypeScript errors

**Symptom**: `pnpm build` fails.

**Solution**:
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix errors and rebuild
pnpm build
```

### Issue: ESLint errors blocking build

**Symptom**: Build fails on lint.

**Temporary Workaround** (NOT recommended for production):
```bash
# next.config.ts
export default {
  eslint: {
    ignoreDuringBuilds: true, // TEMPORARY ONLY
  },
  // ...
}
```

**Proper Solution**: Fix ESLint errors.

### Issue: Port 3000 already in use

**Symptom**: "Port 3000 is already in use".

**Solution**:
```bash
# Kill process on port 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# OR use different port
PORT=3001 pnpm dev
```

### Issue: Hot reload not working

**Symptom**: Changes not reflecting in browser.

**Solution**:
1. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Check browser console for errors
3. Restart dev server
4. Check if file is in `node_modules` (won't hot reload)

---

## Deploy to Vercel

### First Time Setup

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login**:
```bash
vercel login
```

3. **Link Project**:
```bash
vercel link
```

4. **Add Environment Variables**:

```bash
# Via Vercel CLI
vercel env add AUTH_SECRET
# Paste value

vercel env add DATABASE_URL
# Paste value

# OR via Vercel Dashboard
# Project Settings > Environment Variables
```

5. **Deploy**:
```bash
vercel --prod
```

### Subsequent Deployments

**Push to main branch**: Auto-deploys via Vercel GitHub integration.

**Manual Deploy**:
```bash
vercel --prod
```

### Neon Integration (Recommended)

1. Go to Vercel project settings
2. Integrations > Browse Marketplace
3. Add Neon integration
4. Connect Neon project
5. Environment variables auto-configured

---

## Cron Jobs Configuration

**⚠️ Status**: `vercel.json` not found in repository.

**Expected Configuration**:

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-monthly-charges",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/generate-recurring-events",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule Format**: [Cron syntax](https://vercel.com/docs/cron-jobs)

**Verify Cron Protection**: Ensure endpoints validate Vercel Cron secret.

---

## Testing

**⚠️ Status**: No tests currently in project.

**Recommended Setup**:

```bash
# Install test dependencies
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# Add script to package.json
"test": "vitest"

# Run tests
pnpm test
```

---

## Performance Monitoring

### Vercel Analytics

**Enable in Dashboard**:
1. Project Settings > Analytics
2. Enable Web Analytics
3. Enable Speed Insights

### Database Monitoring

**Neon Console**:
1. Monitor query performance
2. Check connection usage
3. Review storage usage

---

## Security Checklist

Before deploying to production:

- [ ] `AUTH_SECRET` is strong random value
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] Environment variables in Vercel (not in code)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] No secrets in git history
- [ ] Rate limiting configured (⚠️ TODO)
- [ ] Cron endpoints protected (⚠️ TODO)
- [ ] Email verification enabled (⚠️ TODO)

---

## Common Commands Reference

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm backup` | Backup database |
| `vercel` | Deploy preview |
| `vercel --prod` | Deploy production |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | - | NextAuth JWT signing secret |
| `NEXTAUTH_URL` | ✅ | http://localhost:3000 | App URL |
| `NEXTAUTH_SECRET` | ❌ | - | Legacy fallback for AUTH_SECRET |
| `RESEND_API_KEY` | ✅ (prod) | - | Email service API key |
| `LOG_LEVEL` | ❌ | info | Pino log level |
| `NODE_ENV` | Auto | development | Environment |

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **NextAuth Docs**: https://authjs.dev
- **Neon Docs**: https://neon.tech/docs
- **Vercel Docs**: https://vercel.com/docs
- **shadcn/ui**: https://ui.shadcn.com

---

**Last Updated**: 2026-03-15
**Status**: ✅ Complete for MVP
