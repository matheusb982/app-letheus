import mongoose, { Schema, type Document } from "mongoose";

export interface IFeedback extends Document {
  user_id: mongoose.Types.ObjectId;
  user_name: string;
  user_email: string;
  family_id: mongoose.Types.ObjectId;
  message: string;
  status: "pending" | "read" | "resolved";
  created_at: Date;
  updated_at: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    user_name: { type: String, required: true },
    user_email: { type: String, required: true },
    family_id: { type: Schema.Types.ObjectId, ref: "Family", required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["pending", "read", "resolved"], default: "pending" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Feedback =
  mongoose.models.Feedback ||
  mongoose.model<IFeedback>("Feedback", feedbackSchema, "feedbacks");
