import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import { getMyProviderProfile } from "../../api/providers";
import { listBookings } from "../../api/bookings";
import ProviderImageCarousel from "../../components/users/ProviderImageCarousel";
import { getBookings, getReceivedReviews, subscribeToUserData } from "../../utils/userFlowStorage";

const emptyStats = {
  profileCompletion: 0,
  totalViews: 0,
  totalBookings: 0,
  totalRevenue: 0,
  pendingRequests: 0,
  rating: 0,
  reviewCount: 0,
  weeklyViews: [
    { name: "Mon", views: 0, bookings: 0, revenue: 0 },
    { name: "Tue", views: 0, bookings: 0, revenue: 0 },
    { name: "Wed", views: 0, bookings: 0, revenue: 0 },
    { name: "Thu", views: 0, bookings: 0, revenue: 0 },
    { name: "Fri", views: 0, bookings: 0, revenue: 0 },
    { name: "Sat", views: 0, bookings: 0, revenue: 0 },
    { name: "Sun", views: 0, bookings: 0, revenue: 0 },
  ],
};

export default function ProviderDashboard() {
  const cachedProfile = readCachedProviderProfile();
  const [user, setUser] = useState(() => readUser());
  const [provider, setProvider] = useState(cachedProfile?.provider || null);
  const [stats, setStats] = useState(cachedProfile?.stats ? { ...emptyStats, ...cachedProfile.stats } : emptyStats);
  const [loading, setLoading] = useState(!cachedProfile?.provider);
  const [bookings, setBookings] = useState(() => getBookings());
  const [reviews, setReviews] = useState(() => getReceivedReviews("PROVIDER"));
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadProvider = () =>
      Promise.all([
        getMyProviderProfile(),
        listBookings().catch(() => getBookings()),
      ])
        .then(([{ provider: nextProvider, stats: nextStats }, nextBookings]) => {
        if (!mounted) return;
        setProvider(nextProvider);
        setBookings(Array.isArray(nextBookings) ? nextBookings : []);
        if (nextProvider?.user) setUser(nextProvider.user);
        if (nextStats) setStats({ ...emptyStats, ...nextStats });
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));

    loadProvider();
    const refreshTimer = window.setInterval(loadProvider, 8000);

    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(
    () =>
      subscribeToUserData(() => {
        setBookings(getBookings());
        setReviews(getReceivedReviews("PROVIDER"));
      }),
    []
  );

  const profile = providerToProfile(provider, user);
  const providerBookings = useMemo(() =>
    bookings.filter((booking) =>
      provider?.id ? !booking.providerId || booking.providerId === provider.id : true
    ),
    [bookings, provider?.id]
  );
  const filteredBookings = useMemo(() => {
    if (!search.trim()) return providerBookings;
    const q = search.trim().toLowerCase();
    return providerBookings.filter((booking) =>
      [booking.service, booking.activity, booking.date, booking.time, booking.status, booking.userName, booking.customerName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [providerBookings, search]);
  const firstName = profile.name.split(" ")[0] || "Provider";
  const completion = useMemo(() => getCompletion(provider), [provider]);
  const photoCount = Array.isArray(provider?.profileImages) ? provider.profileImages.length : 0;
  const liveStats = useMemo(
    () => buildLiveStats({ stats, bookings: providerBookings, reviews, provider }),
    [stats, providerBookings, reviews, provider]
  );
  const revenue = Number(liveStats.totalRevenue || 0);

  return (
    <AppShell type="provider" searchValue={search} onSearchChange={setSearch}>
      <div className="min-h-0 bg-[#fff7ed] text-[#14231f]">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-5">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-[#eddac7] bg-[#fffaf3] p-7 text-black shadow-sm">
              <div className="relative z-10 max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e08c4c]">
                  Provider command center
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                    Welcome back, {firstName}
                  </h1>
                </div>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6b5d52]">
                  Track profile reach, booking momentum, earnings and next actions from one clean workspace.
                </p>
                <div className="mt-6 grid max-w-4xl gap-3 sm:grid-cols-4">
                  {[
                    [BadgeCheck, `${completion}% profile`],
                    [MapPin, profile.city],
                    [CameraBadge, `${photoCount}/4 photos`],
                    [ShieldCheck, provider?.approved ? "Explore live" : "Setup needed"],
                  ].map(([Icon, label]) => (
                    <div key={label} className="flex items-center gap-2 rounded-2xl bg-[#ffeedd] px-3 py-3 text-xs font-black transition hover:-translate-y-0.5 hover:bg-white">
                      <Icon size={16} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Metric icon={Users} label="Profile Views" value={loading ? "..." : liveStats.totalViews} tone="bg-[#ffeedd] text-black" />
              <Metric icon={Briefcase} label="Bookings" value={loading ? "..." : liveStats.totalBookings} tone="bg-[#fffaf3] text-black" />
              <Metric icon={Wallet} label="Revenue" value={`Rs ${revenue.toLocaleString("en-IN")}`} tone="bg-[#fff4e6] text-[#d67f3d]" />
              <Metric icon={Star} label="Rating" value={liveStats.rating ? `${liveStats.rating} (${liveStats.reviewCount})` : "New"} tone="bg-[#ffeedd] text-black" />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <ActionCard
                icon={Rocket}
                title="Create profile"
                text="Open the profile builder, add photos and publish your public listing."
                to="/app/provider/create"
                tone="from-black to-[#e08c4c]"
              />
              <ActionCard
                icon={CalendarCheck}
                title="Set availability"
                text="Tune your weekly slots so users know when you are ready."
                to="/app/provider/availability"
                tone="from-[#16815f] to-[#e08c4c]"
              />
              <ActionCard
                icon={MessageCircle}
                title="Review requests"
                text="Check pending bookings and accept the plans that fit."
                to="/app/provider/bookings"
                tone="from-[#d67f3d] to-[#f59e0b]"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <ChartCard title="Weekly profile performance" subtitle="Views and booking requests">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveStats.weeklyViews}>
                    <defs>
                      <linearGradient id="views" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#e08c4c" stopOpacity={0.34} />
                        <stop offset="95%" stopColor="#e08c4c" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eddac7" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stroke="#e08c4c" strokeWidth={3} fill="url(#views)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Revenue estimate" subtitle="Projected weekly earnings">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={liveStats.weeklyViews}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eddac7" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="revenue" radius={[10, 10, 0, 0]} fill="#111111" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <BookingRequestsTable bookings={filteredBookings} />

            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <PipelinePanel bookings={filteredBookings} />
              <ActivityPanel profile={profile} bookings={filteredBookings} reviews={reviews} />
            </div>
          </div>

          <aside className="grid h-max gap-5">
            <ProfileHealthCard profile={profile} completion={completion} photoCount={photoCount} provider={provider} />
            <NextStepsCard provider={provider} completion={completion} />
            <MiniScheduleCard provider={provider} bookings={filteredBookings} />
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <div className="group rounded-[1.5rem] border border-[#eddac7] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(83,52,30,0.1)]">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl transition group-hover:scale-110 ${tone}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#8b7563]">{label}</p>
    </div>
  );
}

function ActionCard({ icon: Icon, title, text, to, tone }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-[1.5rem] border border-[#eddac7] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(83,52,30,0.1)]"
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`} />
      <div className="flex items-start justify-between gap-4">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg transition group-hover:scale-110`}>
          <Icon size={21} />
        </span>
        <ArrowRight size={18} className="text-[#8b7563] transition group-hover:translate-x-1 group-hover:text-black" />
      </div>
      <h2 className="mt-5 text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm font-bold leading-6 text-[#6b5d52]">{text}</p>
    </Link>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="h-[260px] rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(83,52,30,0.1)]">
      <div className="mb-4">
        <h2 className="text-lg font-black">{title}</h2>
        <p className="text-xs font-bold text-[#8b7563]">{subtitle}</p>
      </div>
      <div className="h-[185px]">{children}</div>
    </div>
  );
}

function BookingRequestsTable({ bookings = [] }) {
  const rows = bookings.slice(0, 5);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Booking Requests</h2>
        <Link to="/app/provider/bookings" className="rounded-lg border border-black/10 px-3 py-2 text-xs font-black hover:bg-[#fff7ed]">
          View all
        </Link>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-[#eddac7] text-[10px] font-black uppercase tracking-[0.12em] text-[#667085]">
              <th className="px-3 py-3">Request ID</th>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Service</th>
              <th className="px-3 py-3">Date & Time</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Amount</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2e2d4]">
            {rows.length ? rows.map((booking, index) => (
              <tr key={booking.id || index} className="text-sm font-semibold">
                <td className="px-3 py-4 font-black">{booking.id || `BR-${1020 + index}`}</td>
                <td className="px-3 py-4">{booking.userName || booking.customerName || booking.providerName || "Buddy user"}</td>
                <td className="px-3 py-4">{booking.service || booking.activity || "Public meetup"}</td>
                <td className="px-3 py-4">{formatProviderDate(booking.date || booking.createdAt)}</td>
                <td className="px-3 py-4"><ProviderStatus status={booking.status} /></td>
                <td className="px-3 py-4 text-right font-black">Rs {Number(booking.amount || 0).toLocaleString("en-IN")}</td>
                <td className="px-3 py-4 text-right">
                  <Link to="/app/provider/bookings" className="rounded-lg bg-black px-4 py-2 text-xs font-black text-white">
                    View
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm font-black text-[#8b7563]">
                  No real booking requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProviderStatus({ status = "PENDING" }) {
  const normalized = String(status).toUpperCase();
  const tone = normalized === "COMPLETED"
    ? "bg-[#e8f6ef] text-[#16815f]"
    : normalized === "CONFIRMED"
      ? "bg-[#e8f6ef] text-[#16815f]"
      : "bg-[#fff4e6] text-[#c76d11]";
  return <span className={`rounded-lg px-3 py-1 text-xs font-black ${tone}`}>{normalized}</span>;
}

function PipelinePanel({ bookings = [] }) {
  const completed = bookings.filter((booking) => String(booking.status || "").toUpperCase() === "COMPLETED").length;
  const items = [
    ["Viewed profile", 100, Users],
    ["Started booking", bookings.length ? 72 : 0, CalendarCheck],
    ["Message sent", bookings.length ? 46 : 0, MessageCircle],
    ["Confirmed plan", bookings.length ? Math.round((completed / bookings.length) * 100) : 0, CheckCircle2],
  ];

  return (
    <section className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Booking flow</h2>
      <p className="mt-1 text-xs font-bold text-[#8b7563]">A quick conversion view for your profile.</p>
      <div className="mt-5 grid gap-4">
        {items.map(([label, value, Icon]) => (
          <div key={label} className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffeedd] text-black transition group-hover:scale-110">
              <Icon size={17} />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm font-black">
                <span>{label}</span>
                <span>{value}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ffeedd]">
                <div className="h-full rounded-full bg-black" style={{ width: `${value}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivityPanel({ profile, bookings = [], reviews = [] }) {
  const rows = [
    ...bookings.slice(0, 3).map((booking) => [
      "Booking update",
      `${booking.service || booking.activity || "Meetup"} in ${booking.city || profile.city}`,
      formatRelativeTime(booking.updatedAt || booking.createdAt || booking.date),
      "bg-[#fff4e6] text-[#b66b12]",
    ]),
    ...reviews.slice(0, 2).map((review) => [
      "New review",
      `${review.rating}/5 stars received`,
      formatRelativeTime(review.createdAt),
      "bg-[#ffeedd] text-black",
    ]),
  ];

  const displayRows = rows.length
    ? rows
    : [["No live activity", "Bookings, reviews and availability changes will appear here.", "Now", "bg-[#fffaf3] text-black"]];

  return (
    <section className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">Recent activity</h2>
          <p className="mt-1 text-xs font-bold text-[#8b7563]">Signals that help you decide what to update next.</p>
        </div>
        <Sparkles size={20} className="text-[#e08c4c]" />
      </div>
      <div className="mt-5 grid gap-3">
        {displayRows.map(([title, text, time, tone], index) => (
          <div key={`${title}-${index}`} className="group flex items-center justify-between gap-3 rounded-2xl bg-[#fffaf3] p-3 transition hover:-translate-y-0.5 hover:bg-[#ffeedd]">
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{title}</p>
              <p className="truncate text-xs font-bold text-[#8b7563]">{text}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black ${tone}`}>{time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfileHealthCard({ profile, completion, photoCount, provider }) {
  const images = getProviderImageUrls(provider);
  return (
    <section className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Profile health</h2>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${provider?.approved ? "bg-[#e8f6ef] text-[#16815f]" : "bg-[#fff4e6] text-[#b66b12]"}`}>
          {provider?.approved ? "Live" : "Needs setup"}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#eddac7]">
        <div className="h-56 bg-[#ffeedd]">
          <ProviderImageCarousel images={images} alt={profile.name} className="h-full w-full" />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-black">{profile.name}</h3>
          <p className="mt-1 text-sm font-bold text-[#6b5d52]">{profile.headline}</p>
          <div className="mt-4 grid gap-2 text-sm font-bold text-[#5d4a3c]">
            <span className="inline-flex items-center gap-2"><MapPin size={15} /> {profile.city}</span>
            <span className="inline-flex items-center gap-2"><IndianRupee size={15} /> {profile.price}/hr</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm font-black">
        <span>{completion}% complete</span>
        <span>{photoCount}/4 photos</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#ffeedd]">
        <div className="h-full rounded-full bg-black" style={{ width: `${completion}%` }} />
      </div>
    </section>
  );
}

function NextStepsCard({ provider, completion }) {
  const steps = [
    [completion >= 100, "Complete profile builder"],
    [Array.isArray(provider?.profileImages) && provider.profileImages.length === 4, "Add all 4 photos"],
    [Boolean(provider?.availabilityDays), "Confirm weekly availability"],
    [Boolean(provider?.activities), "Keep activities clear"],
  ];

  return (
    <section className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Next best actions</h2>
      <div className="mt-4 grid gap-3">
        {steps.map(([done, label]) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl bg-[#fffaf3] p-3 transition hover:bg-[#ffeedd]">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${done ? "bg-[#e8f6ef] text-[#16815f]" : "bg-[#ffeedd] text-black"}`}>
              {done ? <CheckCircle2 size={17} /> : <Clock size={17} />}
            </span>
            <p className="text-sm font-black">{label}</p>
          </div>
        ))}
      </div>
      <Link to="/app/provider/create" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3]">
        Open builder <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function MiniScheduleCard({ provider, bookings = [] }) {
  const todayRows = bookings.filter(isTodayBooking).slice(0, 3);
  const fallback = String(provider?.availabilityDays || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((label) => ["Open", label]);
  const rows = todayRows.length
    ? todayRows.map((booking) => [booking.time || "Today", booking.service || booking.activity || "Public meetup"])
    : fallback.length
      ? fallback
      : [["Today", "No backend schedule yet"]];

  return (
    <section className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Today</h2>
      <div className="mt-4 grid gap-3">
        {rows.map(([time, label]) => (
          <div key={time} className="flex items-center gap-3 rounded-2xl bg-[#fffaf3] p-3">
            <span className="rounded-xl bg-[#ffeedd] px-3 py-2 text-xs font-black text-black">{time}</span>
            <p className="text-sm font-black">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CameraBadge(props) {
  return <Sparkles {...props} />;
}

function providerToProfile(provider, user) {
  const images = Array.isArray(provider?.profileImages) ? provider.profileImages : [];
  return {
    name: provider?.user?.fullName || user?.fullName || "Provider",
    headline: provider?.headline || provider?.profession || "Create your public headline",
    city: provider?.availableCity || provider?.user?.city || user?.city || "Your city",
    price: provider?.hourlyPrice || "0",
    image: getImageSrc(images[0]) || "",
  };
}

function buildLiveStats({ stats, bookings, reviews, provider }) {
  const weeklyViews = buildWeeklyStats(bookings, Number(provider?.hourlyPrice || 0));
  const totalRevenue = weeklyViews.reduce((sum, item) => sum + item.revenue, 0);
  const rating = reviews.length
    ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

  return {
    ...stats,
    totalViews: Number(stats.totalViews || 0),
    totalBookings: bookings.length,
    totalRevenue,
    pendingRequests: bookings.filter((booking) => String(booking.status || "").toUpperCase() === "PENDING").length,
    rating,
    reviewCount: reviews.length,
    weeklyViews,
  };
}

function buildWeeklyStats(bookings, fallbackPrice) {
  const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name) => ({
    name,
    views: 0,
    bookings: 0,
    revenue: 0,
  }));

  bookings.forEach((booking) => {
    const date = new Date(booking.date || booking.createdAt || booking.completedAt);
    if (Number.isNaN(date.getTime())) return;
    const index = (date.getDay() + 6) % 7;
    rows[index].bookings += 1;
    rows[index].revenue += Number(booking.amount || fallbackPrice || 0);
  });

  return rows;
}

function getProviderImageUrls(provider) {
  const images = Array.isArray(provider?.profileImages) ? provider.profileImages : [];
  return images.map(getImageSrc).filter(Boolean);
}

function getImageSrc(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.thumbnailUrl || image.url || image.previewUrl || "";
}

function formatRelativeTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Now";
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatProviderDate(value) {
  if (!value) return "Flexible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isTodayBooking(booking) {
  const date = new Date(booking.date || booking.createdAt);
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === new Date().toDateString();
}

function getCompletion(provider) {
  const images = Array.isArray(provider?.profileImages) ? provider.profileImages : [];
  const checks = [
    provider?.headline,
    provider?.profession,
    provider?.hourlyPrice,
    provider?.availableCity,
    provider?.languages,
    provider?.availabilityDays,
    provider?.activities,
    provider?.bio,
    provider?.providerSafetyAgreement,
    images.length === 4,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}

function readCachedProviderProfile() {
  try {
    return JSON.parse(sessionStorage.getItem("buddybook_my_provider_profile_cache") || "null");
  } catch {
    return null;
  }
}
