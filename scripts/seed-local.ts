import mongoose from "mongoose";
import "dotenv/config";

const PROD_URI = process.env.PROD_MONGODB_URI;
const LOCAL_URI = process.env.MONGODB_URI || "mongodb://localhost:27018/letheus";

if (!PROD_URI) {
  console.error("PROD_MONGODB_URI not set. Add it to .env to seed from production.");
  process.exit(1);
}

if (PROD_URI === LOCAL_URI) {
  console.error("PROD_MONGODB_URI and MONGODB_URI are the same. Aborting to prevent data loss.");
  process.exit(1);
}

const COLLECTIONS_WITH_FAMILY = [
  "periods",
  "purchases",
  "revenues",
  "goals",
  "patrimonies",
  "categories",
];

async function seed() {
  // Connect to prod
  const prod = await mongoose.createConnection(PROD_URI!).asPromise();
  console.log("Connected to PROD");

  const prodDb = prod.db!;

  // Get all families and users
  const families = await prodDb.collection("families").find().toArray();
  const users = await prodDb.collection("users").find().toArray();

  console.log(`Found ${families.length} families, ${users.length} users`);

  // Find periods from last 2 months
  const now = new Date();
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const cutoffMonth = twoMonthsAgo.getMonth() + 1;
  const cutoffYear = twoMonthsAgo.getFullYear();

  const periods = await prodDb
    .collection("periods")
    .find({
      $or: [
        { year: { $gt: cutoffYear } },
        { year: cutoffYear, month: { $gte: cutoffMonth } },
      ],
    })
    .toArray();

  const periodIds = periods.map((p) => p._id);
  console.log(`Found ${periods.length} periods (last 2 months)`);

  // Fetch data for those periods
  const data: Record<string, unknown[]> = {
    families,
    users,
    periods,
  };

  for (const col of COLLECTIONS_WITH_FAMILY) {
    if (col === "periods" || col === "categories") continue;

    const docs = await prodDb
      .collection(col)
      .find({ period_id: { $in: periodIds } })
      .toArray();
    data[col] = docs;
    console.log(`Fetched ${docs.length} ${col}`);
  }

  // Categories don't have period_id, fetch all with family_id
  const categories = await prodDb.collection("categories").find().toArray();
  data.categories = categories;
  console.log(`Fetched ${categories.length} categories`);

  // Fetch chat sessions and messages for completeness
  const chatSessions = await prodDb.collection("chat_sessions").find().toArray();
  const chatMessages = await prodDb.collection("chat_messages").find().toArray();
  const classificationRules = await prodDb.collection("classification_rules").find().toArray();
  console.log(`Fetched ${chatSessions.length} chat sessions, ${chatMessages.length} messages, ${classificationRules.length} rules`);

  await prod.close();
  console.log("\nDisconnected from PROD");

  // Connect to local
  const local = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log("Connected to LOCAL");

  const localDb = local.db!;

  // Drop existing collections
  const existingCollections = await localDb.listCollections().toArray();
  for (const col of existingCollections) {
    await localDb.dropCollection(col.name);
  }
  console.log("Cleared local database");

  // Insert data
  const insertions: [string, unknown[]][] = [
    ["families", data.families],
    ["users", data.users],
    ["periods", data.periods],
    ["purchases", data.purchases || []],
    ["revenues", data.revenues || []],
    ["goals", data.goals || []],
    ["patrimonies", data.patrimonies || []],
    ["categories", data.categories],
    ["chat_sessions", chatSessions],
    ["chat_messages", chatMessages],
    ["classification_rules", classificationRules],
  ];

  for (const [name, docs] of insertions) {
    if (docs.length > 0) {
      await localDb.collection(name).insertMany(docs as Document[]);
      console.log(`Inserted ${docs.length} ${name}`);
    } else {
      console.log(`Skipped ${name} (empty)`);
    }
  }

  // Summary
  console.log("\n--- Seed Summary ---");
  for (const [name, docs] of insertions) {
    console.log(`${name}: ${docs.length}`);
  }
  console.log("--- Done ---");

  await local.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
