import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import type { Environment } from "./config.js";
import { createDatabaseClient } from "./database.js";
import { PrismaAuthStore } from "./auth/prisma-store.js";
import { authRoutes } from "./auth/routes.js";
import type { AuthStore } from "./auth/types.js";
import { configurePasswordHasher } from "./auth/crypto.js";

export async function buildApp(environment: Environment, providedStore?: AuthStore, passwordResetNotifier?: (token: string) => Promise<void>) {
  configurePasswordHasher(environment.PASSWORD_HASHER);
  const database = providedStore ? null : createDatabaseClient(environment.DATABASE_URL);
  const store = providedStore ?? new PrismaAuthStore(database!);
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: environment.CORS_ORIGIN.split(",").map((origin) => origin.trim()), credentials: true
  });
  await app.register(cookie);

  await app.register(swagger, {
      openapi: {
      info: {
        title: "RedVital API",
        description: "API central de RedVital. La compatibilidad sanguínea es únicamente orientativa.",
        version: "0.1.0"
      },
      servers: [{ url: "http://localhost:3001" }],
      components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }, refreshCookie: { type: "apiKey", in: "cookie", name: environment.AUTH_COOKIE_NAME }, accessCookie: { type: "apiKey", in: "cookie", name: environment.AUTH_ACCESS_COOKIE_NAME } } }
    }
  });

  await app.register(swaggerUi, { routePrefix: "/docs" });

  app.get("/health", {
    schema: {
      tags: ["system"],
      summary: "Estado del proceso de la API",
      response: {
        200: {
          type: "object",
          required: ["status", "service"],
          properties: {
            status: { type: "string", example: "ok" },
            service: { type: "string", example: "redvital-api" }
          }
        }
      }
    }
  }, async () => ({ status: "ok", service: "redvital-api" }));
  await app.register(authRoutes, { store, environment, passwordResetNotifier });
  app.addHook("onClose", async () => { if (database) await database.$disconnect(); });

  app.setErrorHandler((error, _request, reply) => {
    const statusCode = error instanceof Error && "statusCode" in error ? Number((error as any).statusCode) : 500;
    if (statusCode >= 400 && statusCode < 500) return reply.code(statusCode).send({ message: error instanceof Error ? error.message : "Invalid request" });
    app.log.error(error); return reply.code(500).send({ message: "Internal server error" });
  });

  return app;
}
