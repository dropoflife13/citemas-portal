'use client';

import { useState } from 'react';

export default function EventCarousel({ images = [], title = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-52 bg-gradient-to-br from-red-950/80 to-black flex items-center justify-center text-4xl rounded-2xl border border-white/10 shadow-inner">
        🏛️
      </div>
    );
  }

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-black/60 border border-white/15 shadow-inner group/carousel">
      {/* Current Image */}
      <img
        src={images[currentIndex]}
        alt={`${title} - image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-all duration-500"
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Navigation Controls (Shown when multiple images exist) */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600/80 text-white flex items-center justify-center text-xs backdrop-blur-md border border-white/20 opacity-80 group-hover/carousel:opacity-100 transition-all cursor-pointer"
            aria-label="Previous image"
          >
            &#10094;
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600/80 text-white flex items-center justify-center text-xs backdrop-blur-md border border-white/20 opacity-80 group-hover/carousel:opacity-100 transition-all cursor-pointer"
            aria-label="Next image"
          >
            &#10095;
          </button>

          {/* Slide Indicator Badge */}
          <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-amber-300 backdrop-blur-md border border-white/15">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Bottom Pagination Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 transition-all rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-5 bg-amber-400 shadow-sm shadow-amber-400'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
