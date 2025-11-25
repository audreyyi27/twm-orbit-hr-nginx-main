import { z } from "zod";

export const addCandidateSchema = z.object({
  candidateData: z.file().optional(),
});

export type AddCandidateSchemaType = z.infer<typeof addCandidateSchema>;
