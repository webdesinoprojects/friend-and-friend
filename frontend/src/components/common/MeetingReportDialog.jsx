import { useState } from "react";
import { Flag, X } from "lucide-react";
import { createMeetingReport } from "../../api/reports";
import { notify } from "./Feedback";

const reasons = [
  ["ABUSE_OR_THREATS", "Abuse or threats"],
  ["SEXUAL_HARASSMENT", "Sexual harassment"],
  ["PHYSICAL_SAFETY", "Physical safety concern"],
  ["FRAUD_OR_THEFT", "Fraud or theft"],
  ["DISCRIMINATION_OR_HATE", "Discrimination or hate"],
];

export default function MeetingReportDialog({ booking, onClose, onSubmitted }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason || details.trim().length < 10 || submitting) return;
    setSubmitting(true);
    try {
      await createMeetingReport({ bookingId: booking.id, reason, details: details.trim() });
      notify("Report submitted securely to the admin team.", "success");
      onSubmitted?.();
      onClose();
    } catch (error) {
      notify(error?.response?.data?.message || "Could not submit report.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <section className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[.15em] text-rose-600">Meeting safety</p><h2 className="mt-1 text-2xl font-black">Report this person</h2></div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><X size={17}/></button>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-500">Meeting {booking.code || booking.id} · Your report goes directly to BuddyBOOK admins.</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {reasons.map(([value, label]) => <button key={value} type="button" onClick={() => setReason(value)} className={`rounded-xl border px-4 py-3 text-left text-sm font-black ${reason === value ? "border-rose-600 bg-rose-50 text-rose-700" : "border-black/10"}`}>{label}</button>)}
        </div>
        <textarea value={details} maxLength={2000} onChange={(event) => setDetails(event.target.value)} placeholder="Describe what happened in your own words…" className="mt-4 min-h-32 w-full rounded-2xl border border-black/10 bg-[#fffaf3] p-4 text-sm font-semibold outline-none focus:border-rose-500"/>
        <div className="mt-2 flex justify-between text-xs font-bold text-slate-400"><span>Minimum 10 characters</span><span>{details.length}/2000</span></div>
        <button type="button" disabled={!reason || details.trim().length < 10 || submitting} onClick={submit} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"><Flag size={16}/>{submitting ? "Submitting…" : "Submit report"}</button>
      </section>
    </div>
  );
}
