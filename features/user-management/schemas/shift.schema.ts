import { z } from "zod";
import { DayOfWeekSchema } from "@/features/user-management/schemas/site.schema";

// Mirrors backend ShiftResponse.
export const ShiftSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  name: z.string(),
  startTime: z.string(), // HH:mm[:ss]
  endTime: z.string(),
  dayOfWeek: DayOfWeekSchema.nullable().optional(),
  crossesMidnight: z.boolean(),
  isDefault: z.boolean(),
  sortOrder: z.number(),
});
export type Shift = z.infer<typeof ShiftSchema>;
export const ShiftListSchema = z.array(ShiftSchema);

// Outbound create/update payload. dayOfWeek "" means the shift applies to all working days.
export const ShiftFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    dayOfWeek: z.string().optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((v) => v.startTime !== v.endTime, {
    message: "Start and end time cannot be the same",
    path: ["endTime"],
  });
export type ShiftFormInput = z.infer<typeof ShiftFormSchema>;
