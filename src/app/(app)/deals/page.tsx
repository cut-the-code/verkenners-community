import { requireOrg } from "@/lib/auth";

export default async function DealsPage() {
  await requireOrg();
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Deals</h1>
      <p className="text-muted-foreground">
        Komt eraan in fase 3 — pipeline met kanban-board.
      </p>
    </div>
  );
}
