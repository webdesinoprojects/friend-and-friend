import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ProviderDashboardCharts({ data }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <ChartCard title="Weekly profile performance" subtitle="Views and booking requests">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="views" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#e08c4c" stopOpacity={0.34} />
                <stop offset="95%" stopColor="#e08c4c" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eddac7" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="views" stroke="#e08c4c" strokeWidth={3} fill="url(#views)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Revenue estimate" subtitle="Projected weekly earnings">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eddac7" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="revenue" radius={[10, 10, 0, 0]} fill="#111111" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="h-[260px] rounded-none border border-[#eddac7] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(83,52,30,0.1)]">
      <div className="mb-4">
        <h2 className="text-lg font-black">{title}</h2>
        <p className="text-xs font-bold text-[#8b7563]">{subtitle}</p>
      </div>
      <div className="h-[185px]">{children}</div>
    </div>
  );
}
