import mongoose from "mongoose";
import "dotenv/config";

const ADMIN_EMAIL = "matheusb982@gmail.com";
const FAMILY_NAME = "Família Teixeira";

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db!;

  // Step 1: Find or create family
  const familiesCol = db.collection("families");
  let family = await familiesCol.findOne({ name: FAMILY_NAME });

  if (!family) {
    // Find admin user first
    const usersCol = db.collection("users");
    const adminUser = await usersCol.findOne({ email: ADMIN_EMAIL });
    if (!adminUser) {
      console.error(`Admin user ${ADMIN_EMAIL} not found`);
      process.exit(1);
    }

    const now = new Date();
    const result = await familiesCol.insertOne({
      name: FAMILY_NAME,
      owner_id: adminUser._id,
      created_at: now,
      updated_at: now,
    });
    family = await familiesCol.findOne({ _id: result.insertedId });
    console.log(`Created family: ${FAMILY_NAME} (${family!._id})`);
  } else {
    console.log(`Family already exists: ${FAMILY_NAME} (${family._id})`);
  }

  const familyId = family!._id;

  // Step 2: Update users
  const usersCol = db.collection("users");
  const adminResult = await usersCol.updateOne(
    { email: ADMIN_EMAIL },
    { $set: { family_id: familyId, family_role: "admin" } }
  );
  console.log(`Admin user updated: ${adminResult.modifiedCount}`);

  const othersResult = await usersCol.updateMany(
    { email: { $ne: ADMIN_EMAIL }, family_id: { $exists: false } },
    { $set: { family_id: familyId, family_role: "member" } }
  );
  console.log(`Other users updated: ${othersResult.modifiedCount}`);

  // Also update users that already have family_id but set it again for idempotency
  const allUsersResult = await usersCol.updateMany(
    { email: { $ne: ADMIN_EMAIL }, family_id: { $ne: familyId } },
    { $set: { family_id: familyId, family_role: "member" } }
  );
  console.log(`Additional users updated: ${allUsersResult.modifiedCount}`);

  // Step 3: Update periods
  const periodsResult = await db.collection("periods").updateMany(
    { family_id: { $exists: false } },
    { $set: { family_id: familyId } }
  );
  console.log(`Periods updated: ${periodsResult.modifiedCount}`);

  // Step 4: Update purchases
  const purchasesResult = await db.collection("purchases").updateMany(
    { family_id: { $exists: false } },
    { $set: { family_id: familyId } }
  );
  console.log(`Purchases updated: ${purchasesResult.modifiedCount}`);

  // Step 5: Update revenues
  const revenuesResult = await db.collection("revenues").updateMany(
    { family_id: { $exists: false } },
    { $set: { family_id: familyId } }
  );
  console.log(`Revenues updated: ${revenuesResult.modifiedCount}`);

  // Step 6: Update goals
  const goalsResult = await db.collection("goals").updateMany(
    { family_id: { $exists: false } },
    { $set: { family_id: familyId } }
  );
  console.log(`Goals updated: ${goalsResult.modifiedCount}`);

  // Step 7: Update patrimonies
  const patrimoniesResult = await db.collection("patrimonies").updateMany(
    { family_id: { $exists: false } },
    { $set: { family_id: familyId } }
  );
  console.log(`Patrimonies updated: ${patrimoniesResult.modifiedCount}`);

  // Step 8: Update categories
  const categoriesResult = await db.collection("categories").updateMany(
    { family_id: { $exists: false } },
    { $set: { family_id: familyId } }
  );
  console.log(`Categories updated: ${categoriesResult.modifiedCount}`);

  // Summary
  const totalUsers = await usersCol.countDocuments({ family_id: familyId });
  const totalPeriods = await db
    .collection("periods")
    .countDocuments({ family_id: familyId });
  const totalPurchases = await db
    .collection("purchases")
    .countDocuments({ family_id: familyId });
  const totalRevenues = await db
    .collection("revenues")
    .countDocuments({ family_id: familyId });
  const totalGoals = await db
    .collection("goals")
    .countDocuments({ family_id: familyId });
  const totalPatrimonies = await db
    .collection("patrimonies")
    .countDocuments({ family_id: familyId });
  const totalCategories = await db
    .collection("categories")
    .countDocuments({ family_id: familyId });

  console.log("\n--- Migration Summary ---");
  console.log(`Family: ${FAMILY_NAME} (${familyId})`);
  console.log(`Users: ${totalUsers}`);
  console.log(`Periods: ${totalPeriods}`);
  console.log(`Purchases: ${totalPurchases}`);
  console.log(`Revenues: ${totalRevenues}`);
  console.log(`Goals: ${totalGoals}`);
  console.log(`Patrimonies: ${totalPatrimonies}`);
  console.log(`Categories: ${totalCategories}`);
  console.log("--- Done ---");

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
