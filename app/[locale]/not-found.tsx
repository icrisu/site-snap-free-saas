import { useTranslations } from "next-intl";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
	const t = useTranslations("errors");

	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
				<h1 className="text-4xl font-bold">404</h1>
				<p className="text-lg text-zinc-600 dark:text-zinc-400">
					{t("notFound")}
				</p>
				<p className="text-sm text-zinc-500">
					{t("notFoundDescription")}
				</p>
				<Link href="/">
					<Button>{t("goHome")}</Button>
				</Link>
			</main>
			<Footer />
		</div>
	);
}
