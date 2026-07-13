import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const managersToSeed = [
  { name: "Asif Iqbal", email: "asif.iqbal@nexacore.com" },
  { name: "Fahmida Chowdhury", email: "fahmida.chowdhury@nexacore.com" },
  { name: "Kazi Arafat", email: "kazi.arafat@nexacore.com" },
  { name: "Nabila Rahman", email: "nabila.rahman@nexacore.com" },
  { name: "Zeeshan Alam", email: "zeeshan.alam@nexacore.com" }
];

async function main() {
  const defaultPassword = "Password123";
  console.log(`[Seed] Hashing default password "${defaultPassword}"...`);
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  console.log(`[Seed] Beginning project manager seeding of ${managersToSeed.length} members...`);

  for (const mgr of managersToSeed) {
    const existing = await prisma.user.findUnique({
      where: { email: mgr.email },
    });

    if (existing) {
      console.log(`[Seed] Skipped: ${mgr.name} (${mgr.email}) already exists.`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: mgr.name,
          email: mgr.email,
          emailVerified: true,
          role: "PROJECT_MANAGER",
        },
      });

      await tx.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: mgr.email,
          password: hashedPassword,
        },
      });
    });

    console.log(`[Seed] Provisioned PM: ${mgr.name} (${mgr.email})`);
  }

  console.log("\n=========================================");
  console.log("  5 Project Managers Seeded Successfully!");
  console.log("  All password credentials: Password123");
  console.log("=========================================\n");
}

main()
  .catch((e) => {
    console.error("[Seed Error]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
