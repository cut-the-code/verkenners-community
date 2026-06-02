-- Row-Level Security voor tenant-isolatie.
--
-- Draai dit ÉÉNMALIG na elke migratie (of voeg het toe aan je deploy-pipeline):
--   psql "$DATABASE_URL" -f src/server/db/rls.sql
--
-- Elke policy laat alleen rijen toe waarvan organization_id gelijk is aan de
-- waarde die `withTenant` per transactie zet via
-- set_config('app.current_org', <orgId>, true). FORCE zorgt dat ook de
-- table-owner aan de policy onderworpen is.

do $$
declare
  t text;
begin
  foreach t in array array[
    'companies', 'contacts', 'pipelines', 'stages', 'deals', 'activities'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('alter table %I force row level security;', t);
    execute format('drop policy if exists tenant_isolation on %I;', t);
    execute format(
      'create policy tenant_isolation on %I
         using (organization_id = current_setting(''app.current_org'', true))
         with check (organization_id = current_setting(''app.current_org'', true));',
      t
    );
  end loop;
end $$;
