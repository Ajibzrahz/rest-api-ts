import dotenv from "dotenv";
dotenv.config();

import config from "config";
import connect from "./utils/connect";
import logger from "./utils/logger";
import createServer from "./utils/server";

const app = createServer();

const PORT = config.get<number>("port");

app.listen(PORT, async () => {
  logger.info(`App is running at http://localhost:${PORT}`);

  await connect();
});
