import { LockKeyhole } from "lucide-react";
import AdminShell from "../../components/layout/AdminShell";

export default function AdminComingSoon({ title }) {
  return (
    <AdminShell>
      <div className="grid min-h-[50vh] place-items-center rounded-[28px] border border-black/10 bg-white p-10 text-center shadow-[0_14px_45px_rgba(0,0,0,0.04)]">
        <div>
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-black text-white">
            <LockKeyhole size={28} />
          </div>

          <h1 className="text-3xl font-black tracking-tight">{title}</h1>

          <p className="mt-3 text-sm font-semibold leading-6 text-black/55 max-w-sm mx-auto">
            This module is currently under development. Check back later for updates.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}