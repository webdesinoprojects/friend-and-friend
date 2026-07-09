import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  Check,
  CheckCircle2,
  Edit3,
  Heart,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import ProviderCard from "../../components/users/ProviderCard";
import UserAppLayout from "../../components/users/UserAppLayout";
import api from "../../api/api";
import { getCachedProviders, listProviders } from "../../api/providers";

export default function UserDashboard() {
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(() => readStorage("buddybook_auth_user", null));
  const [bookings, setBookings] = useState(() =>
    readStorage("buddybook_bookings", [])
  );
  const [providers, setProviders] = useState(() => getCachedProviders());
  const [providersLoading, setProvidersLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const response = await api.get("/auth/me");
        const nextUser =
          response.data?.user || response.data?.data?.user || response.data?.data;

        if (mounted && (nextUser?.id || nextUser?._id)) {
          setUser(nextUser);
          localStorage.setItem("buddybook_auth_user", JSON.stringify(nextUser));
        }
      } catch {
        // Registration/login data already loaded from localStorage.
      }

      try {
        const rows = await loadDashboardProviders();
        if (mounted) {
          setProviders(rows);
        }
      } catch {
        if (mounted) setProviders(getCachedProviders());
      } finally {
        if (mounted) setProvidersLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const refreshBookings = () =>
      setBookings(readStorage("buddybook_bookings", []));

    const refreshProviders = async () => {
      try {
        const rows = await loadDashboardProviders();
        setProviders(rows);
      } catch (e) {
        setProviders(getCachedProviders());
      } finally {
        setProvidersLoading(false);
      }
    };
    const refreshProvidersFromCache = () => setProviders(getCachedProviders());

    window.addEventListener("storage", refreshBookings);
    window.addEventListener("buddybook:data-changed", refreshBookings);
    window.addEventListener("buddybook:providers-changed", refreshProviders);
    window.addEventListener("buddybook:providers-cache-updated", refreshProvidersFromCache);
    window.addEventListener("buddybook:data-changed", refreshProviders);

    return () => {
      window.removeEventListener("storage", refreshBookings);
      window.removeEventListener("buddybook:data-changed", refreshBookings);
      window.removeEventListener("buddybook:providers-changed", refreshProviders);
      window.removeEventListener("buddybook:providers-cache-updated", refreshProvidersFromCache);
      window.removeEventListener("buddybook:data-changed", refreshProviders);
    };
  }, []);

  const filteredProviders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return providers;

    return providers.filter((provider) =>
      [provider.name, provider.city, provider.profession, ...(provider.activities || [])]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [providers, search]);

  const displayProviders = filteredProviders.length
    ? filteredProviders.slice(0, 4)
    : providers.slice(0, 4);

  const displayBookings = bookings.slice(0, 4).map((booking, index) =>
    normalizeBooking(booking, providers[index % providers.length])
  );

  const total = bookings.length;
  const completed = countStatus(bookings, ["COMPLETED"]);
  const pending = countStatus(bookings, ["PENDING"]);
  const totalSpent = bookings.reduce(
    (sum, booking) => sum + Number(booking.amount || 0),
    0
  );
  const weeklyBookings = buildWeeklyBookings(bookings);

  const rating =
    user?.userProfile?.rating ?? user?.rating ?? user?.averageRating ?? 0;
  const dailyLimit = 5;
  const todayBookings = bookings.filter(isToday).length;
  const verified = Boolean(
    user?.mobileVerified ||
      user?.emailVerified ||
      user?.kycStatus === "APPROVED"
  );

  return (
    <UserAppLayout
      title="Dashboard"
      user={user}
      searchValue={search}
      onSearchChange={setSearch}
    >
      <section className="grid min-h-full gap-6 xl:grid-cols-[minmax(0,1fr)_500px]">
        <div className="grid min-h-0 gap-6">
          <UserMetricStrip
            totalSpent={totalSpent}
            savedProviders={readStorage("buddybook_watchlist", []).length}
          />
          <Statistics total={total} completed={completed} pending={pending} />

          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Providers to Explore</h2>
                <p className="text-xs font-bold text-[#75839a]">
                  Verified profiles available for public meetups
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {providersLoading ? (
                [1, 2, 3, 4].map((item) => (
                  <div key={item} className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
                    <div className="h-[86px] animate-pulse bg-[#eef4ff]" />
                    <div className="space-y-2 p-3">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-[#eef4ff]" />
                      <div className="h-2 w-1/2 animate-pulse rounded bg-[#eef4ff]" />
                      <div className="h-6 animate-pulse rounded bg-[#eef4ff]" />
                    </div>
                  </div>
                ))
              ) : displayProviders.length ? (
                displayProviders.map((provider, index) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    index={index}
                    small
                    link={`/app/user/provider/${provider.id}`}
                  />
                ))
              ) : (
                <div className="col-span-full grid h-full place-items-center rounded-lg border border-dashed border-[#dce5f2] bg-[#f8fbff] text-center">
                  <div>
                    <p className="text-sm font-black text-[#17213a]">No provider profiles yet</p>
                    <p className="mt-1 text-xs font-bold text-[#75839a]">
                      Save a provider profile from the provider dashboard and it will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <SafetyChecklist />

          <div className="hidden min-h-0 overflow-hidden rounded-xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">Recent Bookings</h2>
              <Link to="/app/user/bookings" className="text-xs font-black text-[#d67f3d]">
                View all bookings
              </Link>
            </div>

            <div className="grid grid-cols-[1.05fr_1.1fr_1.35fr_0.85fr_0.72fr] gap-2 border-b border-[#e7edf5] px-3 pb-3 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
              <span>Date & time</span>
              <span>Provider</span>
              <span>Activity</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>

            <div className="divide-y divide-[#edf1f6]">
              {displayBookings.length ? displayBookings.map((booking) => (
                <Link
                  key={booking.id}
                  to="/app/user/bookings"
                  className="grid grid-cols-[1.05fr_1.1fr_1.35fr_0.85fr_0.72fr] items-center gap-2 px-3 py-4 transition hover:bg-[#f6f8fc]"
                >
                  <p className="truncate text-xs font-bold text-slate-500">
                    {booking.date}
                  </p>
                  <div className="flex min-w-0 items-center gap-2">
                    <img
                      src={booking.image}
                      alt={booking.providerName}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                    <p className="truncate text-xs font-black">{booking.providerName}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black">{booking.activity}</p>
                    <p className="truncate text-[10px] font-bold text-slate-500">
                      {booking.location}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                  <p className="text-right text-sm font-black">₹{booking.amount}</p>
                </Link>
              )) : (
                <div className="grid min-h-[145px] place-items-center text-center">
                  <div>
                    <CalendarCheck size={24} className="mx-auto text-[#e08c4c]" />
                    <p className="mt-2 text-[11px] font-black">No bookings yet</p>
                    <p className="mt-1 text-[9px] font-bold text-slate-500">
                      Browse verified buddies from the home provider section to create your first plan.
                    </p>
                    <Link
                      to="/app/user/dashboard"
                      className="mt-3 inline-flex rounded-md bg-black px-3 py-2 text-[9px] font-black text-[#fffaf3]"
                    >
                      View dashboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="grid min-h-0 gap-6">
          <WeeklyChart values={weeklyBookings} />
          <SuggestedProviders providers={providers.slice(0, 3)} />
        </aside>
      </section>
    </UserAppLayout>
  );
}

function WelcomeBanner({ user }) {
  const firstName = user?.fullName?.split(" ")[0] || "Buddy";
  return (
    <div className="relative min-h-[210px] overflow-hidden rounded-lg border border-[#eddac7] bg-[#fffaf3] p-8 text-black shadow-sm">
      <div className="relative z-10 max-w-[76%]">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-3xl font-black text-black sm:text-5xl">Welcome back, {firstName}!</p>
          <Link to="/app/user/profile" className="inline-flex items-center gap-1 rounded-full bg-black px-4 py-2.5 text-xs font-black text-[#fffaf3]">
            <Edit3 size={14} /> Edit
          </Link>
        </div>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#5d4a3c]">
          Connect with verified buddies for safe, platonic companionship and public meetups.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {["Safe & Verified", "Public Meetups", "Platonic Only", "Community First"].map(
            (item) => (
              <span key={item} className="rounded-md bg-[#ffeedd] px-5 py-3 text-xs font-black text-black shadow-sm">
                {item}
              </span>
            )
          )}
        </div>
      </div>
      <div className="absolute bottom-8 right-12 hidden items-end gap-4 text-[#e08c4c] md:flex">
        <Users size={78} strokeWidth={1.4} />
        <ShieldCheck size={52} strokeWidth={1.4} />
      </div>
    </div>
  );
}

// ProviderCard is now shared in components/users/ProviderCard.jsx

function UserMetricStrip({ totalSpent, savedProviders }) {
  const cards = [
    [Wallet, `Rs ${totalSpent.toLocaleString("en-IN")}`, "Total Spending", "View details", "bg-[#fff1e6] text-[#d67f3d]"],
    [Heart, savedProviders, "Saved Providers", "View all", "bg-[#fff1e6] text-[#d84e58]"],
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {cards.map(([Icon, value, label, action, tone]) => (
        <article key={label} className="min-h-[150px] rounded-xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex min-w-0 items-center gap-4">
            <span className={`grid h-14 w-14 place-items-center rounded-xl ${tone}`}>
              <Icon size={24} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-2xl font-black">{value}</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-[#667085]">{label}</p>
            </div>
          </div>
          <button className="mt-5 block text-sm font-black text-[#e08c4c]">{action}</button>
        </article>
      ))}
    </div>
  );
}

function OverviewCard({ totalSpent, rating, dailyLimit, todayBookings, verified }) {
  const limitOver = todayBookings >= dailyLimit;
  const items = [
    [Wallet, `₹${totalSpent.toLocaleString("en-IN")}`, "Total Spending", "text-[#d67f3d] bg-[#fff4e6]"],
    [Star, rating || "New", "Member Rating", "text-[#d67f3d] bg-[#fff4e6]"],
    [CalendarCheck, limitOver ? "Limit over" : `${todayBookings}/${dailyLimit}`, "Daily Booking Limit", limitOver ? "text-white bg-[#d84e58]" : "text-black bg-[#ffeedd]"],
    [ShieldCheck, verified ? "Verified" : "Pending", "Verification Status", "text-black bg-[#ffeedd]"],
  ];

  return (
    <div className="rounded-lg border border-[#dce5f2] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">My Overview</h2>
      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
        {items.map(([Icon, value, label, tone]) => (
          <div key={label} className="flex items-center gap-3 border-b border-[#edf1f6] pb-3 last:border-0">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${tone}`}>
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black">{value}</p>
              <p className="truncate text-[10px] font-bold text-[#8491a4]">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyChart({ values }) {
  const max = Math.max(...values, 1);
  return (
    <div className="min-h-0 rounded-lg border border-[#dce5f2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">Weekly Bookings</h2>
          <p className="text-xs font-bold text-[#8693a6]">Bookings completed by day</p>
        </div>
        <Link to="/app/user/bookings" className="text-xs font-black text-[#e08c4c]">
          View all
        </Link>
      </div>
      <div className="mt-4 flex h-[calc(100%-50px)] min-h-[180px] items-end gap-3 border-b border-[#e8edf5] px-2 pb-5">
        {values.map((value, index) => (
          <div key={index} className="flex h-full flex-1 flex-col justify-end text-center">
            <div
              className="mx-auto w-full max-w-8 rounded-t-md bg-black transition hover:bg-[#e08c4c]"
              style={{ height: value ? `${Math.max((value / max) * 82, 12)}%` : "3%" }}
              title={`${value} bookings`}
            />
            <p className="mt-3 text-[10px] font-black text-[#8794a7]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Statistics({ total, completed, pending }) {
  return (
    <div className="rounded-lg border border-[#dce5f2] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Statistics</h2>
      <div className="mt-5 grid grid-cols-3 gap-4">
        {[
          [Users, total, "Total", "bg-[#ffeedd] text-black"],
          [CalendarCheck, pending, "Pending", "bg-[#fff1df] text-[#d37a14]"],
          [Check, completed, "Completed", "bg-[#ffeedd] text-black"],
        ].map(([Icon, value, label, tone]) => (
          <div key={label} className="flex items-center gap-3">
            <span className={`grid h-12 w-12 place-items-center rounded-md ${tone}`}>
              <Icon size={18} />
            </span>
            <div>
              <p className="text-xl font-black">{value}</p>
              <p className="text-[10px] font-bold text-[#8a96a8]">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status = "PENDING" }) {
  const normalized = String(status).toUpperCase();
  const tone =
    normalized === "COMPLETED"
      ? "bg-[#ffeedd] text-black"
      : normalized === "CONFIRMED" || normalized === "ACCEPTED"
        ? "bg-[#ffeedd] text-black"
        : normalized === "CANCELLED" || normalized === "REJECTED"
          ? "bg-[#ffeded] text-[#d84e58]"
          : "bg-[#fff2df] text-[#c97612]";

  return (
    <span className={`w-max rounded-md px-2 py-1 text-[7px] font-black ${tone}`}>
      {normalized}
    </span>
  );
}

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function SafetyChecklist() {
  const items = ["Profile is verified", "Use public meeting places", "Share plans with a friend", "Respect boundaries"];
  return (
    <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Safety Checklist</h2>
        <span className="text-sm font-black text-[#16815f]">All good!</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-[#667085]">You are following best practices for safe meetups.</p>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <p key={item} className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 size={16} className="text-[#16815f]" /> {item}
          </p>
        ))}
      </div>
      <Link to="/safety" className="mt-5 inline-flex text-sm font-black text-[#e08c4c]">View safety tips</Link>
    </section>
  );
}

function SuggestedProviders({ providers }) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Suggested Providers</h2>
        <Link to="/#community" className="text-sm font-black text-[#e08c4c]">View all</Link>
      </div>
      <div className="mt-5 flex gap-6 overflow-x-auto">
        {providers.length ? providers.map((provider) => (
          <Link key={provider.id} to={`/app/user/provider/${provider.id}`} className="min-w-20 text-center">
            <img src={provider.image} alt={provider.name} className="mx-auto h-14 w-14 rounded-full object-cover" />
            <p className="mt-2 max-w-20 truncate text-sm font-black">{provider.name}</p>
            <p className="text-xs font-black text-[#e08c4c]">★ {provider.rating || "4.8"}</p>
          </Link>
        )) : (
          <p className="text-sm font-semibold text-[#667085]">Providers will appear here after profiles are published.</p>
        )}
      </div>
    </section>
  );
}

async function loadDashboardProviders() {
  const approved = await listProviders({ verified: true, limit: 4 });
  if (Array.isArray(approved) && approved.length) return approved;
  const allProviders = await listProviders({ limit: 4 });
  return Array.isArray(allProviders) ? allProviders : [];
}

function normalizeProvider(provider, index) {
  const profile = provider.providerProfile || provider.profile || provider;
  return {
    id: provider.id || provider._id || `provider-${index}`,
    name: provider.fullName || provider.name || profile.displayName || "Verified Buddy",
    city: provider.city || profile.city || "Your city",
    activity:
      profile.activities?.[0]?.name || profile.activities?.[0] || profile.activity || "Public meetups",
    price: profile.hourlyRate || provider.price || 500,
    rating: profile.rating || provider.rating || 4.8,
    reviews: profile.reviewCount || provider.reviewCount || 0,
    available: profile.available ?? provider.available ?? true,
    image:
      provider.avatar || profile.avatar || profile.profileImage || "",
  };
}

function normalizeBooking(booking, provider) {
  return {
    id: booking.id || booking._id,
    providerName:
      booking.providerName || booking.provider?.fullName || provider?.name || "Buddy booking",
    activity: booking.activity || booking.activityName || booking.service?.name || "Buddy meetup",
    location: booking.location?.name || booking.location || booking.city || provider?.city || "Public place",
    date: formatBookingDate(
      booking.date || booking.bookingDate || booking.startTime || booking.createdAt
    ),
    amount: Number(booking.amount || booking.totalAmount || 0),
    status: booking.status || "PENDING",
    image:
      booking.image || booking.provider?.avatar || provider?.image || "",
  };
}

function formatBookingDate(value) {
  if (!value) return "Upcoming";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countStatus(bookings, statuses) {
  return bookings.filter((booking) =>
    statuses.includes(String(booking.status || "").toUpperCase())
  ).length;
}

function buildWeeklyBookings(bookings) {
  const values = [0, 0, 0, 0, 0, 0, 0];
  bookings.forEach((booking) => {
    const value = booking.date || booking.bookingDate || booking.startTime || booking.createdAt;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    const mondayIndex = (date.getDay() + 6) % 7;
    values[mondayIndex] += 1;
  });
  return values;
}

function isToday(booking) {
  const value = booking.date || booking.bookingDate || booking.startTime;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.toDateString() === today.toDateString();
}




