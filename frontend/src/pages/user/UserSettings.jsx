import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../api/api";
import {
  CreditCard,
  Eye,
  Globe2,
  Headphones,
  Lock,
  LogOut,
  MapPin,
  ShieldCheck,
  UserX,
} from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import AccountLifecyclePanel from "../../components/account/AccountLifecyclePanel";

const options = [
  ["Login security", "Password, sessions and device activity", Lock, "lifecycle"],
  ["Privacy controls", "Profile visibility and data sharing", Eye, "privateProfile"],
  ["Location sharing", "Meetup location and safety sharing", MapPin, "locationSharing"],
  ["Payment methods", "Cards, UPI and refund preferences", CreditCard, "/app/user/wallet"],
  ["KYC and safety", "Verification records and safety agreement", ShieldCheck, "/app/user/profile"],
  ["Language and region", "Use device language and timezone", Globe2, "deviceLocale"],
  ["Blocked accounts", "Restrict new contacts to booked providers", UserX, "restrictContacts"],
  ["Help and support", "Report an issue or contact PPlusOne", Headphones, "/contact"],
];

export default function UserSettings() {
  const navigate = useNavigate();
  const [preferences,setPreferences]=useState(()=>{try{return JSON.parse(localStorage.getItem("PPlusOne_user_preferences")||"{}");}catch{return {};}});
  const handleOption=(action)=>{if(action.startsWith("/")){navigate(action);return;}if(action==="lifecycle"){document.getElementById("account-lifecycle")?.scrollIntoView({behavior:"smooth"});return;}setPreferences((current)=>{const next={...current,[action]:!current[action]};localStorage.setItem("PPlusOne_user_preferences",JSON.stringify(next));return next;});};

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("PPlusOne_auth_user");
    navigate("/login");
  };

  return (
    <UserAppLayout title="Settings">
      <section className="min-h-full rounded-[1.5rem] border border-[#eddac7] bg-[#fffaf3] p-4 shadow-sm lg:p-6">
        <div className="mb-5">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#e08c4c]">Account settings</p>
          <h2 className="mt-1 text-2xl font-black text-black">Control your workspace</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {options.map(([title, text, Icon, action]) => (
            <button
              key={title}
              type="button"
              onClick={()=>handleOption(action)}
              className="flex items-center gap-4 rounded-2xl border border-[#eddac7] bg-white p-4 text-left transition hover:bg-[#ffeedd]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fffaf3] text-[#e08c4c]">
                <Icon size={19} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-black">{title}</span>
                <span className="mt-1 block text-xs font-bold leading-5 text-[#6b5d52]">{text}{!action.startsWith("/")&&action!=="lifecycle" ? ` · ${preferences[action] ? "Enabled" : "Disabled"}` : ""}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#eddac7] bg-white p-5">
            <h3 className="text-lg font-black text-black">Logout</h3>
            <p className="mt-1 text-sm font-semibold text-[#6b5d52]">
              End this session and return to the login screen.
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3]"
            >
              <LogOut size={16} /> Logout
            </button>
          </section>

          <div id="account-lifecycle" className="grid gap-4"><AccountLifecyclePanel /></div>
        </div>
      </section>
    </UserAppLayout>
  );
}
