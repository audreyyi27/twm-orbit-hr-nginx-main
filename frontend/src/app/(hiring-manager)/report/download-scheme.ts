import { CandidateStatusEnum } from "@/core/utils/enums/candidates";
import { z } from "zod";

export const FILE_TYPE = [
  { title: "Excel", value: "excel" },
  // { title: "PDF", value: "pdf" },
];

export const downloadSchema = z.object({
  recruitmentFlow: z.enum(Object.values(CandidateStatusEnum), {
    error: "Recruitement flow is required",
  }),
  startDate: z.date(),
  endDate: z.date(),
  fileType: z.enum(FILE_TYPE.flatMap((i) => i.value)),
});
export type DownloadSchemaType = z.infer<typeof downloadSchema>;
