import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, KeyRound, MapPin, Phone, ShieldCheck, TimerReset } from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import { createExtensionOrder, endBookingMeeting, listBookings, verifyBookingEndCode, verifyExtensionPayment } from "../../api/bookings";
import { listChats, sendChatMessage } from "../../api/chats";
import { notify } from "../../components/common/Feedback";
import { formatRupees } from "../../utils/format";
import { getBookings, updateBooking } from "../../utils/userFlowStorage";

export default function UserActiveMeet() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(() => getBookings().find((item) => item.id === bookingId));
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState("");
  const [now, setNow] = useState(Date.now());

  const load = useCallback((quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    return Promise.all([listBookings(), listChats()])
      .then(([rows, chats]) => {
        setBooking(rows.find((item) => item.id === bookingId));
        setThread(chats.find((chat) => chat.bookingId === bookingId));
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
      updateBooking(bookingId, saved);
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
            updateBooking(bookingId, saved);
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

  const shareLocation = () => {
    if (!navigator.geolocation || !thread?.id) return notify("Location sharing is unavailable for this booking.", "error");
    setSharing(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try { await sendChatMessage(thread.id, { type: "LOCATION", latitude: coords.latitude, longitude: coords.longitude }); notify("Current location shared in booking chat.", "success"); }
      catch { notify("Location could not be shared.", "error"); }
      finally { setSharing(false); }
    }, () => { setSharing(false); notify("Location permission was denied.", "error"); }, { enableHighAccuracy: true, timeout: 15000 });
  };

  return (
    <UserAppLayout title="Secure Active Meet">
      <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <div className="overflow-hidden rounded-[2rem] border border-[#eddac7] bg-white shadow-sm">
          <div className="bg-[#171b30] p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f4ad75]">Verified meeting session</p><h2 className="mt-2 text-3xl font-black">{booking.service}</h2><p className="mt-1 text-sm font-bold text-white/55">with {booking.providerName}</p></div><span className="rounded-full bg-emerald-400/15 px-4 py-2 text-xs font-black text-emerald-300">{status}</span></div>
            {status === "ACTIVE" ? <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5 text-center"><p className="text-xs font-black uppercase tracking-[.16em] text-white/45">Time remaining</p><p className="mt-2 font-mono text-4xl font-black tracking-wider text-[#ffd49f]">{remaining || "--:--:--"}</p><p className="mt-2 text-xs font-bold text-white/40">Scheduled until {formatTime(booking.scheduledEndAt)}</p></div> : null}
          </div>

          <div className="p-5 sm:p-7">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Started" value={formatTime(booking.meetingStartedAt) || "Not yet"} />
              <Metric label="Duration" value={`${booking.durationHours || 1} hours`} />
              <Metric label="Extensions" value={booking.extensionCount || 0} />
              <Metric label="Total paid" value={formatRupees(Number(booking.amount || 0))} />
            </div>
            <div className="mt-5 grid h-[280px] place-items-center rounded-[1.7rem] bg-[#fff5e9] text-center"><div><MapPin className="mx-auto text-[#e08c4c]" size={54}/><p className="mt-3 text-lg font-black">Share your live meetup location</p><p className="mt-1 max-w-sm text-sm font-bold text-black/45">Coordinates are shared only inside this booking chat.</p><button type="button" disabled={sharing} onClick={shareLocation} className="mt-4 rounded-xl bg-black px-5 py-3 text-xs font-black text-white">{sharing ? "Sharing..." : "Share location"}</button></div></div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#eddac7] bg-white p-5 shadow-sm sm:p-7">
          {status === "CONFIRMED" ? <div className="rounded-2xl bg-[#fff5e9] p-6"><KeyRound className="text-[#e08c4c]" size={28}/><h2 className="mt-4 text-2xl font-black">Meet the provider first</h2><p className="mt-2 text-sm font-bold leading-6 text-black/55">Share the private start PIN from your bookings page only after meeting the provider in person. This screen becomes active when they enter it.</p></div> : null}

          {status === "ACTIVE" && !booking.endOtpVerified ? <div><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#ffeedd] text-[#c97031]"><KeyRound size={21}/></span><div><h2 className="text-xl font-black">Enter provider's end code</h2><p className="text-xs font-bold text-black/45">Required before ending or extending</p></div></div><div className="mt-6 rounded-2xl bg-[#fffaf3] p-5"><input value={otp} onChange={(event)=>setOtp(event.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" maxLength={6} placeholder="000000" className="w-full rounded-xl border-2 border-black bg-white px-4 py-4 text-center text-3xl font-black tracking-[.35em] outline-none"/><button type="button" onClick={verifyEndCode} disabled={otp.length!==6 || Boolean(busy)} className="mt-3 w-full rounded-xl bg-black px-5 py-4 text-sm font-black text-white disabled:opacity-40">{busy==="verify"?"Verifying...":"Verify end code"}</button></div><p className="mt-4 text-xs font-bold leading-5 text-black/45">The provider sees this code in their dashboard. Ask for it only when you are ready to decide.</p></div> : null}

          {status === "ACTIVE" && booking.endOtpVerified ? <div><div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={27}/></div><h2 className="mt-5 text-3xl font-black">What would you like to do?</h2><p className="mt-2 text-sm font-bold leading-6 text-black/50">End securely now, or add one more hour. Every extension is 10% cheaper than the price paid for the previous hour.</p><div className="mt-6 grid gap-3"><button type="button" onClick={finishMeeting} disabled={Boolean(busy)} className="rounded-2xl bg-[#171b30] px-5 py-4 text-sm font-black text-white disabled:opacity-50">{busy==="end"?"Ending...":"End meeting now"}</button><button type="button" onClick={extendMeeting} disabled={Boolean(busy)} className="rounded-2xl border-2 border-[#e08c4c] bg-[#fff5e9] p-5 text-left disabled:opacity-50"><span className="flex items-center justify-between gap-3"><span><span className="flex items-center gap-2 text-sm font-black"><TimerReset size={18}/>Extend one hour</span><span className="mt-1 block text-xs font-bold text-black/45">10% off the last hourly price</span></span><span className="text-xl font-black text-[#c97031]">{formatRupees(Number(booking.nextExtensionAmount || 0))}</span></span></button></div></div> : null}

          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-black/10 pt-5"><button onClick={()=>booking.providerPhone?window.location.href=`tel:${booking.providerPhone}`:notify("Provider phone number is unavailable.","error")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#fff5e9] px-4 py-3 text-xs font-black"><Phone size={15}/>Call</button><button onClick={()=>window.location.href="tel:112"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-xs font-black text-rose-700"><ShieldCheck size={15}/>SOS 112</button></div>
        </div>
      </section>
    </UserAppLayout>
  );
}

function Metric({ label, value }) { return <div className="rounded-xl bg-[#fffaf3] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-black/35">{label}</p><p className="mt-1 truncate text-sm font-black">{value}</p></div>; }
function formatTime(value) { return value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""; }

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) { existing.addEventListener("load", () => resolve(true), { once: true }); existing.addEventListener("error", () => resolve(false), { once: true }); return; }
    const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script);
  });
}
