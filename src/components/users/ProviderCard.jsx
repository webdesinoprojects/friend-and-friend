import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Heart, MapPin, Star } from "lucide-react";
import { getProviderImages } from "../../api/providers";
import ProviderImageCarousel from "./ProviderImageCarousel";

export default function ProviderCard({
  provider,
  saved,
  onSave,
  link,
  compact = false,
  small = false,
}) {
  const initialImages = useMemo(() => {
    const images = Array.isArray(provider.images) ? provider.images : [];
    return images.length
      ? images.filter(Boolean)
      : [provider.image || provider.avatar].filter(Boolean);
  }, [provider.id, provider.image, provider.avatar]);
  const [carouselImages, setCarouselImages] = useState(initialImages);

  useEffect(() => {
    let active = true;
    setCarouselImages((current) => (current.length ? current : initialImages));

    const hasAllImages =
      !provider.imageCount || initialImages.length >= Number(provider.imageCount);

    if (!provider.id || hasAllImages) return undefined;

    getProviderImages(provider.id)
      .then((images) => {
        if (!active) return;
        const nextImages = images
          .map((image) => image?.url || image?.thumbnailUrl || image)
          .filter(Boolean);

        if (nextImages.length) {
          setCarouselImages(nextImages);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [initialImages, provider.id, provider.imageCount]);

  const tags = Array.isArray(provider.activities)
    ? provider.activities.slice(0, 2)
    : [];

  return (
    <article
      className={`group overflow-hidden border border-[#ecd9c8] bg-white shadow-[0_20px_55px_rgba(80,50,28,0.08)] transition duration-300 ease-out [transform-style:preserve-3d] hover:-translate-y-2 hover:rotate-x-[1deg] hover:rotate-y-[-1deg] hover:border-[#e4b184] hover:shadow-[0_28px_75px_rgba(134,79,42,0.16)] ${
        compact || small ? "rounded-lg" : "rounded-2xl"
      }`}
    >
      <div className={`relative overflow-hidden bg-[#fff3e6] ${compact ? "h-[86px]" : small ? "h-[150px]" : "h-[210px]"}`}>
        <ProviderImageCarousel images={carouselImages} alt={provider.name} showControls />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-transparent" />

        <div className={`absolute flex flex-col gap-2 ${compact ? "left-2 top-2" : "left-4 top-4"}`}>
          <span
            className={`inline-flex items-center gap-2 rounded-full bg-white/92 font-black text-black shadow-sm ${
              compact ? "px-2 py-1 text-[8px]" : small ? "px-2.5 py-1.5 text-[9px]" : "px-3 py-2 text-[10px]"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#e08c4c]" />
            Verified
          </span>

          {!compact && !small ? (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black ${
                provider.available
                  ? "bg-[#ffeedd] text-black"
                  : "bg-[#fff4e6] text-[#92400e]"
              }`}
            >
              {provider.available ? "Available now" : "Request schedule"}
            </span>
          ) : null}
        </div>

        {typeof onSave === "function" ? (
          <button
            type="button"
            onClick={onSave}
            className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/95 text-slate-700 shadow-lg transition ${
              saved ? "bg-[#d67f3d] text-white" : "hover:bg-[#fff4e6]"
            }`}
          >
            <Heart size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        ) : null}
      </div>

      <div className={compact ? "space-y-1.5 p-2.5" : small ? "space-y-2.5 p-4" : "space-y-3 p-5"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`truncate font-black text-slate-900 ${compact ? "text-[11px]" : small ? "text-sm" : "text-base"}`}>
                {provider.name}
              </h3>
              <CheckCircle2 size={compact ? 11 : small ? 13 : 14} className="text-[#e08c4c]" />
            </div>
            <p className={`mt-1 truncate font-semibold text-slate-500 ${compact ? "text-[9px]" : small ? "text-xs" : "text-sm"}`}>
              {provider.profession}
            </p>
          </div>

          <div className={`rounded-full bg-[#fff4e6] font-black text-[#b65f24] ${compact ? "px-2 py-1 text-[8px]" : small ? "px-2.5 py-1 text-[9px]" : "px-3 py-1 text-[10px]"}`}>
            Rs {provider.price}/hr
          </div>
        </div>

        <div className={`flex items-center justify-between font-black text-slate-600 ${compact ? "text-[8px]" : small ? "text-[10px]" : "text-[11px]"}`}>
          <span className="inline-flex items-center gap-1">
            <Star size={compact ? 10 : small ? 12 : 14} className="text-[#f59e0b]" />
            {Number(provider.rating || 0).toFixed(1)}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 text-slate-400">
            <MapPin size={compact ? 10 : small ? 12 : 14} />
            <span className="truncate">{provider.city}</span>
          </span>
        </div>

        {!compact && !small ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#fff4e6] px-3 py-1 text-[10px] font-black text-[#b65f24]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {link ? (
          <Link
            to={link}
            className={
              compact
                ? "block rounded-md bg-black px-2 py-1.5 text-center text-[8px] font-black uppercase tracking-[0.08em] text-[#fffaf3] transition hover:bg-[#fffaf3] hover:text-black"
                : small
                  ? "inline-flex w-full items-center justify-center rounded-md bg-black px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#fffaf3] shadow-[0_12px_22px_rgba(0,0,0,0.14)] transition hover:bg-[#fffaf3] hover:text-black"
                : "inline-flex w-full items-center justify-center rounded-md bg-black px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#fffaf3] shadow-[0_16px_30px_rgba(0,0,0,0.16)] transition hover:bg-[#fffaf3] hover:text-black"
            }
          >
            {compact ? "View" : "View profile"}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
