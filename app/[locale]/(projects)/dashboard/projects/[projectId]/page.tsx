import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ProjectData } from "@/lib/projects/serialize";
import ProjectEditor from "@/components/project/project-editor";

export default async function ProjectEditorPage({
	params,
}: {
	params: Promise<{ locale: string; projectId: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) notFound();

	const { projectId } = await params;

	const project = await prisma.project.findUnique({
		where: { id: projectId },
	});

	if (!project || project.userId !== session.user.id) notFound();

	return (
		<div className="flex min-h-screen flex-col">
			<ProjectEditor
				project={{
					id: project.id,
					name: project.name,
					sourceUrl: project.sourceUrl,
					localPdfFileName: project.localPdfFileName,
					pdfUrl: project.pdfUrl,
					data: project.data as ProjectData | null,
				}}
			/>
		</div>
	);
}
