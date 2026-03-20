import mongoose, { Schema, type Document } from "mongoose";

export interface IPeriod extends Document {
  name: string;
  month: number;
  year: number;
  created_at: Date;
  updated_at: Date;
}

const PeriodSchema = new Schema<IPeriod>(
  {
    name: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const Period =
  mongoose.models.Period ||
  mongoose.model<IPeriod>("Period", PeriodSchema, "periods");
