import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import ProviderCard from "../../components/users/ProviderCard";
import UserAppLayout from "../../components/users/UserAppLayout";
import {
  getWatchlist,
  subscribeToUserData,
  toggleWatchlist,
} from "../../utils/userFlowStorage";

export default function UserWatchlist() {
  const [items, setItems] = useState(getWatchlist);
  const [user] = useState(() => readUser());

  useEffect(() => subscribeToUserData(() => setItems(getWatchlist())), []);

  return (
    <UserAppLayout title="Watch List" user={user}>
      <section className="h-full overflow-hidden rounded-lg border border-[#dce5f2] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-black">Saved Providers</h1><p className="mt-1 text-sm font-bold text-slate-500">Profiles saved from provider cards appear here instantly.</p></div>
          <span className="rounded-md bg-[#fff4e6] px-4 py-2 text-sm font-black text-[#92400e]">{items.length} saved</span>
        </div>

        <div className="custom-scrollbar mt-5 h-[calc(100%-72px)] overflow-y-auto">
          {items.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((provider, index) => (
                <div key={provider.id} className="relative">
                  <button onClick={() => { const result = toggleWatchlist(provider); setItems(result.items); }} className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-black text-[#fffaf3] shadow-lg"><Heart size={19} fill="currentColor" /></button>
                  <ProviderCard provider={provider} index={index} link={`/app/user/provider/${provider.id}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center"><div><Heart size={34} className="mx-auto text-black" /><p className="mt-3 text-xl font-black">Your Watch List is empty</p><Link to="/app/user/dashboard" className="mt-5 inline-flex rounded-md bg-black px-5 py-3 text-sm font-black text-[#fffaf3] shadow-[0_14px_40px_rgba(0,0,0,0.16)] transition hover:bg-[#fffaf3] hover:text-black">View Dashboard</Link></div></div>
          )}
        </div>
      </section>
    </UserAppLayout>
  );
}

function readUser() { try { return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null"); } catch { return null; } }


