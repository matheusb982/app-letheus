import mongoose, { Schema, type Document } from "mongoose";

export interface IChatSession extends Document {
  title: string;
  user_id: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const ChatSessionSchema = new Schema<IChatSession>(
  {
    title: { type: String, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const ChatSession =
  mongoose.models.ChatSession ||
  mongoose.model<IChatSession>(
    "ChatSession",
    ChatSessionSchema,
    "chat_sessions"
  );
