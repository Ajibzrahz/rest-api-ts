import express from "express";
import authorization from "../middleware/authorization";
import route from "../route";

function createServer() {
  const app = express();

  app.use(express.json());
  app.use(authorization);

  route(app);

  return app;
}
export default createServer;
