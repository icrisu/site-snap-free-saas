import { prisma } from "@/lib/db";

export type Usage = {
  projectCount: number;
  storageMB: number;
};

export async function getUsage(userId: string): Promise<Usage> {
  const [projectCount, storageAgg] = await Promise.all([
    prisma.project.count({ where: { userId } }),
    prisma.project.aggregate({
      where: { userId },
      _sum: { fileSize: true },
    }),
  ]);

  const storageBytes = Number(storageAgg._sum.fileSize ?? 0);

  return {
    projectCount,
    storageMB: Math.round((storageBytes / (1024 * 1024)) * 100) / 100,
  };
}
