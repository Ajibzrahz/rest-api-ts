import type { Request, Response } from "express";
import logger from "../utils/logger.js";
import { createUser } from "../service/user-service.js";
import type { CreateUserInput } from "../schema/user-schema.js";
import {omit} from "lodash-es";


export async function createUserHandler(
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
) {
  try {
    const user = await createUser(req.body);
    return res
      .status(201)
      .json({
        message: "user created",
        user: omit(user.toJSON(), ["password"]),
      });
  } catch (error: any) {
    logger.error(error);

    return res.status(409).send(error.message);
  }
}
