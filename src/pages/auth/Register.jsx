import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import { PrimaryButton } from "../../components/common/Button";

export default function Register() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Common registration for both users and providers."
    >
      <form
        className="mt-8 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          navigate("/choose-role");
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-blue-500"
            placeholder="Full name"
          />

          <input
            className="rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-blue-500"
            placeholder="Mobile number"
          />
        </div>

        <input
          className="rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-blue-500"
          placeholder="Email address"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="password"
            className="rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-blue-500"
            placeholder="Password"
          />

          <select className="rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-blue-500">
            <option>Select gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input type="checkbox" className="mt-1" required />I confirm I am 18+
          and agree to Terms, Privacy, KYC consent, safety rules, and strictly
          platonic usage.
        </label>

        <PrimaryButton type="submit" className="w-full">
          Continue to Verification
        </PrimaryButton>

        <p className="text-center text-sm text-slate-600">
          Already have account?{" "}
          <Link to="/login" className="font-bold text-blue-600">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}