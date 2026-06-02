# Verkenners CRM

Een klein, multi-tenant CRM. Next.js (App Router) + TypeScript, PostgreSQL +
Drizzle, Clerk voor auth/organisaties. Tenant-isolatie via `organization_id` +
PostgreSQL Row-Level Security. Zie [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Vereisten

- Node 20+
- Een PostgreSQL-database (Neon, Supabase of lokaal)
- Een Clerk-applicatie met **Organizations** ingeschakeld

## Setup

1. **Dependencies installeren**

   ```bash
   npm install
   ```

2. **Environment**

   Kopieer `.env.example` naar `.env.local` en vul de waarden in:

   ```bash
   cp .env.example .env.local
   ```

   - `DATABASE_URL` — postgres.js connection string (Neon: de *pooled* URL).
   - Clerk keys uit het [Clerk Dashboard](https://dashboard.clerk.com).
   - `CLERK_WEBHOOK_SECRET` — signing secret van je Clerk-webhook.

3. **Database migreren + RLS aanzetten**

   ```bash
   npm run db:generate   # genereert SQL-migraties uit het schema
   npm run db:migrate    # voert ze uit
   psql "$DATABASE_URL" -f src/server/db/rls.sql   # zet RLS-policies
   ```

4. **Clerk-webhook**

   Maak in het Clerk Dashboard een webhook naar `/api/webhooks/clerk` aan en
   abonneer op `user.*`, `organization.*` en `organizationMembership.*`. Zo
   worden users/organisaties naar de database gespiegeld.

5. **Draaien**

   ```bash
   npm run dev
   ```

## Tenant-isolatie

Alle tenant-data loopt via `withTenant(orgId, fn)` in
[`src/server/db/client.ts`](./src/server/db/client.ts). Die opent een
transactie en zet `app.current_org`, waarna de RLS-policies in de database
elke query op de juiste tenant filteren — ook als feature-code een filter zou
vergeten.

## Scripts

| Script               | Doel                          |
|----------------------|-------------------------------|
| `npm run dev`        | Dev-server                    |
| `npm run build`      | Productie-build               |
| `npm run typecheck`  | TypeScript controleren        |
| `npm run db:generate`| Migraties genereren           |
| `npm run db:migrate` | Migraties uitvoeren           |
| `npm run db:studio`  | Drizzle Studio                |

## Status

Fase 1 (fundament) + contacten-CRUD. Volgende fases: bedrijven, deals/pipeline,
activiteiten-tijdlijn. Zie `ARCHITECTURE.md` §9.
