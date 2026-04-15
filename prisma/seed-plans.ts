import "dotenv/config";
import { prisma } from "@/lib/db";

async function main() {
  // 1. Create Free plan
  const freePlan = await prisma.plan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      isFree: true,
      maxProjects: 5,
      maxStorageMB: 50,
      maxFileSizeMB: 10,
      monthlyPrice: 0,
      displayOrder: 0,
    },
  });
  console.log("Created/found Free plan:", freePlan.slug);

  // 2. Create Pro plan stub
  const proPlan = await prisma.plan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      name: "Pro",
      slug: "pro",
      isFree: false,
      maxProjects: 50,
      maxStorageMB: 500,
      maxFileSizeMB: 50,
      monthlyPrice: 1900, // $19.00 in cents
      displayOrder: 1,
    },
  });
  console.log("Created/found Pro plan:", proPlan.slug);

  // 3. For every existing user without a subscription, assign the free plan
  const usersWithoutSub = await prisma.user.findMany({
    where: { subscription: null },
    select: { id: true },
  });

  for (const user of usersWithoutSub) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: freePlan.id,
        status: "ACTIVE",
      },
    });
    console.log(`Assigned free plan to user ${user.id}`);
  }

  console.log(`\nAssigned free plan to ${usersWithoutSub.length} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
