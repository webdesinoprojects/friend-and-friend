import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Heart,
  IndianRupee,
  Languages,
  MapPin,
  MessageCircle,
  Ruler,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import api from "../../api/api";
import {
  getCachedProvider,
  getProvider,
  getProviderImages,
} from "../../api/providers";
import { hasAuthToken } from "../../utils/authSession";
import ProviderImageCarousel from "../../components/users/ProviderImageCarousel";
import {
  getWatchlist,
  rememberProvider,
  toggleWatchlist,
} from "../../utils/userFlowStorage";

export default function UserProviderProfile() {
  const { providerId } = useParams();
  const cachedProvider = useMemo(() => getCachedProvider(providerId), [providerId]);
  const [user, setUser] = useState(() => readUser());
  const [provider, setProvider] = useState(cachedProvider);
  const [galleryImages, setGalleryImages] = useState(() =>
    getProviderImageUrls(cachedProvider)
  );
  const [saved, setSaved] = useState(() =>
    getWatchlist().some((item) => item.id === providerId)
  );
  const [loading, setLoading] = useState(!cachedProvider);

  useEffect(() => {
    let mounted = true;

    if (hasAuthToken()) {
      api
        .get("/auth/me", { timeout: 2500 })
        .then(({ data }) => {
          const nextUser = data?.user || data?.data?.user || data?.data;
          if (mounted && (nextUser?.id || nextUser?._id)) setUser(nextUser);
        })
        .catch(() => {});
    }

    if (cachedProvider) {
      setProvider(cachedProvider);
      setGalleryImages(getProviderImageUrls(cachedProvider));
      setLoading(false);
    }

    getProvider(providerId)
      .then((row) => {
        if (!mounted || !row) return;
        setProvider(row);
        const nextImages = getProviderImageUrls(row);
        if (nextImages.length) setGalleryImages(nextImages);
      })
      .catch(() => {
        if (mounted && !cachedProvider) setProvider(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    getProviderImages(providerId)
      .then((images) => {
        if (!mounted) return;
        const urls = images
          .map((image) => image?.url || image?.thumbnailUrl || image)
          .filter(Boolean);
        if (urls.length) setGalleryImages(urls);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [providerId, cachedProvider]);

  const handleSave = () => {
    if (!provider) return;
    const result = toggleWatchlist(provider);
    setSaved(result.saved);
  };

  if (loading) {
    return (
      <UserAppLayout title="Provider Profile" user={user}>
        <div className="h-full rounded-[2rem] bg-[#fffaf3] p-4">
          <div className="h-full animate-pulse rounded-[2rem] bg-[#ffeedd]" />
        </div>
      </UserAppLayout>
    );
  }

  if (!provider) {
    return (
      <UserAppLayout title="Provider Not Found" user={user}>
        <div className="grid h-full place-items-center rounded-[2rem] bg-[#fffaf3] text-center">
          <div>
            <p className="text-xl font-black">Provider not found</p>
            <Link
              to="/app/user/dashboard"
              className="mt-4 inline-flex rounded-md bg-black px-5 py-3 text-sm font-black text-[#fffaf3]"
            >
              Return to dashboard
            </Link>
          </div>
        </div>
      </UserAppLayout>
    );
  }

  const firstName = provider.name?.split(" ")[0] || "Provider";

  return (
    <UserAppLayout title="Provider Profile" user={user}>
      <section className="custom-scrollbar h-full overflow-y-auto rounded-[1.5rem] bg-[#fffaf3] text-black md:border md:border-[#f1dccb] md:p-5">
        <div className="mx-auto max-w-6xl md:grid md:gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative min-h-[510px] overflow-hidden bg-[#dfe3e6] md:rounded-[2rem]">
            <ProviderImageCarousel
              images={galleryImages}
              alt={provider.name}
              className="h-[560px] w-full md:h-full md:min-h-[620px]"
            />

            <Link
              to="/app/user/dashboard"
              className="absolute left-4 top-4 z-20 grid h-14 w-14 place-items-center rounded-[1.25rem] bg-[#fffaf3] text-black shadow-xl"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={25} />
            </Link>

            <button
              type="button"
              onClick={handleSave}
              className={`absolute right-4 top-4 z-20 grid h-12 w-12 place-items-center rounded-full shadow-xl ${
                saved ? "bg-black text-[#fffaf3]" : "bg-[#fffaf3] text-black"
              }`}
              aria-label="Save provider"
            >
              <Heart size={20} fill={saved ? "currentColor" : "none"} />
            </button>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5 pt-28 text-[#fffaf3]">
              <div className="mx-auto max-w-sm text-center md:max-w-none">
                <div className="mx-auto mb-3 grid h-20 w-20 place-items-center overflow-hidden rounded-full border-4 border-[#fffaf3]/80 bg-[#ffeedd] shadow-xl">
                  {galleryImages[0] ? (
                    <img
                      src={galleryImages[0]}
                      alt={provider.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xl font-black text-black">
                      {firstName[0]}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-black leading-tight md:text-5xl">
                  {provider.name}
                </h1>
                <p className="mt-2 text-sm font-bold text-[#fffaf3]/78">
                  {provider.profession}
                </p>
                <p className="mt-2 inline-flex items-center justify-center gap-2 text-xs font-black text-[#fffaf3]/78">
                  <MapPin size={14} /> {provider.city}, {provider.state}
                </p>
              </div>
            </div>
          </div>

          <article className="-mt-8 rounded-t-[2rem] bg-[#fffaf3] p-5 shadow-[0_-18px_40px_rgba(0,0,0,0.08)] md:mt-0 md:rounded-[2rem] md:border md:border-[#f1dccb] md:bg-white md:p-7 md:shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#ffeedd] px-4 py-2 text-xs font-black text-[#e08c4c]">
                  <CheckCircle2 size={15} /> Verified provider
                </div>
                <h2 className="mt-4 text-2xl font-black md:text-4xl">
                  Book a safe public plan
                </h2>
              </div>

              <div className="rounded-[1.25rem] bg-[#ffeedd] px-5 py-4 text-right">
                <p className="text-[10px] font-black uppercase text-black/45">
                  From
                </p>
                <p className="mt-1 flex items-center text-2xl font-black">
                  <IndianRupee size={20} />
                  {provider.price || 0}/hr
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <Stat icon={Star} value={Number(provider.rating || 0).toFixed(1)} label={`${provider.reviews || 0} reviews`} />
              <Stat icon={ShieldCheck} value="KYC" label="Checked" />
              <Stat icon={Users} value="Public" label="Meetups" />
            </div>

            <InfoBlock title="About">
              <p className="text-sm font-semibold leading-7 text-black/62">
                {provider.bio}
              </p>
            </InfoBlock>

            <InfoBlock title="Activities">
              <div className="flex flex-wrap gap-2">
                {(provider.activities || []).map((activity) => (
                  <span
                    key={activity}
                    className="rounded-full bg-[#ffeedd] px-4 py-2 text-xs font-black text-[#e08c4c]"
                  >
                    {activity}
                  </span>
                ))}
              </div>
            </InfoBlock>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Detail icon={CalendarDays} label="Availability" value={provider.availabilityDays || "Flexible schedule"} />
              <Detail icon={Languages} label="Languages" value={provider.languages || "Not specified"} />
              <Detail icon={GraduationCap} label="Education" value={provider.education || "Not specified"} />
              <Detail icon={Ruler} label="Height" value={provider.height || "Not specified"} />
            </div>

            <div className="sticky bottom-0 -mx-5 mt-7 grid gap-3 border-t border-black/10 bg-[#fffaf3]/95 p-5 backdrop-blur sm:static sm:mx-0 sm:grid-cols-2 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-7">
              <Link
                to={user ? `/app/user/provider/${provider.id}/book` : "/login"}
                onClick={() => rememberProvider(provider)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-4 text-sm font-black text-[#fffaf3] shadow-[0_16px_34px_rgba(0,0,0,0.18)]"
              >
                {user ? "Schedule a meeting" : "Login to schedule"}
              </Link>
              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-black/15 bg-[#ffeedd] px-6 py-4 text-sm font-black text-black">
                <MessageCircle size={17} /> Send Message
              </button>
            </div>
          </article>
        </div>
      </section>
    </UserAppLayout>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-[1rem] border border-black/10 bg-[#ffeedd] p-3">
      <Icon size={16} className="text-[#e08c4c]" />
      <p className="mt-2 text-sm font-black">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-black/45">{label}</p>
    </div>
  );
}

function InfoBlock({ title, children }) {
  return (
    <div className="mt-7">
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1rem] border border-black/10 bg-white p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-black/38">
        <Icon size={14} className="text-[#e08c4c]" /> {label}
      </div>
      <p className="mt-2 text-sm font-black">{value}</p>
    </div>
  );
}

function getProviderImageUrls(provider) {
  if (!provider) return [];
  if (Array.isArray(provider.images) && provider.images.length) {
    return provider.images.filter(Boolean);
  }
  return [provider.image].filter(Boolean);
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}
