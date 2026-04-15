"use client";

type HowItWorksProps = {
    numberLabel: string,
    title: string
    description: string
    className: string
}
export const HowItWorks = ({ numberLabel, title, description, className}: HowItWorksProps) => {
    return ( 
        <div className={ `p-5 md:p-7 rounded-3xl how-it-works ${className}` }>
            <div className="flex items-center justify-center mb-5">
                <div className="w-16 h-16 border-[3px] border-black rounded-full flex items-center justify-center text-4xl font-bold text-black">
                    {numberLabel}
                </div>
            </div>
            <h3 className="font-semibold text-2xl md:text-3xl">{title}</h3>
            <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
                {description}
            </p>
        </div>
    );
}