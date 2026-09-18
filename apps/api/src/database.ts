import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client.js";

/**
 * Factory for the local SQLite development database.
 * It is intentionally not initialized by the health route, so the API process
 * can expose diagnostics while a database is being provisioned.
 */
export function createDatabaseClient(databaseUrl: string) {
  const adapter = new PrismaLibSql({ url: databaseUrl });
  return new PrismaClient({ adapter });
}
