"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";

export function TestimonialSlider() {
  const t = useTranslations("homepage");
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    { name: t("testimonials.name1"), role: t("testimonials.role1"), quote: t("testimonials.quote1") },
    { name: t("testimonials.name2"), role: t("testimonials.role2"), quote: t("testimonials.quote2") },
    { name: t("testimonials.name3"), role: t("testimonials.role3"), quote: t("testimonials.quote3") },
    { name: t("testimonials.name4"), role: t("testimonials.role4"), quote: t("testimonials.quote4") },
  ];

  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      const firstCard = containerRef.current.children[0] as HTMLElement;
      if (!firstCard) return;

      const cardWidth = firstCard.offsetWidth;
      const gap = 24;

      const scrollLeft = index * (cardWidth + gap);

      containerRef.current.scrollTo({
        left: scrollLeft,
        behavior: "smooth"
      });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex < testimonials.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
    }
  };

  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 text-center relative">
        <h2 className="text-3xl font-bold mb-6">{t("testimonials.title")}</h2>

        <div className="relative group">
          {/* Scroll Container */}
          <div
            ref={containerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar py-5"
            style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
            }}
          >
            {testimonials.map((item, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[300px] sm:w-[360px] snap-start bg-white dark:bg-zinc-950 rounded-2xl shadow-lg p-6 transition-all"
              >
                <p className="text-zinc-700 dark:text-zinc-300 text-sm mb-4">&ldquo;{item.quote}&rdquo;</p>
                <div className="text-left">
                  <p className="font-semibold text-zinc-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-3 rounded-full bg-white dark:bg-zinc-800 shadow-md hover:bg-zinc-100 disabled:opacity-30 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === testimonials.length - 1}
              className="p-3 rounded-full bg-white dark:bg-zinc-800 shadow-md hover:bg-zinc-100 disabled:opacity-30 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
