import { z } from "zod";

// Mirrors the Spring Boot `CertificateType` enum.
export const CERTIFICATE_TYPES = [
  "VEVO_CHECK",
  "POLICE_CHECK",
  "WORKING_WITH_CHILDREN_CHECK",
  "PUBLIC_LIABILITY_INSURANCE",
  "ABN_REGISTRATION",
  "GST_REGISTRATION",
  "LABOUR_HIRE_LICENCE",
  "WORK_COVER_INSURANCE",
  "CPCCCM3001",
  "OTHER",
] as const;

export const CertificateTypeSchema = z.enum(CERTIFICATE_TYPES);
export type CertificateType = z.infer<typeof CertificateTypeSchema>;

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  VEVO_CHECK: "VEVO / Working Rights",
  POLICE_CHECK: "Police Check",
  WORKING_WITH_CHILDREN_CHECK: "Working With Children Check",
  PUBLIC_LIABILITY_INSURANCE: "Public Liability Insurance",
  ABN_REGISTRATION: "ABN Registration",
  GST_REGISTRATION: "GST Registration",
  LABOUR_HIRE_LICENCE: "Labour Hire Licence",
  WORK_COVER_INSURANCE: "Work Cover Insurance",
  CPCCCM3001: "CPCCCM3001 – Operate Elevated Work Platforms (≤11m)",
  OTHER: "Other",
};

export function certificateLabel(type: CertificateType, otherLabel?: string | null): string {
  if (type === "OTHER" && otherLabel && otherLabel.trim().length > 0) return otherLabel;
  return CERTIFICATE_TYPE_LABELS[type];
}

// Certificate types that carry an identifying number, and the label for that number field.
// When a type is absent here, no number field is shown on upload.
export const CERTIFICATE_NUMBER_LABELS: Partial<Record<CertificateType, string>> = {
  VEVO_CHECK: "VEVO / passport reference",
  POLICE_CHECK: "Police check reference no.",
  WORKING_WITH_CHILDREN_CHECK: "WWCC number",
  PUBLIC_LIABILITY_INSURANCE: "Policy number",
  ABN_REGISTRATION: "ABN",
  GST_REGISTRATION: "GST / ABN number",
  LABOUR_HIRE_LICENCE: "Licence number",
  WORK_COVER_INSURANCE: "Policy number",
  CPCCCM3001: "Certificate number",
};

export function certificateNumberLabel(type: CertificateType): string | undefined {
  return CERTIFICATE_NUMBER_LABELS[type];
}

// Mirrors backend UserDocumentResponse.
export const UserDocumentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  certificateType: CertificateTypeSchema,
  label: z.string(),
  documentNumber: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  originalFilename: z.string().nullable().optional(),
  sizeBytes: z.number().nullable().optional(),
  issueDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  expired: z.boolean(),
  verified: z.boolean(),
  verifiedAt: z.string().nullable().optional(),
  uploadedAt: z.string().nullable().optional(),
  downloadUrl: z.string(),
});

export type UserDocument = z.infer<typeof UserDocumentSchema>;
export const UserDocumentListSchema = z.array(UserDocumentSchema);
