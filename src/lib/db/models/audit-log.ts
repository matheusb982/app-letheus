import mongoose, { Schema, type Document } from "mongoose";

export interface IAuditLog extends Document {
  family_id: mongoose.Types.ObjectId;
  actor_id: mongoose.Types.ObjectId;
  actor_email: string;
  action: "member_added" | "member_removed" | "member_deleted_account" | "family_deleted" | "owner_deleted_account";
  target_id?: mongoose.Types.ObjectId;
  target_email?: string;
  details?: string;
  created_at: Date;
  updated_at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    family_id: { type: Schema.Types.ObjectId, ref: "Family", required: true },
    actor_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actor_email: { type: String, required: true },
    action: {
      type: String,
      required: true,
      enum: ["member_added", "member_removed", "member_deleted_account", "family_deleted", "owner_deleted_account"],
    },
    target_id: { type: Schema.Types.ObjectId, ref: "User" },
    target_email: { type: String },
    details: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

AuditLogSchema.index({ family_id: 1, created_at: -1 });

export const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema, "audit_logs");
