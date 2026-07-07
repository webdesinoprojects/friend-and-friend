import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Heart,
  MapPin,
  MoreVertical,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";
import ProviderImageCarousel from "../../components/users/ProviderImageCarousel";
import { getProvider } from "../../api/providers";
import { getDemoProvider } from "../../data/demoProviders";
import { isInWatchlist, toggleWatchlist } from "../../utils/userFlowStorage";

export default function PublicProviderProfile() {
  const { providerId } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    getProvider(providerId)
      .then((row) => {
        if (mounted) setProvider(row);
        if (mounted) setSaved(isInWatchlist(row?.id));
      })
      .catch(() => {
        if (!mounted) return;
        const demoProvider = getDemoProvider(providerId);
        setProvider(demoProvider);
        setSaved(isInWatchlist(demoProvider?.id));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [providerId]);

  return (
    <div className="min-h-screen bg-[#fffaf3] text-[#171b30]">
      <PublicNavbar />
      <main className="px-5 pb-16 pt-28 sm:px-8 lg:pt-32">
        <section className="mx-auto max-w-7xl">
          <Link
            to="/#providers"
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

function PublicProviderDetail({ provider, saved, onSave }) {
  const images = provider.images?.length ? provider.images : [provider.image].filter(Boolean);
  const hero = images[0] || "";
  const activity = provider.activities?.[0] || "e-meet";
  const rating = Number(provider.rating || 5).toFixed(1);
  const price = Number(provider.price || 25);

  return (
    <div className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.16)] lg:grid lg:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="border-r border-black/10 bg-white p-4">
        <div className="relative h-[380px] overflow-hidden rounded-3xl bg-[#eeeeee]">
          {hero ? <img src={hero} alt={provider.name} className="h-full w-full object-cover" /> : null}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#34c759]">
                <CheckCircle2 size={24} />
              </span>
              <div>
                <p className="text-2xl font-black">Verified</p>
                <p className="text-sm font-semibold text-white/75">Face-verified provider</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button className="grid h-14 w-9 place-items-center rounded-xl bg-[#f1f1f1]"><ArrowLeft size={18} /></button>
          <div className="flex min-w-0 flex-1 gap-2 overflow-hidden">
            {images.slice(0, 4).map((image, index) => (
              <img key={image || index} src={image} alt="" className={`h-14 w-20 rounded-xl object-cover ${index === 0 ? "ring-2 ring-[#ffcf33]" : ""}`} />
            ))}
          </div>
          <button className="grid h-14 w-9 place-items-center rounded-xl bg-[#f1f1f1]"><ArrowLeft size={18} className="rotate-180" /></button>
        </div>

        <div className="mt-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-black">{provider.name}</h1>
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
          <Pill>🌟 Verified provider</Pill>
          <Pill>📍 {provider.city || "India"}</Pill>
          <Pill>👥 Public meetups</Pill>
        </div>

        <div className="mt-6 rounded-3xl border border-black/10 bg-[#fafafa] p-5">
          <h2 className="text-2xl font-black">About</h2>
          <InfoRow label="Currently located at" value={provider.city || "India"} />
          <InfoRow label="Profession" value={provider.profession || "Provider"} />
          <InfoRow label="Languages" value={provider.languages || "Not specified"} />
        </div>
      </aside>

      <main className="relative bg-[#f3f3f3] p-5 pb-28 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-black">Services</h2>
            <div className="mt-2 h-1 w-24 bg-black" />
          </div>
          <div className="flex gap-2 text-black/45">
            <MoreVertical size={18} />
            <Link to="/" aria-label="Close profile"><X size={18} /></Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["#movies", "#meals", "#drinks", "#gathering", `#${String(activity).toLowerCase().replace(/\s+/g, "-")}`].map((tag, index) => (
            <span key={tag} className={`rounded-full px-3 py-2 text-xs font-black ${index === 4 ? "bg-[#ffcf33]" : "bg-white"}`}>{tag}</span>
          ))}
        </div>

        <section className="mt-5 grid gap-5 rounded-[1.5rem] bg-[#e9e9e9] p-5 lg:grid-cols-[1fr_320px]">
          <div>
            <h3 className="text-2xl font-black">#{String(activity).toLowerCase().replace(/\s+/g, "-")}</h3>
            <p className="mt-3 text-sm text-black/45">Service type: <b className="italic text-black">Public Meetup</b></p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {["Coffee meetup", "City walk", "Movies", "Gaming"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1"><CheckCircle2 size={14} className="text-[#46b85a]" /> {item}</span>
              ))}
            </div>
            <p className="mt-4 text-base font-black">🌈 {price}/hr - Book now</p>
            <p className="mt-1 text-sm font-bold text-black/40">~₹{Math.round(price * 74).toLocaleString("en-IN")} (INR)</p>
          </div>
          {hero ? <img src={hero} alt={provider.name} className="h-[240px] w-full rounded-xl object-cover" /> : null}
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Reviews</h2>
            <p className="flex items-center gap-2 text-xl font-black"><Star fill="#ffcf33" className="text-[#ffcf33]" /> {rating} <span className="text-base font-medium text-black/45">({provider.reviews || 23})</span></p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {["duckkk", "blahblahblah88"].map((name, index) => (
              <article key={name} className="rounded-xl border border-black/10 bg-white p-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ff5353] text-lg font-medium text-white">{name[0].toUpperCase()}</span>
                  <div>
                    <p className="text-base font-black">{name}</p>
                    <p className="text-sm text-black/45">Completed {index ? "1 day" : "9 hours"} ago · #{activity}</p>
                  </div>
                  <p className="ml-auto text-sm font-black">🌈 {price}/hr</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="fixed bottom-6 left-1/2 z-50 grid w-[min(92vw,720px)] -translate-x-1/2 gap-4 rounded-full bg-white p-4 shadow-[0_16px_50px_rgba(0,0,0,0.22)] md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-4">
            <img src={hero || ""} alt="" className="h-12 w-12 rounded-full object-cover" />
            <div className="grid gap-1 md:grid-cols-[1fr_auto] md:items-center md:gap-5">
              <p className="text-xl font-black">#{activity}</p>
              <p className="flex items-center gap-2 text-xl font-black"><Star fill="#ffcf33" className="text-[#ffcf33]" /> {rating}</p>
            </div>
          </div>
          <Link to="/login" className="rounded-full bg-black px-6 py-3 text-center text-sm font-black text-white">
            Book this buddy
          </Link>
        </div>
      </main>
    </div>
  );
}

function Pill({ children }) {
  return <span className="rounded-full border border-black/10 bg-[#fafafa] px-4 py-2 text-sm font-black">{children}</span>;
}

function InfoRow({ label, value }) {
  return (
    <div className="mt-4 flex justify-between gap-4 text-lg">
      <span className="text-black/55">{label}</span>
      <b className="text-right">{value}</b>
    </div>
  );
}

function MiniStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
      <Icon size={17} className="text-[#d67f3d]" />
      <p className="mt-3 text-sm font-black">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-black/45">{label}</p>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-black/40">
        <Icon size={15} /> {label}
      </div>
      <p className="mt-2 text-sm font-black">{value}</p>
    </div>
  );
}
