import { useTranslations } from "next-intl";

const featureKeys = [
    "fastPdf",
    "securePrivate",
    "annotations",
    "cloudStorage",
    "shareableLinks",
    "premiumStorage",
] as const;

const Features = () => {
    const t = useTranslations("homepage");

    return (
        <section className="py-24 hero-background-bottom">
            <div className="mx-auto max-w-6xl px-4">
                <h2 className="text-3xl font-bold text-center mb-16">
                    {t("features.title")}
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {featureKeys.map((key) => (
                        <div
                            key={key}
                            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-950 shadow-sm transition transform hover:-translate-y-1 hover:shadow-xl"
                        >
                            <h3 className="font-semibold text-lg mb-2">{t(`features.${key}`)}</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                {t("features.description")}
                            </p>
                        </div>
                    ))}
                </div>
                
            </div>
        </section>
    );
}

export default Features;
