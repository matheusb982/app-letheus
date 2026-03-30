import mongoose from "mongoose";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not set.");
  process.exit(1);
}

const GLOBAL_CATEGORIES = [
  {
    name: "MORADIA",
    category_type: "purchase",
    subcategories: [
      { name: "Aluguel/Financiamento" },
      { name: "Condomínio" },
      { name: "Água" },
      { name: "Luz" },
      { name: "Gás" },
      { name: "Internet" },
      { name: "Manutenção da Casa" },
    ],
  },
  {
    name: "ALIMENTAÇÃO",
    category_type: "purchase",
    subcategories: [
      { name: "Supermercado" },
      { name: "Padaria" },
      { name: "Restaurante" },
      { name: "Delivery/iFood" },
      { name: "Feira/Hortifruti" },
    ],
  },
  {
    name: "TRANSPORTE",
    category_type: "purchase",
    subcategories: [
      { name: "Combustível" },
      { name: "Uber/99" },
      { name: "Transporte Público" },
      { name: "Estacionamento" },
      { name: "Manutenção Veículo" },
      { name: "Seguro Veículo" },
    ],
  },
  {
    name: "SAÚDE",
    category_type: "purchase",
    subcategories: [
      { name: "Plano de Saúde" },
      { name: "Farmácia" },
      { name: "Consultas Médicas" },
      { name: "Academia" },
      { name: "Exames" },
    ],
  },
  {
    name: "EDUCAÇÃO",
    category_type: "purchase",
    subcategories: [
      { name: "Faculdade/Escola" },
      { name: "Cursos" },
      { name: "Livros/Material" },
    ],
  },
  {
    name: "LAZER",
    category_type: "purchase",
    subcategories: [
      { name: "Streaming/Assinaturas" },
      { name: "Bares/Restaurantes" },
      { name: "Viagens" },
      { name: "Cinema/Shows" },
      { name: "Passeios" },
    ],
  },
  {
    name: "PESSOAL",
    category_type: "purchase",
    subcategories: [
      { name: "Roupas/Acessórios" },
      { name: "Beleza/Estética" },
      { name: "Eletrônicos" },
      { name: "Presentes" },
      { name: "PET" },
      { name: "Outros" },
    ],
  },
  {
    name: "FINANCEIRO",
    category_type: "purchase",
    subcategories: [
      { name: "Tarifas Bancárias" },
      { name: "Seguros" },
      { name: "Impostos" },
      { name: "Empréstimos/Parcelas" },
    ],
  },
  {
    name: "APORTE",
    category_type: "patrimony",
    subcategories: [
      { name: "Renda Fixa" },
      { name: "Ações" },
      { name: "Fundos Imobiliários" },
      { name: "Tesouro Direto" },
      { name: "Criptomoedas" },
      { name: "Poupança" },
      { name: "Previdência Privada" },
      { name: "Outros" },
    ],
  },
];

async function seed() {
  const conn = await mongoose.createConnection(MONGODB_URI!).asPromise();
  const db = conn.db!;
  console.log("Connected to", MONGODB_URI!.replace(/\/\/.*@/, "//***@"));

  // Check existing global templates
  const existing = await db
    .collection("categories")
    .countDocuments({ family_id: null });

  if (existing > 0) {
    console.log(`Found ${existing} existing global templates.`);
    const answer = process.argv.includes("--force");
    if (!answer) {
      console.log("Use --force to replace them. Aborting.");
      await conn.close();
      process.exit(0);
    }
    await db.collection("categories").deleteMany({ family_id: null });
    console.log("Deleted existing global templates.");
  }

  // Insert new templates
  const now = new Date();
  const docs = GLOBAL_CATEGORIES.map((cat) => ({
    name: cat.name,
    description: "",
    category_type: cat.category_type,
    subcategories: cat.subcategories.map((s) => ({
      ...s,
      description: "",
      _id: new mongoose.Types.ObjectId(),
    })),
    family_id: null,
    created_at: now,
    updated_at: now,
  }));

  // Drop legacy unique index on name only (if exists) — should be { name, family_id }
  try {
    await db.collection("categories").dropIndex("name_1");
    console.log("Dropped legacy 'name_1' index (replaced by name_1_family_id_1)");
  } catch {
    // Index doesn't exist, that's fine
  }

  let created = 0;
  for (const doc of docs) {
    try {
      await db.collection("categories").insertOne(doc);
      created++;
      console.log(
        `  ${doc.name} (${doc.category_type}) — ${doc.subcategories.length} subcategories`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("E11000")) {
        console.log(`  ${doc.name} — skipped (already exists)`);
      } else {
        throw err;
      }
    }
  }
  console.log(`\nCreated ${created} global category templates.`);

  console.log("\nDone!");
  await conn.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
