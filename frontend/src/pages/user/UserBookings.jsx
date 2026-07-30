import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  ChevronDown,
  CreditCard,
  Copy,
  Flag,
  KeyRound,
  MessageCircle,
  Search,
  Star,
  XCircle,
} from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import { formatRupees } from "../../utils/format";
import { cancelBookingApi, getCachedBookings, listBookings } from "../../api/bookings";
import { createReview, getCachedMyReviews, listMyReviews } from "../../api/reports";
import { notify } from "../../components/common/Feedback";
import MeetingReportDialog from "../../components/common/MeetingReportDialog";

const statusStyles = {
  CONFIRMED: "bg-[#ffeedd] text-black",
  PAID: "bg-[#ffeedd] text-black",
  ACCEPTED: "bg-[#fffaf3] text-black",
  ACTIVE: "bg-emerald-100 text-emerald-800",
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
  const cachedBookings = getCachedBookings({ pageSize: 100 });
  const [bookings, setBookings] = useState(cachedBookings);
  const [reviews, setReviews] = useState(() => getCachedMyReviews());
  const [loadingBookings, setLoadingBookings] = useState(!cachedBookings.length);
  const [loadError, setLoadError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [openReviewId, setOpenReviewId] = useState("");

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      setLoadError("");
      Promise.all([listBookings({ pageSize: 100 }), listMyReviews()])
        .then(([rows, reviewRows]) => {
          if (!mounted) return;
          setBookings(rows);
          setReviews(reviewRows);
        })
        .catch(() => mounted && setLoadError("Bookings could not be loaded."))
        .finally(() => mounted && setLoadingBookings(false));
    };
    refresh();
    return () => {
      mounted = false;
    };
  }, []);

  const cancelSelectedBooking = async ({ category, description }) => {
    const target = cancelTarget;
    if (!target) return;
    try {
      const saved = await cancelBookingApi(target.id, description, category);
      setBookings((rows) => rows.map((item) => item.id === target.id ? { ...item, ...saved } : item));
      setCancelTarget(null);
      notify("Booking cancelled. The 20% fee was deducted and the remaining amount is being refunded.", "success");
    } catch (error) {
      notify(error?.response?.data?.message || "Could not cancel this booking.", "error");
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
          {loadingBookings ? (
            <div className="grid gap-4 xl:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-[#eddac7] bg-white" />)}</div>
          ) : loadError ? (
            <div className="grid min-h-[18rem] place-items-center rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center"><div><p className="text-xl font-black">Bookings unavailable</p><p className="mt-2 text-sm font-semibold text-slate-500">{loadError}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-full bg-black px-5 py-2.5 text-sm font-black text-white">Try again</button></div></div>
          ) : visibleBookings.length === 0 ? (
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleBookings.map((booking) => {
                const status = String(booking.status || "PENDING").toUpperCase();
                const canManage = ["CONFIRMED", "PAID", "ACCEPTED", "ACTIVE"].includes(status);
                const canChat = String(booking.paymentStatus || "").toUpperCase() === "PAID";
                const completed = status === "COMPLETED";
                const userReview = reviews.find((review) => review.bookingId === booking.id && review.reviewerRole === "USER");

                return (
                  <article
                    key={booking.id}
                    className="min-w-0 self-start rounded-2xl border border-[#eddac7] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {booking.providerImage ? (
                          <img
                            src={booking.providerImage}
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffeedd] text-lg font-black text-black">
                            {(booking.providerName || "B").charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-black">
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

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#fffaf3] p-3 text-xs">
                      <Detail label="Date" value={booking.date || "To be confirmed"} />
                      <Detail label="Time" value={booking.time || "To be confirmed"} />
                      <Detail label="Duration" value={booking.duration || "1 hour"} />
                      <Detail label="Amount" value={formatRupees(Number(booking.amount || 0))} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-xs font-black text-slate-500">
                        <CreditCard size={15} />
                        Payment: {booking.paymentStatus || (status === "PAID" ? "PAID" : "PENDING")}
                      </span>
                      {canManage && (
                        <div className="flex flex-wrap gap-2">
                          {canChat ? <Link to={`/app/user/chat?booking=${booking.id}`} className="inline-flex items-center gap-2 rounded-xl bg-[#fff0df] px-3 py-2 text-xs font-black text-[#a65d28]"><MessageCircle size={15}/>Chat</Link> : null}
                          {status === "ACTIVE" ? <Link to={`/app/user/active-meet/${booking.id}`} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-black text-[#fffaf3]">Open active meeting</Link> : null}
                          {status !== "ACTIVE" ? <button
                            type="button"
                            onClick={() => setCancelTarget(booking)}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700"
                          >
                            Cancel booking
                          </button> : null}
                        </div>
                      )}
                      {status === "ACCEPTED" && booking.paymentStatus === "PENDING" ? <Link to={`/app/user/provider/${booking.providerId}/book?bookingId=${booking.id}&service=${encodeURIComponent(booking.service || "")}&date=${booking.date}&time=${booking.time}&duration=${booking.durationHours || 1}`} className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-xs font-black text-white">Complete payment</Link> : null}
                    </div>

                    {status === "CONFIRMED" && booking.startPin ? (
                      <div className="mt-4 overflow-hidden rounded-xl border border-[#e08c4c] bg-[#fff5e9]">
                        <div className="flex items-center gap-3 px-3 py-2.5"><KeyRound size={15} className="shrink-0 animate-pulse text-[#bc6e36]"/><p className="min-w-0 flex-1 truncate text-[11px] font-black uppercase tracking-[.1em] text-[#bc6e36]">Private PIN · share in person · expires {formatPinExpiry(booking.startPinExpiresAt)}</p><span className="animate-pulse font-mono text-lg font-black tracking-[.22em] text-[#171b30]">{booking.startPin}</span><button type="button" onClick={()=>navigator.clipboard?.writeText(booking.startPin).then(()=>notify("PIN copied.","success"))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm" aria-label="Copy meeting PIN"><Copy size={14}/></button></div>
                      </div>
                    ) : null}

                    {status === "ACTIVE" ? <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><span className="font-black">Meeting timer is running.</span> Open the active meeting panel to enter the provider's end code, finish, or extend.</div> : null}
                    {status === "CANCELLED" ? <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-800"><span className="font-black">Cancellation note: {booking.cancelCategory || "Other"}</span><p className="mt-1">{booking.cancelReason}</p>{booking.refundAmount != null ? <p className="mt-2 text-xs">20% fee: {formatRupees(booking.cancellationFee)} · Refund: {formatRupees(booking.refundAmount)}</p> : null}</div> : null}

                    {completed ? (
                      <><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setReportTarget(booking)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"><Flag size={15}/>Report</button><button type="button" onClick={() => setOpenReviewId((current) => current === booking.id ? "" : booking.id)} className="inline-flex flex-1 items-center justify-between gap-2 rounded-xl bg-[#fffaf3] px-3 py-2 text-xs font-black">Review <ChevronDown size={15} className={`transition ${openReviewId === booking.id ? "rotate-180" : ""}`}/></button></div>{openReviewId === booking.id ? (userReview ? (
                        <div className="mt-3 rounded-2xl bg-[#fffaf3] p-3">
                          <p className="text-xs font-black text-[#e08c4c]">Review submitted</p>
                          <p className="mt-1 text-sm font-bold text-[#5d4a3c]">{userReview.description}</p>
                        </div>
                      ) : (
                        <ReviewForm booking={booking} onSubmitted={(review) => setReviews((rows) => [review, ...rows])} />
                      )) : null}</>
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
      {reportTarget ? <MeetingReportDialog booking={reportTarget} onClose={() => setReportTarget(null)} /> : null}
    </UserAppLayout>
  );
}

function CancelBookingDialog({ onClose, onConfirm }) {
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const options = ["Schedule changed", "Personal emergency", "Provider concern", "Travel or location issue", "Booked by mistake", "Other"];

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/45 p-4" onClick={onClose}>
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-2xl font-black text-black">Cancel booking</h2>
        <p className="mt-3 rounded-2xl bg-[#fffaf3] p-4 text-sm font-bold leading-6 text-[#6b5d52]">
          Cancellation is allowed only until 2 hours before the meeting. A 20% cancellation fee will be deducted and the remaining 80% refunded. The chat will remain visible but messaging will stop permanently.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{options.map((option) => <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#eddac7] p-3 text-sm font-bold"><input type="radio" name="cancel-category" checked={category === option} onChange={() => setCategory(option)}/>{option}</label>)}</div>
        <label className="mt-4 block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#8b7563]">Reason</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Tell the provider why you are cancelling..."
            className="mt-2 min-h-[120px] w-full rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4 text-sm font-bold outline-none focus:border-black"
          />
        </label>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-black">
            Keep booking
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ category, description: reason.trim() })}
            disabled={!category || !reason.trim()}
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
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    try {
      const saved = await createReview({ bookingId: booking.id, rating, description: description.trim() });
      onSubmitted(saved);
    } catch (error) {
      notify(error?.response?.data?.message || "Could not submit review.", "error");
    } finally {
      setSubmitting(false);
    }
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
        disabled={!description.trim() || submitting}
        className="mt-3 rounded-xl bg-black px-4 py-2.5 text-xs font-black text-[#fffaf3] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit review"}
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

function formatPinExpiry(value) {
  if (!value) return "14 days after payment";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
