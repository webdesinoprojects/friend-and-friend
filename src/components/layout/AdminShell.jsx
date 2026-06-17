import {
  BadgeCheck,
  Briefcase,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import Logo from "../common/Logo";

export default function AdminShell({ children }) {
  const menu = [
    ["Overview", "/admin/dashboard", LayoutDashboard],
    ["Users", "/admin/users", Users],
    ["Providers", "/admin/providers", Briefcase],
    ["KYC", "/admin/kyc", BadgeCheck],
    ["Payments", "/admin/payments", CreditCard],
    ["Reports", "/admin/reports", ShieldCheck],
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
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </aside>

      <main className="lg:pl-72">
        <div className="border-b border-slate-200 bg-white px-5 py-4">
          <h1 className="text-xl font-black">Admin Control Center</h1>
        </div>

        <div className="p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}