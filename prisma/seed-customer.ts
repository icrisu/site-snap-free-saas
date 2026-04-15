import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { assignFreePlan } from "@/lib/billing/assign-free-plan";

async function main() {
  const password = await bcrypt.hash("customer123", 12);

  const user = await prisma.user.upsert({
    where: { email: "customer@sitesnap.dev" },
    update: {},
    create: {
      name: "Customer",
      email: "customer@sitesnap.dev",
      password,
      role: "CUSTOMER",
      emailVerified: new Date(),
    },
  });

  await assignFreePlan(user.id);
  console.log("Successfully seeded:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });