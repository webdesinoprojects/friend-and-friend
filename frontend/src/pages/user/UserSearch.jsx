import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import api from "../../api/api";
import { getCachedProviders, listProviders } from "../../api/providers";
import { hasAuthToken } from "../../utils/authSession";
import ProviderCard from "../../components/users/ProviderCard";
import {
  getWatchlist,
  toggleWatchlist,
} from "../../utils/userFlowStorage";

const initialFilters = {
  state: "All",
  gender: "All",
  activity: "All",
  maxPrice: "All",
  rating: "All",
  date: "",
};

export default function UserSearch() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(() => readUser());
  const [providers, setProviders] = useState(() => getCachedProviders());
  const [watchlist, setWatchlist] = useState(getWatchlist);
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const state = searchParams.get("state");
      if (state) {
        setFilters((current) => ({ ...current, state }));
        setDraftFilters((current) => ({ ...current, state }));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    if (!showFilters || !window.matchMedia("(max-width: 767px)").matches) return undefined;
    const scrollY = window.scrollY;
    const bodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overscrollBehavior: document.body.style.overscrollBehavior,
    };
    const htmlOverflow = document.documentElement.style.overflow;
    const htmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      Object.assign(document.body.style, bodyStyles);
      document.documentElement.style.overflow = htmlOverflow;
      document.documentElement.style.overscrollBehavior = htmlOverscroll;
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    };
  }, [showFilters]);

  useEffect(() => {
    let mounted = true;

    const saveProviders = (rows) => {
      if (!mounted || !Array.isArray(rows)) return;

      setProviders(rows);
    };

    const refreshUser = async () => {
      try {
        const userResp = hasAuthToken() ? await api.get("/auth/me") : null;
        const nextUser =
          userResp?.data?.user || userResp?.data?.data?.user || userResp?.data?.data;

        if (mounted && (nextUser?.id || nextUser?._id)) {
          setUser(nextUser);
          localStorage.setItem("buddybook_auth_user", JSON.stringify(nextUser));
        }
      } catch {
        // Keep existing local user if session check fails.
      }
    };

    const refreshProviders = async () => {
      try {
        const rows = await loadExploreProviders();
        saveProviders(rows);
      } catch {
        // Keep cached providers visible if the backend request fails.
      }
    };
    const refreshEverything = () => {
      refreshUser();
      refreshProviders();
    };

    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") {
        refreshProviders();
      }
    };

    refreshEverything();

    window.addEventListener("focus", refreshProviders);
    document.addEventListener("visibilitychange", refreshOnVisible);
    window.addEventListener("buddybook:providers-changed", refreshProviders);
    window.addEventListener("buddybook:data-changed", refreshProviders);

    return () => {
      mounted = false;
      window.removeEventListener("focus", refreshProviders);
      document.removeEventListener("visibilitychange", refreshOnVisible);
      window.removeEventListener("buddybook:providers-changed", refreshProviders);
      window.removeEventListener("buddybook:data-changed", refreshProviders);
    };
  }, []);

  const states = useMemo(
    () => ["All", ...unique(providers.map((item) => item.state))],
    [providers]
  );

  const activities = useMemo(
    () => ["All", ...unique(providers.flatMap((item) => item.activities || []))],
    [providers]
  );

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const providerActivities = provider.activities || [];

      return (
        (filters.state === "All" || sameText(provider.state, filters.state)) &&
        (filters.gender === "All" ||
          String(provider.gender || "").toLowerCase() ===
            filters.gender.toLowerCase()) &&
        (filters.activity === "All" ||
          providerActivities.includes(filters.activity)) &&
        (filters.maxPrice === "All" ||
          Number(provider.price || 0) <= Number(filters.maxPrice)) &&
        (filters.rating === "All" ||
          Number(provider.rating || 0) >= Number(filters.rating)) &&
        (!filters.date || provider.available)
      );
    });
  }, [filters, providers]);

  const activeFilters = Object.values(filters).filter((value) => value && value !== "All").length;

  const updateFilter = (key, value) =>
    setDraftFilters((current) => ({ ...current, [key]: value }));

  const applyFilters = () => {
    setFilters(draftFilters);
    setShowFilters(false);
  };

  const handleSave = (provider) => {
    const result = toggleWatchlist(provider);
    setWatchlist(result.items);
  };

  return (
    <UserAppLayout title="Discover" user={user}>
      <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
        <div className="rounded-lg border border-[#dce5f2] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-[#17213a] sm:text-2xl">
                Find your perfect companion
              </h1>
              <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
                Profiles stay visible instantly and refresh in the background.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex items-center gap-2 rounded-md bg-[#3f37ff] px-5 py-3 text-sm font-black text-white shadow-[0_10px_25px_rgba(63,55,255,0.22)]"
            >
              <SlidersHorizontal size={16} /> Filters
              {activeFilters ? (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[9px] text-[#3f37ff]">
                  {activeFilters}
                </span>
              ) : null}
              <ChevronDown
                size={15}
                className={`transition ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {showFilters ? (
            <div className="fixed inset-x-0 bottom-16 top-16 z-40 touch-pan-y overflow-y-auto overscroll-contain border-t border-[#e7edf5] bg-white p-4 md:static md:mt-4 md:overflow-visible md:bg-transparent md:p-0 md:pt-4">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-6">
                <label className="hidden">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8794a7]"
                  />
                  <input
                    value=""
                    readOnly
                    placeholder="Name, activity, city..."
                    className="h-12 w-full rounded-md border border-[#dce5f2] bg-[#eef4ff] pl-10 pr-3 text-sm font-bold outline-none focus:border-[#3f37ff]"
                  />
                </label>

                <FilterSelect label="State" value={draftFilters.state} options={states} onChange={(value) => updateFilter("state", value)} />
                <FilterSelect label="Gender" value={draftFilters.gender} options={["All", "Male", "Female", "Others", ...(IDENTITY_OPTIONS.includes(draftFilters.gender) ? [draftFilters.gender] : [])]} onChange={(value) => updateFilter("gender", value)} />
                <FilterSelect label="Activity" value={draftFilters.activity} options={activities} onChange={(value) => updateFilter("activity", value)} />
                <FilterSelect label="Max ₹/hr" value={draftFilters.maxPrice} options={["All", ...Array.from({ length: 11 }, (_, index) => String(500 + index * 100))]} onChange={(value) => updateFilter("maxPrice", value)} />
                <FilterSelect label="Highest rating (4 & above)" value={draftFilters.rating} options={["All", "4"]} onChange={(value) => updateFilter("rating", value)} />
              </div>
              {draftFilters.gender === "Others" ? <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-[#dce5f2] bg-[#eef4ff] p-3 sm:grid-cols-3 lg:grid-cols-5">{IDENTITY_OPTIONS.map((identity) => <button key={identity} type="button" onClick={() => updateFilter("gender", identity)} className="rounded-md border border-[#dce5f2] bg-white px-3 py-2 text-xs font-black text-[#17213a]">{identity}</button>)}</div> : null}

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="flex h-12 min-w-[260px] flex-1 items-center gap-2 rounded-md border border-[#dce5f2] bg-[#eef4ff] px-3">
                  <CalendarDays size={16} className="text-[#3f37ff]" />
                  <span className="text-xs font-black text-slate-500">Available date</span>
                  <input
                    type="date"
                    min={dateValue(0)}
                    max={dateValue(6)}
                    value={draftFilters.date}
                    onChange={(event) => updateFilter("date", event.target.value)}
                    className="ml-auto bg-transparent text-xs font-black outline-none"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setDraftFilters(initialFilters);
                    setFilters(initialFilters);
                  }}
                  className="h-12 rounded-md border border-[#dce5f2] px-5 text-xs font-black text-[#3f37ff]"
                >
                  Reset
                </button>
                <button type="button" onClick={applyFilters} className="h-12 rounded-md bg-[#3f37ff] px-7 text-xs font-black text-white">
                  Apply
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 overflow-hidden rounded-lg border border-[#dce5f2] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black sm:text-xl">Verified providers</h2>
              <p className="text-xs font-bold text-slate-500">
                {filteredProviders.length} profiles available
              </p>
            </div>
          </div>

          <div className="custom-scrollbar h-[calc(100%-48px)] overflow-y-auto pr-1">
            {filteredProviders.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filteredProviders.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    saved={watchlist.some((item) => item.id === provider.id)}
                    onSave={() => handleSave(provider)}
                    small
                    link={`/app/user/provider/${provider.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="grid h-full min-h-[260px] place-items-center text-center">
                <div>
                  <Search size={28} className="mx-auto text-[#3f37ff]" />
                  <p className="mt-3 text-lg font-black">No profiles found</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Profiles will appear here as soon as providers publish them.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </UserAppLayout>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="relative">
      <span className="absolute left-3 top-1.5 text-[8px] font-black uppercase text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-md border border-[#dce5f2] bg-[#eef4ff] px-3 pb-1 pt-5 text-xs font-black outline-none focus:border-[#3f37ff]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b))
  );
}

function dateValue(addDays) {
  const date = new Date();
  date.setDate(date.getDate() + addDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function loadExploreProviders() {
  const approved = await listProviders({ verified: true, _t: Date.now() });
  if (Array.isArray(approved) && approved.length) return approved;

  const allProviders = await listProviders({ _t: Date.now() });
  return Array.isArray(allProviders) ? allProviders : [];
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}

function sameText(left, right) {
  return String(left || "").trim().toLocaleLowerCase() === String(right || "").trim().toLocaleLowerCase();
}

const IDENTITY_OPTIONS = [
  "Lesbian", "Gay", "Bisexual", "Transgender", "Queer", "Non-binary",
  "Genderfluid", "Agender", "Bigender", "Genderqueer", "Gender non-conforming",
  "Trans man", "Trans woman", "Intersex",
];
