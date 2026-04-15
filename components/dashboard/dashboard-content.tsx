"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { NewProjectFlow } from "@/components/dashboard/new-project-flow";
import { ProjectGrid } from "@/components/dashboard/project-grid";
import type { ProjectRow } from "@/lib/actions/projects";

type DashboardContentProps = {
	projects: ProjectRow[];
};

export function DashboardContent({ projects }: DashboardContentProps) {
	const t = useTranslations("projects");
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [dialogKey, setDialogKey] = useState(0);

	function handleCreated() {
		setOpen(false);
		router.refresh();
	}

	function handleOpenChange(value: boolean) {
		setOpen(value);
		if (value) {
			setDialogKey((k) => k + 1);
		}
	}

	return (
		<>
			<Button onClick={() => handleOpenChange(true)}>
				<Plus className="mr-2 h-4 w-4" />
				{t("newProject")}
			</Button>
			

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{t("newProject")}</DialogTitle>
					</DialogHeader>
					<NewProjectFlow key={dialogKey} onCreated={handleCreated} />
				</DialogContent>
			</Dialog>

			<div className="mt-5">
				<ProjectGrid projects={projects} />
			</div>
		</>
	);
}
