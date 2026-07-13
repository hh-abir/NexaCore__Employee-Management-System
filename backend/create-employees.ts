import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const employeesToSeed = [
  { name: "Abir Hasan", email: "abir.hasan@nexacore.com" },
  { name: "Tahsin Rahman", email: "tahsin.rahman@nexacore.com" },
  { name: "Sadia Islam", email: "sadia.islam@nexacore.com" },
  { name: "Nafis Ahmed", email: "nafis.ahmed@nexacore.com" },
  { name: "Tanzila Akter", email: "tanzila.akter@nexacore.com" },
  { name: "Zubair Rahman", email: "zubair.rahman@nexacore.com" },
  { name: "Farhana Yasmin", email: "farhana.yasmin@nexacore.com" },
  { name: "Imtiaz Hossain", email: "imtiaz.hossain@nexacore.com" },
  { name: "Anika Tabassum", email: "anika.tabassum@nexacore.com" },
  { name: "Mahmudul Hasan", email: "mahmudul.hasan@nexacore.com" },
  { name: "Sajid Chowdhury", email: "sajid.chowdhury@nexacore.com" },
  { name: "Nusrat Jahan", email: "nusrat.jahan@nexacore.com" },
  { name: "Rafsan Jany", email: "rafsan.jany@nexacore.com" },
  { name: "Sabrina Sultana", email: "sabrina.sultana@nexacore.com" },
  { name: "Tanvir Anjum", email: "tanvir.anjum@nexacore.com" },
  { name: "Mehedi Hasan", email: "mehedi.hasan@nexacore.com" },
  { name: "Jannatul Ferdous", email: "jannatul.ferdous@nexacore.com" },
  { name: "Abrar Fahim", email: "abrar.fahim@nexacore.com" },
  { name: "Taskin Ahmed", email: "taskin.ahmed@nexacore.com" },
  { name: "Sumaiya Rahman", email: "sumaiya.rahman@nexacore.com" }
];

async function main() {
  const defaultPassword = "Password123";
  console.log(`[Seed] Hashing default password "${defaultPassword}"...`);
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  console.log(`[Seed] Beginning employee seeding of ${employeesToSeed.length} members...`);

  for (const emp of employeesToSeed) {
    const existing = await prisma.user.findUnique({
      where: { email: emp.email },
    });

    if (existing) {
      console.log(`[Seed] Skipped: ${emp.name} (${emp.email}) already exists.`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: emp.name,
          email: emp.email,
          emailVerified: true,
          role: "EMPLOYEE",
        },
      });

      await tx.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: emp.email,
          password: hashedPassword,
        },
      });
    });

    console.log(`[Seed] Provisioned: ${emp.name} (${emp.email})`);
  }

  console.log("\n=========================================");
  console.log("  20 Employees Seeded Successfully!");
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
