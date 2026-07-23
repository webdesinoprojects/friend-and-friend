import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import UserAppLayout from "../../components/users/UserAppLayout";
import { getMyReportSummary } from "../../api/reports";

export default function MyReports({ type }) {
  const [data, setData] = useState({ received: 0, limit: 10, submitted: [] });
  useEffect(() => {
    let mounted = true;
    const load = () => getMyReportSummary().then((value) => mounted && setData(value)).catch(() => {});
    load();
    return () => { mounted = false; };
  }, []);
  const content = <section className="rounded-3xl border border-[#eddac7] bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.15em] text-[#e08c4c]">Safety record</p><h2 className="mt-1 text-2xl font-black">Reports</h2></div><div className="rounded-2xl bg-rose-50 px-5 py-3 text-center"><p className="text-2xl font-black text-rose-700">{data.received}</p><p className="text-xs font-black text-rose-600">of {data.limit} received</p></div></div>
    <div className="mt-5 h-2 overflow-hidden rounded-full bg-rose-100"><div className="h-full bg-rose-600 transition-all" style={{ width: `${Math.min(100, (data.received / data.limit) * 100)}%` }}/></div>
    <p className="mt-3 text-sm font-semibold text-slate-500">Accounts are permanently banned at 10 meeting reports.</p>
    <h3 className="mt-7 text-lg font-black">Reports you submitted</h3>
    <div className="mt-3 grid gap-3">{data.submitted.length ? data.submitted.map((report) => <article key={report.id} className="rounded-2xl border border-black/10 bg-[#fffaf3] p-4"><div className="flex justify-between gap-3"><p className="font-black">{String(report.reason).replaceAll("_", " ")}</p><span className="text-xs font-black text-rose-700">{report.status}</span></div><p className="mt-2 text-sm font-semibold text-slate-600">{report.reviewText}</p><p className="mt-2 text-xs font-bold text-slate-400">Meeting {report.bookingId} · Reported {report.reportedName}</p></article>) : <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-black/10 bg-[#fffaf3] text-center"><div><ShieldAlert className="mx-auto text-[#e08c4c]"/><p className="mt-2 text-sm font-black">No reports submitted</p></div></div>}</div>
  </section>;
  return type === "provider" ? <AppShell type="provider">{content}</AppShell> : <UserAppLayout title="Reports">{content}</UserAppLayout>;
}
