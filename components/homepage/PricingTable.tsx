import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const PricingTable = () => {
    const t = useTranslations("homepage");
    const currency = "$";

    return (
        <section id="pricing" className="py-24 bg-zinc-50 dark:bg-zinc-900">
            <div className="mx-auto max-w-6xl px-4 text-center">
                <h2 className="text-3xl font-bold mb-12">{t("pricing.title")}</h2>

                <div className="grid md:grid-cols-3 gap-8 mx-auto">

                    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 bg-white dark:bg-zinc-950">
                        <h3 className="text-xl font-semibold">{t("pricing.free")}</h3>
                        <p className="mt-4 text-4xl font-bold">
                            {currency}0<span className="text-lg">{t("pricing.perMonth")}</span>
                        </p>
                        <ul className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                            <li>✓ {t("pricing.projects2")}</li>
                            <li>✓ {t("pricing.storage10")}</li>
                            <li>✓ {t("pricing.featureAnnotations")}</li>
                            <li>✓ {t("pricing.featureDownload")}</li>
                            <li>✓ {t("pricing.shareViaLink")}</li>
                        </ul>
                        <div className="mt-9">
                            <Link
                                href="/dashboard"
                                className="rounded-sm bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                            >
                                {t("pricing.getStarted")}
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-3xl border-2 border-indigo-500 p-8 bg-white dark:bg-zinc-950 shadow-xl">
                        <h3 className="text-xl font-semibold">{t("pricing.pro")}</h3>
                        <p className="mt-4 text-4xl font-bold">
                            {currency}5<span className="text-lg">{t("pricing.perMonth")}</span>
                        </p>
                        <ul className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                            <li>✓ {t("pricing.projects100")}</li>
                            <li>✓ {t("pricing.storage100")}</li>
                            <li>✓ {t("pricing.featureAnnotations")}</li>
                            <li>✓ {t("pricing.featureDownload")}</li>
                            <li>✓ {t("pricing.saveProjects")}</li>
                            <li>✓ {t("pricing.shareViaLink")}</li>
                            <li>✓ {t("pricing.priorityProcessing")}</li>
                        </ul>
                        <div className="mt-9">
                            <Link
                                href="/dashboard/subscription"
                                className="rounded-sm bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                            >
                                {t("pricing.getStarted")}
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 bg-white dark:bg-zinc-950">
                        <h3 className="text-xl font-semibold">{t("pricing.pro")}</h3>
                        <p className="mt-4 text-4xl font-bold">
                            {currency}9<span className="text-lg">{t("pricing.perMonth")}</span>
                        </p>
                        <ul className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                            <li>✓ {t("pricing.projects1000")}</li>
                            <li>✓ {t("pricing.storage1000")}</li>
                            <li>✓ {t("pricing.featureAnnotations")}</li>
                            <li>✓ {t("pricing.featureDownload")}</li>
                            <li>✓ {t("pricing.saveProjects")}</li>
                            <li>✓ {t("pricing.shareViaLink")}</li>
                            <li>✓ {t("pricing.priorityProcessing")}</li>
                        </ul>
                        <div className="mt-9">
                            <Link
                                href="/dashboard/subscription"
                                className="rounded-sm bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                            >
                                {t("pricing.getStarted")}
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default PricingTable;
