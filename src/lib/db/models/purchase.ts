import mongoose, { Schema, type Document } from "mongoose";

export interface IPurchase extends Document {
  value: number;
  purchase_date: Date;
  purchase_type: "debit" | "credit";
  description?: string;
  subcategory_name?: string;
  subcategory_id?: mongoose.Types.ObjectId;
  period_id?: mongoose.Types.ObjectId;
  family_id?: mongoose.Types.ObjectId;
  is_sample?: boolean;
  created_at: Date;
  updated_at: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    value: { type: Number, required: true },
    purchase_date: { type: Date, required: true },
    purchase_type: {
      type: String,
      required: true,
      enum: ["debit", "credit"],
    },
    description: { type: String },
    subcategory_name: { type: String },
    subcategory_id: { type: Schema.Types.ObjectId },
    period_id: { type: Schema.Types.ObjectId, ref: "Period" },
    family_id: { type: Schema.Types.ObjectId, ref: "Family" },
    is_sample: { type: Boolean },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

PurchaseSchema.index({ family_id: 1, period_id: 1 });

export const Purchase =
  mongoose.models.Purchase ||
  mongoose.model<IPurchase>("Purchase", PurchaseSchema, "purchases");
