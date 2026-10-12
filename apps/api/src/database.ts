import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client.js";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Factory for the local SQLite development database.
 * It is intentionally not initialized by the health route, so the API process
 * can expose diagnostics while a database is being provisioned.
 */
export function createDatabaseClient(databaseUrl: string) {
  const url = databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : null;
  const resolvedDatabaseUrl = url && !url.startsWith("//") && !isAbsolute(url)
    ? pathToFileURL(resolve(fileURLToPath(new URL("../../", import.meta.url)), url)).toString()
    : databaseUrl;
  const adapter = new PrismaLibSql({ url: resolvedDatabaseUrl });
  return new PrismaClient({ adapter });
}
