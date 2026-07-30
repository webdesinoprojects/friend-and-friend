import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminAuthLayout from "../../components/layout/AdminAuthLayout";
import { PrimaryButton } from "../../components/common/Button";
import api from "../../api/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

const submit = async (event) => {
  event.preventDefault();
  setMessage("");
  setLoading(true);

  try {
    const { data } = await api.post("/admin/login", form);

    const user = data.user || data.admin || data.data?.user;

    if (!user) {
      throw new Error("Invalid admin login response.");
    }

    localStorage.setItem("buddybook_admin_user", JSON.stringify(user));

    navigate("/admin/dashboard");
  } catch (error) {
    setMessage(error.response?.data?.message || error.message || "Admin login failed.");
  } finally {
    setLoading(false);
  }
};

  return (
    <AdminAuthLayout title="Admin Login" subtitle="Access the admin panel with email and password.">
      <form className="mt-6 grid gap-4" onSubmit={submit}>
        <div>
          <label className="mb-2 block text-sm font-bold text-black">Email</label>
          <input
            type="email"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-black"
            placeholder="admin@example.com"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-black">Password</label>
          <input
            type="password"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-black"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </div>

        {message ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-black text-red-600">
            {message}
          </p>
        ) : null}

        <div className="mt-2">
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "Verifying..." : "Enter Admin Panel"}
          </PrimaryButton>
        </div>
      </form>
    </AdminAuthLayout>
  );
}
