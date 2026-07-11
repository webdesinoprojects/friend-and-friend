import { HeartHandshake, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function Logo() {
  const goHome = () => {
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };
  return (
    <Link to="/" onClick={goHome} className="flex items-center gap-3" aria-label="BuddyBOOK home">
      <div className="grid h-9 w-9 place-items-center border-2 border-yellow-200 rounded-2xl bg-blue-950 text-yellow-100 shadow-md">
        <HeartHandshake size={20} strokeWidth={2.2} />
      </div>

      <div className="leading-none">
        <div className="flex items-center gap-1">
          <span className="text-[23px] font-black tracking-tight text-slate-950">
            Buddy
          </span>
          <span className="text-[23px] font-black tracking-tight text-blue-950">
            BOOK
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
          <ShieldCheck size={11} className="text-blue-950" />
          Safe meetups
        </div>
      </div>
    </Link>
  );
}
