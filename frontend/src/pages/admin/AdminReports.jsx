import { useEffect, useState } from "react";
import { Flag, ShieldAlert } from "lucide-react";
import AdminShell from "../../components/layout/AdminShell";
import { deleteAdminReport, listAdminReports, updateAdminReport } from "../../api/reports";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    listAdminReports()
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const act = async (report, adminAction, status = "RESOLVED") => {
    const updated = await updateAdminReport(report.id, { adminAction, status });
    setReports((rows) => rows.map((item) => item.id === report.id ? updated : item));
  };

  const deleteReport = async (report) => {
    await deleteAdminReport(report.id);
    setReports((rows) => rows.filter((item) => item.id !== report.id));
  };

  return (
    <AdminShell title="Reports" text="Review reported feedback and take moderation action.">
      <section className="rounded-2xl border border-[#e8e4dc] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#e08c4c]">Moderation</p>
            <h2 className="mt-1 text-2xl font-black">Meeting reports</h2>
          </div>
          <Flag className="text-[#e08c4c]" />
        </div>

        <div className="mt-5 grid gap-4">
          {loading ? (
            <div className="h-28 animate-pulse rounded-2xl bg-[#fff7ed]" />
          ) : reports.length ? reports.map((report) => (
            <article key={report.id} className="rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-[#d84e58]" />
                    <p className="text-sm font-black">{formatReportReason(report.reason)}</p>
                  </div>
                  <p className="mt-2 text-xs font-bold text-[#6b5d52]">
                    Reported by {report.reporterName || "member"} ({report.reporterRole}) about {report.reportedName || "member"} ({report.targetRole})
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${report.status === "OPEN" ? "bg-rose-50 text-rose-700" : "bg-[#e8f6ef] text-[#16815f]"}`}>
                  {report.status}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#e08c4c]">Incident details</p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6 text-[#5d4a3c]">{report.reviewText || "No details included."}</p>
                <div className="mt-3 grid gap-2 text-xs font-bold text-[#6b5d52] sm:grid-cols-2">
                  <p>Booking: {report.bookingId || "Not linked"}</p>
                  <p>Meeting ID: {report.reviewSnapshot?.meetingCode || report.bookingId || "Not linked"}</p>
                  <p>Reporter ID: {report.reporterId}</p>
                  <p>Reported User ID: {report.reportedUserId || "Unknown"}</p>
                  <p>Reporter: {report.reporterName} ({report.reporterRole})</p>
                  <p>Reported: {report.reportedName} ({report.targetRole})</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => act(report, "BLOCK_REPORTED_ACCOUNT")} className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white">
                  Block reported account
                </button>
                <button type="button" onClick={() => act(report, "NO_ACTION", "CLOSED")} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-black text-black">
                  Close
                </button>
                <button type="button" onClick={() => deleteReport(report)} className="rounded-xl bg-[#d84e58] px-4 py-2.5 text-xs font-black text-white">
                  Delete report permanently
                </button>
              </div>

              {report.adminAction ? (
                <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-black text-[#16815f]">
                  Admin action: {report.adminAction}
                </p>
              ) : null}
            </article>
          )) : (
            <div className="grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-[#d9bfaa] bg-[#fff7ed] text-center">
              <div>
                <Flag className="mx-auto text-[#e08c4c]" size={34} />
                <p className="mt-3 text-sm font-black">No reports yet</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function formatReportReason(value) {
  return String(value || "Safety report")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w|\s\w/g, (letter) => letter.toUpperCase());
}
