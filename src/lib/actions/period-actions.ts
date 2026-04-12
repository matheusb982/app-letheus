"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";
import { Period, type IPeriod } from "@/lib/db/models/period";
import { Goal } from "@/lib/db/models/goal";
import { Revenue } from "@/lib/db/models/revenue";
import { getMonthName } from "@/lib/utils/months";
import { DEFAULT_REVENUES } from "@/lib/utils/constants";
import { getUserFamilyId } from "@/lib/actions/family-helpers";

export async function setPeriod(periodId: string) {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const familyId = await getUserFamilyId();

  const period = await Period.findOne({ _id: periodId, family_id: familyId });
  if (!period) throw new Error("Período não encontrado");

  await User.findByIdAndUpdate(session.user.id, { period_id: period._id });

  revalidatePath("/", "layout");
}

export async function createNewPeriod() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const familyId = await getUserFamilyId();
  const user = await User.findById(session.user.id);
  if (!user) throw new Error("Usuário não encontrado");

  const currentPeriod = user.period_id
    ? await Period.findById(user.period_id)
    : null;

  let nextMonth: number;
  let nextYear: number;

  if (currentPeriod) {
    nextMonth = currentPeriod.month === 12 ? 1 : currentPeriod.month + 1;
    nextYear =
      currentPeriod.month === 12 ? currentPeriod.year + 1 : currentPeriod.year;
  } else {
    const now = new Date();
    nextMonth = now.getMonth() + 1;
    nextYear = now.getFullYear();
  }

  // Check if period already exists
  let newPeriod = await Period.findOne({ month: nextMonth, year: nextYear, family_id: familyId });

  if (!newPeriod) {
    newPeriod = await Period.create({
      name: getMonthName(nextMonth),
      month: nextMonth,
      year: nextYear,
      family_id: familyId,
    });

    // Copy goals from current period
    if (currentPeriod) {
      const currentGoals = await Goal.find({ period_id: currentPeriod._id, family_id: familyId });
      for (const goal of currentGoals) {
        await Goal.create({
          value: goal.value,
          subcategory_name: goal.subcategory_name,
          subcategory_id: goal.subcategory_id,
          period_id: newPeriod._id,
          family_id: familyId,
        });
      }
    }

    // Create default revenues
    for (const rev of DEFAULT_REVENUES) {
      await Revenue.create({
        name: rev.name,
        value: rev.value,
        period_id: newPeriod._id,
        family_id: familyId,
      });
    }
  }

  // Update user's active period
  await User.findByIdAndUpdate(session.user.id, {
    period_id: newPeriod._id,
  });

  revalidatePath("/", "layout");
}

export type SerializedPeriod = {
  id: string;
  name: string;
  month: number;
  year: number;
  label: string;
};

function serializePeriod(p: IPeriod): SerializedPeriod {
  return {
    id: p._id.toString(),
    name: p.name,
    month: p.month,
    year: p.year,
    label: `${p.name} ${p.year}`,
  };
}

export async function getAllPeriods(): Promise<SerializedPeriod[]> {
  await connectDB();
  const familyId = await getUserFamilyId();
  const periods = await Period.find({ family_id: familyId }).sort({ year: -1, month: -1 });
  return periods.map(serializePeriod);
}

export async function getCurrentPeriod(): Promise<SerializedPeriod | null> {
  const session = await auth();
  if (!session) return null;

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user?.period_id) return null;

  const period = await Period.findById(user.period_id);
  if (!period) return null;

  return serializePeriod(period);
}
