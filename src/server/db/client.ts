import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazy singletons. We initialiseren de connectie pas bij het eerste echte
 * gebruik (niet bij import), zodat `next build` en preview-deploys zonder
 * DATABASE_URL niet crashen — alleen een daadwerkelijke query faalt dan.
 * In dev hergebruiken we de client over hot reloads heen.
 */
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
  db?: PostgresJsDatabase<typeof schema>;
};

function getDb(): PostgresJsDatabase<typeof schema> {
  if (globalForDb.db) return globalForDb.db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is niet gezet (zie .env.example)");

  const client = globalForDb.client ?? postgres(url, { prepare: false, max: 10 });
  const db = drizzle(client, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.client = client;
    globalForDb.db = db;
  }
  return db;
}

/**
 * Ongescopete db-handle (lazy). Gebruik deze NIET in feature-code — alleen voor
 * webhooks/admin-taken die bewust over tenants heen werken. Voor alle
 * tenant-data gebruik je `withTenant`.
 */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

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
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.current_org', ${organizationId}, true)`,
    );
    return fn(tx);
  });
}
