import { Briefcase, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/common/Logo";

export default function ChooseRole() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),#f8fafc] px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <Logo size="large" />

        <div className="mx-auto mt-16 max-w-3xl text-center">
          <p className="font-bold text-blue-600">Profile mode</p>

          <h1 className="mt-3 text-5xl font-black text-slate-950">
            What do you want to do?
          </h1>

          <p className="mt-4 text-lg text-slate-600">
            One account can work as User, Provider, or both.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <button
            onClick={() => navigate("/app/user/dashboard")}
            className="rounded-[2rem] border border-blue-100 bg-white p-8 text-left shadow-xl transition hover:-translate-y-1 hover:border-blue-300"
          >
            <div className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-blue-600">
              <User size={32} />
            </div>

            <h2 className="text-3xl font-black">Continue as User</h2>

            <p className="mt-3 leading-7 text-slate-600">
              Search verified providers, book activities, pay online, chat, and
              share live location during bookings.
            </p>
          </button>

          <button
            onClick={() => navigate("/app/provider/dashboard")}
            className="rounded-[2rem] border border-violet-100 bg-white p-8 text-left shadow-xl transition hover:-translate-y-1 hover:border-violet-300"
          >
            <div className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-violet-50 text-violet-600">
              <Briefcase size={32} />
            </div>

            <h2 className="text-3xl font-black">Become Provider</h2>

            <p className="mt-3 leading-7 text-slate-600">
              Add your services, pricing, availability, KYC, bank/UPI details,
              and receive booking requests.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
