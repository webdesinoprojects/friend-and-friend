import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

export default function ProviderImageCarousel({
  images,
  alt,
  className = "h-full w-full",
  showControls = true,
}) {
  const slides = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : []),
    [images]
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive((current) => (slides.length ? Math.min(current, slides.length - 1) : 0));
  }, [slides.length]);

  const move = (step) => {
    if (!slides.length) return;
    setActive((current) => (current + step + slides.length) % slides.length);
  };

  if (!slides.length) {
    return (
      <div className={`${className} grid place-items-center bg-[#fffaf3] text-black/45`}>
        <div className="text-center text-xs font-black">
          <ImageIcon size={24} className="mx-auto mb-2" />
          No image
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {slides.map((src, index) => (
        <img
          key={`${src}-${index}`}
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${
            index === active ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0"
          }`}
        />
      ))}

      {slides.length > 1 ? (
        <>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {slides.map((src, index) => (
              <span
                key={`${src}-dot-${index}`}
                className={`h-1.5 rounded-full transition ${
                  active === index ? "w-5 bg-black" : "w-1.5 bg-black/35"
                }`}
              />
            ))}
          </div>

          {showControls ? (
            <div className="absolute inset-y-0 left-2 right-2 z-10 flex items-center justify-between">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  move(-1);
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-black text-[#fffaf3] shadow-lg transition hover:bg-[#fffaf3] hover:text-black"
                aria-label="Previous provider image"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  move(1);
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-black text-[#fffaf3] shadow-lg transition hover:bg-[#fffaf3] hover:text-black"
                aria-label="Next provider image"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
