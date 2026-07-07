import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Star } from "lucide-react";
import ProviderImageCarousel from "../../components/users/ProviderImageCarousel";
import UserAppLayout from "../../components/users/UserAppLayout";
import {
  getWatchlist,
  rememberProvider,
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
              {items.map((provider) => (
                <article key={provider.id} className="overflow-hidden rounded-lg border border-[#dce5f2] bg-[#f8faff]">
                  <div className="relative h-56"><ProviderImageCarousel images={provider.images?.length ? provider.images : [provider.image].filter(Boolean)} alt={provider.name} /><button onClick={() => { const result = toggleWatchlist(provider); setItems(result.items); }} className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-black text-[#fffaf3] shadow-lg"><Heart size={19} fill="currentColor" /></button></div>
                  <div className="p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">{provider.name}</h2><p className="text-sm font-bold text-slate-500">{provider.profession}</p></div><span className="flex items-center gap-1 text-sm font-black"><Star size={14} className="fill-[#f59e0b] text-[#f59e0b]" />{provider.rating}</span></div><p className="mt-3 flex items-center gap-1 text-sm font-bold text-slate-500"><MapPin size={14} />{provider.city}, {provider.state}</p><Link to={`/app/user/provider/${provider.id}`} onClick={() => rememberProvider(provider)} className="mt-4 inline-flex w-full justify-center rounded-md bg-black px-4 py-3 text-sm font-black text-[#fffaf3] shadow-[0_14px_40px_rgba(0,0,0,0.16)] transition hover:bg-[#fffaf3] hover:text-black">View Profile</Link></div>
                </article>
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


