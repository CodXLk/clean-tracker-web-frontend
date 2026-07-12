import { z } from "zod";

const serverEnvSchema = z.object({
  SPRING_BOOT_API_URL: z.string().url(),
  SPRING_BOOT_API_KEY: z.string().min(1),
  AUTH_SECRET:         z.string().min(32),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_APP_URL:  z.string().url(),
});

export const serverEnv = serverEnvSchema.parse(process.env);

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL:  process.env.NEXT_PUBLIC_APP_URL,
});
