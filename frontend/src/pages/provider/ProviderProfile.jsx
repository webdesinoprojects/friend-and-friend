import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Briefcase, Edit3, IndianRupee, Languages, MapPin, ShieldCheck, Star } from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import { getMyProviderProfile } from "../../api/providers";
import { getReceivedReviews } from "../../utils/userFlowStorage";

export default function ProviderProfile() {
  const [user, setUser] = useState(() => readUser());
  const [provider, setProvider] = useState(null);
  const reviews = getReceivedReviews("PROVIDER");

  useEffect(() => {
    let mounted = true;
    getMyProviderProfile()
      .then(({ provider: nextProvider }) => {
        if (!mounted) return;
        setProvider(nextProvider);
        if (nextProvider?.user) setUser(nextProvider.user);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const images = Array.isArray(provider?.profileImages) ? provider.profileImages : [];
  const avatar = getImageSrc(images[0]) || user?.profileImage || "";
  const rating = reviews.length
    ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1)
    : "New";
  const activities = useMemo(
    () => String(provider?.activities || provider?.hobbies || "").split(",").map((item) => item.trim()).filter(Boolean),
    [provider?.activities, provider?.hobbies]
  );

  return (
    <AppShell type="provider">
      <section className="min-h-0 bg-[#fff7ed] text-black">
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="h-max rounded-2xl border border-[#eddac7] bg-white p-5">
            {avatar ? (
              <img src={avatar} alt={user?.fullName || "Provider"} className="h-48 w-48 rounded-[1.5rem] object-cover shadow-[0_18px_42px_rgba(0,0,0,0.12)]" />
            ) : (
              <div className="grid h-48 w-48 place-items-center rounded-[1.5rem] bg-[#ffeedd] text-4xl font-black">{(user?.fullName || "P").charAt(0)}</div>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-black">{user?.fullName || "Provider"}</h1>
              <Link to="/app/provider/create" className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-2 text-[10px] font-black text-[#fffaf3]">
                <Edit3 size={12} /> Edit
              </Link>
            </div>
            <p className="mt-2 text-sm font-bold leading-6 text-[#6b5d52]">{provider?.headline || provider?.profession || "Create your provider headline"}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Tile icon={Star} label="Rating" value={rating} />
              <Tile icon={ShieldCheck} label="Status" value={provider?.approved ? "Live" : "Setup"} />
              <Tile icon={IndianRupee} label="Hourly" value={`Rs ${provider?.hourlyPrice || 0}`} />
              <Tile icon={BadgeCheck} label="Photos" value={`${images.length}/4`} />
            </div>
          </aside>

          <div className="grid gap-5">
            <Panel title="Registered Provider Details" icon={Briefcase}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Profession" value={provider?.profession} />
                <Info label="Education" value={provider?.education} />
                <Info label="Height" value={provider?.height} />
                <Info label="Hobbies" value={provider?.hobbies} />
                <Info label="Available city" value={provider?.availableCity || user?.city} />
                <Info label="Availability" value={provider?.availabilityDays} />
                <Info label="Languages" value={provider?.languages} />
                <Info label="Safety agreement" value={provider?.providerSafetyAgreement ? "Accepted" : "Pending"} />
              </div>
            </Panel>

            <Panel title="Activities" icon={MapPin}>
              <div className="flex flex-wrap gap-2">
                {(activities.length ? activities : ["Coffee meetup", "City walk", "Shopping companion"]).map((item) => (
                  <span key={item} className="rounded-full border border-[#eddac7] bg-[#ffeedd] px-4 py-2 text-sm font-black">{item}</span>
                ))}
              </div>
            </Panel>

            <Panel title="Bio" icon={Languages}>
              <p className="text-sm font-bold leading-7 text-[#5d4a3c]">{provider?.bio || "Write a warm bio from the provider profile builder."}</p>
            </Panel>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-[#eddac7] bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-black text-[#fffaf3]"><Icon size={18} /></span>
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Tile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#fffaf3] p-4">
      <Icon size={18} className="text-[#e08c4c]" />
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#8b7563]">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#fffaf3] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8b7563]">{label}</p>
      <p className="mt-1 break-words text-sm font-black">{value || "Not added"}</p>
    </div>
  );
}

function getImageSrc(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.previewUrl || image.thumbnailUrl || image.url || "";
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}
