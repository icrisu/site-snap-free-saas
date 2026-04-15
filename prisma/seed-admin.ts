import "dotenv/config";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { assignFreePlan } from "@/lib/billing/assign-free-plan";


async function main() {
  const password = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@sitesnap.dev" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@sitesnap.dev",
      password,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  await assignFreePlan(user.id);
  console.log("Seeded admin user:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
