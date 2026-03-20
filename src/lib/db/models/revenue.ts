import mongoose, { Schema, type Document } from "mongoose";

export interface IRevenue extends Document {
  value: number;
  name: string;
  description?: string;
  period_id?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const RevenueSchema = new Schema<IRevenue>(
  {
    value: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String },
    period_id: { type: Schema.Types.ObjectId, ref: "Period" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const Revenue =
  mongoose.models.Revenue ||
  mongoose.model<IRevenue>("Revenue", RevenueSchema, "revenues");
