export default function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon size={22} />
      </div>

      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <h3 className="mt-1 text-2xl font-black text-slate-950">{value}</h3>
      <p className="mt-1 text-xs font-semibold text-emerald-600">{note}</p>
    </div>
  );
}