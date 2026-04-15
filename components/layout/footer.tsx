import { useTranslations } from "next-intl";

export function Footer() {
	const t = useTranslations("footer");

	return (
		<footer className="border-t border-zinc-200 dark:border-zinc-800">
			<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 text-sm text-zinc-500">
				<p>
					&copy; {new Date().getFullYear()} {process.env.SITE_NAME ?? "SiteSnap"}. {t("rights")}
				</p>
				{/* <p>{t("builtWith")}</p> */}
				<p><a className="underline" target="_blank" href="https://sakuraleaf.com">sakuraleaf.com</a></p>
			</div>
		</footer>
	);
}
