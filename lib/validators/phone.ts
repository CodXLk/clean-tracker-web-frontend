import { z } from "zod";

/** Australian mobile in E.164 form: +61 followed by 4 and 8 more digits. */
export const AU_MOBILE_REGEX = /^\+614\d{8}$/;

/**
 * Australian landline or mobile in E.164 form: +61 followed by 9 digits, where the
 * leading digit is a mobile (4) or a geographic area code (2, 3, 7 or 8).
 */
export const AU_PHONE_REGEX = /^\+61[2-478]\d{8}$/;

const INVALID_MESSAGE =
  "Enter a valid Australian phone number: 9 digits after +61 (mobile starts with 4, landline with 2, 3, 7 or 8)";

/** Optional AU landline or mobile number — empty is allowed, but if present it must match +61XXXXXXXXX. */
export const optionalAuPhoneSchema = z
  .string()
  .optional()
  .refine((value) => !value || AU_PHONE_REGEX.test(value), { message: INVALID_MESSAGE });
