import mongoose, { Schema, type Document } from "mongoose";

export interface IPendingExpense {
  description: string;
  value: number;
  purchase_type: "debit" | "credit";
  subcategory_name: string;
  subcategory_id: string;
}

export interface IWhatsAppSession extends Document {
  phone_number: string;
  user_id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  mode: "idle" | "expense" | "chat";
  pending_expense?: IPendingExpense;
  last_activity: Date;
  created_at: Date;
  updated_at: Date;
}

const PendingExpenseSchema = new Schema<IPendingExpense>(
  {
    description: { type: String, required: true },
    value: { type: Number, required: true },
    purchase_type: { type: String, enum: ["debit", "credit"], default: "debit" },
    subcategory_name: { type: String, required: true },
    subcategory_id: { type: String, required: true },
  },
  { _id: false }
);

const WhatsAppSessionSchema = new Schema<IWhatsAppSession>(
  {
    phone_number: { type: String, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    family_id: { type: Schema.Types.ObjectId, ref: "Family", required: true },
    mode: { type: String, enum: ["idle", "expense", "chat"], default: "idle" },
    pending_expense: { type: PendingExpenseSchema },
    last_activity: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

WhatsAppSessionSchema.index({ phone_number: 1 }, { unique: true });
WhatsAppSessionSchema.index({ last_activity: 1 }, { expireAfterSeconds: 86400 }); // 24h TTL

export const WhatsAppSession =
  mongoose.models.WhatsAppSession ||
  mongoose.model<IWhatsAppSession>("WhatsAppSession", WhatsAppSessionSchema, "whatsapp_sessions");
