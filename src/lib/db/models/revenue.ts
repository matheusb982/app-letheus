import mongoose, { Schema, type Document } from "mongoose";

export interface IRevenue extends Document {
  value: number;
  name: string;
  description?: string;
  period_id?: mongoose.Types.ObjectId;
  family_id?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const RevenueSchema = new Schema<IRevenue>(
  {
    value: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String },
    period_id: { type: Schema.Types.ObjectId, ref: "Period" },
    family_id: { type: Schema.Types.ObjectId, ref: "Family" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

RevenueSchema.index({ family_id: 1, period_id: 1 });

export const Revenue =
  mongoose.models.Revenue ||
  mongoose.model<IRevenue>("Revenue", RevenueSchema, "revenues");
