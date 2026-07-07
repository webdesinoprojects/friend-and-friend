import { CalendarCheck, MessageCircle, Star } from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import { getReceivedReviews, getReviews } from "../../utils/userFlowStorage";

export default function ProviderReviews() {
  const received = getReceivedReviews("PROVIDER");
  const given = getReviews().filter((review) => review.reviewerRole === "PROVIDER");

  return (
    <AppShell type="provider">
      <section className="min-h-0 bg-[#fff7ed] text-black">
        <div className="mb-5 rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-5">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#e08c4c]">Provider reviews</p>
          <h1 className="mt-1 text-3xl font-black">Feedback after meetups</h1>
          <p className="mt-1 text-sm font-semibold text-[#6b5d52]">User feedback and reviews you write are kept here.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ReviewColumn title="Reviews about you" reviews={received} empty="User reviews about your completed meetings will appear here." />
          <ReviewColumn title="Reviews you wrote" reviews={given} empty="Your user reviews will appear after you submit them from bookings." />
        </div>
      </section>
    </AppShell>
  );
}

function ReviewColumn({ title, reviews, empty }) {
  return (
    <section className="rounded-2xl border border-[#eddac7] bg-white p-5">
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-4 grid gap-3">
        {reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} />) : (
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

function ReviewCard({ review }) {
  const date = new Date(review.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <article className="rounded-2xl bg-[#fffaf3] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black">{review.targetName || review.reviewerName || "BuddyBOOK member"}</p>
          <p className="mt-1 flex items-center gap-1 text-[10px] font-black text-[#8b7563]"><CalendarCheck size={12} /> {date}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-black text-[#fffaf3]">
          <Star size={13} fill="currentColor" /> {review.rating}/5
        </span>
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-[#5d4a3c]">{review.description}</p>
    </article>
  );
}
