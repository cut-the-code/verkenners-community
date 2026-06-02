import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/server/db/client";
import { organizations, users, memberships } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { Role } from "@/lib/auth";

/**
 * Spiegelt Clerk-identiteit (users, organizations, memberships) naar onze
 * database zodat we kunnen joinen op organization_id / user_id.
 *
 * Configureer in het Clerk Dashboard een webhook naar /api/webhooks/clerk en
 * zet het signing secret in CLERK_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("CLERK_WEBHOOK_SECRET ontbreekt", { status: 500 });
  }

  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Ontbrekende svix-headers", { status: 400 });
  }

  const payload = await req.text();
  let evt: { type: string; data: Record<string, unknown> };
  try {
    evt = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof evt;
  } catch {
    return new Response("Ongeldige handtekening", { status: 400 });
  }

  const data = evt.data;

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const emails = (data.email_addresses ?? []) as Array<{
        id: string;
        email_address: string;
      }>;
      const primary =
        emails.find((e) => e.id === data.primary_email_address_id) ?? emails[0];
      const row = {
        id: data.id as string,
        email: primary?.email_address ?? "",
        firstName: (data.first_name as string) ?? null,
        lastName: (data.last_name as string) ?? null,
        imageUrl: (data.image_url as string) ?? null,
      };
      await db
        .insert(users)
        .values(row)
        .onConflictDoUpdate({ target: users.id, set: row });
      break;
    }

    case "organization.created":
    case "organization.updated": {
      const row = {
        id: data.id as string,
        name: data.name as string,
        slug: (data.slug as string) ?? (data.id as string),
      };
      await db
        .insert(organizations)
        .values(row)
        .onConflictDoUpdate({ target: organizations.id, set: row });
      break;
    }

    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const org = data.organization as { id: string };
      const member = data.public_user_data as { user_id: string };
      const role = mapRole(data.role as string);
      const existing = await db
        .select({ id: memberships.id })
        .from(memberships)
        .where(
          and(
            eq(memberships.organizationId, org.id),
            eq(memberships.userId, member.user_id),
          ),
        )
        .limit(1);
      if (existing[0]) {
        await db
          .update(memberships)
          .set({ role, updatedAt: new Date() })
          .where(eq(memberships.id, existing[0].id));
      } else {
        await db.insert(memberships).values({
          organizationId: org.id,
          userId: member.user_id,
          role,
        });
      }
      break;
    }

    case "organizationMembership.deleted": {
      const org = data.organization as { id: string };
      const member = data.public_user_data as { user_id: string };
      await db
        .delete(memberships)
        .where(
          and(
            eq(memberships.organizationId, org.id),
            eq(memberships.userId, member.user_id),
          ),
        );
      break;
    }
  }

  return new Response("ok", { status: 200 });
}

function mapRole(clerkRole: string): Role {
  if (clerkRole === "org:admin" || clerkRole === "admin") return "admin";
  if (clerkRole === "org:owner" || clerkRole === "owner") return "owner";
  return "member";
}
