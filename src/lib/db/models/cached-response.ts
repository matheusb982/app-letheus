import mongoose, { Schema, type Document } from "mongoose";

export interface ICachedResponse extends Document {
  question_hash: string;
  question: string;
  answer: string;
  expires_at: Date;
  user_id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const CachedResponseSchema = new Schema<ICachedResponse>(
  {
    question_hash: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    expires_at: { type: Date, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    family_id: { type: Schema.Types.ObjectId, ref: "Family", required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// TTL index: MongoDB automatically deletes documents after expires_at
CachedResponseSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
CachedResponseSchema.index({ family_id: 1, user_id: 1, question_hash: 1 });

export const CachedResponse =
  mongoose.models.CachedResponse ||
  mongoose.model<ICachedResponse>(
    "CachedResponse",
    CachedResponseSchema,
    "cached_responses"
  );
