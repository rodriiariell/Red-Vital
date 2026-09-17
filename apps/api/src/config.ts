import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().url(),
  PASSWORD_HASHER: z.enum(["scrypt", "argon2"]).default("scrypt"),
  CORS_ORIGIN: z.string().default("http://localhost:8000"),
  AUTH_ACCESS_TOKEN_SECRET: z.string().min(32),
  AUTH_REFRESH_TOKEN_SECRET: z.string().min(32),
  AUTH_ACCESS_TOKEN_TTL: z.string().default("15m"),
  AUTH_REFRESH_TOKEN_TTL: z.string().default("30d"),
  AUTH_PASSWORD_RESET_TTL: z.string().default("1h"),
  AUTH_COOKIE_NAME: z.string().min(1).default("redvital_refresh"),
  AUTH_ACCESS_COOKIE_NAME: z.string().min(1).default("redvital_access")
});

export type Environment = z.infer<typeof environmentSchema>;

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  return environmentSchema.parse(source);
}
