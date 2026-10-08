import type { Request, Response, NextFunction } from "express";
import { get } from "lodash";
import { verifyJwt } from "../utils/jwt-utils";
import { reIssueAccessToken } from "../service/session-service";

const authorization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const accessToken = get(req, "headers.authorization")?.replace(
    /^Bearer\s/,
    "",
  );

  if (!accessToken) {
    return next();
  }

  const { decode, expired } = verifyJwt(accessToken);

  if (decode) {
    res.locals.user = decode;
    return next();
  }

  const refreshToken = get(req, "headers.x-refresh");

  if (expired && typeof refreshToken === "string") {
    const newAccessToken = await reIssueAccessToken({ refreshToken });

    if (newAccessToken) {
      res.setHeader("x-access-token", newAccessToken);

      const result = verifyJwt(newAccessToken);
      res.locals.user = result.decode;
      return next();
    }
  }

  return next();
};

export default authorization;
