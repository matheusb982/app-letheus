import mongoose, { Schema, type Document } from "mongoose";

export interface IGoal extends Document {
  value: number;
  subcategory_name?: string;
  subcategory_id?: mongoose.Types.ObjectId;
  period_id?: mongoose.Types.ObjectId;
  family_id?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    value: { type: Number, required: true },
    subcategory_name: { type: String },
    subcategory_id: { type: Schema.Types.ObjectId },
    period_id: { type: Schema.Types.ObjectId, ref: "Period" },
    family_id: { type: Schema.Types.ObjectId, ref: "Family" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

GoalSchema.index({ family_id: 1, period_id: 1 });

export const Goal =
  mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema, "goals");
