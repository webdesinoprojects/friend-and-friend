import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Megaphone,
  Monitor,
  Send,
  ShieldCheck,
  Upload,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import api from "../../api/api";
import AdminShell from "../../components/layout/AdminShell";
import ImageField from "../../components/admin/ImageField";

const fallbackContent = {
  heroTitle: "Safe Meetups. Real Connections.",
  heroHighlight: "Find trusted people. Book with confidence.",
  heroImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1100&auto=format&fit=crop&q=85",
  communityTitle: "Built for a Better Community",
  trustTitle: "Safety and trust come first on BuddyBOOK.",
};

const fallbackSummary = {
  metrics: {
    totalUsers: 12458,
    verifiedProviders: 1245,
    activeBookings: 382,
    revenueToday: 8742,
    pendingKyc: 37,
  },
  latestProviders: [],
  pendingApprovals: [
    { label: "KYC Verifications", count: 37 },
    { label: "Provider Applications", count: 12 },
    { label: "Content Reports", count: 5 },
    { label: "Payout Requests", count: 8 },
  ],
};

export default function AdminDashboard() {
  const [content, setContent] = useState(fallbackContent);
  const [summary, setSummary] = useState(fallbackSummary);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("All changes saved");
  const [previewMode, setPreviewMode] = useState("desktop");

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      api.get("/admin/content"),
      api.get("/admin/summary"),
    ]).then(([contentResult, summaryResult]) => {
      if (!mounted) return;
      if (contentResult.status === "fulfilled") {
        setContent({ ...fallbackContent, ...(contentResult.value.data?.data || {}) });
      }
      if (summaryResult.status === "fulfilled") {
        setSummary({ ...fallbackSummary, ...(summaryResult.value.data?.data || {}) });
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = summary.metrics || fallbackSummary.metrics;
  const latestProviders = useMemo(() => {
    const rows = Array.isArray(summary.latestProviders) ? summary.latestProviders : [];
    if (rows.length) return rows;
    return [
      { id: "sarah", user: { fullName: "Sarah Johnson" }, profession: "Yoga Instructor" },
      { id: "david", user: { fullName: "David Chen" }, profession: "Personal Trainer" },
      { id: "aisha", user: { fullName: "Aisha Patel" }, profession: "Life Coach" },
      { id: "michael", user: { fullName: "Michael Brown" }, profession: "Photography Guide" },
    ];
  }, [summary.latestProviders]);

  const updateField = (field, value) => {
    setContent((current) => ({ ...current, [field]: value }));
  };

  const saveContent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const { data } = await api.put("/admin/content", content);
      setContent({ ...fallbackContent, ...(data?.data || {}) });
      setMessage("All changes saved");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update website");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Admin Overview" text="Manage BuddyBOOK operations and website content">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[repeat(5,minmax(0,1fr))_minmax(180px,1fr)]">
        <MetricCard icon={Users} tone="blue" label="Total Users" value={formatNumber(metrics.totalUsers)} trend="8.4%" note="vs last 7 days" />
        <MetricCard icon={ShieldCheck} tone="green" label="Verified Providers" value={formatNumber(metrics.verifiedProviders)} trend="6.7%" note="vs last 7 days" />
        <MetricCard icon={CalendarDays} tone="blue" label="Active Bookings" value={formatNumber(metrics.activeBookings)} trend="12.3%" note="vs last 7 days" />
        <MetricCard icon={CircleDollarSign} tone="yellow" label="Revenue Today" value={`$${formatNumber(metrics.revenueToday)}`} trend="15.2%" note="vs yesterday" />
        <MetricCard icon={FileCheck2} tone="orange" label="Pending KYC" value={formatNumber(metrics.pendingKyc)} trend="18.6%" note="vs last 7 days" danger />
        <div className="hidden rounded-xl border border-[#dedede] bg-white shadow-sm xl:block" />
      </section>

      <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,2.1fr)_minmax(310px,0.9fr)]">
        <div className="grid min-w-0 gap-5">
          <div className="grid min-w-0 gap-5 2xl:grid-cols-[1.05fr_0.95fr_0.55fr]">
            <Panel title="Bookings Growth" action="Last 30 days" actionTo="/admin/bookings">
              <LineChart />
            </Panel>
            <Panel title="Revenue by Week" action="Last 8 weeks" actionTo="/admin/payments">
              <BarChart />
            </Panel>
            <Panel title="Users vs Providers">
              <DonutChart total={Number(metrics.totalUsers || 0) + Number(metrics.verifiedProviders || 0)} />
            </Panel>
          </div>

          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(360px,0.78fr)_minmax(0,1.22fr)]">
            <Panel title="Website Content Control" info>
              <form onSubmit={saveContent} className="space-y-3">
                <ContentInput label="Hero Title" value={content.heroTitle} onChange={(value) => updateField("heroTitle", value)} />
                <ContentInput label="Hero Highlight" value={content.heroHighlight} onChange={(value) => updateField("heroHighlight", value)} />
                <ImageField
                  label="Hero Image"
                  value={content.heroImage}
                  onChange={(value) => updateField("heroImage", value)}
                  onMessage={setMessage}
                />
                <ContentInput label="Community Title" value={content.communityTitle} onChange={(value) => updateField("communityTitle", value)} />
                <ContentInput label="Trust Title" value={content.trustTitle} onChange={(value) => updateField("trustTitle", value)} />
                <div className="flex items-center justify-between gap-4 pt-2">
                  <button type="submit" disabled={saving} className="h-12 w-60 rounded-md bg-[#081e49] text-sm font-black text-white disabled:opacity-50">
                    {saving ? "Updating..." : "Update Website"}
                  </button>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#344054]">
                    <CheckCircle2 size={15} className="text-[#149647]" /> {message || "Saving..."}
                  </span>
                </div>
              </form>
            </Panel>

            <Panel
              title="Live Preview"
              icon={Monitor}
              actions={
                <div className="flex rounded-md border border-[#d8dce3] bg-white p-1">
                  {["desktop", "mobile"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPreviewMode(mode)}
                      className={`rounded px-3 py-1.5 text-xs font-black capitalize ${
                        previewMode === mode ? "bg-[#081e49] text-white" : "text-[#344054]"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              }
            >
              <LivePreview content={content} mode={previewMode} />
            </Panel>
          </div>

          <Panel title="Recent Activity">
            <ActivityTable />
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
            <SafetyAlerts />
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

function ContentInput({ label, value, onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-black">{label}</span>
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-[#d8dce3] bg-white px-3 text-sm font-medium outline-none focus:border-[#08285c]"
      />
    </label>
  );
}

function LineChart() {
  const points = "0,132 28,122 56,95 84,116 112,104 140,78 168,49 196,65 224,35 252,22 280,55 308,58 336,28 364,30 392,4 420,23 448,0 476,36 504,42";
  return (
    <svg viewBox="0 0 520 210" className="h-[210px] w-full">
      {[30, 70, 110, 150, 190].map((y) => (
        <line key={y} x1="0" x2="520" y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
      ))}
      <polyline points={points} fill="none" stroke="#0b4ad8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="0" y="208" fontSize="12" fill="#667085">May 1</text>
      <text x="150" y="208" fontSize="12" fill="#667085">May 8</text>
      <text x="300" y="208" fontSize="12" fill="#667085">May 22</text>
      <text x="450" y="208" fontSize="12" fill="#667085">May 29</text>
    </svg>
  );
}

function BarChart() {
  const bars = [78, 91, 112, 132, 148, 171, 191];
  return (
    <svg viewBox="0 0 520 210" className="h-[210px] w-full">
      {[35, 75, 115, 155, 195].map((y) => (
        <line key={y} x1="0" x2="520" y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
      ))}
      {bars.map((height, index) => (
        <rect key={index} x={35 + index * 65} y={195 - height} width="18" height={height} rx="3" fill="#071b44" />
      ))}
      {["Apr 7", "Apr 21", "May 5", "May 19", "Jun 2"].map((label, index) => (
        <text key={label} x={20 + index * 115} y="208" fontSize="12" fill="#667085">{label}</text>
      ))}
    </svg>
  );
}

function DonutChart({ total }) {
  return (
    <div className="flex h-[210px] items-center justify-center gap-5">
      <div className="relative grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(#071b44_0_91%,#ffc21c_91%_100%)]">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
          <div>
            <p className="text-lg font-black">{formatNumber(total || 13703)}</p>
            <p className="text-xs text-[#667085]">Total</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 text-sm font-semibold">
        <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#071b44]" /> Users<br /><span className="ml-5 text-xs text-[#667085]">12,458 (90.9%)</span></p>
        <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#ffc21c]" /> Providers<br /><span className="ml-5 text-xs text-[#667085]">1,245 (9.1%)</span></p>
      </div>
    </div>
  );
}

function LivePreview({ content, mode }) {
  const heroImage = content.heroImage || fallbackContent.heroImage;
  const mobile = mode === "mobile";
  return (
    <div className="max-h-[540px] overflow-auto rounded-md border border-[#d8dce3] bg-[#f2f4f7] p-3">
      <div className={`mx-auto overflow-hidden rounded-md border border-[#d8dce3] bg-white shadow-sm ${mobile ? "w-[320px]" : "min-w-[640px]"}`}>
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-3 text-xs font-black">
          <span>Buddy<span className="text-[#f6b800]">BOOK</span></span>
          <div className={`${mobile ? "hidden" : "flex"} gap-8`}>
            <span>How It Works</span>
            <span>Providers</span>
            <span>Community</span>
            <span>Safety</span>
          </div>
          <span className="rounded-md bg-[#ffc21c] px-4 py-2">Sign Up</span>
        </div>
        <div
          className={`relative grid content-center overflow-hidden bg-cover bg-center ${mobile ? "min-h-[430px] px-6" : "min-h-[255px] px-12"}`}
          style={{ backgroundImage: `linear-gradient(90deg, rgba(255,246,231,0.96), rgba(255,246,231,0.62), rgba(255,246,231,0.12)), url(${heroImage})` }}
        >
          <h3 className={`max-w-[390px] font-black leading-tight text-[#071b44] ${mobile ? "text-3xl" : "text-4xl"}`}>
            {content.heroTitle || fallbackContent.heroTitle}
          </h3>
          <p className={`mt-4 max-w-[300px] font-black leading-6 text-black ${mobile ? "text-base" : "text-lg"}`}>
            {content.heroHighlight || fallbackContent.heroHighlight}
          </p>
          <button className="mt-5 w-fit rounded-md bg-[#ffc21c] px-6 py-3 text-sm font-black" type="button">
            Get Started
          </button>
        </div>
        <div className="bg-white px-8 py-6 text-center">
          <p className="font-black">{content.communityTitle || fallbackContent.communityTitle}</p>
          <p className="mt-2 text-xs font-medium text-[#667085]">Join thousands of verified people building meaningful connections.</p>
          <div className={`mx-auto mt-5 grid gap-3 ${mobile ? "grid-cols-1" : "max-w-lg grid-cols-3"}`}>
            {["Verified", "Payments", "Safety"].map((item) => (
              <div key={item} className="rounded-lg border border-[#e5e7eb] bg-[#fbfbfa] p-4 text-sm font-black">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
      {providers.map((provider, index) => {
        const name = provider.user?.fullName || provider.fullName || provider.name || "Provider";
        const title = provider.profession || provider.headline || "Verified Provider";
        return (
          <div key={provider.id || name} className="flex items-center gap-3">
            <img
              src={provider.user?.profileImage || `https://i.pravatar.cc/80?img=${index + 12}`}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
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

function SafetyAlerts() {
  return (
    <div className="space-y-4">
      {[
        ["3 new safety reports", "2h ago", "red"],
        ["User blocked", "5h ago", "red"],
        ["KYC expiring soon", "12h ago", "yellow"],
      ].map(([label, time, tone]) => (
        <div key={label} className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-md ${tone === "red" ? "bg-[#fff1f1] text-[#d92d20]" : "bg-[#fff8e6] text-[#f5a400]"}`}>
            <AlertTriangle size={17} />
          </span>
          <span className="flex-1 text-sm font-semibold">{label}</span>
          <span className="text-xs font-medium text-[#667085]">{time}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityTable() {
  const rows = [
    ["Jun 2, 2025 10:35 AM", "Sarah Johnson", "Provider Verified", "Yoga Instructor", "Completed"],
    ["Jun 2, 2025 09:18 AM", "Mike Anderson", "Booking Created", "Personal Training Session", "Completed"],
    ["Jun 2, 2025 08:47 AM", "Aisha Patel", "Payout Requested", "Amount: $320.00", "Processing"],
    ["Jun 2, 2025 07:21 AM", "System", "Safety Report", "Inappropriate Behavior", "Under Review"],
  ];
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
          {rows.map((row) => (
            <tr key={row.join("-")}>
              <td className="py-3 text-[#344054]">{row[0]}</td>
              <td className="py-3 font-semibold">{row[1]}</td>
              <td className="py-3 text-[#344054]">{row[2]}</td>
              <td className="py-3 text-[#344054]">{row[3]}</td>
              <td className="py-3"><Status value={row[4]} /></td>
            </tr>
          ))}
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
