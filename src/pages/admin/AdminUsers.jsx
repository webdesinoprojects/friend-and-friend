import { useEffect, useState } from "react";
import AdminShell from "../../components/layout/AdminShell";
import api from "../../api/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    api
      .get("/admin/users", getAdminHeaders())
      .then(({ data }) => {
        if (mounted) setUsers(data?.data || []);
      })
      .catch(() => setUsers([]))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = users.filter((user) =>
    [user.fullName, user.email, user.phone].join(" ").toLowerCase().includes(query.toLowerCase())
  );

  const toggleBlock = async (user) => {
    const action = user.isBlocked ? "unblock" : "block";
    try {
      await api.post(`/admin/users/${user.id}/${action}`, {}, getAdminHeaders());
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, isBlocked: !item.isBlocked } : item))
      );
    } catch (error) {
      alert(error.response?.data?.message || `Could not ${action} user.`);
    }
  };

  return (
    <AdminShell
      eyebrow="User Management"
      title="All Users"
      text="Manage user accounts across the platform."
    >
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter users by name, email, or phone..."
          className="h-12 w-full max-w-md rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none focus:border-black"
        />
      </div>

      <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_14px_45px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-black/5" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-[#f7f7f5] text-xs font-black uppercase tracking-[0.16em] text-black/45">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>KYC</th>
                  <th>First Booking</th>
                  <th>Last Booking</th>
                  <th>Total Bookings</th>
                  <th>Total Earning</th>
                  <th>Total Spending</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filtered.length ? (
                  filtered.map((user) => (
                    <tr key={user.id} className="transition hover:bg-black/5">
                      <td className="px-5 py-4 font-black text-black">{user.fullName}</td>
                      <td className="font-semibold text-black/65">{user.email || "Not added"}</td>
                      <td className="font-semibold text-black/65">{user.phone}</td>
                      <td>
                        <span className="inline-flex items-center rounded-full bg-black/5 px-3 py-1 text-xs font-black text-black">
                          {user.role === "PROVIDER" ? "Provider" : "User"}
                        </span>
                      </td>
                      <td className="font-semibold text-black/65">{user.city || "Not set"}</td>
                      <td>
                        <StatusPill status={user.kycStatus?.toLowerCase() || "pending"} />
                      </td>
                      <td className="font-semibold text-black/65">{formatDate(user.firstBooking || user.bookingSummary?.firstBooking)}</td>
                      <td className="font-semibold text-black/65">{formatDate(user.lastBooking || user.bookingSummary?.lastBooking)}</td>
                      <td className="font-black text-black">{user.totalBookings ?? user.bookingSummary?.totalBookings ?? 0}</td>
                      <td className="font-semibold text-black/65">{formatMoney(user.totalEarning ?? user.bookingSummary?.totalEarning)}</td>
                      <td className="font-semibold text-black/65">{formatMoney(user.totalSpending ?? user.bookingSummary?.totalSpending)}</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5">
                          {user.faceStatus === "VERIFIED" ? (
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-black/20" />
                          )}
                          <span className="text-xs font-bold uppercase tracking-[0.12em] text-black/55">
                            {user.faceStatus === "VERIFIED" ? "Verified" : "Unverified"}
                          </span>
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleBlock(user)}
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black transition ${
                            user.isBlocked
                              ? "bg-black/5 text-black/70 hover:bg-black/10"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {user.isBlocked ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" className="px-5 py-12 text-center text-sm font-black text-black/45">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function formatMoney(value) {
  if (value === null || value === undefined) return "-";
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAdminHeaders() {
  const token = localStorage.getItem("buddybook_admin_token") || localStorage.getItem("buddybook_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

function StatusPill({ status }) {
  const isVerified = status === "verified" || status === "approved";
  const isRejected = status === "rejected";
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
      isVerified ? "bg-emerald-50 text-emerald-700" :
      isRejected ? "bg-red-50 text-red-700" :
      "bg-black/5 text-black/65"
    }`}>
      {status}
    </span>
  );
}
