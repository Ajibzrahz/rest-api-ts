import type { Request, Response, NextFunction } from "express";
import {
  createSession,
  findSessions,
  updateSessions,
} from "../service/session-service";
import { validatePassword } from "../service/user-service";
import { signJwt } from "../utils/jwt-utils";
import config from "config";
import { omit } from "lodash";

export async function createUserSessionHandler(
  req: Request,
  res: Response,
) {
  const user = await validatePassword(req.body);

  if (!user) {
    return res.status(401).send("invalid email or password");
  }

  const session = await createSession(
    user._id.toString(),
    req.get("user-agent") || "",
  );
  //create accessToken
  const accessToken = signJwt(
    { ...omit(user.toJSON(), ["password"]), session: session._id },
    { expiresIn: config.get("accessTokenTtl") }, //15 minutes
  );

  // create refreshToken

  const refreshToken = signJwt(
    { ...omit(user.toJSON(), ["password"]), session: session._id },
    { expiresIn: config.get("refreshTokenTtl") }, //1 year
  );
  return res.send({ accessToken, refreshToken });
}

export async function getUserSessionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = res.locals.user._id;

  const sessions = await findSessions({ user: userId, valid: true });

  return res.send(sessions);
}
export async function deleteSessionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const sessionId = res.locals.user.session;

  await updateSessions({ _id: sessionId }, { valid: false });

  return res.send({ accessToken: null, refreshToken: null });
}
