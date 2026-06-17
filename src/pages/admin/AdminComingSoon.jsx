import { LockKeyhole } from "lucide-react";
import AdminShell from "../../components/layout/AdminShell";

export default function AdminComingSoon({ title }) {
  return (
    <AdminShell>
      <div className="grid min-h-[60vh] place-items-center rounded-[2rem] bg-white p-10 text-center shadow-xl">
        <div>
          <LockKeyhole className="mx-auto mb-5 text-blue-600" size={42} />

          <h1 className="text-4xl font-black">{title}</h1>

          <p className="mt-3 text-slate-600">
            This admin module will be built after dashboard base is ready.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}