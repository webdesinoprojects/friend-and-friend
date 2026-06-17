import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import { PrimaryButton } from "../../components/common/Button";

export default function Login() {
  const navigate = useNavigate();

  return (
    <AuthLayout title="Welcome back" subtitle="Login to continue your journey.">
      <form
        className="mt-8 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          navigate("/choose-role");
        }}
      >
        <input
          className="rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-blue-500"
          placeholder="Email or mobile number"
        />

        <input
          type="password"
          className="rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-blue-500"
          placeholder="Password"
        />

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input type="checkbox" className="mt-1" required />I agree to the
          Terms, Privacy Policy and strictly platonic platform rules.
        </label>

        <PrimaryButton type="submit" className="w-full">
          Login
        </PrimaryButton>

        <p className="text-center text-sm text-slate-600">
          New here?{" "}
          <Link to="/register" className="font-bold text-blue-600">
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}