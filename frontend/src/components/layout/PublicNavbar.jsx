import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Wallet,
  X,
} from "lucide-react";
import api from "../../api/api";
import Logo from "../common/Logo";
import { hasAuthToken } from "../../utils/authSession";

const navItems = [
  { label: "How it works", to: "/how-it-works" },
  { label: "Explore", to: "/activities" },
  { label: "Safety", to: "/safety" },
  { label: "Contact", to: "/contact" },
];

const userWorkspace = [
  { label: "Dashboard", to: "/app/user/dashboard", icon: LayoutDashboard },
  { label: "Watch List", to: "/app/user/watchlist", icon: Heart },
  { label: "Bookings", to: "/app/user/bookings", icon: CalendarCheck },
  { label: "Payments", to: "/app/user/wallet", icon: Wallet },
  { label: "Reviews", to: "/app/user/reviews", icon: Star },
  { label: "Profile", to: "/app/user/profile", icon: User },
  { label: "Settings", to: "/app/user/settings", icon: Settings },
];

const providerWorkspace = [
  { label: "Dashboard", to: "/app/provider/dashboard", icon: LayoutDashboard },
  { label: "Provider Profile", to: "/app/provider/profile", icon: User },
  { label: "Bookings", to: "/app/provider/bookings", icon: CalendarCheck },
  { label: "Earnings", to: "/app/provider/earnings", icon: Wallet },
  { label: "Reviews", to: "/app/provider/reviews", icon: Star },
  { label: "Settings", to: "/app/provider/settings", icon: Settings },
];

const fallbackAvatar =
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=160&auto=format&fit=crop&q=80";

export default function PublicNavbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [user, setUser] = useState(() => readStoredUser());

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    let mounted = true;
    if (!hasAuthToken()) {
      setUser(readStoredUser());
      return () => {
        mounted = false;
      };
    }

    api
      .get("/auth/me")
      .then(({ data }) => {
        const nextUser = data?.user || data?.data?.user || data?.data;
        if (!mounted || !(nextUser?.id || nextUser?._id)) return;
        setUser(nextUser);
        localStorage.setItem("buddybook_auth_user", JSON.stringify(nextUser));
      })
      .catch((error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("buddybook_token");
          localStorage.removeItem("buddybook_auth_user");
        }
        setUser(null);
      });

    const syncUser = () => {
      setUser(readStoredUser());
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("buddybook:auth-changed", syncUser);

    return () => {
      mounted = false;
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("buddybook:auth-changed", syncUser);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = accountOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [accountOpen]);

  const isProvider = user?.role === "PROVIDER";
  const workspaceItems = isProvider ? providerWorkspace : userWorkspace;
  const rating = useMemo(() => getAccountRating(user), [user]);
  const avatar = getAvatar(user);

  const openAccount = () => {
    setAccountOpen(true);
    setLogoutConfirm(false);
    closeMenu();
  };

  const handleLogout = () => {
    localStorage.removeItem("buddybook_auth_user");
    localStorage.removeItem("buddybook_token");
    localStorage.removeItem("buddybook_admin_token");
    localStorage.removeItem("buddybook_admin_user");
    localStorage.removeItem("token");
    setUser(null);
    setAccountOpen(false);
    setLogoutConfirm(false);
    window.dispatchEvent(new Event("buddybook:auth-changed"));
    navigate("/");
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-4 z-[9999] px-4">
        <div className="relative z-[9999] mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-full border-2 border-black bg-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.14)] backdrop-blur-2xl">
            <div className="mx-auto px-4 sm:px-5">
              <div className="flex h-16 items-center justify-between gap-4">
<div className="flex items-center gap-3">
                   <div className="rounded-full bg-white/30 px-2 py-1 shadow-sm backdrop-blur-2xl">
                     <Logo />
                   </div>
                 </div>

                <nav className="hidden items-center rounded-full border border-black/70 bg-white/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_14px_35px_rgba(0,0,0,0.08)] md:flex">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="group relative overflow-hidden rounded-full px-4 py-2.5 text-sm font-bold text-black transition duration-300 hover:text-black"
                    >
                      <span className="pointer-events-none absolute inset-0 scale-90 rounded-full bg-gradient-to-r from-[#e8e8e4] to-[#e9ecef] opacity-0 transition duration-300 group-hover:scale-100 group-hover:opacity-100" />
                      <span className="relative z-10">{item.label}</span>
                      <span className="pointer-events-none absolute bottom-1 left-5 right-5 h-0.5 scale-x-0 rounded-full bg-black transition duration-300 group-hover:scale-x-100" />
                    </Link>
                  ))}
                </nav>

                <div className="hidden items-center gap-3 md:flex">
                  {user ? (
                    <button
                      type="button"
                      onClick={openAccount}
                      className="flex items-center gap-2 rounded-full border border-black bg-white px-2 py-1.5 text-sm font-black text-black shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-black hover:text-white"
                      aria-label="Open account menu"
                    >
                      <img
                        src={avatar}
                        alt={user.fullName || "Account"}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <ChevronDown size={17} />
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="group relative overflow-hidden rounded-full bg-black px-6 py-3 text-sm font-black text-white shadow-[0_16px_35px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(0,0,0,0.28)]"
                    >
                      <span className="absolute inset-0 bg-black" />
                      <span className="absolute inset-0 bg-gradient-to-r from-[#f8f7ff]/25 via-[#caf0f8]/20 to-[#e8e8e4]/25 opacity-0 transition duration-300 group-hover:opacity-100" />
                      <span className="absolute -left-8 top-0 h-full w-8 rotate-12 bg-white/40 transition duration-700 group-hover:left-[120%]" />
                      <span className="relative z-10 flex items-center gap-2">
                        Get Started
                        <ArrowRight
                          size={16}
                          className="transition group-hover:translate-x-0.5"
                        />
                      </span>
                    </Link>
                  )}
                </div>

                <button
                  onClick={() => setIsOpen((prev) => !prev)}
                  className="grid h-12 w-12 place-items-center rounded-full border border-black bg-white text-black shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#caf0f8] md:hidden"
                  aria-label="Toggle menu"
                >
                  {isOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>
          </div>

          {isOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] rounded-[2rem] border-2 border-black bg-gradient-to-br from-[#caf0f8] via-white to-[#f8f7ff] p-4 shadow-2xl backdrop-blur-xl md:hidden">
              <div className="grid gap-3">
                <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-black text-black">
                    <Sparkles size={17} />
                    Safe, verified and platonic meetups
                  </div>
                  <p className="mt-1 text-sm leading-6 text-black/65">
                    Book trusted people for movies, dinner, shopping, gaming, city tours and more.
                  </p>
                </div>

                <nav className="grid gap-2 rounded-[1.5rem] border border-black/10 bg-white p-2 shadow-sm">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={closeMenu}
                      className="rounded-full bg-[#e9ecef] px-4 py-3 text-sm font-black text-black transition hover:bg-[#e8e8e4]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {user ? (
                  <button
                    type="button"
                    onClick={openAccount}
                    className="flex items-center justify-between rounded-full bg-black px-4 py-3 text-sm font-black text-white shadow-lg shadow-black/20"
                  >
                    <span className="flex items-center gap-2">
                      <img
                        src={avatar}
                        alt={user.fullName || "Account"}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    </span>
                    <ChevronDown size={16} />
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="rounded-full bg-black px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Get Started
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <AccountDrawer
        open={accountOpen}
        user={user}
        avatar={avatar}
        rating={rating}
        isProvider={isProvider}
        workspaceItems={workspaceItems}
        logoutConfirm={logoutConfirm}
        setLogoutConfirm={setLogoutConfirm}
        onClose={() => {
          setAccountOpen(false);
          setLogoutConfirm(false);
        }}
        onLogout={handleLogout}
      />
    </>
  );
}

function AccountDrawer({
  open,
  user,
  avatar,
  rating,
  isProvider,
  workspaceItems,
  logoutConfirm,
  setLogoutConfirm,
  onClose,
  onLogout,
}) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/20 px-4">
      <button
        type="button"
        aria-label="Close account drawer"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <div className="pointer-events-none relative mx-auto h-full w-full max-w-7xl">
        <aside className="pointer-events-auto absolute right-0 top-[5.5rem] flex w-full max-w-[320px] max-h-[calc(100vh-6.5rem)] flex-col overflow-hidden bg-[#fffdf9] shadow-[0_30px_120px_rgba(0,0,0,0.28)] rounded-[1.5rem] sm:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-black/45">
            <User size={15} />
            Account
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#f5f3ee] text-black transition hover:bg-[#ece7df]"
            aria-label="Close account menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-3">
          <section className="rounded-[1.2rem] border border-[#f0d9c4] bg-white p-3 shadow-[0_18px_55px_rgba(120,72,32,0.08)]">
            <div className="flex items-start gap-3">
              <img
                src={avatar}
                alt={user.fullName || "Account avatar"}
                className="h-14 w-14 rounded-full bg-[#f1f1f1] object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-black text-black">
                      {user.fullName || "BuddyBOOK User"}
                    </h2>
                    <p className="mt-0.5 text-xs font-black text-black/45">
                      {isProvider ? "Provider account" : "User account"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-black text-black">
                      <Star size={13} fill="#f59e0b" className="text-[#f59e0b]" />
                      {rating}
                    </div>
                  </div>
                  <ChevronDown size={24} className="text-black/45 shrink-0" />
                </div>
              </div>
            </div>

          </section>

          <p className="mb-1 mt-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-black/45">
            Workspace
          </p>
          <nav className="grid gap-1.5">
            {workspaceItems.map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                onClick={onClose}
                className="flex items-center gap-3 rounded-full px-4 py-2 text-sm font-black text-black/78 transition hover:bg-[#f5f3ee]"
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="my-2 h-px bg-black/10" />


        </div>

        <div className="border-t border-black/10 p-3 pb-4">
          {logoutConfirm ? (
            <div className="rounded-[1.2rem] border border-[#f4c7b4] bg-[#fff7ed] p-4">
              <p className="text-sm font-black text-black">Sign out?</p>
              <p className="mt-1 text-xs font-semibold text-black/55">
                You will return to the public home page.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLogoutConfirm(false)}
                  className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-black text-black"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-full bg-black px-4 py-2.5 text-xs font-black text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLogoutConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[1rem] border border-[#f0d9c4] bg-[#fff7ed] px-5 py-3 text-sm font-black text-[#d65f18] transition hover:bg-[#ffe8d4]"
            >
              <LogOut size={21} />
              Sign out
            </button>
          )}
        </div>
        </aside>
      </div>
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
  const providerImages = user?.providerProfile?.profileImages;
  const firstProviderImage = Array.isArray(providerImages)
    ? providerImages.find(Boolean)
    : null;

  return (
    user?.profileImage ||
    user?.avatar ||
    user?.referenceSelfie ||
    firstProviderImage ||
    fallbackAvatar
  );
}

function getAccountRating(user) {
  const localAverage = getLocalAccountRating(user);
  if (localAverage) return localAverage;

  const providerRating = Number(
    user?.providerProfile?.rating || user?.providerProfile?.averageRating
  );
  if (Number.isFinite(providerRating) && providerRating > 0) {
    return providerRating.toFixed(2);
  }

  return user?.role === "PROVIDER" ? "4.80" : "4.43";
}

function getLocalAccountRating(user) {
  try {
    const reviews = JSON.parse(localStorage.getItem("buddybook_reviews") || "[]");
    const role = user?.role || "USER";
    const userIds = [user?.id, user?._id].filter(Boolean).map(String);
    const received = Array.isArray(reviews)
      ? reviews.filter((review) =>
          review.targetRole === role &&
          (!review.targetId || userIds.includes(String(review.targetId)) || review.targetName === user?.fullName)
        )
      : [];
    if (!received.length) return "";
    return (received.reduce((sum, item) => sum + Number(item.rating || 0), 0) / received.length).toFixed(2);
  } catch {
    return "";
  }
}
