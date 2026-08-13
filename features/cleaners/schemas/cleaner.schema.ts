import { z } from "zod";
import {
  UserDocumentSchema,
} from "@/features/users/schemas/document.schema";
import { SiteTypeSchema } from "@/features/user-management/schemas/site.schema";

// Mirrors backend CleanerResponse.
export const CleanerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const CleanerListSchema = z.array(CleanerSchema);

export type Cleaner = z.infer<typeof CleanerSchema>;

// Mirrors backend CleanerSiteSummaryResponse.
export const CleanerSiteSummarySchema = z.object({
  siteId: z.string().uuid(),
  siteName: z.string(),
  clientName: z.string().nullable().optional(),
  clientCompanyName: z.string().nullable().optional(),
  siteType: SiteTypeSchema.nullable().optional(),
  slotLabel: z.string().nullable().optional(),
});
export type CleanerSiteSummary = z.infer<typeof CleanerSiteSummarySchema>;

// Mirrors backend CleanerDetailResponse.
export const CleanerDetailSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  hasPhoto: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  setupComplete: z.boolean().optional().default(false),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  documents: z.array(UserDocumentSchema).default([]),
  sites: z.array(CleanerSiteSummarySchema).default([]),
});
export type CleanerDetail = z.infer<typeof CleanerDetailSchema>;
