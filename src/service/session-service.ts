import type { QueryFilter, UpdateQuery } from "mongoose";
import Session, { type SessionDocument } from "../models/session-model.js";
import { signJwt, verifyJwt } from "../utils/jwt-utils.js";
import { get, omit } from "lodash-es";
import { findUser } from "./user-service.js";
import config from "config";

export async function createSession(userId: string, userAgent: string) {
  const session = await Session.create({ user: userId, userAgent });

  return session.toJSON();
}

export async function findSessions(query: QueryFilter<SessionDocument>) {
  return Session.find(query).lean();
}

export async function updateSessions(
  query: QueryFilter<SessionDocument>,
  update: UpdateQuery<SessionDocument>,
) {
  return Session.updateOne(query, update);
}

export async function reIssueAccessToken({
  refreshToken,
}: {
  refreshToken: string;
}) {
  const { decode } = verifyJwt(refreshToken);

  if (!decode || !get(decode, "session")) return false;

  const session = await Session.findById(get(decode, "session"));

  if (!session || !session.valid) return false;

  const user = await findUser({ _id: session.user });

  if (!user) return false;

  const accessToken = signJwt(
    { ...omit(user, ["password"]), session: session._id },
    { expiresIn: config.get("accessTokenTtl") }, //15 minutes
  );

  return accessToken;
}
