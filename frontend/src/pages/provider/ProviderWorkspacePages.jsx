import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Plus,
  Save,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import { getMyProviderProfile } from "../../api/providers";
import {
  addReview,
  getBookings,
  getReviewForBooking,
  subscribeToUserData,
  updateBooking,
} from "../../utils/userFlowStorage";

const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const palette = ["#e08c4c", "#111111", "#ffeedd", "#16815f"];

export function ProviderServices() {
  const { provider, stats } = useProviderWorkspace();
  const [services, setServices] = useState(() => [
    { name: "Coffee meetup", price: 450, status: "Live" },
    { name: "City walk", price: 700, status: "Live" },
    { name: "Shopping companion", price: 650, status: "Draft" },
  ]);

  const addService = () =>
    setServices((current) => [
      ...current,
      { name: provider?.activities?.split(",")?.[0]?.trim() || "New activity", price: Number(provider?.hourlyPrice || 500), status: "Draft" },
    ]);

  return (
    <ProviderPageShell
      title="Services"
      subtitle="Package your activities into clear offers users can book."
      action={<button onClick={addService} className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3] shadow-lg shadow-black/10"><Plus size={16} /> Add service</button>}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="Service catalog" subtitle="Edit the public offers connected to your provider profile.">
          <div className="grid gap-3">
            {services.map((service, index) => (
              <div key={`${service.name}-${index}`} className="grid gap-3 rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4 md:grid-cols-[1fr_120px_100px]">
                <input
                  value={service.name}
                  onChange={(event) => updateRow(setServices, index, "name", event.target.value)}
                  className="rounded-xl border border-[#eddac7] bg-white px-3 py-2 text-sm font-bold outline-none focus:border-black"
                />
                <input
                  value={service.price}
                  onChange={(event) => updateRow(setServices, index, "price", event.target.value)}
                  className="rounded-xl border border-[#eddac7] bg-white px-3 py-2 text-sm font-bold outline-none focus:border-black"
                />
                <select
                  value={service.status}
                  onChange={(event) => updateRow(setServices, index, "status", event.target.value)}
                  className="rounded-xl border border-[#eddac7] bg-white px-3 py-2 text-sm font-bold outline-none focus:border-black"
                >
                  <option>Live</option>
                  <option>Draft</option>
                  <option>Paused</option>
                </select>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Demand mix" subtitle="Projected interest by activity.">
          <div className="h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={services.map((item, index) => ({ name: item.name, value: 20 + index * 12 }))} dataKey="value" outerRadius={90}>
                  {services.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </ProviderPageShell>
  );
}

export function ProviderAvailability() {
  const { provider } = useProviderWorkspace();
  const [slots, setSlots] = useState(() =>
    week.map((day, index) => ({
      day,
      enabled: index !== 2,
      window: index > 4 ? "11:00 AM - 7:00 PM" : "5:00 PM - 9:00 PM",
    }))
  );

  return (
    <ProviderPageShell title="Availability" subtitle="Control when users can request public meetup bookings.">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="Weekly schedule" subtitle={provider?.availabilityDays || "Set the days and windows you prefer."}>
          <div className="grid gap-3">
            {slots.map((slot, index) => (
              <label key={slot.day} className="grid gap-3 rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4 md:grid-cols-[100px_1fr_90px]">
                <span className="text-sm font-black">{slot.day}</span>
                <input
                  value={slot.window}
                  onChange={(event) => updateRow(setSlots, index, "window", event.target.value)}
                  className="rounded-xl border border-[#eddac7] bg-white px-3 py-2 text-sm font-bold outline-none focus:border-black"
                />
                <input
                  type="checkbox"
                  checked={slot.enabled}
                  onChange={(event) => updateRow(setSlots, index, "enabled", event.target.checked)}
                  className="h-6 w-6 justify-self-end accent-black"
                />
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Availability flow" subtitle="Live slots by day">
          <div className="mt-5 grid gap-3">
            {slots.map((slot) => (
              <div key={slot.day} className="flex items-center gap-3">
                <span className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-black ${slot.enabled ? "bg-[#e8f6ef] text-[#16815f]" : "bg-[#fff1f1] text-[#c03545]"}`}>
                  {slot.day}
                </span>
                <div className="h-2 flex-1 rounded-full bg-[#ede9ff]">
                  <div className={`h-full rounded-full ${slot.enabled ? "bg-black" : "bg-[#e8d6c5]"}`} style={{ width: slot.enabled ? "78%" : "24%" }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </ProviderPageShell>
  );
}

export function ProviderBookings() {
  const { stats } = useProviderWorkspace();
  const [bookings, setBookings] = useState(() => getBookings());

  useEffect(() => subscribeToUserData(() => setBookings(getBookings())), []);

  return (
    <ProviderPageShell title="Bookings" subtitle="Review requests, accept safe plans, and monitor booking flow.">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Booking requests" subtitle="Complete meetings and review users after the plan is over.">
          {bookings.length ? (
            <div className="grid gap-3">
              {bookings.map((booking) => {
                const status = String(booking.status || "PENDING").toUpperCase();
                const completed = status === "COMPLETED";
                const providerReview = getReviewForBooking(booking.id, "PROVIDER");

                return (
                  <article key={booking.id} className="rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-black">{booking.service || booking.activity || "Buddy meetup"}</p>
                        <p className="mt-1 text-sm font-bold text-[#6b5d52]">
                          User booking for {booking.date || "date pending"} {booking.time ? `at ${booking.time}` : ""}
                        </p>
                      </div>
                      <Status value={status} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {!completed ? (
                        <button
                          type="button"
                          onClick={() => updateBooking(booking.id, { status: "COMPLETED", completedAt: new Date().toISOString() })}
                          className="rounded-xl bg-black px-4 py-2.5 text-xs font-black text-[#fffaf3]"
                        >
                          Mark completed
                        </button>
                      ) : null}
                    </div>

                    {completed ? (
                      providerReview ? (
                        <div className="mt-4 rounded-xl bg-white p-3">
                          <p className="text-xs font-black text-[#e08c4c]">Review submitted</p>
                          <p className="mt-1 text-sm font-bold text-[#5d4a3c]">{providerReview.description}</p>
                        </div>
                      ) : (
                        <ProviderReviewForm booking={booking} onSubmitted={() => setBookings(getBookings())} />
                      )
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-[#d9bfaa] bg-[#fffaf3] text-center">
              <div>
                <p className="text-base font-black">No booking requests yet</p>
                <p className="mt-2 text-sm font-bold text-[#756f95]">
                  Publish your provider profile and accepted user requests will show here.
                </p>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Weekly bookings" subtitle="Accepted and completed volume">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eddac7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#111111" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </ProviderPageShell>
  );
}

function ProviderReviewForm({ booking, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState("");

  const submit = () => {
    if (!description.trim()) return;
    addReview({
      bookingId: booking.id,
      reviewerRole: "PROVIDER",
      targetRole: "USER",
      targetName: booking.userName || "BuddyBOOK user",
      rating,
      description,
      service: booking.service || booking.activity,
    });
    onSubmitted();
  };

  return (
    <div className="mt-4 rounded-xl bg-white p-3">
      <p className="text-sm font-black">Review the user</p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)} className="text-[#e08c4c]" aria-label={`${value} star rating`}>
            <Star size={20} fill={value <= rating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Write a short, professional note about the user's conduct."
        className="mt-3 min-h-[92px] w-full rounded-xl border border-[#eddac7] bg-[#fffaf3] p-3 text-sm font-bold outline-none focus:border-black"
      />
      <button type="button" onClick={submit} disabled={!description.trim()} className="mt-3 rounded-xl bg-black px-4 py-2.5 text-xs font-black text-[#fffaf3] disabled:cursor-not-allowed disabled:opacity-50">
        Submit review
      </button>
    </div>
  );
}

export function ProviderEarnings() {
  const { stats } = useProviderWorkspace();

  return (
    <ProviderPageShell title="Earnings" subtitle="Track expected revenue and payout health.">
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi icon={Wallet} label="Total revenue" value={`Rs ${Number(stats.totalRevenue || 0).toLocaleString("en-IN")}`} />
          <Kpi icon={IndianRupee} label="Pending payout" value="Rs 2,800" />
          <Kpi icon={TrendingUp} label="Avg booking" value="Rs 720" />
          <Kpi icon={CheckCircle2} label="Completed" value={stats.totalBookings || 0} />
        </div>

        <Panel title="Revenue trend" subtitle="A simple view of weekly earning momentum.">
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyViews}>
                <defs>
                  <linearGradient id="providerRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#e08c4c" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#e08c4c" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eddac7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#e08c4c" strokeWidth={3} fill="url(#providerRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </ProviderPageShell>
  );
}

function ProviderPageShell({ title, subtitle, action, children }) {
  return (
    <AppShell type="provider">
      <div className="min-h-0 bg-[#fff7ed] text-black">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[#eddac7] bg-[#fffaf3] p-6 text-black shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e08c4c]">Provider workspace</p>
            <h1 className="mt-2 text-3xl font-black">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-[#6b5d52]">{subtitle}</p>
          </div>
          {action || <button className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3] shadow-lg shadow-black/10"><Save size={16} /> Save view</button>}
        </div>
        {children}
      </div>
    </AppShell>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black">{title}</h2>
        <p className="mt-1 text-xs font-bold text-[#8b7563]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#eddac7] bg-white p-4 shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffeedd] text-black">
        <Icon size={19} />
      </span>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#8b7563]">{label}</p>
    </div>
  );
}

function Status({ value }) {
  const tone =
    value === "Completed"
      ? "bg-[#e8f6ef] text-[#16815f]"
      : value === "Accepted"
        ? "bg-[#ffeedd] text-black"
        : "bg-[#fff4e6] text-[#b66b12]";

  return <span className={`w-max rounded-full px-3 py-1 text-xs font-black ${tone}`}>{value}</span>;
}

function updateRow(setter, index, key, value) {
  setter((current) =>
    current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: value } : item
    )
  );
}

function useProviderWorkspace() {
  const [provider, setProvider] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    weeklyViews: week.map((name) => ({ name, views: 0, bookings: 0, revenue: 0 })),
  });

  useEffect(() => {
    let mounted = true;
    getMyProviderProfile()
      .then((result) => {
        if (!mounted) return;
        setProvider(result.provider);
        if (result.stats) setStats((current) => ({ ...current, ...result.stats }));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return useMemo(() => ({ provider, stats }), [provider, stats]);
}
