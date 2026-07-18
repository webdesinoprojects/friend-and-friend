import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Star } from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import { getProvider } from "../../api/providers";
import { formatRs } from "../../utils/format";
import { getWatchlist, removeMissingWatchlistProviders, subscribeToUserData, toggleWatchlist } from "../../utils/userFlowStorage";

export default function UserWatchlist() {
  const [items, setItems] = useState(getWatchlist);
  const [user] = useState(readUser);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const savedProviders = getWatchlist();
      const results = await Promise.allSettled(savedProviders.map((provider) => getProvider(provider.id)));
      if (!mounted) return;
      const deletedIds = results.flatMap((result, index) =>
        result.status === "rejected" && result.reason?.response?.status === 404
          ? [savedProviders[index].id]
          : []
      );
      const currentProviders = deletedIds.length
        ? removeMissingWatchlistProviders(deletedIds)
        : getWatchlist();
      const liveProviders = new Map(results.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [[result.value.id, result.value]] : []
      ));
      setItems(currentProviders.map((provider) => ({
        ...provider,
        ...(liveProviders.get(provider.id) || {}),
      })));
    };
    refresh();
    const unsubscribe = subscribeToUserData(refresh);
    return () => { mounted = false; unsubscribe?.(); };
  }, []);

  const remove = (provider) => setItems(toggleWatchlist(provider).items);

  return (
    <UserAppLayout title="Watch List" user={user}>
      <section className="min-h-full rounded-[1.5rem] border border-[#eadcca] bg-[#fffaf3] p-3 shadow-sm sm:p-5 lg:p-7">
        <header className="flex items-end justify-between gap-3 border-b border-black/8 pb-4 sm:pb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df843f]">Your favourites</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Saved Providers</h1>
            <p className="mt-1 hidden text-sm font-bold text-black/50 sm:block">Keep your favourite verified buddies close.</p>
          </div>
          <span className="shrink-0 rounded-full bg-black px-3 py-2 text-xs font-black text-white sm:px-4 sm:text-sm">{items.length} saved</span>
        </header>

        {items.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
            {items.map((provider) => <WatchlistCard key={provider.id} provider={provider} onRemove={() => remove(provider)} />)}
          </div>
        ) : (
          <div className="grid min-h-[55vh] place-items-center px-5 text-center">
            <div><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ffe8ce]"><Heart size={28} /></span><p className="mt-4 text-xl font-black">Your Watch List is empty</p><p className="mt-2 text-sm font-bold text-black/45">Save a profile and it will appear here.</p><Link to="/app/user/dashboard" className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-sm font-black text-white">Explore providers</Link></div>
          </div>
        )}
      </section>
    </UserAppLayout>
  );
}

function WatchlistCard({ provider, onRemove }) {
  const image = provider.image || provider.avatar || provider.images?.[0];
  const rating = Number(provider.rating || 0);
  return (
    <article className="group relative min-w-0 overflow-hidden rounded-[1.25rem] border border-black/8 bg-white shadow-[0_12px_32px_rgba(72,45,25,0.09)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(72,45,25,0.14)]">
      <Link to={`/app/user/provider/${provider.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#eee8df] sm:aspect-[5/4]">
          {image ? <img src={image} alt={provider.name || "Provider"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-4xl font-black">{provider.name?.[0] || "B"}</div>}
          <span className="absolute bottom-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 truncate rounded-full bg-white/90 px-2 py-1 text-[10px] font-black backdrop-blur sm:bottom-3 sm:left-3 sm:px-3 sm:text-xs"><MapPin size={11} /> {provider.city || "India"}</span>
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2"><h2 className="truncate text-sm font-black sm:text-lg">{provider.name || "Verified Buddy"}</h2><span className="flex shrink-0 items-center gap-1 text-xs font-black sm:text-sm"><Star size={13} fill="currentColor" />{rating ? rating.toFixed(1) : "New"}</span></div>
          <p className="mt-1 truncate text-[11px] font-bold text-black/45 sm:text-sm">{provider.profession || provider.headline || "Verified companion"}</p>
          <p className="mt-3 text-sm font-black text-[#df843f] sm:text-base">{formatRs(provider.price)}/hr</p>
        </div>
      </Link>
      <button type="button" onClick={onRemove} aria-label={`Remove ${provider.name || "provider"} from watchlist`} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black text-white shadow-lg transition hover:scale-105 sm:right-3 sm:top-3 sm:h-10 sm:w-10"><Heart size={15} fill="currentColor" /></button>
    </article>
  );
}

function readUser() {
  try { return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null"); } catch { return null; }
}
