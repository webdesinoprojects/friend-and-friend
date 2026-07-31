import {
  CalendarCheck,
  Flag,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Star,
  User,
  Wallet,
  X,
} from "lucide-react";

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { getCachedReportSummary, getMyReportSummary } from "../../api/reports";
import { listChats } from "../../api/chats";
import { useLocation, Link, Outlet, useNavigate } from "react-router-dom";
import Logo from "../common/Logo";
import { NotificationBell } from "../common/HeaderActions";
import api from "../../api/api";
import { clearQueryCache } from "../../utils/queryCache";

const providerLinks = [
  { label: "Overview", to: "/app/provider/dashboard", icon: LayoutDashboard },
  { label: "Provider Profile", to: "/app/provider/profile", icon: User },
  { label: "Bookings", to: "/app/provider/bookings", icon: CalendarCheck },
  { label: "Chat", to: "/app/provider/chat", icon: MessageCircle },
  { label: "Earnings", to: "/app/provider/earnings", icon: Wallet },
  { label: "Reviews", to: "/app/provider/reviews", icon: Star },
  { label: "Reports", to: "/app/provider/reports", icon: Flag },
  { label: "Settings", to: "/app/provider/settings", icon: Settings },
];

const userLinks = [
  { label: "Overview", to: "/app/user/dashboard", icon: LayoutDashboard },
  { label: "Watch List", to: "/app/user/watchlist", icon: Star },
  { label: "Bookings", to: "/app/user/bookings", icon: CalendarCheck },
  { label: "Payments", to: "/app/user/wallet", icon: Wallet },
  { label: "Profile", to: "/app/user/profile", icon: User },
  { label: "Settings", to: "/app/user/settings", icon: Settings },
];

const ProviderWorkspaceContext = createContext(null);

export function ProviderWorkspaceRoute() {
  const [layoutProps, setLayoutProps] = useState({});
  const contextValue = useMemo(() => ({ setLayoutProps }), []);
  useEffect(() => {
    listChats().catch(() => {});
  }, []);

  return (
    <ProviderWorkspaceContext.Provider value={contextValue}>
      <AppShellView type="provider" {...layoutProps}>
        <Outlet />
      </AppShellView>
    </ProviderWorkspaceContext.Provider>
  );
}

export default function AppShell(props) {
  const workspace = useContext(ProviderWorkspaceContext);
  const { type, searchValue, onSearchChange } = props;

  useLayoutEffect(() => {
    if (!workspace || type !== "provider") return undefined;
    workspace.setLayoutProps({ searchValue, onSearchChange });
    return () => workspace.setLayoutProps({});
  }, [workspace, type, searchValue, onSearchChange]);

  if (workspace && type === "provider") return props.children;
  return <AppShellView {...props} />;
}

function AppShellView({ type, children, searchValue = "", onSearchChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const pageName = pathParts[pathParts.length - 1] || "dashboard";
  const links = type === "provider" ? providerLinks : userLinks;
  const storedUser = readStoredUser();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [reportCount, setReportCount] = useState(() => getCachedReportSummary().received || 0);
  useEffect(() => {
    if (type !== "provider") return undefined;
    let mounted = true;
    const load = () => getMyReportSummary().then((data) => mounted && setReportCount(data.received || 0)).catch(() => {});
    load();
    return () => { mounted = false; };
  }, [type]);
  const inputValue = searchValue || localSearch;
  const searchMatches = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return [];
    return links.filter((item) => item.label.toLowerCase().includes(query)).slice(0, 6);
  }, [inputValue, links]);

  const updateSearch = (value) => {
    setLocalSearch(value);
    onSearchChange?.(value);
  };

  const goToMatch = (to) => {
    updateSearch("");
    navigate(to);
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("buddybook_auth_user");
    clearQueryCache();
    window.dispatchEvent(new Event("buddybook:auth-changed"));
    setDrawerOpen(false);
    navigate("/");
  };

  return (
    <div className="h-dvh overflow-hidden bg-[#fbfaf7] text-[#0f172a]">
      <div className="grid h-full min-h-0 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 border-r border-black/10 bg-white p-6 lg:flex lg:flex-col">
          <Logo />
          <nav className="mt-10 grid gap-2">
            {links.map(({ label, to, icon: Icon }) => {
              const active = location.pathname === to || (to.includes(pageName) && location.pathname.includes(to));
              return (
                <Link
                  key={label}
                  to={to}
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-black transition ${
                    active ? "bg-[#fff0d2] text-[#08204a]" : "text-[#111827] hover:bg-[#fff7ed]"
                  }`}
                >
                  <Icon size={22} />
                  {label}
                  {label === "Reports" ? <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">{reportCount}</span> : null}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl bg-[#fff7ed] p-5">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#e08c4c] shadow-sm">
              <ShieldCheck size={22} />
            </span>
            <p className="mt-5 text-base font-black">Safe Platform.</p>
            <p className="mt-1 text-sm font-semibold text-[#667085]">Trusted Community.</p>
            <Link to="/safety" className="mt-5 inline-flex text-sm font-black text-[#0b4a9f]">Learn more &rarr;</Link>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col">
          <header className="lg:hidden">
            <div className="fixed left-3 right-3 top-3 z-[9998] rounded-full border-2 border-black bg-white/90 shadow-[0_18px_50px_rgba(0,0,0,0.14)] backdrop-blur-xl">
              <div className="flex h-14 items-center justify-between gap-3 px-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-[#fffaf3]"
                    aria-label="Go to home page"
                  >
                    <Home size={18} />
                  </button>
                </div>
                <h1 className="text-sm font-black tracking-tight text-black sm:text-base">
                  {type === "provider" && pageName === "dashboard"
                    ? "Provider Overview"
                    : `${pageName.replace(/-/g, " ")}`}
                </h1>
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-black"
                    aria-label={`Open ${type} workspace menu`}
                  >
                    <Menu size={19} />
                  </button>
                </div>
              </div>
            </div>
            <div className="h-[72px] shrink-0" />
          </header>

          <header className="hidden h-[92px] shrink-0 items-center justify-between border-b border-black/10 bg-white px-4 sm:px-8 lg:flex">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:bg-[#fff7ed] lg:hidden"
                aria-label="Go to home page"
              >
                <Home size={18} />
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:bg-[#fff7ed] lg:hidden"
                aria-label={`Open ${type} workspace menu`}
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {type === "provider" && pageName === "dashboard"
                  ? "Provider Overview"
                  : `${pageName.replace(/-/g, " ")}`}
              </h1>
              <p className="mt-1 hidden text-sm font-semibold text-[#667085] sm:block">
                {type === "provider"
                  ? "Track your profile, bookings, earnings and next actions."
                  : "Manage your safe workspace and bookings."}
              </p>
              </div>
            </div>

            <div className="relative hidden h-14 min-w-[260px] max-w-[440px] flex-1 items-center gap-3 rounded-xl border border-black/10 bg-white px-4 shadow-sm xl:flex">
              <Search size={20} className="text-[#667085]" />
              <input
                value={inputValue}
                onChange={(event) => updateSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && searchMatches[0]) goToMatch(searchMatches[0].to);
                }}
                placeholder={type === "provider" ? "Search bookings, services, earnings..." : "Search anything..."}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
              />
              <kbd className="rounded-md bg-[#f2f4f7] px-2 py-1 text-xs font-black text-[#475467]">⌘ K</kbd>
              {searchMatches.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                  {searchMatches.map(({ label, to, icon: Icon }) => (
                    <button
                      key={to}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => goToMatch(to)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black text-[#111827] hover:bg-[#fff7ed]"
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="hidden items-center gap-3 sm:flex">
                <img
                  src={getAvatar(storedUser)}
                  alt={storedUser?.fullName || "Account"}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div className="hidden xl:block">
                  <p className="text-sm font-black">{storedUser?.fullName || "Provider"}</p>
                  <p className="text-xs font-semibold text-[#667085]">{storedUser?.city || "New Delhi"}, {storedUser?.state || "Delhi"}</p>
                </div>
              </div>
            </div>
          </header>

          {drawerOpen ? (
            <div className="fixed inset-0 z-[10000] bg-black/35 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
              <aside
                className="workspace-mobile-drawer absolute right-0 top-0 flex h-full w-[min(86vw,330px)] flex-col bg-white p-5 shadow-[-20px_0_70px_rgba(0,0,0,0.2)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7563]">
                      {type === "provider" ? "Provider Workspace" : "User Workspace"}
                    </p>
                    <h2 className="mt-1 text-2xl font-black capitalize">{pageName.replace(/-/g, " ")}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-black text-[#fffaf3]"
                    aria-label={`Close ${type} workspace menu`}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-6 rounded-2xl bg-[#fffaf3] p-4">
                  <p className="text-lg font-black">{storedUser?.fullName || (type === "provider" ? "Provider" : "BuddyBOOK User")}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#6b5d52]">
                    {storedUser?.email || storedUser?.phone || "Profile details"}
                  </p>
                </div>

                <nav className="mt-6 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto">
                  {links.map(({ label, to, icon: Icon }) => {
                    const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
                    return (
                      <Link
                        key={label}
                        to={to}
                        onClick={() => setDrawerOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                          active ? "bg-[#fff0d2] text-[#08204a] shadow-sm" : "text-black hover:bg-[#ffeedd]"
                        }`}
                      >
                        <Icon size={18} />
                        {label}
                      </Link>
                    );
                  })}
                </nav>
                <button
                  type="button"
                  onClick={logout}
                  className="mt-5 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 text-sm font-black text-white"
                >
                  <LogOut size={19} />
                  Logout
                </button>
              </aside>
            </div>
          ) : null}

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
            {children}
          </div>
        </main>
      </div>
      <style>{`@keyframes workspaceDrawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } } .workspace-mobile-drawer { animation: workspaceDrawerIn 260ms ease-out both; }`}</style>
    </div>
  );
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}

function getAvatar(user) {
  return (
    user?.profileImage ||
    user?.avatar ||
    user?.referenceSelfie ||
    "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=160&auto=format&fit=crop&q=80"
  );
}
