"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "/images/hero/commerce-moderne.jpg", alt: "Commerce moderne" },
  { src: "/images/products/brazza-robe-wax-ndoki.jpg", alt: "Mode" },
  { src: "/images/products/samsung-galaxy-a54-5g.jpg", alt: "Électronique" },
  { src: "/images/products/station-energie-solaire-1000w.jpg", alt: "Énergie solaire" },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full max-w-[260px] aspect-[4/3] rounded-lg overflow-hidden shadow-lg border border-white/20">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="(max-width: 1024px) 100vw, 300px"
            className="object-cover"
          />
        </div>
      ))}

      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition ${
              i === index ? "bg-white" : "bg-white/40"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
