import Image from "next/image";
import { useTranslations } from "next-intl";
import { CaptureFlow } from "@/components/capture/capture-flow";
import Link from "next/link";

interface MainHeroProps {
    turnstileSiteKey?: string;
    disableTurnstileForPdfGenerate?: boolean;
    initialUrl?: string;
}

export const MainHero = ({ turnstileSiteKey, disableTurnstileForPdfGenerate, initialUrl }: MainHeroProps) => {
    const t = useTranslations("homepage");
    const tHeader = useTranslations("header");

    return (
        <section className="relative overflow-hidden px-4 pt-28 pb-32 hero-background">
            <div className="absolute left-0 top-0 w-full h-full bg-zinc-50 dark:bg-zinc-900 z-9"></div>

            <div className="absolute inset-0 hero-background dark:bg-zinc-900 z-10"></div>
            


            <div className="relative mx-auto max-w-6xl text-center z-20">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                    {t("hero.titlePrefix")}
                    <span className="bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        {t("hero.titleHighlight")}
                    </span>
                </h1>

                <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                    {t("hero.subtitle")}
                </p>

                {/* <div className="mt-9 mb-2">
                    <Link
                        href="/auth/signup"
                        className="rounded-sm px-6 py-3 font-medium text-white shadow-lg shadow-indigo-600/20 bg-linear-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition-all"
                    >
                        {tHeader("getStarted")}
                    </Link>
                </div> */}

                <div className="mt-10 max-w-xl mx-auto">
                    <CaptureFlow turnstileSiteKey={turnstileSiteKey} disableTurnstileForPdfGenerate={disableTurnstileForPdfGenerate} initialUrl={initialUrl} />
                    <p className="mt-3 text-xs text-zinc-500">
                        {t("hero.noCreditCard")}
                    </p>
                </div>

                {/* Product mock preview */}
                <div className="mt-16 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 p-6 transition hover:shadow-3xl">
                    <div className="overflow-hidden rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-zinc-400 text-sm">
                        <Image src="/images/pdf-editor.jpg" alt="" width={1200} height={800} priority />
                    </div>
                </div>
            </div>

        </section>
    );
}

export default MainHero;
