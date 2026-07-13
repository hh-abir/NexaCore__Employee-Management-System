import { PrismaClient } from "@prisma/client";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.DATABASE_URL || "";

async function testMongoose() {
  console.log("\n--- Testing Mongoose (Native Driver) Connection ---");
  try {
    const start = Date.now();
    await mongoose.connect(url);
    console.log(`Mongoose successfully connected in ${Date.now() - start}ms`);
  } catch (err: any) {
    console.error("Mongoose connection failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

async function testPrisma() {
  console.log("\n--- Testing Prisma Connection ---");
  const prisma = new PrismaClient();
  try {
    const start = Date.now();
    await prisma.user.findFirst();
    console.log(`Prisma successfully connected in ${Date.now() - start}ms`);
  } catch (err: any) {
    console.error("Prisma connection failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const maskedUrl = url.replace(/:([^@]+)@/, ":****@");
  console.log(`Testing connection to: ${maskedUrl}`);
  await testMongoose();
  await testPrisma();
}

main();
