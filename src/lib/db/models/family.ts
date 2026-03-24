import mongoose, { Schema, type Document } from "mongoose";

export interface IFamily extends Document {
  name: string;
  owner_id: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const FamilySchema = new Schema<IFamily>(
  {
    name: { type: String, required: true },
    owner_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const Family =
  mongoose.models.Family ||
  mongoose.model<IFamily>("Family", FamilySchema, "families");
