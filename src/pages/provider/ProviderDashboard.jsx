import { BadgeCheck, Calendar, Star, Wallet } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AppShell from "../../components/layout/AppShell";
import StatCard from "../../components/common/StatCard";
import { chartData } from "../../data/mockData";

export default function ProviderDashboard() {
  return (
    <AppShell type="provider">
      <div className="grid gap-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-violet-700 to-blue-600 p-8 text-white shadow-xl">
          <h2 className="text-4xl font-black">Welcome, Provider 👋</h2>

          <p className="mt-3 max-w-2xl text-violet-100">
            Manage your services, pricing, availability, booking requests,
            earnings, payouts and reviews.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <StatCard
            icon={Wallet}
            label="Total Earnings"
            value="₹48,760"
            note="+12%"
          />
          <StatCard icon={Calendar} label="Bookings" value="28" note="+8%" />
          <StatCard
            icon={BadgeCheck}
            label="Profile"
            value="92%"
            note="Almost done"
          />
          <StatCard icon={Star} label="Rating" value="4.8" note="128 reviews" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-[2rem] p-6">
            <h3 className="mb-5 text-xl font-black">Earnings trend</h3>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    strokeWidth={4}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-6">
            <h3 className="text-xl font-black">Booking requests</h3>

            <div className="mt-5 grid gap-4">
              {[
                ["Rahul Sharma", "City Tour", "₹1,600"],
                ["Sneha Iyer", "Shopping", "₹1,800"],
                ["Amit Verma", "Movie", "₹700"],
              ].map(([name, activity, price]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4"
                >
                  <div>
                    <h4 className="font-black">{name}</h4>
                    <p className="text-sm text-slate-500">{activity}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-black">{price}</p>

                    <div className="mt-2 flex gap-2">
                      <button className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">
                        Accept
                      </button>

                      <button className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}