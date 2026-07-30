import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, FileText, Search, ShieldCheck, UserRound, X, XCircle } from "lucide-react";
import AdminShell from "../../components/layout/AdminShell";
import api from "../../api/api";
import { EmptyState, SkeletonRows, confirmAction, notify } from "../../components/common/Feedback";

const headers = () => ({});

export default function AdminKyc() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const load = useCallback(() => { setLoading(true); api.get("/admin/kyc", headers()).then(({ data }) => setRows(data?.data || [])).catch(() => notify("KYC records could not be loaded.", "error")).finally(() => setLoading(false)); }, []);
  useEffect(load, [load]);

  const visible = useMemo(() => rows.filter((row) => {
    const matchesFilter = filter === "ALL" || row.kycStatus === filter;
    const haystack = `${row.fullName} ${row.email} ${row.phone} ${row.role} ${row.kycVerification?.documentType} ${row.kycVerification?.documentNumber}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  }), [rows, filter, query]);

  const decide = async (status) => {
    if (status === "REJECTED" && !reason.trim()) return notify("Enter a clear rejection reason for the applicant.", "error");
    const ok = await confirmAction({ title: `${status === "VERIFIED" ? "Approve" : "Reject"} this application?`, message: `${selected.fullName} will be notified by email.`, confirmLabel: status === "VERIFIED" ? "Approve" : "Reject", danger: status === "REJECTED" });
    if (!ok) return;
    try { const { data } = await api.patch(`/admin/kyc/${selected.id}`, { status, reason }, headers()); notify(data.emailDelivered ? data.message : `${data.message} Resend: ${data.emailError || "delivery failed"}`, data.emailDelivered ? "success" : "error"); setSelected(null); setReason(""); load(); }
    catch (error) { notify(error.response?.data?.message || "Decision could not be saved.", "error"); }
  };

  return <AdminShell eyebrow="Trust operations" title="KYC Approvals" text="Review identity evidence, registration details and approval history.">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1">{["ALL", "PENDING", "VERIFIED", "REJECTED"].map(value => <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${filter === value ? "bg-black text-white" : "border border-black/10 bg-white"}`}>{value}</button>)}</div>
      <label className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 sm:max-w-sm"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, phone, email or ID" className="min-w-0 w-full bg-transparent text-sm font-bold outline-none"/></label>
    </div>
    <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">{loading ? <SkeletonRows count={7}/> : !visible.length ? <EmptyState icon={ShieldCheck} title="No matching applications" text="New registration submissions will appear here." onAction={load}/> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-black text-xs uppercase tracking-wider text-white"><tr><th className="p-5">Member</th><th>Status</th><th>Document</th><th>Submitted</th><th>History</th><th>Action</th></tr></thead><tbody>{visible.map(row => <tr key={row.id} className="border-t border-black/5 transition hover:bg-[#fffaf3]"><td className="p-5"><div className="flex items-center gap-3"><Avatar row={row}/><div><p className="font-black">{row.fullName}</p><p className="text-xs font-semibold text-black/45">{row.role} · {row.phone}</p><p className="text-xs text-black/40">{row.email || "No email"}</p></div></div></td><td><Status value={row.kycStatus}/></td><td className="text-sm font-bold">{labelDocument(row.kycVerification)}</td><td className="text-sm font-semibold">{date(row.createdAt)}</td><td className="text-sm font-bold">{row.history?.length || 0} decisions</td><td><button onClick={() => { setSelected(row); setReason(row.kycVerification?.rejectionReason || ""); }} className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-black text-white"><Eye size={15}/>Review</button></td></tr>)}</tbody></table></div>}</div>
    {selected ? <ReviewDialog item={selected} reason={reason} setReason={setReason} close={() => setSelected(null)} decide={decide}/> : null}
  </AdminShell>;
}

function ReviewDialog({ item, reason, setReason, close, decide }) {
  const profile = item.role === "PROVIDER" ? item.providerProfile : item.userProfile;
  return <div className="fixed inset-0 z-[10000] overflow-y-auto bg-black/65 p-3 sm:p-6"><div className="mx-auto my-3 max-w-6xl overflow-hidden rounded-[2rem] bg-[#fffdf9] shadow-2xl">
    <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-black/10 bg-white/95 p-4 backdrop-blur sm:items-center sm:p-5"><div className="flex min-w-0 items-center gap-3 sm:gap-4"><Avatar row={item} large/><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#df7a31] sm:text-xs">Identity application</p><h2 className="truncate text-xl font-black sm:text-3xl">{item.fullName}</h2><p className="text-xs font-bold text-black/45 sm:text-sm">{item.role} · Registered {dateTime(item.createdAt)}</p></div></div><button onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white sm:h-11 sm:w-11" aria-label="Close"><X/></button></header>
    <div className="grid gap-4 p-3 sm:gap-6 sm:p-5 lg:grid-cols-[1fr_1.15fr]">
      <div className="space-y-5">
        <Section title="Registration details" icon={UserRound}><InfoGrid values={[["Full name",item.fullName],["Email",item.email],["Mobile",item.phone],["Role",item.role],["Gender",item.gender],["Location",[item.city,item.state].filter(Boolean).join(", ")],["Mobile OTP",item.mobileVerified?"Verified":"Not verified"],["Email OTP",item.emailVerified?"Verified":"Not verified"]]}/></Section>
        <Section title="Identity document" icon={FileText}><InfoGrid values={[["Type",item.kycVerification?.documentType],["Document number",item.kycVerification?.documentNumber],["Consent",item.kycVerification?.consentAccepted?"Accepted":"Not accepted"],["Submitted",dateTime(item.kycVerification?.createdAt)]]}/><Document title="Uploaded identity proof" src={item.kycVerification?.documentUrl}/></Section>
        <Section title={`${item.role === "PROVIDER" ? "Provider" : "User"} profile`} icon={ShieldCheck}><InfoGrid values={Object.entries(profile || {}).filter(([key, value]) => !["id","userId","profileImages","profileQuestions","createdAt","updatedAt"].includes(key) && typeof value !== "object").map(([key,value]) => [humanize(key), String(value ?? "")])}/></Section>
      </div>
      <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Document title="Live selfie" src={item.referenceSelfie}/><Document title="Profile picture" src={item.profileImage}/></div>
        {Array.isArray(profile?.profileImages) && profile.profileImages.length ? <Section title="Additional profile pictures" icon={UserRound}><div className="grid grid-cols-3 gap-3">{profile.profileImages.map((image,index)=><img key={index} src={typeof image === "string" ? image : image?.url} className="aspect-square rounded-2xl object-cover" alt={`Profile ${index+1}`}/>)}</div></Section> : null}
        <Section title="Decision history" icon={ShieldCheck}>{item.history?.length ? <div className="space-y-2">{item.history.map(entry => <div key={entry.id} className="rounded-2xl border border-black/5 bg-white p-4"><div className="flex justify-between gap-3"><Status value={entry.status}/><span className="text-xs font-bold text-black/45">{dateTime(entry.createdAt)}</span></div><p className="mt-2 text-sm font-semibold">{entry.reason || "Application approved"}</p></div>)}</div> : <p className="text-sm font-semibold text-black/45">No previous decisions.</p>}</Section>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Rejection reason — explain exactly what must be corrected" className="min-h-28 w-full rounded-2xl border border-black/10 bg-white p-4 font-semibold outline-none focus:border-black"/>
        <div className="grid gap-3 sm:grid-cols-2"><button onClick={()=>decide("REJECTED")} className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-3.5 font-black text-white"><XCircle/>Reject</button><button onClick={()=>decide("VERIFIED")} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 font-black text-white"><CheckCircle2/>Approve</button></div>
      </div>
    </div>
  </div></div>;
}

function Avatar({ row, large }) { const src=row.profileImage||row.referenceSelfie; return src?<img src={src} alt="" className={`${large?"h-14 w-14":"h-12 w-12"} rounded-full object-cover`}/>:<span className={`${large?"h-14 w-14":"h-12 w-12"} grid place-items-center rounded-full bg-[#fff0de]`}><UserRound/></span> }
function Status({ value="PENDING" }) { const style=value==="VERIFIED"?"bg-emerald-100 text-emerald-800":value==="REJECTED"?"bg-rose-100 text-rose-700":"bg-[#fff0dc] text-[#9a531f]"; return <span className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>{value}</span> }
function Section({ title, icon:Icon, children }) { return <section className="rounded-3xl border border-black/10 bg-[#f8f6f2] p-4 sm:p-5"><h3 className="mb-4 flex items-center gap-2 font-black"><Icon size={19}/>{title}</h3>{children}</section> }
function InfoGrid({ values }) { return <dl className="grid gap-3 sm:grid-cols-2">{values.filter(([,value])=>value!==undefined&&value!==null&&value!=="").map(([label,value])=><div key={label} className="rounded-2xl bg-white p-3"><dt className="text-[10px] font-black uppercase tracking-wider text-black/40">{label}</dt><dd className="mt-1 break-words text-sm font-bold">{value}</dd></div>)}</dl> }
function Document({ title, src }) { const pdf=/\.pdf(?:$|\?)/i.test(String(src||"")); return <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white"><p className="border-b border-black/5 p-3 text-sm font-black">{title}</p>{src?(pdf?<iframe src={src} title={title} className="h-72 w-full"/>:<a href={src} target="_blank" rel="noreferrer"><img src={src} alt={title} className="h-72 w-full object-contain"/></a>):<div className="grid h-40 place-items-center text-sm font-bold text-black/35">Not uploaded</div>}</div> }
const labelDocument = doc => doc ? `${humanize(doc.documentType || "Identity proof")} · ${doc.documentNumber || (doc.documentNumberLast4 ? `•••• ${doc.documentNumberLast4}` : "Number unavailable")}` : "No document";
const humanize = value => String(value||"").replaceAll("_"," ").replace(/([a-z])([A-Z])/g,"$1 $2").replace(/^./,c=>c.toUpperCase());
const date = value => value ? new Date(value).toLocaleDateString("en-IN") : "—";
const dateTime = value => value ? new Date(value).toLocaleString("en-IN") : "—";
