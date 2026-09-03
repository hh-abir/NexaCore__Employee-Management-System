import { runDatabaseSeed } from "./src/services/seedService";

async function main() {
  try {
    const result = await runDatabaseSeed();
    console.log("\n=======================================================");
    console.log("  NEXACORE DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=======================================================");
    console.log("\nCore Credentials:");
    result.users.forEach(u => {
      console.log(`- ${u.role}: ${u.email} (Password: ${u.password})`);
    });
    console.log("=======================================================\n");
    process.exit(0);
  } catch (error) {
    console.error("[Reset DB Error]:", error);
    process.exit(1);
  }
}

main();
