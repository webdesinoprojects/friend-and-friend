import { Link, NavLink } from "react-router-dom";
import {
  Bell,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  FileText,
  Home,
  Search,
  Settings,
  ShieldCheck,
  Users,
  UserCheck,
} from "lucide-react";
import { useMemo } from "react";

const navItems = [
  { label: "Overview", to: "/admin/dashboard", icon: Home },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Providers", to: "/admin/providers", icon: UserCheck },
  { label: "Bookings", to: "/admin/bookings", icon: CalendarCheck },
  { label: "Payments", to: "/admin/payments", icon: CreditCard },
  { label: "Website Content", to: "/admin/content", icon: FileText },
  { label: "Trust & Safety", to: "/admin/kyc", icon: ShieldCheck },
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

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#101828]">
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
                  `flex items-center gap-4 rounded-2xl px-5 py-4 text-[15px] font-semibold transition ${
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
          <Link to="/admin/kyc" className="mt-4 inline-flex text-sm font-black text-[#0b4aa2]">
            Learn more &rarr;
          </Link>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-[270px]">
        <header className="sticky top-0 z-30 border-b border-transparent bg-[#fbfbfa]/92 px-4 py-7 backdrop-blur sm:px-7 lg:px-10">
          <div className="grid gap-5 xl:grid-cols-[minmax(300px,1fr)_auto] xl:items-start xl:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.02em] text-black">{title}</h1>
              <p className="mt-2 text-base font-medium text-[#4b5563]">{text}</p>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-5 xl:justify-end">
              <label className="flex h-14 w-full min-w-[260px] max-w-[430px] items-center gap-3 rounded-lg border border-[#d7dce3] bg-white px-4 shadow-sm xl:w-[430px]">
                <Search size={19} className="text-[#667085]" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#667085]"
                  placeholder="Search anything..."
                />
                <span className="rounded-md bg-[#f4f4f4] px-2 py-1 text-xs font-bold text-[#344054]">
                  ⌘ K
                </span>
              </label>
              <Link to="/admin/reports" className="relative grid h-12 w-12 place-items-center rounded-full bg-white text-black shadow-sm">
                <Bell size={24} />
                <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[#f6c400] text-xs font-black">
                  3
                </span>
              </Link>
              <div className="flex min-w-fit items-center gap-3">
                <img
                  src="/admin-logo.svg"
                  alt="BuddyBOOK"
                  className="h-11 w-11 rounded-2xl object-contain"
                />
                <Link to="/admin/settings" className="flex items-center gap-2 text-base font-black">
                  {admin?.fullName || "Admin"} <ChevronDown size={18} />
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 pb-8 sm:px-7 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
