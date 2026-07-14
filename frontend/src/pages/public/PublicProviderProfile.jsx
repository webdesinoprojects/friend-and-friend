import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Heart,
  Sparkles,
  Star,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";
import ProviderImageCarousel from "../../components/users/ProviderImageCarousel";
import { getProvider, getProviderImages } from "../../api/providers";
import { formatRs } from "../../utils/format";
import {
  getReviews,
  isInWatchlist,
  rememberProvider,
  toggleWatchlist,
} from "../../utils/userFlowStorage";

export default function PublicProviderProfile() {
  const { providerId } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    Promise.allSettled([getProvider(providerId), getProviderImages(providerId)])
      .then((results) => {
        if (!mounted) return;
        const row = results[0].status === "fulfilled" ? results[0].value : null;
        if (!row) throw results[0].reason || new Error("Provider not found");
        const gallery = results[1].status === "fulfilled"
          ? results[1].value.map((image) => image?.url || image?.thumbnailUrl || image).filter(Boolean)
          : [];
        setProvider({ ...row, images: gallery.length ? gallery : row.images });
        setSaved(isInWatchlist(row?.id));
      })
      .catch((error) => {
        if (!mounted) return;
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("buddybook_token");
          localStorage.removeItem("buddybook_auth_user");
        }
        setProvider(null);
        setSaved(false);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [providerId]);

  return (
    <div className="min-h-screen scroll-smooth bg-[#fffaf3] text-[#171b30]">
      <PublicNavbar />
      <main className="px-5 pb-16 pt-28 sm:px-8 lg:pt-32">
        <section className="mx-auto max-w-7xl">
          <Link
            to={getExplorePath()}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black shadow-sm"
          >
            <ArrowLeft size={16} /> Back to explore
          </Link>

          {loading ? (
            <div className="mt-6 h-[480px] animate-pulse rounded-lg bg-white" />
          ) : !provider ? (
            <div className="mt-6 grid min-h-[360px] place-items-center rounded-lg border border-black/10 bg-white text-center">
              <div>
                <Sparkles size={30} className="mx-auto text-[#d67f3d]" />
                <p className="mt-3 text-2xl font-black">Provider not found</p>
                <p className="mt-2 text-sm font-semibold text-black/50">
                  This profile may no longer be available.
                </p>
              </div>
            </div>
          ) : (
            <PublicProviderDetail
              provider={provider}
              saved={saved}
              onSave={() => {
                rememberProvider(provider);
                const result = toggleWatchlist(provider);
                setSaved(result.saved);
              }}
            />
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function PublicProviderDetail({ provider, saved, onSave }) {  const images = provider.images?.length ? provider.images : [provider.image].filter(Boolean);
  const [activeImage, setActiveImage] = useState(0);
  const hero = images[activeImage] || images[0] || "";
  const activities = getProviderActivities(provider);
  const activity = activities[0] || "Public meetup";
  const reviews = getProviderReviews(provider);
  const rating = getProviderRating(provider, reviews);
  const price = Number(provider.price || 500);
  const bookingPath = `/app/user/provider/${provider.id}/book?service=${encodeURIComponent(activity)}&duration=1`;
  const providerAccount = isProviderAccount();
  const schedulePath = providerAccount
    ? "/app/provider/dashboard"
    : isLoggedIn()
      ? bookingPath
      : `/login?redirect=${encodeURIComponent(bookingPath)}`;

  const shift = (direction) => {
    if (!images.length) return;
    setActiveImage((current) => (current + direction + images.length) % images.length);
  };

  return (
    <div className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.16)] lg:grid lg:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="border-r border-black/10 bg-white p-4">
        <div className="relative h-[380px] overflow-hidden rounded-3xl bg-[#eeeeee]">
          {hero ? <img src={hero} alt={provider.name} className="h-full w-full object-cover" decoding="async" /> : <ProviderImageCarousel images={images} alt={provider.name} />}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => shift(-1)} className="grid h-14 w-9 place-items-center rounded-xl bg-[#f1f1f1]">
            <ArrowLeft size={18} />
          </button>
          <div className="flex min-w-0 flex-1 gap-2 overflow-hidden">
            {images.slice(0, 4).map((image, index) => (
              <button key={image || index} type="button" onClick={() => setActiveImage(index)} className="shrink-0">
                <img
                  src={image}
                  alt=""
                  className={`h-14 w-20 rounded-xl object-cover ${index === activeImage ? "ring-2 ring-[#ffcf33]" : ""}`}
                />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => shift(1)} className="grid h-14 w-9 place-items-center rounded-xl bg-[#f1f1f1]">
            <ArrowLeft size={18} className="rotate-180" />
          </button>
        </div>

        <div className="mt-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-black"><VerifiedName name={provider.name} /></h1>
            <p className="mt-1 text-lg font-medium text-black/65">Avg. response within <b>minutes</b></p>
          </div>
          <button
            type="button"
            onClick={onSave}
            className="grid h-12 w-12 place-items-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:-translate-y-0.5"
            aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Heart size={22} fill={saved ? "black" : "none"} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Pill>{provider.city || "India"}</Pill>
          <Pill>Public meetups</Pill>
        </div>

        <div className="mt-6 rounded-3xl border border-black/10 bg-[#fafafa] p-5">
          <h2 className="text-2xl font-black">About</h2>
          <InfoRow label="Currently located at" value={provider.city || "India"} />
          <InfoRow label="Profession" value={provider.profession || "Provider"} />
          <InfoRow label="Languages" value={provider.languages || "Not specified"} />
        </div>
      </aside>

      <main className="relative mx-auto max-w-3xl bg-[#f3f3f3] p-5 pb-28">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-black">Services</h2>
            <div className="mt-2 h-1 w-24 bg-black" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {activities.map((item, index) => (
            <span key={item} className={`rounded-full px-3 py-2 text-xs font-black ${index === 0 ? "bg-[#ffcf33]" : "bg-white"}`}>
              #{toSlug(item)}
            </span>
          ))}
        </div>

        <section className="mt-5 grid gap-5 rounded-[1.5rem] bg-[#e9e9e9] p-5 lg:grid-cols-[1fr_320px]">
          <div>
            <h3 className="text-2xl font-black">#{toSlug(activity)}</h3>
            <p className="mt-3 text-sm text-black/45">Service type: <b className="italic text-black">{provider.name}</b></p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {activities.map((item) => (
                <span key={item} className="inline-flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-[#46b85a]" /> {item}
                </span>
              ))}
            </div>
            <p className="mt-4 text-base font-black">{formatRs(price)}/hr - Schedule a meeting</p>
          </div>
          <div className="relative h-[240px] overflow-hidden rounded-xl">
            <ProviderImageCarousel images={images} alt={provider.name} />
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Reviews</h2>
            <p className="flex items-center gap-2 text-xl font-black">
              <Star fill="#ffcf33" className="text-[#ffcf33]" /> {rating}
              <span className="text-base font-medium text-black/45">({reviews.length || provider.reviews || 0})</span>
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {reviews.map((review, index) => (
              <article key={review.id || index} className="rounded-xl border border-black/10 bg-white p-3">
                <div className="flex items-start gap-2">
                  {review.reviewerImage ? (
                    <img src={review.reviewerImage} alt={review.reviewerName || "Reviewer"} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ff5353] text-lg font-medium text-white">
                      {(review.reviewerName || "U")[0].toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p className="text-base font-black">{review.reviewerName || "BuddyBOOK user"}</p>
                    <p className="text-sm text-black/45">{formatReviewDate(review.createdAt)} - #{toSlug(review.service || activity)}</p>
                  </div>
                  <p className="ml-auto flex items-center gap-1 text-sm font-black">
                    <Star size={14} fill="#ffcf33" className="text-[#ffcf33]" /> {review.rating || 5}
                  </p>
                </div>
                <p className="mt-3 text-sm font-bold leading-6 text-black/70">{review.description || review.text || "No written review added."}</p>
              </article>
            ))}
            {!reviews.length ? (
              <p className="rounded-xl border border-dashed border-black/10 bg-white p-5 text-sm font-bold text-black/45 md:col-span-2">
                Original reviews will appear here after completed bookings.
              </p>
            ) : null}
          </div>
        </section>

        <div className={`fixed bottom-4 left-1/2 z-50 w-[min(94vw,720px)] -translate-x-1/2 rounded-2xl bg-white p-3 shadow-[0_16px_50px_rgba(0,0,0,0.22)] md:bottom-6 md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-4 md:rounded-full md:p-4`}>
          <div className="flex items-center gap-3 md:gap-4">
            <img src={hero || ""} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover md:h-12 md:w-12" />
            <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-3 md:gap-5">
              <p className="truncate text-base font-black md:text-xl">#{toSlug(activity)}</p>
              <p className="flex items-center gap-1 text-sm font-black md:text-xl"><Star size={18} fill="#ffcf33" className="text-[#ffcf33]" /> {rating}</p>
            </div>
          </div>
          <Link to={schedulePath} onClick={() => rememberProvider(provider)} className="mt-3 block w-full rounded-full bg-black px-6 py-3 text-center text-sm font-black text-white md:mt-0 md:w-auto">
            {providerAccount ? "Provider accounts cannot book" : "Schedule a meeting"}
          </Link>
        </div>
      </main>
    </div>
  );
}

function getProviderActivities(provider) {
  const rows = Array.isArray(provider?.activities)
    ? provider.activities
    : String(provider?.activities || "")
        .split(",")
        .map((item) => item.trim());
  const cleaned = rows.filter(Boolean);
  return cleaned.length ? cleaned : ["Public meetup"];
}

function getProviderReviews(provider) {
  return getReviews().filter((review) => review.targetRole === "PROVIDER" && (
    review.targetId === provider.id ||
    review.providerId === provider.id ||
    review.targetName === provider.name
  ));
}

function getProviderRating(provider, reviews) {
  if (reviews.length) {
    return (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1);
  }
  return Number(provider.rating || 0).toFixed(1);
}

function toSlug(value) {
  return String(value || "meetup").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formatReviewDate(value) {
  if (!value) return "Completed recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Completed recently";
  return `Completed ${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`;
}

function Pill({ children }) {
  return <span className="rounded-full border border-black/10 bg-[#fafafa] px-4 py-2 text-sm font-black">{children}</span>;
}

function VerifiedName({ name }) {
  const value = String(name || "Verified provider");
  return <span className="inline-flex items-center gap-3">{value}<BadgeCheck size={30} strokeWidth={2.5} fill="#1687ff" className="shrink-0 text-white drop-shadow-sm" aria-label="Verified provider" /></span>;
}

function InfoRow({ label, value }) {
  return (
    <div className="mt-4 flex justify-between gap-4 text-lg">
      <span className="text-black/55">{label}</span>
      <b className="text-right">{value}</b>
    </div>
  );
}

function isLoggedIn() {
  return Boolean(
    localStorage.getItem("buddybook_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("buddybook_auth_user")
  );
}

function isProviderAccount() {
  try {
    const user = JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
    return user?.role === "PROVIDER";
  } catch {
    return false;
  }
}

function getExplorePath() {
  if (!isLoggedIn()) return "/#providers";
  if (isProviderAccount()) return "/app/provider/dashboard";
  return "/app/user/dashboard";
}
