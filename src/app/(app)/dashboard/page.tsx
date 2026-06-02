import { requireOrg } from "@/lib/auth";
import { listContacts } from "@/server/services/contacts";

export default async function DashboardPage() {
  const ctx = await requireOrg();
  const contacts = await listContacts(ctx);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Contacten" value={contacts.length} />
        <Stat label="Jouw rol" value={ctx.role} />
        <Stat label="Organisatie" value={ctx.orgId.slice(0, 12) + "…"} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
