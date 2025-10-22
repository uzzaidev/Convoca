# Arquivos que precisam ter imports do Drizzle removidos

## Remover estas linhas de cada arquivo:

### src/app/api/groups/route.ts
- `import { groups } from "@/db/schema";`
- `import { eq } from "drizzle-orm";`
- `import { createGroupSchema } from "@/lib/validations";`

### src/app/api/events/route.ts
- `import { events } from "@/db/schema";`

### src/app/api/events/[eventId]/route.ts
- `import { events } from "@/db/schema";`
- `import { eq } from "drizzle-orm";`

### src/app/api/events/[eventId]/rsvp/route.ts
- `import { eventAttendance } from "@/db/schema";`

### src/app/api/events/[eventId]/draw/route.ts
- `import { eventAttendance, teams, teamMembers } from "@/db/schema";`
- `import { eq } from "drizzle-orm";`

### src/app/api/events/[eventId]/actions/route.ts
- `import { eventActions } from "@/db/schema";`
- `import { eq } from "drizzle-orm";`

## E também remover:
- src/db/schema.ts (arquivo inteiro)
- drizzle.config.ts (arquivo inteiro)
- src/lib/auth.ts (arquivo inteiro - NextAuth)
- src/lib/validations.ts (pode manter mas remover dependências do Drizzle)

## Já limpo:
✅ src/lib/db.ts - usando SQL puro do Neon
✅ src/lib/groups.ts - usando SQL puro
✅ src/lib/events.ts - usando SQL puro
✅ scripts/seed.ts - usando SQL puro
