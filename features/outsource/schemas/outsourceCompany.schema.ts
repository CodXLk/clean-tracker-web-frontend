import { z } from "zod";

export const OutsourceCompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  contactPersonName: z.string().nullable().optional(),
  contactNumber: z.string().nullable().optional(),
  active: z.boolean().default(true),
});
export type OutsourceCompany = z.infer<typeof OutsourceCompanySchema>;
export const OutsourceCompanyListSchema = z.array(OutsourceCompanySchema);

export interface OutsourceCompanyInput {
  name: string;
  contactPersonName?: string;
  contactNumber?: string;
}
