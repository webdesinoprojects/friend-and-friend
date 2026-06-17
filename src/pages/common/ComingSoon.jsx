import { Menu } from "lucide-react";
import AppShell from "../../components/layout/AppShell";

export default function ComingSoon({ type, title }) {
  return (
    <AppShell type={type}>
      <div className="grid min-h-[60vh] place-items-center rounded-[2rem] bg-white p-10 text-center shadow-xl">
        <div>
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-blue-600">
            <Menu />
          </div>

          <h1 className="text-4xl font-black">{title}</h1>

          <p className="mt-3 text-slate-600">
            This page structure is ready. We will build this next.
          </p>
        </div>
      </div>
    </AppShell>
  );
}