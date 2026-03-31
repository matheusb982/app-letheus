import mongoose, { Schema, type Document } from "mongoose";

export type SubscriptionStatus = "trialing" | "active" | "expired" | "canceled";

export interface IFamily extends Document {
  name: string;
  owner_id: mongoose.Types.ObjectId;
  subscription_status?: SubscriptionStatus;
  trial_ends_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const FamilySchema = new Schema<IFamily>(
  {
    name: { type: String, required: true },
    owner_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subscription_status: { type: String, enum: ["trialing", "active", "expired", "canceled"], default: "trialing" },
    trial_ends_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const Family =
  mongoose.models.Family ||
  mongoose.model<IFamily>("Family", FamilySchema, "families");
