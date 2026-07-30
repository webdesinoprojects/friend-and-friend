import { Link, NavLink } from "react-router-dom";
import {
  Bell,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  Flag,
  FileText,
  Home,
  Search,
  Settings,
  ShieldCheck,
  Users,
  UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const navItems = [
  { label: "Overview", to: "/admin/dashboard", icon: Home },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Providers", to: "/admin/providers", icon: UserCheck },
  { label: "KYC Reviews", to: "/admin/kyc", icon: ShieldCheck },
  { label: "Reports", to: "/admin/reports", icon: Flag, child: true },
  { label: "Bookings", to: "/admin/bookings", icon: CalendarCheck },
  { label: "Payments", to: "/admin/payments", icon: CreditCard },
  { label: "Website Content", to: "/admin/content", icon: FileText },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export default function AdminShell({ children, title = "Admin Overview", text = "Manage BuddyBOOK operations and website content" }) {
  const admin = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("buddybook_admin_user") || "null");
    } catch {
      return null;
    }
  }, []);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/admin/notifications", getAdminHeaders())
      .then(({ data }) => setNotifications(data?.data || []))
      .catch(() => setNotifications([]));
  }, []);

  return (
    <div className="admin-shell min-h-screen overflow-x-hidden bg-[#fbfbfa] text-[#101828]">
      <aside className="fixed left-0 top-0 hidden h-screen w-[270px] border-r border-[#e8e4dc] bg-white px-4 py-7 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2">
          <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-[#0b2857] text-[#ffc21c]">
            <ShieldCheck size={27} strokeWidth={2.4} />
            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[#ffc21c]" />
          </div>
          <div className="leading-tight">
            <p className="text-2xl font-black tracking-tight">
              Buddy<span className="text-[#f6b800]">BOOK</span>
            </p>
            <p className="text-[10px] font-semibold text-[#667085]">Safe Meetups. Real Connections.</p>
          </div>
        </div>

        <nav className="mt-8 flex-1 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 rounded-2xl px-5 py-4 text-[15px] font-semibold transition ${item.child ? "ml-7 border-l-2 border-[#f6b800]" : ""} ${
                    isActive
                      ? "bg-[#fff3d8] text-[#08285c]"
                      : "text-[#101828] hover:bg-[#f7f5ef]"
                  }`
                }
              >
                <Icon size={21} strokeWidth={1.9} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="rounded-2xl bg-[#fff7e6] p-5">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#f6b800] shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <p className="mt-4 text-sm font-black">Safe Platform.</p>
          <p className="mt-1 text-sm font-semibold text-[#667085]">Trusted Community.</p>
          <Link to="/admin/settings" className="mt-4 inline-flex text-sm font-black text-[#0b4aa2]">
            Learn more &rarr;
          </Link>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-[270px]">
        <header className="sticky top-0 z-30 border-b border-[#ece8df] bg-[#fbfbfa]/95 px-4 py-4 backdrop-blur sm:px-7 sm:py-6 lg:px-10 lg:py-7">
          <div className="grid gap-5 xl:grid-cols-[minmax(300px,1fr)_auto] xl:items-start xl:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.02em] text-black sm:text-4xl">{title}</h1>
              <p className="mt-1 text-sm font-medium text-[#4b5563] sm:mt-2 sm:text-base">{text}</p>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-5 xl:justify-end">
              <label className="order-last flex h-12 w-full min-w-0 items-center gap-3 rounded-lg border border-[#d7dce3] bg-white px-4 shadow-sm sm:h-14 xl:order-none xl:w-[430px]">
                <Search size={19} className="text-[#667085]" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#667085]"
                  placeholder="Search anything..."
                />
                <span className="rounded-md bg-[#f4f4f4] px-2 py-1 text-xs font-bold text-[#344054]">
                  ⌘ K
                </span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((value) => !value)}
                  className="relative grid h-12 w-12 place-items-center rounded-full bg-white text-black shadow-sm"
                >
                  <Bell size={24} />
                  {notifications.length ? (
                    <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[#f6c400] text-xs font-black">
                      {Math.min(notifications.length, 9)}
                    </span>
                  ) : null}
                </button>
                {notificationsOpen ? (
                  <div className="fixed inset-x-4 top-20 z-50 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-96">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-black/45">Notifications</p>
                    <div className="mt-3 grid max-h-96 gap-3 overflow-y-auto">
                      {notifications.length ? notifications.map((item) => (
                        <article key={item.id} className="rounded-xl bg-[#fff7ed] p-3">
                          <p className="text-sm font-black">{item.title}</p>
                          <p className="mt-1 text-xs font-semibold text-black/55">{item.detail}</p>
                          <p className="mt-2 text-[10px] font-black text-[#e08c4c]">{formatDateTime(item.createdAt)}</p>
                        </article>
                      )) : (
                        <p className="rounded-xl bg-[#fff7ed] p-4 text-sm font-semibold text-black/55">No booking or login notifications yet.</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex min-w-fit items-center gap-3">
                <img
                  src="/admin-logo.svg"
                  alt="BuddyBOOK"
                  className="h-11 w-11 rounded-2xl object-contain"
                />
                <Link to="/admin/settings" className="flex items-center gap-2 text-sm font-black sm:text-base">
                  <span className="max-w-24 truncate sm:max-w-40">{admin?.fullName || "Admin"}</span> <ChevronDown size={18} />
                </Link>
              </div>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Admin navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return <NavLink key={item.label} to={item.to} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-black ${isActive ? "bg-[#08285c] text-white" : "border border-[#e4e0d8] bg-white text-[#101828]"}`}><Icon size={16}/>{item.label}</NavLink>;
            })}
          </nav>
        </header>

        <div className="px-4 pb-8 sm:px-7 lg:px-10">{children}</div>
      </main>
    </div>
  );
}

function getAdminHeaders() {
  return {};
}

function formatDateTime(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
