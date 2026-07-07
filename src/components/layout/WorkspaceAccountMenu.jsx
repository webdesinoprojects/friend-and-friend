import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarCheck,
  ChevronDown,
  Heart,
  LayoutDashboard,
  Info,
  LogOut,
  Settings,
  Star,
  Tag,
  User,
  Wallet,
  X,
} from "lucide-react";
import api from "../../api/api";

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
  { label: "Services", to: "/app/provider/services", icon: BriefcaseBusiness },
  { label: "Bookings", to: "/app/provider/bookings", icon: CalendarCheck },
  { label: "Earnings", to: "/app/provider/earnings", icon: Wallet },
  { label: "Reviews", to: "/app/provider/reviews", icon: Star },
  { label: "Settings", to: "/app/provider/settings", icon: Settings },
];

const fallbackAvatar =
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=160&auto=format&fit=crop&q=80";

export default function WorkspaceAccountMenu({ user: suppliedUser }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [user, setUser] = useState(() => suppliedUser || readStoredUser());

  useEffect(() => {
    if (suppliedUser) setUser(suppliedUser);
  }, [suppliedUser]);

  useEffect(() => {
    let mounted = true;

    api
      .get("/auth/me")
      .then(({ data }) => {
        const nextUser = data?.user || data?.data?.user || data?.data;
        if (!mounted || !(nextUser?.id || nextUser?._id)) return;
        setUser(nextUser);
        localStorage.setItem("buddybook_auth_user", JSON.stringify(nextUser));
      })
      .catch(() => {});

    const syncUser = () => setUser(readStoredUser());
    window.addEventListener("storage", syncUser);
    window.addEventListener("buddybook:auth-changed", syncUser);

    return () => {
      mounted = false;
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("buddybook:auth-changed", syncUser);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isProvider = user?.role === "PROVIDER";
  const workspaceItems = isProvider ? providerWorkspace : userWorkspace;
  const dashboardPath = isProvider ? "/app/provider/dashboard" : "/app/user/dashboard";
  const profilePath = isProvider ? "/app/provider/profile" : "/app/user/profile";
  const avatar = getAvatar(user);
  const rating = useMemo(() => getAccountRating(user), [user]);

  const close = () => {
    setOpen(false);
    setLogoutConfirm(false);
  };

  const logout = () => {
    localStorage.removeItem("buddybook_auth_user");
    localStorage.removeItem("buddybook_token");
    localStorage.removeItem("token");
    setUser(null);
    close();
    window.dispatchEvent(new Event("buddybook:auth-changed"));
    navigate("/");
  };

  if (!user) {
    return (
      <Link
        to="/login"
        className="rounded-2xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3]"
      >
        Get Started
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-[1.5rem] bg-[#fff7ed] px-3 py-2 transition hover:bg-[#fff4e6]"
      >
        <img
          src={avatar}
          alt={user.fullName || "Account"}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="hidden min-w-0 text-left sm:block">
          <p className="max-w-[140px] truncate text-xs font-black text-[#111827]">
            {user.fullName || "BuddyBOOK User"}
          </p>
          <p className="mt-0.5 text-[9px] font-bold text-[#6b7280]">
            {user.city || "Your city"}
            {user.state ? `, ${user.state}` : ""}
          </p>
        </div>
        <ChevronDown size={16} className="hidden sm:block" />
      </button>

      {open ? createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/20 px-4">
          <button
            type="button"
            aria-label="Close account drawer"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={close}
          />

          <aside className="absolute bottom-5 right-4 top-5 flex w-[min(calc(100%-2rem),300px)] flex-col overflow-hidden rounded-[1.35rem] bg-[#fffdf9] shadow-[0_30px_120px_rgba(0,0,0,0.28)] sm:right-5 sm:rounded-[1.6rem]">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-black/45">
                <User size={15} />
                Account
              </div>
              <button
                type="button"
                onClick={close}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#f5f3ee] text-black transition hover:bg-[#ece7df]"
                aria-label="Close account menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
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
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-black text-black">
                        <Star size={13} fill="#f59e0b" className="text-[#f59e0b]" />
                        {rating}
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
                    onClick={close}
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
                      onClick={logout}
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
        </div>,
        document.body
      ) : null}
    </>
  );
}

function SimpleLink({ icon: Icon, label, to, onClose }) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 rounded-full px-4 py-2 text-sm font-black text-black/78 transition hover:bg-[#f5f3ee]"
    >
      <Icon size={18} />
      {label}
    </Link>
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
  const providerRating = Number(
    user?.providerProfile?.rating || user?.providerProfile?.averageRating
  );
  if (Number.isFinite(providerRating) && providerRating > 0) {
    return providerRating.toFixed(2);
  }

  return user?.role === "PROVIDER" ? "4.80" : "4.43";
}
