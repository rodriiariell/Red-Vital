import { buildApp } from "./app.js";
import { loadEnvironment } from "./config.js";

const environment = loadEnvironment();
const app = await buildApp(environment);

try {
  await app.listen({ host: environment.API_HOST, port: environment.API_PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
