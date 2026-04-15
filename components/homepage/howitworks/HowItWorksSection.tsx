"use client";

import { useTranslations } from "next-intl";
import { HowItWorks } from "./HowItWorks";
import { useMemo } from "react";

export const HowItWorksSection = () => {
    const t = useTranslations("homepage");

    const howItWorksMessages = useMemo(() => {
        return [
            {
                numberLabel: '1',
                title: t("howItWorks.step1Title"),
                description: t("howItWorks.step1Description"),
                className: 'card-1'
            },
            {
                numberLabel: '2',
                title: t("howItWorks.step2Title"),
                description: t("howItWorks.step2Description"),
                className: 'card-2'
            },
            {
                numberLabel: '3',
                title: t("howItWorks.step3Title"),
                description: t("howItWorks.step3Description"),
                className: 'card-3'
            }
        ];
    }, [t]);

    return (
        <section className="py-24 bg-white dark:bg-zinc-900">

            <div className="mx-auto max-w-6xl px-4">

                <h2 className="text-3xl font-bold text-center mb-16">
                    {t("howItWorks.title")}
                </h2>

                <div className="grid md:grid-cols-3 gap-12 text-center">
                    { howItWorksMessages.map((entry) => {
                        return <HowItWorks key={entry.numberLabel} numberLabel={entry.numberLabel}
                        description={entry.description} title={entry.title} className={entry.className} />
                    }) }
                </div>
            </div>
        </section>

    );
}
