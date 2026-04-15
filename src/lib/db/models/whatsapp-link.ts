import mongoose, { Schema, type Document } from "mongoose";

export interface IWhatsAppLink extends Document {
  phone_number: string;
  user_id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  verified: boolean;
  link_token?: string;
  link_token_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const WhatsAppLinkSchema = new Schema<IWhatsAppLink>(
  {
    phone_number: { type: String, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    family_id: { type: Schema.Types.ObjectId, ref: "Family", required: true },
    verified: { type: Boolean, default: false },
    link_token: { type: String },
    link_token_expires_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

WhatsAppLinkSchema.index({ phone_number: 1 }, { unique: true });
WhatsAppLinkSchema.index({ link_token: 1 }, { unique: true, sparse: true });
WhatsAppLinkSchema.index({ user_id: 1 }, { unique: true });

export const WhatsAppLink =
  mongoose.models.WhatsAppLink ||
  mongoose.model<IWhatsAppLink>("WhatsAppLink", WhatsAppLinkSchema, "whatsapp_links");
