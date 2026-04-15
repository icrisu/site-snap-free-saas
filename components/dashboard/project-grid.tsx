"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Share2, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { deleteProject } from "@/lib/actions/projects";
import { DeleteProjectDialog } from "@/components/dashboard/delete-project-dialog";
import type { ProjectRow } from "@/lib/actions/projects";

function getThumbnailSrc(project: ProjectRow): string | null {
  if (project.thumbnailUrl) return project.thumbnailUrl;
  if (project.localThumbnailFileName)
    return `/uploads/thumbnails/${project.id}.png`;
  return null;
}

type ProjectGridProps = {
  projects: ProjectRow[];
};

export function ProjectGrid({ projects }: ProjectGridProps) {
  const t = useTranslations("dashboard.projects");
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteProject(deleteTarget.id);
      if (result.success) {
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  if (projects.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        {t("noProjects")}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
        {projects.map((project) => {
          const thumb = getThumbnailSrc(project);
          return (
            <div
              key={project.id}
              className="group bg-card shadow-sm transition-shadow hover:shadow-md rounded-t-lg border border-zinc-200"
            >
              <div className="relative aspect-4/3 bg-muted overflow-hidden rounded-t-lg border-b border-zinc-200">
                {thumb ? (
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                  >
                    <Image loading="eager" src={`${thumb}?v=${project.updatedAt.getTime()}`} alt="" width={600} height={400} className="object-cover" />

                  </Link>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    PDF
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 p-4">
                <span className="truncate text-md font-bold">
                  {project.name}
                </span>

                <div className="flex shrink-0 gap-1">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title={t("edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <Link
                    target="_blank"
                    href={`/projects/${project.id}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title={t("share")}
                  >
                    <Share2 className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(project)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title={t("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteProjectDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        projectName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
