"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteProjectFiles } from "@/lib/projects/storage";

export type ProjectRow = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  localThumbnailFileName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getUserProjects() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      thumbnailUrl: true,
      localThumbnailFileName: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: "desc" },
  });

  return projects as ProjectRow[];
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  if (project.userId !== session.user.id) {
    return { success: false, error: "Unauthorized" };
  }

  await deleteProjectFiles(projectId);
  await prisma.project.delete({ where: { id: projectId } });

  return { success: true };
}
