import { useEffect, useState } from "react";
import { CalendarCheck, Flag, MessageCircle, Star, X } from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import { getCachedMyReviews, reportReview, listMyReviews } from "../../api/reports";

export default function ProviderReviews() {
  const [reviews, setReviews] = useState(() => getCachedMyReviews());
  useEffect(() => { listMyReviews().then(setReviews).catch(() => setReviews([])); }, []);
  const received = reviews.filter((review) => review.targetRole === "PROVIDER");
  const given = reviews.filter((review) => review.reviewerRole === "PROVIDER");

  return (
    <AppShell type="provider">
      <section className="min-h-0 bg-[#fff7ed] text-black">
        <div className="mb-5 rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-5">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#e08c4c]">Provider reviews</p>
          <h1 className="mt-1 text-3xl font-black">Feedback after meetups</h1>
          <p className="mt-1 text-sm font-semibold text-[#6b5d52]">User feedback and reviews you write are kept here.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ReviewColumn title="Reviews about you" reviews={received} empty="User reviews about your completed meetings will appear here." canReport />
          <ReviewColumn title="Reviews you wrote" reviews={given} empty="Your user reviews will appear after you submit them from bookings." />
        </div>
      </section>
    </AppShell>
  );
}

function ReviewColumn({ title, reviews, empty, canReport = false }) {
  return (
    <section className="rounded-2xl border border-[#eddac7] bg-white p-5">
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-4 grid gap-3">
        {reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} canReport={canReport} />) : (
          <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-[#d9bfaa] bg-[#fffaf3] p-6 text-center">
            <div>
              <MessageCircle className="mx-auto text-[#e08c4c]" size={34} />
              <p className="mt-3 text-sm font-black">{empty}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review, canReport = false }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);
  const date = new Date(review.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const submitReport = async (event) => {
    event.preventDefault();
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    await reportReview(review, reason.trim()).then(() => {
      setReported(true);
      setReportOpen(false);
      setReason("");
    }).catch(() => {});
    setSubmitting(false);
  };

  return (
    <article className="rounded-2xl bg-[#fffaf3] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black">{(canReport ? review.reviewerName : review.targetName) || "BuddyBOOK member"}</p>
          <p className="mt-1 flex items-center gap-1 text-[10px] font-black text-[#8b7563]"><CalendarCheck size={12} /> {date}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-black text-[#fffaf3]">
          <Star size={13} fill="currentColor" /> {review.rating}/5
        </span>
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-[#5d4a3c]">{review.description}</p>
      {canReport ? (
        <button type="button" onClick={() => setReportOpen(true)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black text-[#d84e58]">
          <Flag size={13} /> {reported ? "Reported" : "Report"}
        </button>
      ) : null}
      {reportOpen ? (
        <ReportDialog
          reason={reason}
          submitting={submitting}
          onReasonChange={setReason}
          onClose={() => setReportOpen(false)}
          onSubmit={submitReport}
        />
      ) : null}
    </article>
  );
}

function ReportDialog({ reason, submitting, onReasonChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-[#f0b8a8] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#d84e58]">Report review</p>
            <h3 className="mt-1 text-xl font-black">Why do you want to report this?</h3>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[#fffaf3] text-black">
            <X size={16} />
          </button>
        </div>
        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Write the reason..."
          className="mt-4 min-h-32 w-full resize-none rounded-2xl border border-[#eddac7] bg-[#fffaf3] px-4 py-3 text-sm font-bold outline-none focus:border-[#d84e58]"
        />
        <button type="submit" disabled={!reason.trim() || submitting} className="mt-4 w-full rounded-2xl bg-[#d84e58] px-5 py-3 text-sm font-black text-white disabled:opacity-45">
          {submitting ? "Submitting..." : "Submit report"}
        </button>
      </form>
    </div>
  );
}
