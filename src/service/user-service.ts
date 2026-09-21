import type { UserDocument } from "../models/user-model.js";
import mongoose, { type QueryFilter } from "mongoose";
import User from "../models/user-model.js";
import { omit } from "lodash-es";

export async function createUser(
  input: Pick<UserDocument, "email" | "password" | "name">,
) {
  try {
    const user = await User.create(input);

    return omit(user, ["password"]);
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function validatePassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const user = await User.findOne({ email });

  if (!user) {
    return false;
  }

  const isValid = user.comparePassword(password);

  if (!isValid) return false;

  return omit(user, ["password"]);
}

export async function findUser(query: QueryFilter<UserDocument>) {
  return User.findOne(query).lean();
}
