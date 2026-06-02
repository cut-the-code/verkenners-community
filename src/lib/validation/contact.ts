import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

export const contactInputSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht").max(120),
  lastName: z.preprocess(emptyToUndefined, z.string().max(120).optional()),
  email: z.preprocess(
    emptyToUndefined,
    z.string().email("Ongeldig e-mailadres").optional(),
  ),
  phone: z.preprocess(emptyToUndefined, z.string().max(40).optional()),
  jobTitle: z.preprocess(emptyToUndefined, z.string().max(120).optional()),
  companyId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().max(2000).optional()),
});

export type ContactInput = z.infer<typeof contactInputSchema>;
