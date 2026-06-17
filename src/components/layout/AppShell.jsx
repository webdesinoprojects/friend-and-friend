import {
  Bell,
  Briefcase,
  Calendar,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Search,
  User,
  Wallet,
} from "lucide-react";

import { Link, NavLink } from "react-router-dom";
import Logo from "../common/Logo";

export default function AppShell({ type, children }) {
  const isProvider = type === "provider";

  const menu = isProvider
    ? [
        ["Dashboard", "/app/provider/dashboard", LayoutDashboard],
        ["Services", "/app/provider/services", Briefcase],
        ["Availability", "/app/provider/availability", Calendar],
        ["Bookings", "/app/provider/bookings", MessageCircle],
        ["Earnings", "/app/provider/earnings", Wallet],
      ]
    : [
        ["Dashboard", "/app/user/dashboard", LayoutDashboard],
        ["Search", "/app/user/search", Search],
        ["Bookings", "/app/user/bookings", Calendar],
        ["Wallet", "/app/user/wallet", CreditCard],
        ["Profile", "/choose-role", User],
      ];

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 hidden h-full w-72 border-r border-slate-200 bg-white p-5 lg:block">
        <Logo />

        <div className="mt-8 grid gap-2">
          {menu.map(([label, path, Icon]) => (
            <NavLink
              key={label}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="absolute bottom-5 left-5 right-5 rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase text-slate-400">
            Current mode
          </p>
          <p className="mt-1 font-black capitalize">{type}</p>

          <Link
            to="/choose-role"
            className="mt-3 inline-block text-sm font-bold text-blue-600"
          >
            Switch mode
          </Link>
        </div>
      </aside>

      <main className="lg:pl-72">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500">
                RentAFRND App Panel
              </p>
              <h1 className="text-xl font-black capitalize">{type} panel</h1>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-2xl bg-slate-100 p-3">
                <Bell size={18} />
              </button>

              <Link to="/" className="rounded-2xl bg-slate-100 p-3">
                <LogOut size={18} />
              </Link>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}