import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Eye, X } from "lucide-react";
import AdminShell from "../../components/layout/AdminShell";
import api from "../../api/api";
import { formatRs } from "../../utils/format";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

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
    const ok = window.confirm(`Are you sure you want to ${action} ${user.fullName}?`);
    if (!ok) return;
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
        <style>{`.users-table th,.users-table td{padding:1rem 1.25rem;vertical-align:middle;white-space:nowrap}.users-table th:first-child,.users-table td:first-child{padding-left:1.25rem}`}</style>
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-black/5" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="users-table w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-[#f7f7f5] text-xs font-black uppercase tracking-[0.16em] text-black/45">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Aadhaar</th>
                  <th>Selfie</th>
                  <th>KYC</th>
                  <th>First Booking</th>
                  <th>Last Booking</th>
                  <th>Total Bookings</th>
                  <th>Total Earning</th>
                  <th>Total Spending</th>
                <th>Status</th>
                <th>Action</th>
                <th></th>
              </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filtered.length ? (
                  filtered.map((user) => (
                    <tr key={user.id} className="transition hover:bg-black/5">
                      <td className="px-5 py-4 font-black text-black">{user.fullName}{user.accountDeleted ? <span className="mt-1 block text-[10px] uppercase tracking-wider text-rose-600">Deleted {formatDate(user.deletedAt)}</span> : null}</td>
                      <td className="font-semibold text-black/65">{user.email || "Not added"}</td>
                      <td className="font-semibold text-black/65">{user.phone}</td>
                      <td className="font-semibold text-black/65">{user.phone || "Not added"}</td>
                      <td>
                        <span className="inline-flex items-center rounded-full bg-black/5 px-3 py-1 text-xs font-black text-black">
                          {user.role === "PROVIDER" ? "Provider" : "User"}
                        </span>
                      </td>
                      <td className="font-semibold text-black/65">{user.city || "Not set"}</td>
                      <td className="font-black text-black">{user.aadhaarLast4 ? `**** ${user.aadhaarLast4}` : "-"}</td>
                      <td>
                        {user.referenceSelfie ? (
                          <button type="button" onClick={() => setPreviewImage(user.referenceSelfie)} className="grid h-9 w-9 place-items-center rounded-full bg-black text-white">
                            <Eye size={16} />
                          </button>
                        ) : "-"}
                      </td>
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
                          {user.accountDeleted ? (
                            <span className="h-2 w-2 rounded-full bg-rose-600" />
                          ) : user.accountDisabled ? (
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                          ) : user.faceStatus === "VERIFIED" ? (
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-black/20" />
                          )}
                          <span className="text-xs font-bold uppercase tracking-[0.12em] text-black/55">
                            {user.accountDeleted ? "Account deleted" : user.accountDisabled ? "Temporarily disabled" : user.faceStatus === "VERIFIED" ? "Verified" : "Unverified"}
                          </span>
                        </span>
                      </td>
                      <td>
                        {user.accountDeleted ? <span className="inline-flex rounded-full bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700">Deleted</span> : <button
                          type="button"
                          onClick={() => toggleBlock(user)}
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black transition ${
                            user.isBlocked
                              ? "bg-black/5 text-black/70 hover:bg-black/10"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {user.isBlocked ? "Unblock" : "Block"}
                        </button>}
                      </td>
                      <td className="pr-4">
                        {!user.accountDeleted ? <button
                          type="button"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-black text-white transition hover:scale-105"
                          aria-label={`Open ${user.fullName} profile`}
                        >
                          <ChevronRight size={17} />
                        </button> : <span className="text-xs font-bold text-black/30">Removed</span>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="17" className="px-5 py-12 text-center text-sm font-black text-black/45">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {previewImage ? <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} /> : null}
    </AdminShell>
  );
}

function ImagePreview({ src, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/55 p-4" onClick={onClose}>
      <div className="relative max-w-sm rounded-3xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black text-white"><X size={16} /></button>
        <img src={src} alt="Live selfie" className="max-h-[70vh] w-full rounded-2xl object-contain" />
      </div>
    </div>
  );
}

function formatMoney(value) {
  if (value === null || value === undefined) return "-";
  return formatRs(value);
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
  return {};
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
