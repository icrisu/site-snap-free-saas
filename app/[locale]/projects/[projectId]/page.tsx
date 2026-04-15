import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ProjectData } from "@/lib/projects/serialize";
import ProjectPreview from "@/components/project/project-preview";

export default async function ProjectPreviewPage({
	params,
}: {
	params: Promise<{ locale: string; projectId: string }>;
}) {


	const session = await auth();

	const { projectId } = await params;

	const project = await prisma.project.findUnique({
		where: { id: projectId },
	});

	if (!project) notFound();

	const isLoggedInAndProjectOwner: boolean = session?.user?.id === project.userId;

	return (		
		<ProjectPreview
			project={{
				id: project.id,
				name: project.name,
				localPdfFileName: project.localPdfFileName,
				pdfUrl: project.pdfUrl,
				data: project.data as ProjectData | null,
			}}
			isLoggedInAndProjectOwner={isLoggedInAndProjectOwner}
		/>
	);
}
