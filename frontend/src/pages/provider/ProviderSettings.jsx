import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Calendar,
  CreditCard,
  Eye,
  Headphones,
  Lock,
  LogOut,
  ShieldCheck,
  UserX,
  Wallet,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import AccountLifecyclePanel from "../../components/account/AccountLifecyclePanel";

const options = [
  ["Login security", "Password, sessions and devices", Lock, "lifecycle"],
  ["Profile visibility", "Public listing and search visibility", Eye, "profileVisible"],
  ["Availability defaults", "Weekly schedule and buffer times", Calendar, "/app/provider/availability"],
  ["Payout settings", "Revenue and settlement overview", Wallet, "/app/provider/earnings"],
  ["Payment records", "Invoices, refunds and deductions", CreditCard, "/app/provider/earnings"],
  ["KYC and safety", "Identity records and provider agreement", ShieldCheck, "/app/provider/profile"],
  ["Blocked users", "Restrict messages to booked users", UserX, "restrictContacts"],
  ["Help and support", "Contact BuddyBOOK operations", Headphones, "/contact"],
];

export default function ProviderSettings() {
  const navigate = useNavigate();
  const [preferences,setPreferences]=useState(()=>{try{return JSON.parse(localStorage.getItem("buddybook_provider_preferences")||"{}");}catch{return {};}});
  const handleOption=(action)=>{if(action.startsWith("/")){navigate(action);return;}if(action==="lifecycle"){document.getElementById("account-lifecycle")?.scrollIntoView({behavior:"smooth"});return;}setPreferences((current)=>{const next={...current,[action]:!current[action]};localStorage.setItem("buddybook_provider_preferences",JSON.stringify(next));return next;});};

  const logout = () => {
    localStorage.removeItem("buddybook_auth_user");
    localStorage.removeItem("buddybook_token");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AppShell type="provider">
      <section className="min-h-0 bg-[#fff7ed] text-black">
        <div className="mb-5 rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-5">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#e08c4c]">Provider settings</p>
          <h1 className="mt-1 text-3xl font-black">Control your panel</h1>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {options.map(([title, text, Icon, action]) => (
            <button key={title} type="button" onClick={()=>handleOption(action)} className="flex items-center gap-4 rounded-2xl border border-[#eddac7] bg-white p-4 text-left transition hover:bg-[#ffeedd]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fffaf3] text-[#e08c4c]"><Icon size={19} /></span>
              <span>
                <span className="block text-sm font-black">{title}</span>
                <span className="mt-1 block text-xs font-bold leading-5 text-[#6b5d52]">{text}{!action.startsWith("/")&&action!=="lifecycle" ? ` · ${preferences[action] ? "Enabled" : "Disabled"}` : ""}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#eddac7] bg-white p-5">
            <h2 className="text-lg font-black">Logout</h2>
            <p className="mt-1 text-sm font-semibold text-[#6b5d52]">End this provider session and return to login.</p>
            <button type="button" onClick={logout} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3]">
              <LogOut size={16} /> Logout
            </button>
          </section>

          <div id="account-lifecycle" className="grid gap-4"><AccountLifecyclePanel /></div>
        </div>
      </section>
    </AppShell>
  );
}
