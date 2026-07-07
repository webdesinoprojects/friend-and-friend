import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
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

  const primaryActivity = Array.isArray(provider.activities) && provider.activities.length
    ? provider.activities[0]
    : "Public meetup";
  const completedBookings = Number(provider.completedBookings || provider.bookingsCompleted || provider.reviews || 0);
  const bookingBadge = `${Math.max(2, (completedBookings % 4) + 2)}x booked Recently`;
  const cardContent = (
    <>
      <div className={`relative overflow-hidden rounded-[1.35rem] bg-[#f2f2f2] ${compact ? "h-[150px]" : small ? "h-[230px]" : "h-[320px]"}`}>
        <ProviderImageCarousel images={carouselImages} alt={provider.name} />
        <div className="absolute right-0 top-0 rounded-bl-2xl bg-black px-4 py-2 text-xs font-black text-white sm:text-sm">
          {bookingBadge}
        </div>
        {typeof onSave === "function" ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSave();
            }}
            className={`absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/95 text-black shadow-lg transition ${
              saved ? "bg-black text-white" : "hover:bg-[#fff4e6]"
            }`}
          >
            <Heart size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        ) : null}
      </div>

      <div className={compact ? "p-3" : small ? "p-4" : "p-5"}>
        <h3 className={`font-black text-black ${compact ? "text-lg" : small ? "text-2xl" : "text-3xl"}`}>
          {provider.name}
        </h3>
        <p className={`mt-3 font-semibold leading-7 text-black ${compact ? "line-clamp-2 text-sm" : "line-clamp-3 text-base"}`}>
          {provider.bio || provider.profession || `${primaryActivity} with safe public meetups.`}
        </p>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className={`font-black text-black ${compact ? "text-lg" : "text-2xl"}`}>Rs {provider.price}/hr</p>
            <p className="mt-1 text-sm font-black text-black/38">{completedBookings || 0} bookings completed</p>
          </div>
          <p className="flex items-center gap-2 text-2xl font-black text-black">
            <Star size={26} fill="currentColor" />
            {Number(provider.rating || 0).toFixed(1)}
          </p>
        </div>
      </div>
    </>
  );

  const className = `group block overflow-hidden rounded-[1.35rem] bg-white text-black transition duration-300 hover:-translate-y-1 ${small ? "" : "shadow-[0_20px_55px_rgba(80,50,28,0.08)]"}`;

  return link ? (
    <Link to={link} className={className}>
      {cardContent}
    </Link>
  ) : (
    <article className={className}>{cardContent}</article>
  );
}
