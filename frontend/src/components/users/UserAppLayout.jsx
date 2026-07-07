import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  Heart,
  LayoutDashboard,
  Menu,
  Settings,
  Star,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { ComingSoonMessageButton, NotificationBell } from "../common/HeaderActions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

const userLinks = [
  { label: "Dashboard", to: "/app/user/dashboard", icon: LayoutDashboard },
  { label: "Watch List", to: "/app/user/watchlist", icon: Heart },
  { label: "Bookings", to: "/app/user/bookings", icon: CalendarCheck },
  { label: "Payments", to: "/app/user/wallet", icon: Wallet },
  { label: "Reviews", to: "/app/user/reviews", icon: Star },
  { label: "Profile", to: "/app/user/profile", icon: User },
  { label: "Settings", to: "/app/user/settings", icon: Settings },
];

export default function UserAppLayout({
  children,
  title = "Dashboard",
  user,
  searchValue = "",
  onSearchChange,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = readStoredUser();
  const activeUser = user || storedUser;
  const pageName = getPageName(location.pathname, title);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="h-dvh overflow-hidden bg-[#fff7ed] p-2 text-[#14231f] sm:p-3">
      <div className="mx-auto h-full max-w-[1900px]">
        <div className="flex h-full min-h-0 min-w-0 flex-col gap-3">
          <header className="flex h-16 shrink-0 items-center justify-between rounded-[1.5rem] border border-[#eddac7] bg-white px-4 shadow-sm sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eddac7] bg-[#fffaf3] text-black transition hover:bg-[#ffeedd]"
                aria-label="Open user workspace menu"
              >
                <Menu size={18} />
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-[#fffaf3] transition hover:bg-[#d67f3d]"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>
              <Breadcrumb className="min-w-0">
                <BreadcrumbList className="gap-1.5">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        to="/app/user/dashboard"
                        className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7563] transition hover:text-black"
                      >
                        User Workspace
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-[#8b7563]/45" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="truncate text-base font-black capitalize tracking-tight text-[#111827]">
                      {pageName}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <ComingSoonMessageButton />
            </div>
          </header>

          {drawerOpen ? (
            <div className="fixed inset-0 z-[10000] bg-black/35 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
              <aside
                className="h-full w-[min(86vw,330px)] bg-white p-5 shadow-[20px_0_70px_rgba(0,0,0,0.2)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7563]">
                      User Workspace
                    </p>
                    <h2 className="mt-1 text-2xl font-black capitalize">{pageName}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-black text-[#fffaf3]"
                    aria-label="Close user workspace menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-6 rounded-2xl bg-[#fffaf3] p-4">
                  <p className="text-lg font-black">{activeUser?.fullName || "BuddyBOOK User"}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#6b5d52]">
                    {activeUser?.email || activeUser?.phone || "Profile details"}
                  </p>
                </div>

                <nav className="mt-6 grid gap-2">
                  {userLinks.map(({ label, to, icon: Icon }) => (
                    <Link
                      key={label}
                      to={to}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-black transition hover:bg-[#ffeedd]"
                    >
                      <Icon size={18} />
                      {label}
                    </Link>
                  ))}
                </nav>
              </aside>
            </div>
          ) : null}

          <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function getPageName(pathname, fallback) {
  const parts = pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || fallback || "dashboard";
  if (last === "search") return "Dashboard";
  if (last === "wallet") return "Payments";
  return String(last).replace(/-/g, " ");
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}
