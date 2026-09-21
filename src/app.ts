import express from "express";
import config from "config";
import connect from "./utils/connect.js";
import logger from "./utils/logger.js";
import route from "./route.js";
import authorization from "./middleware/authorization.js";
import dotenv from "dotenv"
dotenv.config()

const app = express();

app.use(express.json())
app.use(authorization)

const PORT = config.get<number>("port");

app.listen(PORT, async () => {
  logger.info(`App is running at http://localhost:${PORT}`);

  await connect();

  route(app)
});
