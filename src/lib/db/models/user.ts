import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  fullname: string;
  email: string;
  encrypted_password: string;
  reset_password_token?: string;
  reset_password_sent_at?: Date;
  remember_created_at?: Date;
  period_id?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullname: { type: String, default: "" },
    email: { type: String, required: true, unique: true, default: "" },
    encrypted_password: { type: String, required: true, default: "" },
    reset_password_token: { type: String },
    reset_password_sent_at: { type: Date },
    remember_created_at: { type: Date },
    period_id: { type: Schema.Types.ObjectId, ref: "Period" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema, "users");
