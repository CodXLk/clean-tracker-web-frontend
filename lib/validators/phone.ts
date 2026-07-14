import { z } from "zod";

/** Australian mobile in E.164 form: +61 followed by 4 and 8 more digits. */
export const AU_MOBILE_REGEX = /^\+614\d{8}$/;

const INVALID_MESSAGE = "Enter a valid mobile number: 9 digits starting with 4 (e.g. 412345678)";

/** Optional AU mobile number — empty is allowed, but if present it must fully match +614XXXXXXXX. */
export const optionalAuMobileSchema = z
  .string()
  .optional()
  .refine((value) => !value || AU_MOBILE_REGEX.test(value), { message: INVALID_MESSAGE });
