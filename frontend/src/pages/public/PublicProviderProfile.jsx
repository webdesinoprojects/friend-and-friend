import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  IndianRupee,
  Languages,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import { getProvider, getProviderImages } from "../../api/providers";
import { formatRs } from "../../utils/format";
import {
  isInWatchlist,
  rememberProvider,
  toggleWatchlist,
} from "../../utils/userFlowStorage";

export default function PublicProviderProfile() {
  const { providerId } = useParams();
  const [searchParams] = useSearchParams();
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
        setSaved(isInWatchlist(row.id));
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
    <div className="min-h-screen scroll-smooth bg-[radial-gradient(circle_at_top_left,_#fff8e8_0,_#f5f3ec_38%,_#edf5f1_100%)] text-[#17213a] xl:h-screen xl:overflow-hidden">
      <PublicNavbar />
      <main className="box-border px-3 pb-28 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pb-20 lg:pt-32 xl:h-screen xl:overflow-hidden xl:pb-5">
        <section className="mx-auto max-w-[1440px] xl:flex xl:h-full xl:min-h-0 xl:flex-col">
          <Link
            to={getExplorePath()}
            className="inline-flex items-center gap-2 rounded-full border border-[#17213a]/10 bg-white/90 px-4 py-2 text-sm font-black shadow-sm backdrop-blur"
          >
            <ArrowLeft size={16} /> Back to explore
          </Link>

          {loading ? (
            <ProfileSkeleton />
          ) : !provider ? (
            <div className="mt-5 grid min-h-[360px] place-items-center rounded-[2rem] border border-[#17213a]/10 bg-white/90 text-center shadow-sm">
              <div>
                <Sparkles size={30} className="mx-auto text-[#d67f3d]" />
                <p className="mt-3 text-2xl font-black">Provider not found</p>
                <p className="mt-2 text-sm font-semibold text-[#17213a]/50">
                  This profile may no longer be available.
                </p>
              </div>
            </div>
          ) : (
            <PublicProviderDetail
              provider={provider}
              highlightedActivities={parseHighlightedActivities(searchParams)}
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
    </div>
  );
}

function PublicProviderDetail({ provider, highlightedActivities, saved, onSave }) {
  const images = provider.images?.length ? provider.images : [provider.image].filter(Boolean);
  const activities = getProviderActivities(provider);
  const activity = activities[0] || "Public meetup";
  const reviews = Array.isArray(provider.reviewItems) ? provider.reviewItems : [];
  const rating = getProviderRating(provider, reviews);
  const price = Number(provider.price || 0);
  const bookingPath = `/app/user/provider/${provider.id}/book?service=${encodeURIComponent(activity)}&duration=1`;
  const providerAccount = isProviderAccount();
  const schedulePath = providerAccount
    ? "/app/provider/dashboard"
    : isLoggedIn()
      ? bookingPath
      : `/login?redirect=${encodeURIComponent(bookingPath)}`;

  return (
    <>
      <div className="mt-3 grid items-start gap-3 sm:mt-5 sm:gap-5 xl:mb-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[2rem] border border-[#17213a]/10 bg-[#fffdf8] p-3 shadow-[0_20px_65px_rgba(32,53,45,0.11)] sm:p-4 xl:h-full xl:min-h-0">
          <ProfileGallery images={images} name={provider.name} available={provider.available} />

          <div className="px-1 pb-1 pt-4 sm:px-2 sm:pb-2 sm:pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#17213a] sm:text-3xl">
                  <span className="truncate">{provider.name || "Verified provider"}</span>
                  <BadgeCheck size={27} fill="#2b76e5" className="shrink-0 text-white" aria-label="Verified provider" />
                </h1>
                <p className="mt-1 text-sm font-bold text-[#17213a]/50">
                  {provider.profession || "Verified companion"}
                </p>
              </div>
              <button
                type="button"
                onClick={onSave}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${
                  saved
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-[#17213a]/10 bg-white text-[#17213a] hover:-translate-y-0.5"
                }`}
                aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
              >
                <Heart size={20} fill={saved ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
              <ProfilePill icon={IndianRupee} accent>{price ? `${formatRs(price)}/hr` : "Price not added"}</ProfilePill>
            </div>

            <section className="mb-4 mt-4 rounded-2xl border border-[#dfe8e2] bg-[#f5faf7] p-4 sm:mt-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#2c8060]" />
                <h2 className="text-lg font-black">About</h2>
              </div>
              <div className="mt-2 divide-y divide-[#17213a]/8">
                <InfoRow icon={MapPin} label="Located in" value={provider.city || "Not added"} />
                <InfoRow icon={BriefcaseBusiness} label="Profession" value={provider.profession || "Not added"} />
                <InfoRow icon={Languages} label="Languages" value={provider.languages || "Not added"} />
              </div>
            </section>
          </div>
        </aside>

        <main className="relative overflow-hidden rounded-[2rem] border border-[#17213a]/10 bg-white/95 shadow-[0_20px_65px_rgba(32,53,45,0.09)] xl:grid xl:h-full xl:min-h-0 xl:grid-rows-[auto_auto_minmax(0,1fr)]">
          <div className="border-b border-[#17213a]/8 bg-gradient-to-r from-[#f6fbf8] via-white to-[#fff8e9] p-5 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2c8060]">Verified profile</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Activities &amp; Reviews</h2>
          </div>

          <section className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
            <div className="rounded-2xl border border-[#dfe8e2] bg-[#f8fbf9] p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">Activities</h3>
                  <p className="mt-1 text-[11px] font-bold text-[#17213a]/45">Choose an activity for your meeting.</p>
                </div>
                {price ? <p className="rounded-full bg-[#fff4d8] px-3 py-1.5 text-xs font-black text-[#8c5b0b]">{formatRs(price)}/hr</p> : null}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {activities.map((item, index) => (
                  <ActivityCard
                    key={`${item}-${index}`}
                    activity={item}
                    featured={highlightedActivities.has(normalizeActivity(item))}
                  />
                ))}
              </div>
            </div>

            <BioPanel provider={provider} />
          </section>

          <ReviewsSection
            reviews={reviews}
            rating={rating}
            total={Number(provider.reviews || reviews.length)}
            activity={activity}
            schedulePath={schedulePath}
            provider={provider}
            providerAccount={providerAccount}
          />
        </main>
      </div>
    </>
  );
}

function ProfileGallery({ images, name, available }) {
  const slides = Array.isArray(images) ? images.filter(Boolean) : [];
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  const move = (direction) => {
    if (slides.length < 2) return;
    setActive((current) => (current + direction + slides.length) % slides.length);
  };

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] bg-[#edf1ed] sm:aspect-[5/4] xl:h-[300px] xl:aspect-auto">
        {slides[active] ? (
          <img src={slides[active]} alt={name} className="h-full w-full object-cover" decoding="async" />
        ) : (
          <div className="grid h-full place-items-center text-center text-sm font-black text-[#17213a]/35">
            <div><ImageIcon size={30} className="mx-auto mb-2" />No profile image</div>
          </div>
        )}
        <span className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black shadow-sm backdrop-blur ${
          available ? "bg-white/90 text-[#247052]" : "bg-white/90 text-[#17213a]/55"
        }`}>
          <span className={`h-2 w-2 rounded-full ${available ? "bg-emerald-500" : "bg-slate-400"}`} />
          {available ? "Available for booking" : "Currently unavailable"}
        </span>
        {slides.length > 1 ? (
          <>
            <button type="button" onClick={() => move(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md" aria-label="Previous photo">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => move(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md" aria-label="Next photo">
              <ChevronRight size={20} />
            </button>
            <span className="absolute bottom-4 right-4 rounded-full bg-[#17213a]/75 px-3 py-1.5 text-[10px] font-black text-white backdrop-blur">
              {active + 1} / {slides.length}
            </span>
          </>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(slides.length, 4)}, minmax(0, 1fr))` }}>
          {slides.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`aspect-[4/3] overflow-hidden rounded-xl border-2 transition ${
                index === active ? "border-[#d29a2e] shadow-sm" : "border-transparent opacity-75 hover:opacity-100"
              }`}
              aria-label={`Show photo ${index + 1}`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ActivityCard({ activity, featured }) {
  return (
    <article className={`flex min-h-14 items-center justify-center overflow-hidden rounded-xl border px-3 py-2 text-center ${
      featured ? "border-[#e5c67a] bg-[#fff8e7]" : "border-[#dfe8e2] bg-[#f8fbf9]"
    }`}>
      <h4 className="line-clamp-2 text-xs font-black">{activity}</h4>
    </article>
  );
}

function BioPanel({ provider }) {
  const rows = buildBioRows(provider);
  return (
    <section className="rounded-2xl border border-[#eadfca] bg-[#fffaf1] p-4">
      <h3 className="text-xl font-black">Bio</h3>
      <p className="mt-1 text-xs font-bold text-[#17213a]/45">Profile questions and answers.</p>
      <div className="mt-3 divide-y divide-[#17213a]/8">
        {rows.map((row) => (
          <div key={row.question} className="flex min-w-0 items-center justify-between gap-5 py-2.5">
            <strong className="shrink-0 text-sm text-[#17213a]">{row.question}</strong>
            <span title={row.answer} className="truncate text-right text-sm font-semibold text-[#17213a]/45">{row.answer}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildBioRows(provider) {
  const rows = [
    { question: "Age", answer: provider.age },
    { question: "Education", answer: provider.education },
    { question: "Height", answer: provider.height },
  ];
  (Array.isArray(provider.questions) ? provider.questions : []).forEach((item) => {
    if (!item?.answer || String(item.type || "").toUpperCase() === "SERVICE") return;
    const rawQuestion = String(item.question || item.key || "Profile detail").trim();
    rows.push({
      question: rawQuestion.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      answer: String(item.answer).trim(),
    });
  });

  const unique = new Map();
  rows.forEach((row) => {
    if (!row.answer) return;
    const key = row.question.toLowerCase();
    if (!unique.has(key)) unique.set(key, row);
  });
  return unique.size ? Array.from(unique.values()) : [{ question: "Profile details", answer: "Not added yet." }];
}

function ReviewsSection({ reviews, rating, total, activity, schedulePath, provider, providerAccount }) {
  const distribution = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((score) => reviews.filter((review) => Number(review.rating) === score).length);
    const max = Math.max(...counts, 1);
    return counts.map((count, index) => ({ score: 5 - index, count, width: `${Math.round((count / max) * 100)}%` }));
  }, [reviews]);

  return (
    <section className="min-h-0 border-t border-[#17213a]/8 bg-[#fffdf9] mb-4 p-4 pb-24">
      <div>
        <h3 className="text-xl font-black">Reviews</h3>
        <p className="mt-1 text-xs font-bold text-[#17213a]/45">Verified feedback from completed meetups.</p>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#eadfca] bg-[#fff9ed] p-4">
          <div className="flex items-end gap-2">
            <Star size={28} fill="#f5b82e" className="mb-1 text-[#f5b82e]" />
            <strong className="text-4xl font-black">{rating}</strong>
          </div>
          <p className="mt-1 text-xs font-bold text-[#17213a]/48">{total} verified review{total === 1 ? "" : "s"}</p>
          <div className="mt-3 space-y-1.5">
            {distribution.map((row) => (
              <div key={row.score} className="grid grid-cols-[28px_1fr_18px] items-center gap-2 text-[10px] font-black text-[#17213a]/50">
                <span>{row.score}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-[#17213a]/8"><span className="block h-full rounded-full bg-[#f5b82e]" style={{ width: row.width }} /></span>
                <span className="text-right">{row.count}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="grid min-w-0 gap-2 xl:grid-cols-2">
          {reviews.slice(0, 4).map((review, index) => (
            <article key={review.id || index} className="rounded-2xl border border-[#17213a]/9 bg-white p-3">
              <div className="flex items-start gap-3">
                {review.reviewerImage ? (
                  <img src={review.reviewerImage} alt={review.reviewerName || "Reviewer"} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#dff2e8] font-black text-[#247052]">
                    {(review.reviewerName || "U")[0].toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="truncate text-sm font-black">{review.reviewerName || "BuddyBOOK user"}</p>
                    <Stars value={Number(review.rating || 0)} />
                    <span className="text-[10px] font-bold text-[#17213a]/40">{formatReviewDate(review.createdAt)}</span>
                  </div>
                  <span className="mt-2 inline-flex rounded-full bg-[#edf5f1] px-2.5 py-1 text-[10px] font-black text-[#247052]">
                    {review.service || activity}
                  </span>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[#17213a]/65">{review.description || "No written review added."}</p>
                </div>
              </div>
            </article>
          ))}
          {!reviews.length ? (
            <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-[#17213a]/15 bg-white p-6 text-center">
              <div>
                <Star size={26} className="mx-auto text-[#d29a2e]" />
                <p className="mt-2 text-sm font-black">No completed-meetup reviews yet</p>
                <p className="mt-1 text-xs font-semibold text-[#17213a]/45">New backend reviews will appear here automatically.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="absolute bottom-4 right-4 z-10">
        <Link
          to={schedulePath}
          onClick={() => rememberProvider(provider)}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#17213a] px-6 py-3 text-center text-sm font-black text-white shadow-[0_12px_30px_rgba(23,33,58,0.18)] transition-all duration-300 ease-out before:absolute before:inset-y-0 before:-left-1/2 before:w-1/3 before:-skew-x-12 before:bg-white/25 before:blur-sm before:transition-all before:duration-500 hover:-translate-y-1 hover:scale-[1.03] hover:bg-[#2c8060] hover:shadow-[0_18px_38px_rgba(44,128,96,0.3)] hover:before:left-[125%] active:translate-y-0 active:scale-[0.98]"
        >
          <Sparkles size={16} className="relative transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          <span className="relative">{providerAccount ? "Return to dashboard" : "Schedule a meeting"}</span>
        </Link>
      </div>
    </section>
  );
}

function Stars({ value }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={13} fill={star <= value ? "#f5b82e" : "transparent"} className={star <= value ? "text-[#f5b82e]" : "text-[#17213a]/20"} />
      ))}
    </span>
  );
}

function ProfilePill({ icon: Icon, accent = false, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-black ${
      accent ? "border-[#e5c67a] bg-[#fff4d8] text-[#80550b]" : "border-[#dfe8e2] bg-[#f6faf7] text-[#355447]"
    }`}>
      <Icon size={14} /> {children}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="grid grid-cols-[20px_minmax(0,1fr)] gap-2 py-3 text-sm">
      <Icon size={16} className="mt-0.5 text-[#2c8060]" />
      <div className="flex min-w-0 justify-between gap-3">
        <span className="font-semibold text-[#17213a]/50">{label}</span>
        <b className="max-w-[58%] text-right">{value}</b>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mt-5 grid animate-pulse gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
      <div className="h-[680px] rounded-[2rem] bg-white/80" />
      <div className="h-[680px] rounded-[2rem] bg-white/80" />
    </div>
  );
}

function getProviderActivities(provider) {
  const rows = Array.isArray(provider?.activities)
    ? provider.activities
    : String(provider?.activities || "").split(",").map((item) => item.trim());
  const cleaned = rows.filter(Boolean);
  return cleaned.length ? cleaned : ["Public meetup"];
}

function parseHighlightedActivities(searchParams) {
  const values = searchParams
    .getAll("activities")
    .flatMap((value) => value.split(","))
    .map(normalizeActivity)
    .filter(Boolean);
  return new Set(values);
}

function normalizeActivity(value) {
  return String(value || "").trim().toLowerCase();
}

function getProviderRating(provider, reviews) {
  if (reviews.length) {
    return (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1);
  }
  return Number(provider.rating || 0).toFixed(1);
}

function formatReviewDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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
