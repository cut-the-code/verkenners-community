import { requireOrg } from "@/lib/auth";
import { ContactForm } from "./contact-form";

export default async function NewContactPage() {
  await requireOrg();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nieuw contact</h1>
      <ContactForm />
    </div>
  );
}
