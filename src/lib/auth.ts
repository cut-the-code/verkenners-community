import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type Role = "owner" | "admin" | "member";

export interface OrgContext {
  userId: string;
  orgId: string;
  role: Role;
}

/** Mapt een Clerk org-role (bijv. "org:admin") naar onze rol. */
function normalizeRole(orgRole: string | null | undefined): Role {
  switch (orgRole) {
    case "org:admin":
    case "admin":
      return "admin";
    case "org:owner":
    case "owner":
      return "owner";
    default:
      return "member";
  }
}

/**
 * Vereist een ingelogde user met een actieve organisatie. Redirect anders naar
 * sign-in of de org-selectie. Geeft de tenant-context terug voor `withTenant`.
 */
export async function requireOrg(): Promise<OrgContext> {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/select-organization");

  return { userId, orgId, role: normalizeRole(orgRole) };
}

/** Werpt wanneer de huidige rol niet in `allowed` zit. */
export function assertRole(ctx: OrgContext, allowed: Role[]): void {
  if (!allowed.includes(ctx.role)) {
    throw new Error("Onvoldoende rechten voor deze actie");
  }
}
