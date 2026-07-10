import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Search,
  Star,
  XCircle,
} from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import { cancelBookingApi, completeBookingApi, listBookings } from "../../api/bookings";
import {
  addReview,
  cancelBooking,
  getBookings,
  getReviewForBooking,
  subscribeToUserData,
  updateBooking,
} from "../../utils/userFlowStorage";

const statusStyles = {
  CONFIRMED: "bg-[#ffeedd] text-black",
  PAID: "bg-[#ffeedd] text-black",
  ACCEPTED: "bg-[#fffaf3] text-black",
  PENDING: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-[#111111] text-[#fffaf3]",
  CANCELLED: "bg-rose-50 text-rose-700",
  REJECTED: "bg-rose-50 text-rose-700",
};

function getBookingGroup(booking) {
  const status = String(booking.status || "PENDING").toUpperCase();
  if (["CONFIRMED", "PAID", "ACCEPTED", "UPCOMING"].includes(status)) {
    return "UPCOMING";
  }
  if (["CANCELLED", "REJECTED"].includes(status)) return "CANCELLED";
  return status;
}

export default function UserBookings() {
  const [bookings, setBookings] = useState(() => getBookings());
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      listBookings()
        .then((rows) => mounted && setBookings(rows))
        .catch(() => mounted && setBookings(getBookings()));
    };
    refresh();
    const unsubscribe = subscribeToUserData(refresh);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const markCompleted = async (booking) => {
    const completedAt = new Date().toISOString();
    setBookings((rows) => rows.map((item) => item.id === booking.id ? { ...item, status: "COMPLETED", completedAt } : item));
    updateBooking(booking.id, { status: "COMPLETED", completedAt });
    try {
      const saved = await completeBookingApi(booking.id);
      setBookings((rows) => rows.map((item) => item.id === booking.id ? { ...item, ...saved, status: "COMPLETED", completedAt } : item));
    } catch {
      setBookings(getBookings());
    }
  };

  const cancelSelectedBooking = async (reason) => {
    const target = cancelTarget;
    if (!target) return;
    cancelBooking(target.id, reason);
    setBookings((rows) => rows.map((item) => item.id === target.id ? { ...item, status: "CANCELLED", cancelReason: reason, cancelledAt: new Date().toISOString() } : item));
    setCancelTarget(null);
    try {
      const saved = await cancelBookingApi(target.id, reason);
      setBookings((rows) => rows.map((item) => item.id === target.id ? { ...item, ...saved } : item));
    } catch {
      setBookings(getBookings());
    }
  };

  const counts = useMemo(
    () => ({
      ALL: bookings.length,
      UPCOMING: bookings.filter((item) => getBookingGroup(item) === "UPCOMING").length,
      PENDING: bookings.filter((item) => getBookingGroup(item) === "PENDING").length,
      COMPLETED: bookings.filter((item) => getBookingGroup(item) === "COMPLETED").length,
      CANCELLED: bookings.filter((item) => getBookingGroup(item) === "CANCELLED").length,
    }),
    [bookings]
  );

  const visibleBookings = bookings;

  return (
    <UserAppLayout title="Bookings">
      <section className="flex min-h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-[1.5rem] border border-[#eddac7] bg-[#fffaf3] shadow-sm">
        <header className="border-b border-[#eddac7] bg-white p-5 lg:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#e08c4c]">
                Booking management
              </p>
              <h2 className="mt-1 text-2xl font-black text-black lg:text-3xl">
                Your meetups
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Track upcoming, pending, and completed bookings in one place.
              </p>
            </div>

            <Link
              to="/app/user/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3] shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
            >
              <Search size={17} />
              Find a buddy
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={CalendarCheck} label="Total" value={counts.ALL} tone="indigo" />
            <Stat icon={Clock3} label="Upcoming" value={counts.UPCOMING} tone="blue" />
            <Stat icon={CheckCircle2} label="Completed" value={counts.COMPLETED} tone="green" />
            <Stat icon={XCircle} label="Pending" value={counts.PENDING} tone="amber" />
          </div>

        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-7">
          {visibleBookings.length === 0 ? (
            <div className="grid min-h-[18rem] place-items-center rounded-2xl border border-dashed border-[#d9bfaa] bg-white p-8 text-center">
              <div>
                <CalendarCheck className="mx-auto text-[#e08c4c]" size={42} />
                <p className="mt-4 text-xl font-black text-black">
                  No bookings
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Book a verified provider and it will appear here automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleBookings.map((booking) => {
                const status = String(booking.status || "PENDING").toUpperCase();
                const canShareLocation = ["CONFIRMED", "PAID", "ACCEPTED"].includes(status);
                const completed = status === "COMPLETED";
                const userReview = getReviewForBooking(booking.id, "USER");

                return (
                  <article
                    key={booking.id}
                    className="rounded-2xl border border-[#eddac7] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {booking.providerImage ? (
                          <img
                            src={booking.providerImage}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#ffeedd] text-xl font-black text-black">
                            {(booking.providerName || "B").charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black text-black">
                            {booking.service || "Buddy meetup"}
                          </h3>
                          <p className="truncate text-sm font-bold text-slate-500">
                            with {booking.providerName || "BuddyBOOK provider"}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black ${statusStyles[status] || statusStyles.PENDING}`}>
                        {status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[#fffaf3] p-4 text-sm">
                      <Detail label="Date" value={booking.date || "To be confirmed"} />
                      <Detail label="Time" value={booking.time || "To be confirmed"} />
                      <Detail label="Duration" value={booking.duration || "1 hour"} />
                      <Detail label="Amount" value={`₹${Number(booking.amount || 0).toLocaleString("en-IN")}`} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-xs font-black text-slate-500">
                        <CreditCard size={15} />
                        Payment: {booking.paymentStatus || (status === "PAID" ? "PAID" : "PENDING")}
                      </span>
                      {canShareLocation && (
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/app/user/active-meet/${booking.id}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-black text-[#fffaf3]"
                          >
                            <MapPin size={15} />
                            Meetup location
                          </Link>
                          <button
                            type="button"
                            onClick={() => markCompleted(booking)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#ffeedd] px-4 py-2.5 text-xs font-black text-black"
                          >
                            <CheckCircle2 size={15} />
                            Mark completed
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelTarget(booking)}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700"
                          >
                            Cancel booking
                          </button>
                        </div>
                      )}
                    </div>

                    {completed ? (
                      userReview ? (
                        <div className="mt-4 rounded-2xl bg-[#fffaf3] p-4">
                          <p className="text-xs font-black text-[#e08c4c]">Review submitted</p>
                          <p className="mt-1 text-sm font-bold text-[#5d4a3c]">{userReview.description}</p>
                        </div>
                      ) : (
                        <ReviewForm booking={booking} onSubmitted={() => setBookings(getBookings())} />
                      )
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
      {cancelTarget ? (
        <CancelBookingDialog
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={cancelSelectedBooking}
        />
      ) : null}
    </UserAppLayout>
  );
}

function CancelBookingDialog({ booking, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/45 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-2xl font-black text-black">Cancel booking</h2>
        <p className="mt-3 rounded-2xl bg-[#fffaf3] p-4 text-sm font-bold leading-6 text-[#6b5d52]">
          If you cancel within 6 hours of the meeting time, 10% cancellation charges may be deducted. Your chat with the provider will be closed after cancellation.
        </p>
        <label className="mt-4 block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#8b7563]">Reason</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Tell the provider why you are cancelling..."
            className="mt-2 min-h-[120px] w-full rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4 text-sm font-bold outline-none focus:border-black"
          />
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-black">
            Keep booking
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            Confirm cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ booking, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState("");

  const submit = () => {
    if (!description.trim()) return;
    addReview({
      bookingId: booking.id,
      reviewerRole: "USER",
      targetRole: "PROVIDER",
      targetName: booking.providerName || "BuddyBOOK provider",
      targetImage: booking.providerImage,
      rating,
      description,
      service: booking.service || booking.activity,
    });
    onSubmitted();
  };

  return (
    <div className="mt-4 rounded-2xl bg-[#fffaf3] p-4">
      <p className="text-sm font-black text-black">Review your provider</p>
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
        placeholder="Write a short, respectful note about the meetup."
        className="mt-3 min-h-[92px] w-full rounded-xl border border-[#eddac7] bg-white p-3 text-sm font-bold outline-none focus:border-black"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!description.trim()}
        className="mt-3 rounded-xl bg-black px-4 py-2.5 text-xs font-black text-[#fffaf3] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Submit review
      </button>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    indigo: "bg-[#ffeedd] text-black",
    blue: "bg-[#fffaf3] text-black",
    green: "bg-[#ffeedd] text-black",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
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


