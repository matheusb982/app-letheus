"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { Category, type ICategory } from "@/lib/db/models/category";
import { categorySchema, subcategorySchema } from "@/lib/validations/categories";

export interface SerializedSubcategory {
  id: string;
  name: string;
  description: string;
}

export interface SerializedCategory {
  id: string;
  name: string;
  description: string;
  category_type: "purchase" | "patrimony";
  category_type_label: string;
  subcategories: SerializedSubcategory[];
}

export async function getCategories(): Promise<SerializedCategory[]> {
  await connectDB();
  const categories = await Category.find().sort({ name: 1 }).lean<ICategory[]>();

  return categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    description: c.description ?? "",
    category_type: c.category_type,
    category_type_label: c.category_type === "purchase" ? "Compra" : "Patrimônio",
    subcategories: c.subcategories.map((s: { _id: { toString(): string }; name: string; description?: string }) => ({
      id: s._id.toString(),
      name: s.name,
      description: s.description ?? "",
    })),
  }));
}

export async function getSubcategoriesByType(categoryType: "purchase" | "patrimony"): Promise<SerializedSubcategory[]> {
  await connectDB();
  const categories = await Category.find({ category_type: categoryType }).lean<ICategory[]>();

  const subcategories: SerializedSubcategory[] = [];
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      subcategories.push({
        id: (sub as { _id: { toString(): string } })._id.toString(),
        name: sub.name,
        description: sub.description ?? "",
      });
    }
  }

  return subcategories.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCategory(data: FormData) {
  await connectDB();

  const raw = {
    name: data.get("name"),
    description: data.get("description"),
    category_type: data.get("category_type"),
  };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await Category.create(parsed.data);

  revalidatePath("/categories");
  return { success: true };
}

export async function updateCategory(id: string, data: FormData) {
  await connectDB();

  const raw = {
    name: data.get("name"),
    description: data.get("description"),
    category_type: data.get("category_type"),
  };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await Category.findByIdAndUpdate(id, parsed.data);

  revalidatePath("/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  await connectDB();
  await Category.findByIdAndDelete(id);
  revalidatePath("/categories");
}

export async function addSubcategory(categoryId: string, data: FormData) {
  await connectDB();

  const raw = {
    name: data.get("name"),
    description: data.get("description"),
  };

  const parsed = subcategorySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await Category.findByIdAndUpdate(categoryId, {
    $push: { subcategories: parsed.data },
  });

  revalidatePath("/categories");
  return { success: true };
}

export async function updateSubcategory(
  categoryId: string,
  subcategoryId: string,
  data: FormData
) {
  await connectDB();

  const raw = {
    name: data.get("name"),
    description: data.get("description"),
  };

  const parsed = subcategorySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await Category.findOneAndUpdate(
    { _id: categoryId, "subcategories._id": subcategoryId },
    {
      $set: {
        "subcategories.$.name": parsed.data.name,
        "subcategories.$.description": parsed.data.description ?? "",
      },
    }
  );

  revalidatePath("/categories");
  return { success: true };
}

export async function deleteSubcategory(categoryId: string, subcategoryId: string) {
  await connectDB();

  await Category.findByIdAndUpdate(categoryId, {
    $pull: { subcategories: { _id: subcategoryId } },
  });

  revalidatePath("/categories");
}
