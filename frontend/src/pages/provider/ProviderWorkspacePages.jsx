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
  Clock3,
  CreditCard,
  Flag,
  IndianRupee,
  KeyRound,
  MapPin,
  Plus,
  Play,
  Save,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import { formatRs } from "../../utils/format";
import { getMyProviderProfile, saveMyProviderProfile } from "../../api/providers";
import { listBookings, startBookingMeeting } from "../../api/bookings";
import { createReview } from "../../api/reports";
import { notify } from "../../components/common/Feedback";
import MeetingReportDialog from "../../components/common/MeetingReportDialog";
import {
  addReview,
  getBookings,
  getReviewForBooking,
  subscribeToUserData,
} from "../../utils/userFlowStorage";

const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const palette = ["#e08c4c", "#111111", "#ffeedd", "#16815f"];

function formatMeetingTime(value) {
  if (!value) return "after the booked duration";
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function ProviderServices() {
  const { provider, bookings, loading, error, retry } = useProviderWorkspace();
  const [services, setServices] = useState([]); const [saving,setSaving]=useState(false);
  useEffect(()=>{ if(!provider)return; const saved=(provider.profileQuestions||[]).filter((item)=>item?.type==="SERVICE"); setServices(saved.length?saved:String(provider.activities||"").split(",").map(name=>name.trim()).filter(Boolean).map(name=>({type:"SERVICE",name,price:Number(provider.hourlyPrice||0),status:"Live"}))); },[provider]);

  const addService = () =>
    setServices((current) => [
      ...current,
      { name: provider?.activities?.split(",")?.[0]?.trim() || "New activity", price: Number(provider?.hourlyPrice || 500), status: "Draft" },
    ]);
  const demandData = services.map((item) => ({
    name: item.name,
    value: bookings.filter((booking) => String(booking.service || booking.activity || "").trim().toLowerCase() === String(item.name || "").trim().toLowerCase()).length,
  }));

  return (
    <ProviderPageShell
      title="Services"
      subtitle="Package your activities into clear offers users can book."
      action={<button onClick={addService} className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3] shadow-lg shadow-black/10"><Plus size={16} /> Add service</button>}
    >
      {error ? <WorkspaceError message={error} onRetry={retry} /> : null}
      {loading ? <WorkspaceLoading /> : null}
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
          <button type="button" disabled={saving} onClick={async()=>{setSaving(true);try{const others=(provider.profileQuestions||[]).filter(item=>item?.type!=="SERVICE");await saveMyProviderProfile({...provider,activities:services.filter(s=>s.status==="Live").map(s=>s.name).join(", "),profileQuestions:[...others,...services.map(s=>({...s,type:"SERVICE"}))]});notify("Services saved.","success");}catch{notify("Services could not be saved.","error");}finally{setSaving(false);}}} className="mt-4 rounded-xl bg-black px-5 py-3 text-sm font-black text-white disabled:opacity-50"><Save size={16} className="mr-2 inline" />{saving?"Saving...":"Save services"}</button>
        </Panel>

        <Panel title="Demand mix" subtitle="Bookings received for each activity.">
          <div className="h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demandData.some((item) => item.value > 0) ? demandData : [{ name: "No bookings yet", value: 1 }]} dataKey="value" outerRadius={90}>
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
  const { provider, loading, error, retry } = useProviderWorkspace(); const [saving,setSaving]=useState(false);
  const [slots, setSlots] = useState(() => week.map((day, index) => ({
      day,
      enabled: index !== 2,
      window: index > 4 ? "11:00 AM - 7:00 PM" : "5:00 PM - 9:00 PM",
    })));
  useEffect(()=>{if(!provider)return;const saved=(provider.profileQuestions||[]).find(item=>item?.type==="WEEKLY_AVAILABILITY")?.slots;if(Array.isArray(saved)&&saved.length)setSlots(saved);},[provider]);

  return (
    <ProviderPageShell title="Availability" subtitle="Control when users can request public meetup bookings.">
      {error ? <WorkspaceError message={error} onRetry={retry} /> : null}{loading ? <WorkspaceLoading /> : null}
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
          <button type="button" disabled={saving} onClick={async()=>{setSaving(true);try{const others=(provider.profileQuestions||[]).filter(item=>item?.type!=="WEEKLY_AVAILABILITY");await saveMyProviderProfile({...provider,availabilityDays:slots.filter(s=>s.enabled).map(s=>s.day).join(", "),profileQuestions:[...others,{type:"WEEKLY_AVAILABILITY",slots}]});notify("Availability saved.","success");}catch{notify("Availability could not be saved.","error");}finally{setSaving(false);}}} className="mt-4 rounded-xl bg-black px-5 py-3 text-sm font-black text-white disabled:opacity-50"><Save size={16} className="mr-2 inline" />{saving?"Saving...":"Save availability"}</button>
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
  const [pins, setPins] = useState({});
  const [startingId, setStartingId] = useState("");
  const [reportTarget, setReportTarget] = useState(null);

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      listBookings()
        .then((rows) => mounted && setBookings(rows))
        .catch(() => mounted && setBookings(getBookings()));
    };
    refresh();
    const unsubscribe = subscribeToUserData(() => setBookings(getBookings()));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const startMeeting = async (booking) => {
    const pin = String(pins[booking.id] || "");
    if (pin.length !== 6) return notify("Enter the six-digit PIN shared by the user.", "error");
    setStartingId(booking.id);
    try {
      const saved = await startBookingMeeting(booking.id, pin);
      setBookings((rows) => rows.map((item) => item.id === booking.id ? { ...item, ...saved } : item));
      setPins((current) => ({ ...current, [booking.id]: "" }));
      notify("Meeting timer started. Share the end code with the user when ready.", "success");
    } catch (error) {
      notify(error.response?.data?.message || "The meeting could not be started.", "error");
    } finally {
      setStartingId("");
    }
  };

  return (
    <ProviderPageShell title="Bookings" subtitle="Start meetings securely with the user's PIN and manage the live handoff." action={null}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-h-[calc(100vh-13rem)] flex-col overflow-hidden rounded-[1.5rem] border border-[#eddac7] bg-[#fffaf3] shadow-sm">
          <header className="border-b border-[#eddac7] bg-white p-5">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#e08c4c]">Booking management</p>
              <h2 className="mt-1 text-2xl font-black text-black">Provider bookings</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Enter the user's start PIN, run the timer, and share the private end code.</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <BookingStat icon={CalendarCheck} label="Total" value={bookings.length} />
              <BookingStat icon={Clock3} label="Upcoming" value={bookings.filter((item) => ["CONFIRMED", "PAID", "ACCEPTED"].includes(String(item.status || "").toUpperCase())).length} />
              <BookingStat icon={CheckCircle2} label="Completed" value={bookings.filter((item) => String(item.status || "").toUpperCase() === "COMPLETED").length} />
              <BookingStat icon={Users} label="Users" value={new Set(bookings.map((item) => item.userId || item.userName).filter(Boolean)).size} />
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {bookings.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {bookings.map((booking) => {
                  const status = String(booking.status || "PENDING").toUpperCase();
                  const completed = status === "COMPLETED";
                  const providerReview = getReviewForBooking(booking.id, "PROVIDER");

                  return (
                    <article key={booking.id} className="rounded-2xl border border-[#eddac7] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#ffeedd] text-xl font-black text-black">
                            {(booking.userName || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-black text-black">{booking.service || booking.activity || "Buddy meetup"}</h3>
                            <p className="truncate text-sm font-bold text-slate-500">with {booking.userName || booking.customerName || "BuddyBOOK user"}</p>
                          </div>
                        </div>
                        <Status value={status} />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[#fffaf3] p-4 text-sm">
                        <Detail label="Date" value={booking.date || "To be confirmed"} />
                        <Detail label="Time" value={booking.time || "To be confirmed"} />
                        <Detail label="Duration" value={booking.duration || `${booking.durationHours || 1} hour`} />
                        <Detail label="Amount" value={formatRs(Number(booking.amount || 0))} />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-xs font-black text-slate-500">
                          <CreditCard size={15} />
                          Payment: {booking.paymentStatus || "PAID"}
                        </span>
                      </div>

                      {status === "CONFIRMED" ? (
                        <div className="mt-4 rounded-2xl border border-[#edc8a8] bg-[#fff5e9] p-4">
                          <div className="flex items-center gap-2"><KeyRound size={17} className="text-[#c97031]" /><p className="text-sm font-black">Start meeting with user PIN</p></div>
                          <p className="mt-1 text-xs font-bold leading-5 text-black/50">Ask the user for the six-digit PIN shown after payment. It can be used once within 14 days.</p>
                          <div className="mt-3 flex gap-2">
                            <input value={pins[booking.id] || ""} onChange={(event)=>setPins((current)=>({...current,[booking.id]:event.target.value.replace(/\D/g,"").slice(0,6)}))} inputMode="numeric" maxLength={6} placeholder="000000" className="min-w-0 flex-1 rounded-xl border-2 border-black bg-white px-4 py-3 text-center text-xl font-black tracking-[.28em] outline-none" />
                            <button type="button" disabled={startingId===booking.id || String(pins[booking.id]||"").length!==6} onClick={()=>startMeeting(booking)} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-xs font-black text-white disabled:opacity-40"><Play size={15}/>{startingId===booking.id?"Starting...":"Start"}</button>
                          </div>
                        </div>
                      ) : null}

                      {status === "ACTIVE" ? (
                        <div className="mt-4 overflow-hidden rounded-2xl bg-[#171b30] p-5 text-white">
                          <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#f4ad75]">Meeting in progress</p><p className="mt-1 text-sm font-bold text-white/60">Ends {formatMeetingTime(booking.scheduledEndAt)}</p></div><span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" /></div>
                          {booking.endOtp ? <div className="mt-4 rounded-xl border border-white/10 bg-white/10 p-4 text-center"><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/55">Give this end code to the user</p><p className="mt-2 text-3xl font-black tracking-[.28em] text-[#ffd49f]">{booking.endOtp}</p></div> : <div className="mt-4 rounded-xl bg-emerald-500/15 p-4 text-sm font-black text-emerald-200">End code verified. Waiting for the user to end or extend the meeting.</div>}
                          {booking.extensionCount ? <p className="mt-3 text-xs font-bold text-white/50">Extended {booking.extensionCount} time{booking.extensionCount===1?"":"s"} · {booking.durationHours} total hours</p> : null}
                        </div>
                      ) : null}

                      {completed ? (
                        <><button type="button" onClick={() => setReportTarget(booking)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700"><Flag size={15}/>Report user</button>{providerReview ? (
                          <div className="mt-4 rounded-2xl bg-[#fffaf3] p-4">
                            <p className="text-xs font-black text-[#e08c4c]">Review submitted</p>
                            <p className="mt-1 text-sm font-bold text-[#5d4a3c]">{providerReview.description}</p>
                          </div>
                        ) : (
                          <ProviderReviewForm booking={booking} onSubmitted={() => setBookings((rows) => [...rows])} />
                        )}</>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-[#d9bfaa] bg-white text-center">
                <div>
                  <CalendarCheck className="mx-auto text-[#e08c4c]" size={42} />
                  <p className="mt-4 text-xl font-black text-black">No booking requests yet</p>
                  <p className="mt-2 text-sm font-bold text-[#756f95]">Publish your provider profile and accepted user requests will show here.</p>
                </div>
              </div>
            )}
          </div>
        </section>

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
      {reportTarget ? <MeetingReportDialog booking={reportTarget} onClose={() => setReportTarget(null)} /> : null}
    </ProviderPageShell>
  );
}

function ProviderReviewForm({ booking, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    try {
      const saved = await createReview({ bookingId: booking.id, rating, description: description.trim() });
      addReview({
      ...saved,
      bookingId: booking.id,
      reviewerRole: "PROVIDER",
      targetRole: "USER",
      targetName: booking.userName || "BuddyBOOK user",
      rating,
      description,
      service: booking.service || booking.activity,
      });
      onSubmitted();
    } catch (error) {
      notify(error?.response?.data?.message || "Could not submit review.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl bg-[#fffaf3] p-4">
      <p className="text-sm font-black text-black">Review the user</p>
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
        className="mt-3 min-h-[92px] w-full rounded-xl border border-[#eddac7] bg-white p-3 text-sm font-bold outline-none focus:border-black"
      />
      <button type="button" onClick={submit} disabled={!description.trim() || submitting} className="mt-3 rounded-xl bg-black px-4 py-2.5 text-xs font-black text-[#fffaf3] disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? "Submitting..." : "Submit review"}
      </button>
    </div>
  );
}

export function ProviderEarnings() {
  const { stats, bookings } = useProviderWorkspace();
  const completedBookings = bookings.filter((booking) => String(booking.status || "").toUpperCase() === "COMPLETED");
  const revenueBookings = completedBookings.length ? completedBookings : bookings.filter((booking) =>
    ["CONFIRMED", "ACCEPTED"].includes(String(booking.status || "").toUpperCase())
  );
  const bookingRevenue = revenueBookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  const totalRevenue = Number(stats.totalRevenue || bookingRevenue || 0);
  const pendingPayout = revenueBookings
    .filter((booking) => String(booking.payoutStatus || "PENDING").toUpperCase() !== "PAID")
    .reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  const averageBooking = revenueBookings.length ? bookingRevenue / revenueBookings.length : 0;

  return (
    <ProviderPageShell title="Earnings" subtitle="Track expected revenue and payout health.">
      <div className="grid min-w-0 gap-4 sm:gap-5">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          <Kpi icon={Wallet} label="Total revenue" value={formatRs(totalRevenue)} />
          <Kpi icon={IndianRupee} label="Pending payout" value={formatRs(pendingPayout)} />
          <Kpi icon={TrendingUp} label="Avg booking" value={formatRs(averageBooking)} />
          <Kpi icon={CheckCircle2} label="Completed" value={completedBookings.length} />
        </div>

        <Panel title="Revenue trend" subtitle="A simple view of weekly earning momentum.">
          <div className="h-[240px] min-w-0 sm:h-[320px] lg:h-[360px]">
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
  const hasAction = action !== undefined;
  return (
    <AppShell type="provider">
      <div className="min-h-0 bg-[#fff7ed] text-black">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[#eddac7] bg-[#fffaf3] p-4 text-black shadow-sm sm:mb-5 sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e08c4c]">Provider workspace</p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-[#6b5d52]">{subtitle}</p>
          </div>
          {hasAction ? action : null}
        </div>
        {children}
      </div>
    </AppShell>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#eddac7] bg-white p-3 shadow-sm sm:p-5">
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
    <div className="flex min-h-[132px] min-w-0 flex-col justify-between rounded-none border border-[#eddac7] bg-white p-3 shadow-sm sm:min-h-[150px] sm:p-4">
      <span className="grid h-9 w-9 place-items-center rounded-none bg-[#ffeedd] text-black sm:h-11 sm:w-11">
        <Icon size={19} />
      </span>
      <div className="mt-3 min-w-0"><p className="truncate text-xl font-black sm:text-2xl">{value}</p>
      <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.08em] text-[#8b7563] sm:text-xs sm:tracking-[0.12em]">{label}</p></div>
    </div>
  );
}

function Status({ value }) {
  const normalized = String(value || "PENDING").toUpperCase();
  const tone =
    normalized === "COMPLETED"
      ? "bg-[#e8f6ef] text-[#16815f]"
      : normalized === "ACCEPTED" || normalized === "CONFIRMED" || normalized === "PAID"
        ? "bg-[#ffeedd] text-black"
        : "bg-[#fff4e6] text-[#b66b12]";

  return <span className={`w-max rounded-full px-3 py-1 text-xs font-black ${tone}`}>{normalized}</span>;
}

function BookingStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffeedd] text-black">
        <Icon size={19} />
      </span>
      <div>
        <p className="text-xl font-black text-black">{value}</p>
        <p className="text-xs font-bold text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate font-extrabold text-black">{value}</p>
    </div>
  );
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
  const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [reload,setReload]=useState(0);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    weeklyViews: week.map((name) => ({ name, views: 0, bookings: 0, revenue: 0 })),
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true); setError("");
    Promise.all([getMyProviderProfile(), listBookings().catch(() => getBookings())])
      .then(([result, bookingRows]) => {
        if (!mounted) return;
        setProvider(result.provider);
        setBookings(Array.isArray(bookingRows) ? bookingRows : []);
        if (result.stats) setStats((current) => ({ ...current, ...result.stats }));
      })
      .catch(() => { if(mounted)setError("Provider workspace data could not be loaded."); }).finally(()=>{if(mounted)setLoading(false);});
    return () => {
      mounted = false;
    };
  }, [reload]);

  return useMemo(() => ({ provider, stats, bookings, loading, error, retry:()=>setReload(v=>v+1) }), [provider, stats, bookings, loading, error]);
}

function WorkspaceLoading(){return <div className="mb-4 h-20 animate-pulse rounded-2xl bg-black/5" />;}
function WorkspaceError({message,onRetry}){return <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">{message}<button type="button" onClick={onRetry} className="ml-3 rounded-lg bg-black px-3 py-2 text-xs text-white">Retry</button></div>;}
