import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "hr@worksync.com";
  const password = "Password123";
  const name = "Jane Doe (HR Admin)";

  console.log("[Seed] Checking if default HR admin user exists...");
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`[Seed] HR User already exists with email: ${email}`);
    return;
  }

  console.log("[Seed] Hashing default password...");
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log("[Seed] Inserting HR user and credentials...");
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        emailVerified: true,
        role: "HR",
      },
    });

    await tx.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: email,
        password: hashedPassword,
      },
    });
  });

  console.log("\n=========================================");
  console.log("  HR Admin User Created Successfully!");
  console.log("=========================================");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log("=========================================\n");
}

main()
  .catch((e) => {
    console.error("[Seed] Error creating user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
