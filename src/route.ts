import type { Express, Request, Response } from "express";
import { createUserHandler } from "./controllers/user-controller.js";
import validate from "./middleware/validate-resource.js";
import { createUserSchema } from "./schema/user-schema.js";
import {
  createUserSessionHandler,
  deleteSessionHandler,
  getUserSessionHandler,
} from "./controllers/session-controller.js";
import { createSessionSchema } from "./schema/session-schema.js";
import requireUser from "./middleware/require-user.js";
import {
  createProductSchema,
  deleteProductSchema,
  getProductSchema,
  updateProductSchema,
} from "./schema/product-schema.js";
import {
  createProductHandler,
  deleteProductHandler,
  getProductHandler,
  updateProductHandler,
} from "./controllers/product-controller.js";

function route(app: Express) {
  app.get("/healthCheck", (req: Request, res: Response) => res.sendStatus(200));

  app.post("/api/users", validate(createUserSchema), createUserHandler);

  //session
  app.post(
    "/api/sessions",
    validate(createSessionSchema),
    createUserSessionHandler,
  );
  app.get("/api/sessions", requireUser, getUserSessionHandler);

  app.delete("/api/sessions", requireUser, deleteSessionHandler);

  //product
  app.post(
    "/api/products",
    requireUser,
    validate(createProductSchema),
    createProductHandler,
  );
  app.get(
    "/api/products/:productId",
    validate(getProductSchema),
    getProductHandler,
  );
  app.put(
    "/api/products/:productId",
    requireUser,
    validate(updateProductSchema),
    updateProductHandler,
  );
  app.delete(
    "/api/products/:productId",
    requireUser,
    validate(deleteProductSchema),
    deleteProductHandler,
  );
}

export default route;
