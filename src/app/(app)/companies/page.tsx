import { requireOrg } from "@/lib/auth";

export default async function CompaniesPage() {
  await requireOrg();
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Bedrijven</h1>
      <p className="text-muted-foreground">
        Komt eraan in fase 2 — bedrijven-CRUD.
      </p>
    </div>
  );
}
