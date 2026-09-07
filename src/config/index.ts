import "dotenv/config"

import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string(),
  CLIENT_ID: z.string(),
  CLIENT_SECRET: z.string(),
  REDIRECT_URL: z.string(),
  SESSION_SECRET: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_MAX_AGE: z.string(),
  REFRESH_TOKEN_MAX_AGE: z.string(),
  DATABASE_URL: z.string()
})

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.log("Invalid environment variables: ");
  console.error(z.prettifyError(parsedEnv.error))
  process.exit(1)
}

export const env = {
  ...parsedEnv.data,
  GOOGLE_SCOPES: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ],
  IS_PRODUCTION: parsedEnv.data.NODE_ENV === "production" ? true : false
}
