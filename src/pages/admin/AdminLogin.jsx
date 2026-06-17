import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import { PrimaryButton } from "../../components/common/Button";

export default function AdminLogin() {
  const navigate = useNavigate();

  return (
    <AuthLayout title="Admin login" subtitle="Private access for platform team.">
      <form
        className="mt-8 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          navigate("/admin/dashboard");
        }}
      >
        <input
          className="rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-blue-500"
          placeholder="Admin email"
        />

        <input
          type="password"
          className="rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-blue-500"
          placeholder="Password"
        />

        <PrimaryButton type="submit" className="w-full">
          Enter Admin Panel
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}