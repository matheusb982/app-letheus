import mongoose, { Schema, type Document } from "mongoose";

export interface IChatMessage extends Document {
  content: string;
  role: "user" | "assistant";
  chat_session_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    content: { type: String, required: true },
    role: { type: String, required: true, enum: ["user", "assistant"] },
    chat_session_id: {
      type: Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
    },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>(
    "ChatMessage",
    ChatMessageSchema,
    "chat_messages"
  );
