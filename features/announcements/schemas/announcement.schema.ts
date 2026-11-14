import { z } from "zod";

export const ANNOUNCEMENT_AUDIENCES = ["ALL", "ROLES", "SITES"] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

/** Roles an announcement can target. Clients are never included. */
export const ANNOUNCEMENT_ROLES = [
  "CLEANER",
  "SUPERVISOR",
  "OUTSOURCE_CLEANER",
  "OUTSOURCE_SUPERVISOR",
  "CLIENT_SERVICE_MANAGER",
  "COMPANY_ADMIN",
  "SUPER_ADMIN",
] as const;
export type AnnouncementRole = (typeof ANNOUNCEMENT_ROLES)[number];

export const AnnouncementSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  urgent: z.boolean(),
  audience: z.enum(ANNOUNCEMENT_AUDIENCES).nullable().optional(),
  audienceSummary: z.string().nullable().optional(),
  targetRoles: z.array(z.string()).nullable().optional(),
  targetSiteIds: z.array(z.string()).nullable().optional(),
  createdByName: z.string().nullable().optional(),
  createdAt: z.string(),
  // Sender view
  recipientCount: z.number().nullable().optional(),
  readCount: z.number().nullable().optional(),
  // Recipient view
  read: z.boolean().nullable().optional(),
  notificationId: z.string().nullable().optional(),
});
export const AnnouncementListSchema = z.array(AnnouncementSchema);
export type Announcement = z.infer<typeof AnnouncementSchema>;

export interface AnnouncementInput {
  title: string;
  message: string;
  urgent: boolean;
  audience: AnnouncementAudience;
  roles: AnnouncementRole[];
  siteIds: string[];
}

export const ANNOUNCEMENT_LIMITS = { title: 120, message: 1000 } as const;
