import { and, desc, eq, isNull } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { contacts } from "@/server/db/schema";
import { assertRole, type OrgContext } from "@/lib/auth";
import { contactInputSchema, type ContactInput } from "@/lib/validation/contact";

export type Contact = typeof contacts.$inferSelect;

/** Alle (niet-verwijderde) contacten van de tenant, nieuwste eerst. */
export function listContacts(ctx: OrgContext): Promise<Contact[]> {
  return withTenant(ctx.orgId, (tx) =>
    tx
      .select()
      .from(contacts)
      .where(isNull(contacts.deletedAt))
      .orderBy(desc(contacts.createdAt)),
  );
}

/** Eén contact op id (tenant-scoped). */
export function getContact(
  ctx: OrgContext,
  id: string,
): Promise<Contact | undefined> {
  return withTenant(ctx.orgId, async (tx) => {
    const [row] = await tx
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), isNull(contacts.deletedAt)))
      .limit(1);
    return row;
  });
}

/** Maakt een nieuw contact aan. */
export function createContact(
  ctx: OrgContext,
  input: ContactInput,
): Promise<Contact> {
  const data = contactInputSchema.parse(input);
  return withTenant(ctx.orgId, async (tx) => {
    const [row] = await tx
      .insert(contacts)
      .values({
        ...data,
        organizationId: ctx.orgId,
        createdBy: ctx.userId,
      })
      .returning();
    return row;
  });
}

/** Werkt een contact bij. */
export function updateContact(
  ctx: OrgContext,
  id: string,
  input: ContactInput,
): Promise<Contact | undefined> {
  const data = contactInputSchema.parse(input);
  return withTenant(ctx.orgId, async (tx) => {
    const [row] = await tx
      .update(contacts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contacts.id, id), isNull(contacts.deletedAt)))
      .returning();
    return row;
  });
}

/** Soft-delete; alleen admins en owners mogen dit. */
export function deleteContact(ctx: OrgContext, id: string): Promise<void> {
  assertRole(ctx, ["owner", "admin"]);
  return withTenant(ctx.orgId, async (tx) => {
    await tx
      .update(contacts)
      .set({ deletedAt: new Date() })
      .where(eq(contacts.id, id));
  });
}
