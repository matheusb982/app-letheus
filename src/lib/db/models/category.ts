import mongoose, { Schema, type Document, type Types } from "mongoose";

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
  created_at: Date;
  updated_at: Date;
}

const SubcategorySchema = new Schema<ISubcategory>({
  name: { type: String, required: true },
  description: { type: String },
});

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    category_type: {
      type: String,
      required: true,
      enum: ["purchase", "patrimony"],
    },
    subcategories: [SubcategorySchema],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const Category =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema, "categories");
