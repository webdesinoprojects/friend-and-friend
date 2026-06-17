import { Briefcase, Calendar, Users, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AdminShell from "../../components/layout/AdminShell";
import StatCard from "../../components/common/StatCard";
import { chartData } from "../../data/mockData";

export default function AdminDashboard() {
  return (
    <AdminShell>
      <div className="grid gap-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <h2 className="text-4xl font-black">Platform Overview</h2>

          <p className="mt-3 text-slate-300">
            Manage users, providers, KYC approvals, bookings, payments, reports
            and safety.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <StatCard icon={Users} label="Total Users" value="12,842" note="+12%" />
          <StatCard
            icon={Briefcase}
            label="Providers"
            value="984"
            note="+8%"
          />
          <StatCard
            icon={Calendar}
            label="Bookings"
            value="2,431"
            note="+15%"
          />
          <StatCard icon={Wallet} label="Revenue" value="₹34.9L" note="+18%" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-[2rem] p-6">
            <h3 className="mb-5 text-xl font-black">Bookings by day</h3>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-6">
            <h3 className="text-xl font-black">Pending actions</h3>

            <div className="mt-5 grid gap-4">
              {[
                ["KYC approvals", "42 pending"],
                ["Provider approvals", "18 pending"],
                ["Refund requests", "7 pending"],
                ["Reported chats", "13 pending"],
              ].map(([title, count]) => (
                <div
                  key={title}
                  className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4"
                >
                  <p className="font-black">{title}</p>

                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}