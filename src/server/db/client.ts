import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is niet gezet (zie .env.example)");
}

/**
 * Eén gedeelde connectie-pool. In dev hergebruiken we de client over hot
 * reloads heen zodat we niet door connecties heen branden.
 */
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.client ??
  postgres(process.env.DATABASE_URL, { prepare: false, max: 10 });

if (process.env.NODE_ENV !== "production") globalForDb.client = client;

/**
 * Ongescopete db-handle. Gebruik deze NIET in feature-code — alleen voor
 * webhooks/admin-taken die bewust over tenants heen werken. Voor alle
 * tenant-data gebruik je `withTenant`.
 */
export const db = drizzle(client, { schema });

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Voert `fn` uit binnen een transactie waarin `app.current_org` op de gegeven
 * organisatie staat. De RLS-policies in de database filteren daardoor
 * automatisch alle rijen op deze tenant — zelfs als feature-code een
 * `where organization_id = …` zou vergeten.
 */
export async function withTenant<T>(
  organizationId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.current_org', ${organizationId}, true)`,
    );
    return fn(tx);
  });
}
