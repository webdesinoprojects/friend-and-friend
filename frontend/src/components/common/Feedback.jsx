import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, RefreshCw, X } from "lucide-react";

export function notify(message, type = "success") {
  window.dispatchEvent(new CustomEvent("buddybook:toast", { detail: { id: Date.now(), message, type } }));
}

export function confirmAction({ title, message, confirmLabel = "Confirm", danger = false }) {
  return new Promise((resolve) => window.dispatchEvent(new CustomEvent("buddybook:confirm", { detail: { title, message, confirmLabel, danger, resolve } })));
}

export function FeedbackHost() {
  const [toasts, setToasts] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  useEffect(() => {
    const toast = ({ detail }) => {
      setToasts((rows) => [...rows.slice(-3), detail]);
      window.setTimeout(() => setToasts((rows) => rows.filter((item) => item.id !== detail.id)), 4200);
    };
    const confirm = ({ detail }) => setConfirmation(detail);
    window.addEventListener("buddybook:toast", toast);
    window.addEventListener("buddybook:confirm", confirm);
    return () => { window.removeEventListener("buddybook:toast", toast); window.removeEventListener("buddybook:confirm", confirm); };
  }, []);
  const answer = (value) => { confirmation?.resolve(value); setConfirmation(null); };
  return <>
    <div className="fixed right-5 top-24 z-[100000] grid w-[min(90vw,380px)] gap-3">{toasts.map((item) => { const Icon = item.type === "error" ? AlertTriangle : item.type === "info" ? Info : CheckCircle2; return <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 text-sm font-bold shadow-2xl"><Icon size={20} className={item.type === "error" ? "text-rose-500" : "text-emerald-600"}/><span className="flex-1">{item.message}</span><button onClick={() => setToasts((rows) => rows.filter((row) => row.id !== item.id))}><X size={16}/></button></div>; })}</div>
    {confirmation ? <div className="fixed inset-0 z-[100001] grid place-items-center bg-black/55 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl"><h2 className="text-2xl font-black">{confirmation.title}</h2><p className="mt-3 text-sm font-semibold leading-6 text-black/60">{confirmation.message}</p><div className="mt-7 flex justify-end gap-3"><button onClick={() => answer(false)} className="rounded-full border border-black/10 px-5 py-3 text-sm font-black">Cancel</button><button onClick={() => answer(true)} className={`rounded-full px-5 py-3 text-sm font-black text-white ${confirmation.danger ? "bg-rose-600" : "bg-black"}`}>{confirmation.confirmLabel}</button></div></div></div> : null}
  </>;
}

export function SkeletonRows({ count = 5 }) { return <div className="grid gap-3 p-5">{Array.from({length:count}).map((_,i)=><div key={i} className="h-16 animate-pulse rounded-2xl bg-black/5" />)}</div>; }
export function EmptyState({ icon: Icon = Info, title, text, actionLabel, onAction }) { return <div className="grid min-h-56 place-items-center rounded-[1.5rem] border border-dashed border-black/15 bg-white p-8 text-center"><div><Icon className="mx-auto text-[#df843f]" size={34}/><h3 className="mt-4 text-xl font-black">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm font-semibold text-black/50">{text}</p>{onAction ? <button onClick={onAction} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-black text-white"><RefreshCw size={15}/>{actionLabel || "Try again"}</button>:null}</div></div>; }
