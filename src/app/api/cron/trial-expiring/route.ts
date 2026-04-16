import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Family, type IFamily } from "@/lib/db/models/family";
import { User, type IUser } from "@/lib/db/models/user";
import { sendTrialExpiringEmail } from "@/lib/services/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const now = new Date();
  const in1Day = new Date(now);
  in1Day.setDate(in1Day.getDate() + 1);
  const in3Days = new Date(now);
  in3Days.setDate(in3Days.getDate() + 3);

  // Find families with trial ending in ~1 day or ~3 days
  // 1 day: trial_ends_at between now and +1 day
  // 3 days: trial_ends_at between +2 days and +3 days
  const families = await Family.find({
    subscription_status: "trialing",
    trial_ends_at: { $ne: null },
    $or: [
      { trial_ends_at: { $gte: now, $lte: in1Day } },
      { trial_ends_at: { $gte: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), $lte: in3Days } },
    ],
  }).lean<IFamily[]>();

  let sent = 0;
  let failed = 0;

  for (const family of families) {
    const owner = await User.findById(family.owner_id).lean<IUser>();
    if (!owner?.email) continue;

    const msRemaining = family.trial_ends_at!.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    if (daysRemaining < 1 || daysRemaining > 3) continue;

    // Normalize to 1 or 3
    const notifyDays = daysRemaining <= 1 ? 1 : 3;

    try {
      await sendTrialExpiringEmail(owner.email, owner.fullname, notifyDays);
      sent++;
    } catch (error) {
      console.error(`Failed to send trial email to ${owner.email}:`, error);
      failed++;
    }
  }

  return NextResponse.json({
    processed: families.length,
    sent,
    failed,
  });
}
