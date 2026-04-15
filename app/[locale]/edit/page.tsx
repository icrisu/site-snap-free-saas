import { getTranslations } from "next-intl/server";
// import EditPageClient from "@/components/editor/edit-page-client";
import EditPageClient from "@/components/editor/edit-page-comp";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "metadata" });

	return {
		title: t("editTitle"),
		description: t("editDescription"),
		robots: { index: false, follow: false },
	};
}

const disableSignupPayments = process.env.DISABLE_SIGNUP_PAYMENTS === "true";

export default function EditPage() {
	return <EditPageClient disableSignupPayments={disableSignupPayments} />;
}
