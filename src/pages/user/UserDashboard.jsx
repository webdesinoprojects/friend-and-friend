import { BadgeCheck, Calendar, Star, Users, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AppShell from "../../components/layout/AppShell";
import StatCard from "../../components/common/StatCard";
import { chartData, providers } from "../../data/mockData";
import { Link } from "react-router-dom";

export default function UserDashboard() {
  return (
    <AppShell type="user">
      <div className="grid gap-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-blue-600 to-violet-700 p-8 text-white shadow-xl">
          <h2 className="text-4xl font-black">Welcome, User 👋</h2>

          <p className="mt-3 max-w-2xl text-blue-100">
            Search providers, book activities, pay safely, chat in-app, and use
            live location during the meeting.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <StatCard icon={Calendar} label="Upcoming" value="3" note="+1 today" />
          <StatCard icon={Users} label="Saved Providers" value="18" note="+4" />
          <StatCard
            icon={Wallet}
            label="Total Spent"
            value="₹12,450"
            note="+18%"
          />
          <StatCard icon={Star} label="Avg Rating" value="4.8" note="Excellent" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass-card rounded-[2rem] p-6 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-black">Discover providers</h3>

              <Link to="/app/user/search" className="font-bold text-blue-600">
                View all
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {providers.map((provider) => (
                <div
                  key={provider.name}
                  className="rounded-3xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-3xl">
                    {provider.gender === "Female" ? "👩" : "👨"}
                  </div>

                  <h4 className="font-black">{provider.name}</h4>

                  <p className="text-sm text-slate-500">
                    {provider.profession}
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {provider.city} · {provider.price}
                  </p>

                  <div className="mt-3 flex items-center gap-1 text-sm font-bold text-amber-500">
                    <Star size={16} fill="currentColor" /> {provider.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-6">
            <h3 className="text-xl font-black">Safety status</h3>

            <div className="mt-5 grid gap-3">
              {[
                "Mobile verified",
                "Email verified",
                "KYC pending",
                "Emergency contact added",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold"
                >
                  <BadgeCheck className="text-emerald-500" size={18} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-6">
          <h3 className="mb-5 text-xl font-black">Monthly booking trend</h3>

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
      </div>
    </AppShell>
  );
}