import { z } from "zod";

export const addCvSchema = z.object({
  candidateData: z.file().optional(),
});

export type AddCvSchemaType = z.infer<typeof addCvSchema>;
