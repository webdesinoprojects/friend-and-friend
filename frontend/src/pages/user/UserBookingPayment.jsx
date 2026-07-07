import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  IndianRupee,
  Lock,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import api from "../../api/api";
import { getCachedProvider, getProvider } from "../../api/providers";
import { createPaidBooking } from "../../utils/userFlowStorage";

const paymentMethods = [
  ["UPI", Smartphone, "Google Pay, PhonePe or any UPI app"],
  ["Card", CreditCard, "Credit or debit card"],
  ["Wallet", Wallet, "BuddyBOOK wallet balance"],
];

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
  const [service, setService] = useState(() => bookingParams.get("service") || "");
  const [date, setDate] = useState(() => bookingParams.get("date") || dateValue(1));
  const [time, setTime] = useState(() => bookingParams.get("time") || "17:30");
  const [duration, setDuration] = useState(() => bookingParams.get("duration") || "1");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  useEffect(() => {
    let mounted = true;
    if (cachedProvider) {
      setProvider(cachedProvider);
      setService((current) => current || getProviderActivities(cachedProvider)[0]);
      setLoading(false);
    }

    api.get("/auth/me", { timeout: 2500 }).then(({ data }) => {
      const nextUser = data?.user || data?.data?.user || data?.data;
      if (mounted && (nextUser?.id || nextUser?._id)) setUser(nextUser);
    }).catch(() => {});

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

  const amount = useMemo(
    () => Number(provider?.price || 0) * Number(duration || 1),
    [duration, provider]
  );

  const handlePayment = async () => {
    if (!provider || !service || !date || !time) return;
    setProcessing(true);

    // Replace this short delay with Razorpay verification when live payments are enabled.
    await new Promise((resolve) => setTimeout(resolve, 650));
    const { booking } = createPaidBooking({
      provider,
      service,
      date,
      time,
      duration,
      paymentMethod,
    });

    api.post("/bookings", {
      ...booking,
      userId: user?.id,
      userName: user?.fullName || "User",
    }).catch(() => {});

    navigate("/app/user/dashboard", {
      replace: true,
      state: { paymentSuccess: true },
    });
  };

  if (loading) {
    return (
      <UserAppLayout title="Secure Checkout" user={user}>
        <div className="h-full animate-pulse rounded-[2rem] bg-[#ffeedd]" />
      </UserAppLayout>
    );
  }

  if (!provider) {
    return (
      <UserAppLayout title="Booking Not Found" user={user}>
        <div className="grid h-full place-items-center rounded-[2rem] bg-[#fffaf3] text-xl font-black">
          Provider not found.
        </div>
      </UserAppLayout>
    );
  }

  return (
    <UserAppLayout title="Secure Checkout" user={user}>
      <section className="custom-scrollbar grid h-full gap-4 overflow-y-auto rounded-[1.5rem] bg-[#fffaf3] p-3 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[1.5rem] border border-[#f1dccb] bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-black">Booking Summary</h1>
          <div className="mt-5 flex items-center gap-4 rounded-[1.25rem] bg-[#ffeedd] p-4">
            <img src={provider.image} alt={provider.name} className="h-20 w-20 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="truncate text-lg font-black">{provider.name}</p>
              <p className="text-sm font-bold text-slate-600">{provider.profession}</p>
              <p className="mt-1 flex items-center text-sm font-black text-[#e08c4c]"><IndianRupee size={14} />{provider.price}/hr</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Activity">
              <select value={service} onChange={(event) => setService(event.target.value)} className="field-control">
                {[...new Set([service, ...getProviderActivities(provider)].filter(Boolean))].map((activity) => <option key={activity}>{activity}</option>)}
              </select>
            </Field>
            <Field label="Duration">
              <select value={duration} onChange={(event) => setDuration(event.target.value)} className="field-control">
                {[1, 2, 3, 4, 5, 6].map((hours) => <option key={hours} value={hours}>{hours} Hour{hours > 1 ? "s" : ""}</option>)}
              </select>
            </Field>
            <Field label="Meetup date" icon={CalendarDays}>
              <input type="date" min={dateValue(0)} max={dateValue(30)} value={date} onChange={(event) => setDate(event.target.value)} className="field-control" />
            </Field>
            <Field label="Start time" icon={Clock3}>
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="field-control" />
            </Field>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-black/10 bg-[#fffaf3] p-4">
            <div className="flex justify-between text-sm font-bold text-slate-600"><span>Hourly rate</span><span>₹{provider.price}</span></div>
            <div className="mt-2 flex justify-between text-sm font-bold text-slate-600"><span>Duration</span><span>{duration} hour(s)</span></div>
            <div className="mt-3 flex justify-between border-t border-[#e6ecff] pt-3 text-lg font-black"><span>Total</span><span>₹{amount}</span></div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[#f1dccb] bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">Choose Payment Method</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">Your booking is created after successful payment.</p>

          <div className="mt-5 grid gap-3">
            {paymentMethods.map(([name, Icon, description]) => (
              <button
                key={name}
                type="button"
                onClick={() => setPaymentMethod(name)}
                className={`flex items-center gap-4 rounded-lg border p-4 text-left transition ${
                  paymentMethod === name
                    ? "border-black bg-[#ffeedd]"
                    : "border-black/10 hover:bg-[#fffaf3]"
                }`} 
              >
                <span className={`grid h-11 w-11 place-items-center rounded-md ${paymentMethod === name ? "bg-black text-[#fffaf3]" : "bg-[#ffeedd] text-black"}`}>
                  <Icon size={19} />
                </span>
                <span className="flex-1"><span className="block text-sm font-black">{name}</span><span className="mt-1 block text-xs font-bold text-slate-500">{description}</span></span>
                {paymentMethod === name ? <Check size={18} className="text-[#e08c4c]" /> : null}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-[1.25rem] bg-[#ffeedd] p-4">
            <ShieldCheck size={21} className="text-[#e08c4c]" />
            <div><p className="text-sm font-black">Protected BuddyBOOK payment</p><p className="mt-1 text-xs font-bold leading-5 text-slate-600">Payment and booking records stay available in your dashboard, Bookings and Payments pages.</p></div>
          </div>

          <button
            type="button"
            disabled={processing}
            onClick={handlePayment}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-4 text-sm font-black text-[#fffaf3] shadow-[0_12px_28px_rgba(0,0,0,0.18)] disabled:opacity-60"
          >
            <Lock size={17} /> {processing ? "Processing..." : `Pay ₹${amount} Securely`}
          </button>
        </div>
      </section>

      <style>{`.field-control{width:100%;background:transparent;font-size:.875rem;font-weight:800;outline:none;color:#111}`}</style>
    </UserAppLayout>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="rounded-[1rem] border border-black/10 bg-[#fffaf3] p-3">
      <span className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{Icon ? <Icon size={12} /> : null}{label}</span>
      {children}
    </label>
  );
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

function readUser() {
  try { return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null"); } catch { return null; }
}







