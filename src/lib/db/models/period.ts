import mongoose, { Schema, type Document } from "mongoose";

export interface IPeriod extends Document {
  name: string;
  month: number;
  year: number;
  family_id?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const PeriodSchema = new Schema<IPeriod>(
  {
    name: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    family_id: { type: Schema.Types.ObjectId, ref: "Family" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

PeriodSchema.index({ family_id: 1, month: 1, year: 1 }, { unique: true });

export const Period =
  mongoose.models.Period ||
  mongoose.model<IPeriod>("Period", PeriodSchema, "periods");
