import type { Request, Response } from "express";
import logger from "../utils/logger";
import * as UserService from "../service/user-service";
import type { CreateUserInput } from "../schema/user-schema";
import {omit} from "lodash";


export async function createUserHandler(
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
) {
  try {
    const user = await UserService.createUser(req.body);
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
