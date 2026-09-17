import { loadEnvironment } from "./config.js";
import { createDatabaseClient } from "./database.js";

const database = createDatabaseClient(loadEnvironment().DATABASE_URL);

try {
  await database.$queryRawUnsafe("SELECT 1");
  console.log("PostgreSQL connection: ok");
} finally {
  await database.$disconnect();
}
