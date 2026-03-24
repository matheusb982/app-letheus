import mongoose, { type Types, Schema, type Document } from "mongoose";

export interface ISubcategory {
  _id: Types.ObjectId;
  name: string;
  description?: string;
}

export interface ICategory extends Document {
  name: string;
  description?: string;
  category_type: "purchase" | "patrimony";
  subcategories: ISubcategory[];
  family_id?: mongoose.Types.ObjectId | null;
  created_at: Date;
  updated_at: Date;
}

const SubcategorySchema = new Schema<ISubcategory>({
  name: { type: String, required: true },
  description: { type: String },
});

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    description: { type: String },
    category_type: {
      type: String,
      required: true,
      enum: ["purchase", "patrimony"],
    },
    subcategories: [SubcategorySchema],
    family_id: { type: Schema.Types.ObjectId, ref: "Family", default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

CategorySchema.index({ name: 1, family_id: 1 }, { unique: true });

export const Category =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema, "categories");
