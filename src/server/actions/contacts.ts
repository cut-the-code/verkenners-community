"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrg } from "@/lib/auth";
import { contactInputSchema } from "@/lib/validation/contact";
import { createContact, deleteContact } from "@/server/services/contacts";

export type ActionState = { error?: string };

/** Server Action: nieuw contact aanmaken vanuit het formulier. */
export async function createContactAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireOrg();

  const parsed = contactInputSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
    companyId: formData.get("companyId"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" };
  }

  await createContact(ctx, parsed.data);
  revalidatePath("/contacts");
  redirect("/contacts");
}

/** Server Action: contact verwijderen (soft-delete). */
export async function deleteContactAction(formData: FormData): Promise<void> {
  const ctx = await requireOrg();
  const id = String(formData.get("id"));
  await deleteContact(ctx, id);
  revalidatePath("/contacts");
}
