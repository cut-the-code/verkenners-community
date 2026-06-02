import {
  pgTable,
  text,
  uuid,
  timestamp,
  numeric,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Gedeelde audit-kolommen voor elke tabel.
 */
const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

/**
 * Standaardkolommen voor elke tenant-scoped tabel: een eigen uuid-pk plus de
 * `organizationId` die de RLS-policies gebruiken voor isolatie.
 */
const tenantColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  ...auditColumns,
};

/* -------------------------------------------------------------------------- */
/*  Identiteit (gespiegeld vanuit Clerk)                                       */
/* -------------------------------------------------------------------------- */

/** Een tenant. `id` is de Clerk organization id. */
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(), // Clerk org_...
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  ...auditColumns,
});

/** Een persoon met een login. `id` is de Clerk user id. */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user_...
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  ...auditColumns,
});

export const membershipRole = pgEnum("membership_role", [
  "owner",
  "admin",
  "member",
]);

/** Koppelt een user aan een organization met een rol. */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull().default("member"),
    ...auditColumns,
  },
  (t) => [
    index("memberships_org_idx").on(t.organizationId),
    index("memberships_user_idx").on(t.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  CRM-kern                                                                   */
/* -------------------------------------------------------------------------- */

/** Bedrijven/accounts waarmee de tenant zakendoet. */
export const companies = pgTable(
  "companies",
  {
    ...tenantColumns,
    name: text("name").notNull(),
    domain: text("domain"),
    phone: text("phone"),
    notes: text("notes"),
  },
  (t) => [index("companies_org_idx").on(t.organizationId)],
);

/** Personen, optioneel gekoppeld aan een company. */
export const contacts = pgTable(
  "contacts",
  {
    ...tenantColumns,
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    jobTitle: text("job_title"),
    notes: text("notes"),
  },
  (t) => [
    index("contacts_org_idx").on(t.organizationId),
    index("contacts_company_idx").on(t.companyId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Sales-pipeline                                                             */
/* -------------------------------------------------------------------------- */

/** Een configureerbare verkoop-pipeline per tenant. */
export const pipelines = pgTable(
  "pipelines",
  {
    ...tenantColumns,
    name: text("name").notNull(),
    isDefault: integer("is_default").notNull().default(0),
  },
  (t) => [index("pipelines_org_idx").on(t.organizationId)],
);

/** Een fase binnen een pipeline. */
export const stages = pgTable(
  "stages",
  {
    ...tenantColumns,
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    index("stages_org_idx").on(t.organizationId),
    index("stages_pipeline_idx").on(t.pipelineId),
  ],
);

/** Een verkoopkans. */
export const deals = pgTable(
  "deals",
  {
    ...tenantColumns,
    title: text("title").notNull(),
    value: numeric("value", { precision: 14, scale: 2 }),
    currency: text("currency").notNull().default("EUR"),
    stageId: uuid("stage_id").references(() => stages.id, {
      onDelete: "set null",
    }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    ownerId: text("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("deals_org_idx").on(t.organizationId),
    index("deals_stage_idx").on(t.stageId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Activiteiten                                                               */
/* -------------------------------------------------------------------------- */

export const activityType = pgEnum("activity_type", [
  "note",
  "task",
  "call",
  "email",
]);

/** Notities, taken, calls en e-mails op de tijdlijn van een contact/deal. */
export const activities = pgTable(
  "activities",
  {
    ...tenantColumns,
    type: activityType("type").notNull().default("note"),
    body: text("body").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),
    dealId: uuid("deal_id").references(() => deals.id, {
      onDelete: "cascade",
    }),
  },
  (t) => [
    index("activities_org_idx").on(t.organizationId),
    index("activities_contact_idx").on(t.contactId),
    index("activities_deal_idx").on(t.dealId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Tabellen waarop RLS-tenantisolatie van toepassing is. */
export const tenantTables = [
  "companies",
  "contacts",
  "pipelines",
  "stages",
  "deals",
  "activities",
] as const;

/** SQL-expressie die de actieve tenant uit de sessie leest. */
export const currentOrg = sql`current_setting('app.current_org', true)`;
