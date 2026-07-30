import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock3, CreditCard, KeyRound, Phone, ShieldCheck, TimerReset, UserRound } from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import { createExtensionOrder, endBookingMeeting, listBookings, verifyBookingEndCode, verifyExtensionPayment } from "../../api/bookings";
import { notify } from "../../components/common/Feedback";
import { formatRupees } from "../../utils/format";

export default function UserActiveMeet() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState("");
  const [now, setNow] = useState(Date.now());

  const load = useCallback((quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    return listBookings()
      .then((rows) => {
        setBooking(rows.find((item) => item.id === bookingId));
      })
      .catch(() => setError("Active meet details could not be loaded."))
      .finally(() => !quiet && setLoading(false));
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => { setNow(Date.now()); load(true); }, 10000);
    return () => window.clearInterval(timer);
  }, [load]);

  const remaining = useMemo(() => {
    if (!booking?.scheduledEndAt) return null;
    const seconds = Math.max(0, Math.floor((new Date(booking.scheduledEndAt).getTime() - now) / 1000));
    return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }, [booking?.scheduledEndAt, now]);

  if (loading) return <UserAppLayout title="Active Meet"><div className="h-64 animate-pulse rounded-[2rem] bg-black/5" /></UserAppLayout>;
  if (error) return <UserAppLayout title="Active Meet"><div role="alert" className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center font-black text-red-700">{error}<button onClick={() => load()} className="ml-3 rounded-xl bg-black px-4 py-2 text-white">Retry</button></div></UserAppLayout>;
  if (!booking) return <UserAppLayout title="Active Meet"><div className="rounded-[2rem] bg-white p-8 text-center font-black">Booking not found.</div></UserAppLayout>;

  const status = String(booking.status || "").toUpperCase();

  const verifyEndCode = async () => {
    if (otp.length !== 6) return notify("Enter the complete six-digit code from the provider.", "error");
    setBusy("verify");
    try {
      const saved = await verifyBookingEndCode(bookingId, otp);
      setBooking((current) => ({ ...current, ...saved }));
      setOtp("");
      notify("Code verified. Choose whether to finish or extend.", "success");
    } catch (err) {
      notify(err.response?.data?.message || "The end code could not be verified.", "error");
    } finally { setBusy(""); }
  };

  const finishMeeting = async () => {
    setBusy("end");
    try {
      const saved = await endBookingMeeting(bookingId);
      notify("Meeting completed securely.", "success");
      navigate("/app/user/bookings", { replace: true });
    } catch (err) {
      notify(err.response?.data?.message || "The meeting could not be ended.", "error");
    } finally { setBusy(""); }
  };

  const extendMeeting = async () => {
    setBusy("extend");
    try {
      if (!(await loadRazorpayCheckout())) throw new Error("Razorpay Checkout could not be loaded.");
      const checkout = await createExtensionOrder(bookingId);
      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.order.amount,
        currency: checkout.order.currency,
        name: "BuddyBOOK",
        description: `One-hour meeting extension · ${checkout.extension.sequence * 10}% cumulative saving path`,
        order_id: checkout.order.id,
        theme: { color: "#171b30" },
        modal: { ondismiss: () => setBusy("") },
        handler: async (response) => {
          try {
            const saved = await verifyExtensionPayment(bookingId, response);
            setBooking((current) => ({ ...current, ...saved }));
            notify("One discounted hour added. A new end code is ready for the provider.", "success");
          } catch (err) {
            notify(err.response?.data?.message || "Extension payment verification failed.", "error");
          } finally { setBusy(""); }
        },
      });
      razorpay.on("payment.failed", (response) => { notify(response.error?.description || "Extension payment failed.", "error"); setBusy(""); });
      razorpay.open();
    } catch (err) {
      notify(err.response?.data?.message || err.message || "Could not start extension payment.", "error");
      setBusy("");
    }
  };

  return (
    <UserAppLayout title="Secure Active Meet">
      <section className="mx-auto max-w-4xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.09)]">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 p-5 sm:p-7">
          <div className="flex min-w-0 items-center gap-4">
            {booking.providerImage ? <img src={booking.providerImage} alt={booking.providerName} className="h-16 w-16 border border-slate-200 object-cover" /> : <span className="grid h-16 w-16 place-items-center bg-slate-100 text-slate-500"><UserRound size={28}/></span>}
            <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-700">Verified active booking</p><h1 className="mt-1 truncate text-2xl font-black text-slate-950">{booking.service}</h1><p className="truncate text-sm font-semibold text-slate-500">with {booking.providerName}</p></div>
          </div>
          <span className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700">{status}</span>
        </header>

        {status === "ACTIVE" ? <div className="border-b border-slate-200 bg-slate-950 px-5 py-6 text-center text-white"><p className="text-[10px] font-black uppercase tracking-[.22em] text-slate-400">Session time remaining</p><p className="mt-2 font-mono text-4xl font-black tracking-[.12em]">{remaining || "--:--:--"}</p><p className="mt-1 text-xs font-semibold text-slate-400">Scheduled until {formatTime(booking.scheduledEndAt)}</p></div> : null}

        <div className="grid grid-cols-2 border-b border-slate-200 sm:grid-cols-4">
          <InfoCell icon={Clock3} label="Started" value={formatTime(booking.meetingStartedAt) || "Not yet"} />
          <InfoCell icon={CalendarDays} label="Duration" value={`${booking.durationHours || 1} hour${Number(booking.durationHours || 1) === 1 ? "" : "s"}`} />
          <InfoCell icon={TimerReset} label="Extensions" value={booking.extensionCount || 0} />
          <InfoCell icon={CreditCard} label="Total paid" value={formatRupees(Number(booking.amount || 0))} />
        </div>

        <div className="p-5 sm:p-7">
          {status === "CONFIRMED" ? <div className="border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-3"><KeyRound className="text-amber-700" size={20}/><div><h2 className="font-black">Meet the provider first</h2><p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Share your private start PIN only after meeting the provider in person.</p></div></div></div> : null}

          {status === "ACTIVE" && !booking.endOtpVerified ? <div className="border border-slate-200 p-4"><div className="flex flex-wrap items-center gap-3"><div className="mr-auto min-w-[210px]"><div className="flex items-center gap-2"><KeyRound size={17}/><h2 className="text-sm font-black">{booking.extensionCount ? `Enter new code for extension ${booking.extensionCount}` : "Enter provider end code"}</h2></div><p className="mt-1 text-[11px] font-semibold text-slate-500">Ask the provider for this code to end or extend.</p></div><input aria-label="Provider six-digit code" value={otp} onChange={(event)=>setOtp(event.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" maxLength={6} placeholder="000000" className="h-11 w-40 border border-slate-950 bg-white px-3 text-center font-mono text-lg font-black tracking-[.2em] outline-none focus:ring-2 focus:ring-amber-300"/><button type="button" onClick={verifyEndCode} disabled={otp.length!==6 || Boolean(busy)} className="h-11 bg-slate-950 px-5 text-xs font-black text-white disabled:opacity-40">{busy==="verify"?"Verifying...":"Verify code"}</button></div></div> : null}

          {status === "ACTIVE" && booking.endOtpVerified ? <div className="border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={22}/><div><h2 className="font-black text-slate-950">Code verified</h2><p className="mt-1 text-xs font-semibold text-slate-600">End this meeting, or pay for another discounted hour. Payment creates a fresh code and repeats the same secure handoff.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={finishMeeting} disabled={Boolean(busy)} className="h-12 border border-slate-950 bg-white px-5 text-sm font-black text-slate-950 disabled:opacity-50">{busy==="end"?"Ending...":"End meeting"}</button><button type="button" onClick={extendMeeting} disabled={Boolean(busy)} className="flex h-12 items-center justify-between bg-slate-950 px-5 text-left text-white disabled:opacity-50"><span><span className="block text-xs font-black">Extend one hour</span><span className="block text-[10px] font-semibold text-slate-400">10% less than previous hour</span></span><span className="text-base font-black">{formatRupees(Number(booking.nextExtensionAmount || 0))}</span></button></div></div> : null}

          {booking.extensions?.length ? <div className="mt-5 border border-slate-200"><div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><h3 className="text-xs font-black uppercase tracking-[.14em] text-slate-600">Extension payments</h3></div>{booking.extensions.map((extension) => <div key={extension.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0"><div><p className="text-sm font-black">Extra hour {extension.sequence}</p><p className="text-[10px] font-semibold text-slate-500">{extension.status === "PAID" ? "Paid and added to this booking" : "Payment pending"}</p></div><span className="text-xs font-bold text-emerald-700">{extension.discountPercent}% discount</span><span className="text-sm font-black">{formatRupees(Number(extension.amount || 0))}</span></div>)}</div> : null}

          <div className="mt-5 flex justify-center gap-3 border-t border-slate-200 pt-5"><button onClick={()=>booking.providerPhone?window.location.href=`tel:${booking.providerPhone}`:notify("Provider phone number is unavailable.","error")} className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-5 text-xs font-black"><Phone size={14}/>Call provider</button><button onClick={()=>window.location.href="tel:112"} className="inline-flex h-10 items-center justify-center gap-2 border border-rose-200 bg-rose-50 px-5 text-xs font-black text-rose-700"><ShieldCheck size={14}/>SOS 112</button></div>
        </div>
      </section>
    </UserAppLayout>
  );
}

function InfoCell({ icon: Icon, label, value }) { return <div className="border-r border-slate-200 p-4 last:border-r-0"><div className="flex items-center gap-2 text-slate-400"><Icon size={14}/><p className="text-[9px] font-black uppercase tracking-wider">{label}</p></div><p className="mt-2 truncate text-sm font-black text-slate-950">{value}</p></div>; }
function formatTime(value) { return value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""; }

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) { existing.addEventListener("load", () => resolve(true), { once: true }); existing.addEventListener("error", () => resolve(false), { once: true }); return; }
    const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script);
  });
}
