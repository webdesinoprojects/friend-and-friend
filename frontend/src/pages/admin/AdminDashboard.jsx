import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Megaphone,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import api from "../../api/api";
import AdminShell from "../../components/layout/AdminShell";

const fallbackSummary = {
  metrics: {
    totalUsers: 0, verifiedProviders: 0, activeBookings: 0, revenueToday: 0, pendingKyc: 0, userCount: 0, providerCount: 0,
  },
  latestProviders: [],
  pendingApprovals: [], charts: { bookingGrowth: [], revenueByWeek: [] }, recentActivity: [], safetyAlerts: [],
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState(fallbackSummary);

  useEffect(() => {
    let mounted = true;
    api.get("/admin/summary").then(({ data }) => {
      if (!mounted) return;
      setSummary({ ...fallbackSummary, ...(data?.data || {}) });
    }).catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = summary.metrics || fallbackSummary.metrics;
  const latestProviders = useMemo(() => {
    const rows = Array.isArray(summary.latestProviders) ? summary.latestProviders : [];
    return rows;
  }, [summary.latestProviders]);

  return (
    <AdminShell title="Admin Overview" text="Manage BuddyBOOK operations and website content">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[repeat(5,minmax(0,1fr))_minmax(180px,1fr)]">
        <MetricCard icon={Users} tone="blue" label="Total Users" value={formatNumber(metrics.totalUsers)} trend="Live" note="database" />
        <MetricCard icon={ShieldCheck} tone="green" label="Verified Providers" value={formatNumber(metrics.verifiedProviders)} trend="Live" note="database" />
        <MetricCard icon={CalendarDays} tone="blue" label="Active Bookings" value={formatNumber(metrics.activeBookings)} trend="Live" note="database" />
        <MetricCard icon={CircleDollarSign} tone="yellow" label="Revenue Today" value={`₹${formatNumber(metrics.revenueToday)}`} trend="Live" note="database" />
        <MetricCard icon={FileCheck2} tone="orange" label="Pending KYC" value={formatNumber(metrics.pendingKyc)} trend="Live" note="database" />
        <div className="hidden rounded-xl border border-[#dedede] bg-white shadow-sm xl:block" />
      </section>

      <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,2.1fr)_minmax(310px,0.9fr)]">
        <div className="grid min-w-0 gap-5">
          <div className="grid min-w-0 gap-5 2xl:grid-cols-[1.05fr_0.95fr_0.55fr]">
            <Panel title="Bookings Growth" action="Last 30 days" actionTo="/admin/bookings">
              <LineChart rows={summary.charts?.bookingGrowth || []} />
            </Panel>
            <Panel title="Revenue by Week" action="Last 8 weeks" actionTo="/admin/payments">
              <BarChart rows={summary.charts?.revenueByWeek || []} />
            </Panel>
            <Panel title="Users vs Providers">
              <DonutChart users={Number(metrics.userCount || 0)} providers={Number(metrics.providerCount || 0)} />
            </Panel>
          </div>

          <Panel title="Recent Activity" action="Live feed" actionTo="/admin/activity">
            <ActivityTable rows={summary.recentActivity || []} />
          </Panel>
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <Panel title="Pending Approvals" link="View all" linkTo="/admin/kyc">
            <ApprovalList rows={summary.pendingApprovals || fallbackSummary.pendingApprovals} />
          </Panel>
          <Panel title="Latest Providers" link="View all" linkTo="/admin/providers">
            <ProviderList providers={latestProviders} />
          </Panel>
          <Panel title="Safety Alerts" link="View all" linkTo="/admin/reports">
            <SafetyAlerts rows={summary.safetyAlerts || []} />
          </Panel>
          <Panel title="Quick Actions">
            <div className="grid grid-cols-2 gap-4">
              <QuickAction icon={UserPlus} label="Add Provider" to="/admin/providers" />
              <QuickAction icon={Megaphone} label="Send Announcement" to="/admin/content" />
              <QuickAction icon={ShieldCheck} label="Review Reports" to="/admin/reports" />
              <QuickAction icon={FileText} label="Export Reports" to="/admin/payments" />
            </div>
          </Panel>
        </aside>
      </section>
    </AdminShell>
  );
}

function MetricCard({ icon: Icon, tone, label, value, trend, note, danger = false }) {
  const tones = {
    blue: "bg-[#eaf2ff] text-[#08285c]",
    green: "bg-[#ebf6e7] text-[#18803a]",
    yellow: "bg-[#fff3d8] text-[#f5a400]",
    orange: "bg-[#fff0e6] text-[#f26d21]",
  };

  return (
    <article className="min-w-0 rounded-xl border border-[#dedede] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${tones[tone]}`}>
          <Icon size={28} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black text-black">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-black">{value}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-[#667085]">
            <span className={danger ? "text-[#d92d20]" : "text-[#039855]"}>{danger ? "▲" : "▲"} {trend}</span>
            <span>{note}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

function Panel({ title, children, action, actionTo, link, linkTo, icon: Icon, info = false, actions }) {
  return (
    <section className="min-w-0 rounded-xl border border-[#dedede] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-transparent px-5 pt-5">
        <h2 className="flex items-center gap-2 text-lg font-black text-black">
          {title}
          {info ? <span className="grid h-4 w-4 place-items-center rounded-full border border-[#98a2b3] text-[10px] text-[#667085]">i</span> : null}
          {Icon ? <Icon size={18} className="text-[#344054]" /> : null}
        </h2>
        {actions || null}
        {action ? (
          <Link to={actionTo || "/admin/dashboard"} className="rounded-md border border-[#d8dce3] bg-white px-3 py-2 text-xs font-semibold">
            {action}
          </Link>
        ) : null}
        {link ? <Link to={linkTo || "/admin/dashboard"} className="text-sm font-black text-[#0b4aa2]">{link}</Link> : null}
      </div>
      <div className="p-5 pt-4">{children}</div>
    </section>
  );
}

function LineChart({ rows = [] }) {
  if (!rows.length) return <ChartEmpty />;
  const max=Math.max(1,...rows.map(row=>Number(row.value||0)));
  const points=rows.map((row,index)=>`${index/Math.max(rows.length-1,1)*500},${190-Number(row.value||0)/max*170}`).join(" ");
  return (
    <svg viewBox="0 0 520 210" className="h-[210px] w-full">
      {[30, 70, 110, 150, 190].map((y) => (
        <line key={y} x1="0" x2="520" y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
      ))}
      <polyline points={points} fill="none" stroke="#0b4ad8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {[0,Math.floor(rows.length/3),Math.floor(rows.length*2/3),rows.length-1].map(index=><text key={index} x={index/Math.max(rows.length-1,1)*470} y="208" fontSize="10" fill="#667085">{rows[index]?.label}</text>)}
    </svg>
  );
}

function BarChart({ rows = [] }) {
  if (!rows.length) return <ChartEmpty />;
  const max=Math.max(1,...rows.map(row=>Number(row.value||0)));
  return (
    <svg viewBox="0 0 520 210" className="h-[210px] w-full">
      {[35, 75, 115, 155, 195].map((y) => (
        <line key={y} x1="0" x2="520" y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
      ))}
      {rows.map((row,index)=>{const height=Number(row.value||0)/max*170;return <rect key={row.label} x={25+index*60} y={195-height} width="24" height={height} rx="3" fill="#071b44"/>})}
      {rows.map((row, index) => (
        <text key={row.label} x={18 + index * 60} y="208" fontSize="10" fill="#667085">{row.label}</text>
      ))}
    </svg>
  );
}

function DonutChart({ users = 0, providers = 0 }) {
  const total=users+providers; const userPercent=total?Math.round(users/total*100):0;
  return (
    <div className="flex h-[210px] items-center justify-center gap-5">
      <div className="relative grid h-36 w-36 place-items-center rounded-full" style={{background:`conic-gradient(#071b44 0 ${userPercent}%,#ffc21c ${userPercent}% 100%)`}}>
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
          <div>
            <p className="text-lg font-black">{formatNumber(total)}</p>
            <p className="text-xs text-[#667085]">Total</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 text-sm font-semibold">
        <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#071b44]" /> Users<br /><span className="ml-5 text-xs text-[#667085]">{formatNumber(users)} ({userPercent}%)</span></p>
        <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#ffc21c]" /> Providers<br /><span className="ml-5 text-xs text-[#667085]">{formatNumber(providers)} ({total?100-userPercent:0}%)</span></p>
      </div>
    </div>
  );
}

function ChartEmpty(){return <div className="grid h-[210px] place-items-center text-sm font-bold text-[#667085]">No database activity for this period.</div>}

function ApprovalList({ rows }) {
  const icons = [Users, UserCheck, FileText, CreditIcon];
  return (
    <div className="divide-y divide-[#e5e7eb]">
      {rows.map((row, index) => {
        const Icon = icons[index] || FileText;
        return (
          <div key={row.label} className="flex items-center gap-3 py-4">
            <Icon size={18} />
            <span className="flex-1 text-sm font-black">{row.label}</span>
            <span className="rounded-md bg-[#fff1df] px-3 py-1 text-sm font-black text-[#f26d21]">{row.count}</span>
            <ChevronRight size={18} className="text-[#667085]" />
          </div>
        );
      })}
    </div>
  );
}

function ProviderList({ providers }) {
  return (
    <div className="space-y-4">
      {providers.map((provider) => {
        const name = provider.user?.fullName || provider.fullName || provider.name || "Provider";
        const title = provider.profession || provider.headline || "Verified Provider";
        return (
          <div key={provider.id || name} className="flex items-center gap-3">
            {provider.user?.profileImage ? <img src={provider.user.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fff1df] text-xs font-black">{name.slice(0,2).toUpperCase()}</span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{name}</p>
              <p className="truncate text-xs font-medium text-[#667085]">{title}</p>
            </div>
            <span className="rounded-md bg-[#e9f8e6] px-3 py-2 text-xs font-black text-[#18803a]">Verified</span>
          </div>
        );
      })}
    </div>
  );
}

function SafetyAlerts({ rows = [] }) {
  return (
    <div className="space-y-4">
      {rows.length ? rows.map((row) => (
        <div key={row.id} className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-[#fff1f1] text-[#d92d20]">
            <AlertTriangle size={17} />
          </span>
          <span className="flex-1 text-sm font-semibold">{row.label}</span>
          <span className="text-xs font-medium text-[#667085]">{new Date(row.createdAt).toLocaleDateString("en-IN")}</span>
        </div>
      )) : <p className="text-sm font-semibold text-[#667085]">No open safety alerts.</p>}
    </div>
  );
}

function ActivityTable({ rows = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="text-xs font-black text-[#344054]">
          <tr>
            <th className="pb-4">Date</th>
            <th className="pb-4">User</th>
            <th className="pb-4">Action</th>
            <th className="pb-4">Details</th>
            <th className="pb-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {rows.length ? rows.map((row) => (
            <tr key={row.id}>
              <td className="py-3 text-[#344054]">{new Date(row.date).toLocaleString("en-IN")}</td>
              <td className="py-3 font-semibold">{row.user}</td>
              <td className="py-3 text-[#344054]">{row.action}</td>
              <td className="py-3 text-[#344054]">{row.details}</td>
              <td className="py-3"><Status value={row.status} /></td>
            </tr>
          )) : <tr><td colSpan="5" className="py-10 text-center text-sm font-bold text-[#667085]">No recent database activity.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Status({ value }) {
  const classes = {
    Completed: "bg-[#e9f8e6] text-[#18803a]",
    Processing: "bg-[#fff8e6] text-[#a15c00]",
    "Under Review": "bg-[#eaf2ff] text-[#0b4aa2]",
  };
  return <span className={`rounded-md px-3 py-1 text-xs font-black ${classes[value] || "bg-[#f2f4f7]"}`}>{value}</span>;
}

function QuickAction({ icon: Icon, label, to }) {
  return (
    <Link to={to} className="grid h-24 place-items-center rounded-lg border border-[#dedede] bg-white px-3 text-center text-xs font-black text-[#071b44] transition hover:bg-[#fff7e6]">
      <Icon size={28} />
      <span>{label}</span>
    </Link>
  );
}

function CreditIcon(props) {
  return <FileCheck2 {...props} />;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}
