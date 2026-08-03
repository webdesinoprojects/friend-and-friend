import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, BadgeCheck, CalendarCheck2, CheckCircle2, Clock3, Heart,
  Languages, MapPin, MessageCircle, ShieldCheck, Sparkles, Star, UserRound,
} from "lucide-react";

import { getBookedUserProfile } from "../../api/bookings";

const splitTags = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
  : "Not available";

function normalizeQuestions(value, bio) {
  if (Array.isArray(value)) {
    const rows = value
      .map((item) => typeof item === "string" ? { question: "About me", answer: item } : item)
      .filter((item) => item?.answer);
    if (rows.length) return rows;
  }
  return bio ? [{ question: "About me", answer: bio }] : [];
}

export default function ProviderUserProfile({ self = false }) {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getBookedUserProfile(self ? "" : userId)
      .then((data) => active && setProfile(data))
      .catch((requestError) => active && setError(requestError?.response?.data?.message || "Could not load this user profile."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [self, userId]);

  const interests = useMemo(() => {
    const details = profile?.profile || {};
    return [...new Set([...splitTags(details.interests), ...splitTags(details.preferredActivities)])];
  }, [profile]);
  const answers = useMemo(
    () => normalizeQuestions(profile?.profile?.profileQuestions, profile?.profile?.bio),
    [profile]
  );

  if (loading) return <ProfileSkeleton />;
  if (error || !profile) {
    return <div className="mx-auto max-w-2xl rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center"><h1 className="text-2xl font-black">Profile unavailable</h1><p className="mt-2 font-bold text-rose-700">{error}</p><Link to={self ? "/app/user/dashboard" : "/app/provider/bookings"} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-black text-white"><ArrowLeft size={16}/> Back to {self ? "dashboard" : "bookings"}</Link></div>;
  }

  const location = [profile.city, profile.state].filter(Boolean).join(", ") || "Location not added";
  const stats = profile.stats || {};
  const verification = profile.verified || {};
  const heroStyle = profile.profileImage
    ? { backgroundImage: `linear-gradient(180deg,rgba(10,15,28,.05),rgba(10,15,28,.82)),url("${profile.profileImage}")` }
    : undefined;

  return (
    <div className="mx-auto max-w-[1500px] pb-10">
      <Link to={self ? "/app/user/dashboard" : "/app/provider/bookings"} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-black"><ArrowLeft size={17}/> Back to {self ? "dashboard" : "bookings"}</Link>

      <section className="overflow-hidden rounded-[1.75rem] border border-[#ead8c6] bg-[#f8f3ed] shadow-[0_24px_70px_rgba(43,29,18,.10)]">
        <div className="relative grid bg-[#14182a] md:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
          <div style={heroStyle} className="relative min-h-[260px] bg-gradient-to-br from-[#26304e] via-[#14182a] to-[#8f552f] bg-cover bg-center md:min-h-[290px]">
            {!profile.profileImage ? <div className="absolute inset-0 grid place-items-center text-[9rem] font-black text-white/15">{profile.fullName?.charAt(0)}</div> : null}
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] backdrop-blur"><ShieldCheck size={14} className="text-[#ffad6d]"/> {self ? "Your public profile" : "Booked user profile"}</span>
              <h1 className="mt-3 text-3xl font-black">{profile.fullName}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-bold text-white/75"><MapPin size={16}/>{location}</p>
            </div>
          </div>

          <div className="flex flex-col justify-center p-5 text-white sm:p-7 xl:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ee9655]">PPlusOne community</p><h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Meet the person behind your booking.</h2></div>
              <Link to={self ? "/app/user/profile" : `/app/provider/chat${profile.bookings?.[0]?.id ? `?booking=${profile.bookings[0].id}` : ""}`} className="inline-flex items-center gap-2 rounded-xl bg-[#e88a48] px-4 py-2.5 text-xs font-black text-white transition hover:bg-white hover:text-black">{self ? <Sparkles size={16}/> : <MessageCircle size={16}/>} {self ? "Edit profile" : "Open chat"}</Link>
            </div>
            <p className="mt-3 max-w-3xl line-clamp-2 text-sm font-semibold leading-6 text-white/65">{profile.profile?.bio || `${profile.fullName} has completed their verified PPlusOne profile and is ready for safe, thoughtful meetups.`}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <HeroStat value={profile.age || "18+"} label="Age" />
              <HeroStat value={stats.bookingsTogether || 0} label="Bookings together" />
              <HeroStat value={stats.completedTogether || 0} label="Completed" />
              <HeroStat value={stats.averageRating || "New"} label="User rating" />
            </div>
            <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold text-white/45"><CalendarCheck2 size={14}/> Member since {formatDate(profile.joinedAt)}</span>
          </div>
        </div>

        <div className="grid items-start gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
          <div className="grid gap-4">
            <Panel icon={Sparkles} title="Interests & meetup style" eyebrow="Personality">
              {interests.length ? <div className="flex flex-wrap gap-2">{interests.map((item) => <span key={item} className="rounded-full border border-[#e9cbb3] bg-[#fff1e4] px-4 py-2 text-sm font-black text-[#7a4323]">{item}</span>)}</div> : <Empty text="This user has not added interests yet." />}
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Detail icon={Languages} label="Preferred language" value={profile.profile?.preferredLanguage || "Not added"} />
                <Detail icon={UserRound} label="Gender" value={profile.gender || "Not added"} />
                <Detail icon={MapPin} label="From" value={location} />
              </div>
            </Panel>

            <Panel icon={Heart} title="Get to know them" eyebrow="Profile answers">
              {answers.length ? <div className="grid gap-2 md:grid-cols-2">{answers.map((item, index) => <article key={`${item.question}-${index}`} className="rounded-2xl border border-[#f0dfd0] bg-gradient-to-br from-[#fffaf4] to-white p-4 transition hover:border-[#e4b38e] hover:shadow-sm"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#c56f34]">{item.question || "About me"}</p><p className="mt-2 text-sm font-bold leading-6 text-slate-700">{item.answer}</p></article>)}</div> : <Empty text="No profile answers have been added yet." />}
            </Panel>

            <Panel icon={CalendarCheck2} title="Your booking history" eyebrow={self ? "Your activity" : "Shared activity"}>
              <div className="grid gap-3 sm:grid-cols-2">
                {(profile.bookings || []).map((booking) => <article key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-black">{booking.service || "Buddy meetup"}</h4><p className="mt-1 text-xs font-bold text-slate-500">{formatDate(booking.date)} · {booking.time || "Flexible time"}</p></div><span className="rounded-full bg-[#eef8f3] px-3 py-1 text-[10px] font-black text-emerald-700">{booking.status}</span></div><p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500"><Clock3 size={14}/>{booking.duration}</p></article>)}
              </div>
            </Panel>
          </div>

          <aside className="grid h-max gap-4 xl:sticky xl:top-24">
            <Panel icon={BadgeCheck} title="Trust & verification" eyebrow="Safety">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <Verification label="Identity verified" active={verification.identity} />
                <Verification label="Face check verified" active={verification.face} />
                <Verification label="Mobile verified" active={verification.phone} />
                <Verification label="Email verified" active={verification.email} />
              </div>
              <p className="mt-3 rounded-xl bg-[#fff5e9] p-3 text-[11px] font-bold leading-5 text-[#77533a]">Private contact and identity details remain protected.</p>
            </Panel>

            <Panel icon={Star} title="Provider reviews" eyebrow={`${stats.reviewCount || 0} review${stats.reviewCount === 1 ? "" : "s"}`}>
              {(profile.reviews || []).length ? <div className="grid max-h-[340px] gap-2 overflow-y-auto pr-1">{profile.reviews.map((review) => <article key={review.id} className="rounded-2xl border border-[#f0dfd0] bg-[#fffaf4] p-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{review.reviewerName}</strong><span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-black text-[#d87937]"><Star size={12} fill="currentColor"/>{review.rating}</span></div><p className="mt-2 text-sm font-semibold leading-5 text-slate-600">{review.description || "A positive PPlusOne meetup."}</p>{review.service ? <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-slate-400">{review.service}</p> : null}</article>)}</div> : <Empty text="This user is new and has no provider reviews yet." />}
            </Panel>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Panel({ icon: Icon, title, eyebrow, children }) {
  return <section className="h-full rounded-[1.35rem] border border-[#ead8c6] bg-white p-4 shadow-[0_8px_28px_rgba(43,29,18,.05)] sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#171b30] text-white"><Icon size={18}/></span><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#cf773b]">{eyebrow}</p><h3 className="text-lg font-black">{title}</h3></div></div>{children}</section>;
}
function HeroStat({ value, label }) {
  return <div className="rounded-xl border border-white/10 bg-white/[.06] px-3 py-2.5 backdrop-blur"><strong className="block text-xl font-black text-[#ffad6d]">{value}</strong><span className="mt-0.5 block text-[8px] font-black uppercase tracking-wider text-white/50">{label}</span></div>;
}
function Detail({ icon: Icon, label, value }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><Icon size={16} className="text-[#d77c3d]"/><p className="mt-2 text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-black capitalize">{value}</p></div>;
}
function Verification({ label, active }) {
  return <div className="flex items-center gap-2 rounded-xl border border-[#f3e4d7] bg-[#fffaf4] p-3"><CheckCircle2 size={17} className={active ? "text-emerald-600" : "text-slate-300"}/><span className="min-w-0 flex-1 text-xs font-black">{label}</span><span className={`text-[8px] font-black uppercase ${active ? "text-emerald-700" : "text-slate-400"}`}>{active ? "Verified" : "Pending"}</span></div>;
}
function Empty({ text }) {
  return <div className="rounded-2xl border border-dashed border-[#dec7b4] bg-[#fffaf4] p-6 text-center text-sm font-bold text-slate-500">{text}</div>;
}
function ProfileSkeleton() {
  return <div className="animate-pulse space-y-4"><div className="h-[290px] rounded-[1.75rem] bg-slate-200"/><div className="grid gap-4 lg:grid-cols-2"><div className="h-64 rounded-[1.5rem] bg-slate-100"/><div className="h-64 rounded-[1.5rem] bg-slate-100"/></div></div>;
}
