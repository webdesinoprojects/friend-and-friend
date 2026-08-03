import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  IndianRupee,
  Lock,
} from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import api from "../../api/api";
import { formatRupees } from "../../utils/format";
import { createBookingRequest, createRazorpayOrder, listBookings, verifyRazorpayPayment } from "../../api/bookings";
import { getCachedProvider, getProvider } from "../../api/providers";
import { hasAuthToken } from "../../utils/authSession";

const paymentMethods = [
  ["Razorpay Test Checkout", CreditCard, "UPI, cards, netbanking and supported wallets"],
];

const TIME_OPTIONS = (() => {
  const list = [];
  for (let hour = 6; hour <= 23; hour += 1) {
    for (const minute of ["00", "30"]) {
      list.push(`${String(hour).padStart(2, "0")}:${minute}`);
    }
  }
  return list;
})();

export default function UserBookingPayment() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bookingParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const cachedProvider = useMemo(() => getCachedProvider(providerId), [providerId]);
  const [user, setUser] = useState(() => readUser());
  const [provider, setProvider] = useState(cachedProvider);
  const [loading, setLoading] = useState(!cachedProvider);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [service, setService] = useState(() => bookingParams.get("service") || "");
  const [date, setDate] = useState(() => bookingParams.get("date") || dateValue(1));
  const [time, setTime] = useState(() => bookingParams.get("time") || "17:30");
  const [duration, setDuration] = useState(() => bookingParams.get("duration") || "1");
  const [paymentMethod, setPaymentMethod] = useState("Razorpay Test Checkout");
  const bookingId = bookingParams.get("bookingId");
  const [acceptedBooking, setAcceptedBooking] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (cachedProvider) {
      setProvider(cachedProvider);
      setService((current) => current || getProviderActivities(cachedProvider)[0]);
      setLoading(false);
    }

    if (hasAuthToken()) {
      api.get("/auth/me", { timeout: 2500, suppressGlobalError: true }).then(({ data }) => {
        const nextUser = data?.user || data?.data?.user || data?.data;
        if (mounted && (nextUser?.id || nextUser?._id)) setUser(nextUser);
      }).catch(() => {});
    }

    getProvider(providerId)
      .then((nextProvider) => {
        if (!mounted || !nextProvider) return;
        setProvider(nextProvider);
        setService((current) => current || getProviderActivities(nextProvider)[0]);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [providerId, cachedProvider]);

  useEffect(() => {
    if (!bookingId) return;
    listBookings().then((rows) => setAcceptedBooking(rows.find((item) => item.id === bookingId) || null)).catch(() => {});
  }, [bookingId]);

  const hourlyRate = useMemo(() => parseHourlyRate(provider?.price), [provider?.price]);
  const amount = useMemo(
    () => hourlyRate * Number(duration || 1),
    [duration, hourlyRate]
  );
  const invalidUrl = useMemo(
    () => provider ? hasInvalidBookingParams(bookingParams, provider) : false,
    [bookingParams, provider]
  );

  const handlePayment = async () => {
    if (!provider || !service || !date || !time) return;
    setProcessing(true);
    setPaymentError("");
    try {
      const checkoutLoaded = await loadRazorpayCheckout();
      if (!checkoutLoaded) throw new Error("Razorpay Checkout could not be loaded. Check your internet connection.");
      if (!bookingId) {
        const request = await createBookingRequest({ providerId: provider.id, service, date, time, durationHours: Number(duration || 1) });
        navigate("/app/user/bookings", { replace: true, state: { requestSent: true, bookingId: request.id } });
        return;
      }
      if (acceptedBooking?.status !== "ACCEPTED") throw new Error("Payment opens only after the provider accepts this request.");
      const orderData = await createRazorpayOrder({
        bookingId,
        providerId: provider.id,
        service,
        date,
        time,
        durationHours: Number(duration || 1),
      });
      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "PPlusOne",
        description: `${service} with ${provider.name}`,
        order_id: orderData.order.id,
        prefill: { name: user?.fullName || "", email: user?.email || "", contact: user?.phone || "" },
        notes: { provider: provider.name, activity: service },
        theme: { color: "#171b30" },
        modal: { ondismiss: () => setProcessing(false) },
        handler: async (response) => {
          try {
            const booking = await verifyRazorpayPayment(response);
            navigate("/app/user/bookings", { replace: true, state: { paymentSuccess: true, bookingId: booking.id } });
          } catch (error) {
            setPaymentError(error.response?.data?.message || error.message || "Payment verification failed. Please contact support with your Razorpay payment ID.");
            setProcessing(false);
          }
        },
      });
      razorpay.on("payment.failed", (response) => {
        setPaymentError(response.error?.description || "Razorpay payment failed. Please try again.");
        setProcessing(false);
      });
      razorpay.open();
    } catch (error) {
      setPaymentError(error.response?.data?.message || error.message || "Could not start Razorpay checkout.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <UserAppLayout title="Secure Checkout" user={user}>
        <div className="h-full animate-pulse border-2 border-black bg-white" />
      </UserAppLayout>
    );
  }

  if (invalidUrl) {
    return <Navigate to="/404" replace />;
  }

  if (!provider) {
    return (
      <UserAppLayout title="Booking Not Found" user={user}>
        <div className="grid h-full place-items-center border-2 border-black bg-white text-xl font-black">
          Provider not found.
        </div>
      </UserAppLayout>
    );
  }

  return (
    <UserAppLayout title="Secure Checkout" user={user}>
      <section className="custom-scrollbar h-full min-w-0 overflow-x-auto bg-[#fffaf3] p-3 text-[#171b30] sm:p-5">
        <div className="mb-4 border-2 border-[#171b30] bg-[#171b30] p-4 text-white">
          <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">PPlusOne secure payments</p><h1 className="mt-1 text-xl font-black sm:text-2xl">Complete your verified booking</h1></div>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0 border-2 border-[#171b30] bg-white p-5 shadow-[6px_6px_0_#e08c4c]">
          <div className="flex items-center justify-between border-b-2 border-[#171b30] pb-4"><h2 className="text-2xl font-black">Booking summary</h2><span className="border border-[#e08c4c] bg-[#ffeedd] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#bc6e36]">Step 1 of 2</span></div>
          <div className="mt-5 flex items-center gap-4 border-2 border-[#e08c4c] bg-[#fffaf3] p-4">
            <img src={provider.image} alt={provider.name} className="h-20 w-20 border-2 border-[#171b30] object-cover" />
            <div className="min-w-0">
              <p className="truncate text-lg font-black">{provider.name}</p>
              <p className="text-sm font-bold text-[#171b30]/55">{provider.profession}</p>
              <p className="mt-1 flex items-center text-sm font-black text-[#e08c4c]"><IndianRupee size={14} />{hourlyRate}/hr</p>
            </div>
            <span className="ml-auto hidden border border-[#171b30] bg-[#171b30] px-3 py-1.5 text-[10px] font-black uppercase text-white sm:block">Verified</span>
          </div>

          <div className="mt-5 grid min-w-0 max-w-full gap-3 overflow-hidden sm:grid-cols-2">
            <Field label="Activity">
              <select value={service} onChange={(event) => setService(event.target.value)} className="field-control block w-full min-w-0 max-w-full truncate">
                {[...new Set([service, ...getProviderActivities(provider)].filter(Boolean))].map((activity) => <option key={activity}>{activity}</option>)}
              </select>
            </Field>
            <Field label="Duration">
              <select value={duration} onChange={(event) => setDuration(event.target.value)} className="field-control block w-full min-w-0 max-w-full truncate">
                {[1, 2, 3, 4, 5, 6].map((hours) => <option key={hours} value={hours}>{hours} Hour{hours > 1 ? "s" : ""}</option>)}
              </select>
            </Field>
            <Field label="Meetup date" icon={CalendarDays}>
              <input type="date" min={dateValue(0)} max={dateValue(10)} value={date} onChange={(event) => setDate(event.target.value)} className="field-control block w-full min-w-0 max-w-full" />
            </Field>
            <Field label="Start time" icon={Clock3}>
              <select value={time} onChange={(event) => setTime(event.target.value)} className="field-control block w-full min-w-0 max-w-full truncate">
                {TIME_OPTIONS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </Field>
          </div>

          <div className="mt-5 border-2 border-[#171b30] bg-[#fffaf3] p-4">
            <div className="flex justify-between text-sm font-bold text-[#171b30]/60"><span>Hourly rate</span><span>{formatRupees(hourlyRate)}</span></div>
            <div className="mt-2 flex justify-between text-sm font-bold text-[#171b30]/60"><span>Duration</span><span>{duration} hour(s)</span></div>
            <div className="mt-4 flex justify-between border-t-2 border-[#171b30] pt-4 text-xl font-black"><span>Total payable</span><span className="text-[#e08c4c]">{formatFullRupees(amount)}</span></div>
          </div>
        </div>

        <div className="min-w-0 border-2 border-[#171b30] bg-white p-5 shadow-[6px_6px_0_#e08c4c]">
          <div className="flex items-center justify-between border-b-2 border-[#171b30] pb-4"><div><h2 className="text-2xl font-black">Payment</h2><p className="mt-1 text-sm font-bold text-[#171b30]/55">The booking is confirmed only after verified payment.</p></div><span className="border border-[#e08c4c] bg-[#ffeedd] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#bc6e36]">Step 2 of 2</span></div>

          <div className="mt-5 grid gap-3">
            {paymentMethods.map(([name, Icon, description]) => (
              <button
                key={name}
                type="button"
                onClick={() => setPaymentMethod(name)}
                className={`flex items-center gap-4 border-2 p-4 text-left transition ${
                  paymentMethod === name
                    ? "border-[#e08c4c] bg-white text-[#171b30] shadow-[5px_5px_0_#171b30]"
                    : "border-[#171b30] bg-[#fffaf3] hover:bg-[#ffeedd]"
                }`} 
              >
                <span className={`grid h-11 w-11 place-items-center border ${paymentMethod === name ? "border-[#171b30] bg-[#171b30] text-white" : "border-[#171b30] bg-[#171b30] text-white"}`}>
                  <Icon size={19} />
                </span>
                <span className="flex-1"><span className="block text-sm font-black">{name}</span><span className="mt-1 block text-xs font-bold text-[#171b30]/50">{description}</span></span>
                {paymentMethod === name ? <Check size={18} className="text-[#e08c4c]" /> : null}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={processing}
            onClick={handlePayment}
            className="mx-auto mt-5 flex w-[92%] items-center justify-center gap-2 rounded-full border-2 border-[#2563eb] bg-[#2563eb] px-6 py-4 text-sm font-black text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            <Lock size={17} /> {processing ? "Processing..." : bookingId ? `Pay ${formatFullRupees(acceptedBooking?.amount ?? amount)} Securely` : "Send booking request"}
          </button>
          {paymentError ? <p role="alert" className="mt-5 border-2 border-[#e08c4c] bg-[#ffeedd] p-3 text-xs font-black text-[#a95820]">Payment notice: {paymentError}</p> : null}
          <div className="mt-3 flex items-center justify-center gap-2 text-center text-[10px] font-bold text-[#171b30]/55"><Lock size={12} /> Razorpay test mode · No real money is charged.</div>
          <p className="mx-auto mt-2 max-w-xl text-center text-xs font-semibold leading-5 text-[#171b30]/45">Order amount is calculated by PPlusOne and the payment signature is verified before your booking is created.</p>
        </div>
        </div>
      </section>

      <style>{`.field-control{display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box;background:transparent;font-size:.875rem;font-weight:800;outline:none;color:#111;overflow:hidden;text-overflow:ellipsis}.field-control option{max-width:calc(100vw - 4rem);overflow:hidden;text-overflow:ellipsis}@media(max-width:639px){.field-control{inline-size:100%;max-inline-size:100%;overflow:visible;text-overflow:clip}select.field-control{-webkit-appearance:none;appearance:none;padding-inline-end:1.25rem;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23111' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .1rem center;background-size:.7rem}input.field-control[type="date"]{-webkit-appearance:none;appearance:none;min-inline-size:0}input.field-control[type="date"]::-webkit-date-and-time-value{text-align:left;margin:0}input.field-control[type="date"]::-webkit-calendar-picker-indicator{margin-inline-start:auto;padding:0}}`}</style>
    </UserAppLayout>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block min-w-0 max-w-full overflow-hidden border-2 border-[#171b30] bg-[#fffaf3] p-3">
      <span className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#e08c4c]">{Icon ? <Icon size={12} /> : null}{label}</span>
      {children}
    </label>
  );
}

function formatFullRupees(value) {
  return `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
}

function parseHourlyRate(value) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/,/g, "");
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(k)?/);
  if (!match) return 0;
  return Math.round(Number(match[1]) * (match[2] ? 1000 : 1));
}

function dateValue(addDays) {
  const date = new Date();
  date.setDate(date.getDate() + addDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getProviderActivities(provider) {
  const activities = Array.isArray(provider?.activities)
    ? provider.activities
    : String(provider?.activities || "")
        .split(",")
        .map((item) => item.trim());

  const cleaned = activities.filter(Boolean);
  return cleaned.length ? cleaned : ["Coffee & Conversation"];
}

function hasInvalidBookingParams(params, provider) {
  const duration = params.get("duration");
  const date = params.get("date");
  const time = params.get("time");
  const service = params.get("service");
  const allowedActivities = getProviderActivities(provider);

  if (duration && !["1", "2", "3", "4", "5", "6"].includes(duration)) return true;
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return true;
  if (service && !allowedActivities.includes(service)) return true;
  if (date) {
    const selected = new Date(`${date}T00:00:00`);
    const min = new Date(`${dateValue(0)}T00:00:00`);
    const max = new Date(`${dateValue(10)}T00:00:00`);
    if (Number.isNaN(selected.getTime()) || selected < min || selected > max) return true;
  }
  return false;
}

function readUser() {
  try { return JSON.parse(localStorage.getItem("PPlusOne_auth_user") || "null"); } catch { return null; }
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
