import mongoose, { Schema, type Document } from "mongoose";

export interface IClassificationRule extends Document {
  pattern: string;
  subcategory_id: mongoose.Types.ObjectId;
  subcategory_name: string;
  user_id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const ClassificationRuleSchema = new Schema<IClassificationRule>(
  {
    pattern: { type: String, required: true },
    subcategory_id: { type: Schema.Types.ObjectId, required: true },
    subcategory_name: { type: String, required: true },
    user_id: { type: Schema.Types.ObjectId, required: true },
    family_id: { type: Schema.Types.ObjectId, ref: "Family", required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

ClassificationRuleSchema.index({ family_id: 1, user_id: 1, pattern: 1 }, { unique: true });

export const ClassificationRule =
  mongoose.models.ClassificationRule ||
  mongoose.model<IClassificationRule>(
    "ClassificationRule",
    ClassificationRuleSchema,
    "classification_rules"
  );
