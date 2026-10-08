import mongoose from "mongoose";
import { type UserDocument } from "./user-model";

export interface SessionDocument extends mongoose.Document {
  user: UserDocument["_id"];
  valid: boolean;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const sessionSchema = new mongoose.Schema<SessionDocument>(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    valid: {
      type: Boolean,
      default: true,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true },
);

const Session = mongoose.model<SessionDocument>("Session", sessionSchema);
export default Session;
