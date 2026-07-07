import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, Eye, Mail, MapPin, Phone, ShieldCheck, User, X } from "lucide-react";
import AdminShell from "../../components/layout/AdminShell";
import api from "../../api/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

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
      setSelectedUser((current) =>
        current?.id === user.id ? { ...current, isBlocked: !current.isBlocked } : current
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
                      <td className="px-5 py-4 font-black text-black">{user.fullName}</td>
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
                      <td className="pr-4">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-black text-white transition hover:scale-105"
                          aria-label={`Open ${user.fullName} profile`}
                        >
                          <ChevronRight size={17} />
                        </button>
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
      {selectedUser ? (
        <UserProfileDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onPreviewSelfie={(src) => setPreviewImage(src)}
          onToggleBlock={toggleBlock}
        />
      ) : null}
    </AdminShell>
  );
}

function UserProfileDrawer({ user, onClose, onPreviewSelfie, onToggleBlock }) {
  const avatar = user.profileImage || user.referenceSelfie || "";
  const profile = user.userProfile || {};
  const summary = user.bookingSummary || {};

  return (
    <div className="fixed inset-0 z-[9998] bg-black/35 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-3xl flex-col overflow-hidden bg-[#fbfbfa] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-black/45">User Profile</p>
            <h2 className="mt-1 text-3xl font-black text-black">{user.fullName}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-black text-white">
            <X size={18} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
          <section className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="grid place-items-center">
                {avatar ? (
                  <img src={avatar} alt={user.fullName} className="h-36 w-36 rounded-full object-cover" />
                ) : (
                  <div className="grid h-36 w-36 place-items-center rounded-full bg-[#fff3d8] text-4xl font-black text-black">
                    {getInitials(user.fullName)}
                  </div>
                )}
              </div>
              <div className="mt-5 text-center">
                <p className="text-xl font-black">{user.fullName}</p>
                <p className="mt-1 text-sm font-semibold text-black/55">{user.role || "USER"}</p>
              </div>
              <button
                type="button"
                onClick={() => onToggleBlock(user)}
                className={`mt-5 w-full rounded-2xl px-5 py-3 text-sm font-black ${
                  user.isBlocked ? "bg-black/5 text-black" : "bg-red-50 text-red-700"
                }`}
              >
                {user.isBlocked ? "Unblock user" : "Block user"}
              </button>
            </div>

            <div className="grid gap-5">
              <Panel title="Account Details">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info icon={Mail} label="Email" value={user.email || "Not added"} />
                  <Info icon={Phone} label="Mobile" value={user.phone || "Not added"} />
                  <Info icon={MapPin} label="Location" value={[user.city, user.state].filter(Boolean).join(", ") || "Not set"} />
                  <Info icon={CalendarDays} label="Joined" value={formatDate(user.createdAt)} />
                  <Info icon={User} label="Gender" value={user.gender || "Not added"} />
                  <Info icon={CalendarDays} label="DOB" value={user.dob || "Not added"} />
                </div>
              </Panel>

              <Panel title="Verification & KYC">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Info icon={ShieldCheck} label="KYC status" value={user.kycStatus || "PENDING"} />
                  <Info icon={ShieldCheck} label="Face status" value={user.faceStatus || "PENDING"} />
                  <Info icon={ShieldCheck} label="Aadhaar" value={user.aadhaarLast4 ? `**** ${user.aadhaarLast4}` : "Not added"} />
                </div>
                <div className="mt-4 rounded-2xl border border-black/10 bg-[#fff7ed] p-4">
                  <p className="text-sm font-black">Live selfie</p>
                  {user.referenceSelfie ? (
                    <button
                      type="button"
                      onClick={() => onPreviewSelfie(user.referenceSelfie)}
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-black text-white"
                    >
                      <Eye size={16} /> View selfie
                    </button>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-black/50">No selfie uploaded.</p>
                  )}
                </div>
              </Panel>

              <Panel title="User Profile">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Bio" value={profile.bio || "Not added"} />
                  <Info label="Interests" value={profile.interests || "Not added"} />
                  <Info label="Preferred activities" value={profile.preferredActivities || profile.activityPreferences || "Not added"} />
                  <Info label="Preferred language" value={profile.preferredLanguage || "Not added"} />
                  <Info label="Emergency contact" value={profile.emergencyContact || "Not added"} />
                </div>
              </Panel>

              <Panel title="Booking Summary">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Stat label="First booking" value={formatDate(user.firstBooking || summary.firstBooking)} />
                  <Stat label="Last booking" value={formatDate(user.lastBooking || summary.lastBooking)} />
                  <Stat label="Total bookings" value={user.totalBookings ?? summary.totalBookings ?? 0} />
                  <Stat label="Total spending" value={formatMoney(user.totalSpending ?? summary.totalSpending)} />
                </div>
              </Panel>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-black">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#f7f7f5] p-4">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-black/40">
        {Icon ? <Icon size={14} /> : null}
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-black">{value}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#fff7ed] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/40">{label}</p>
      <p className="mt-2 text-base font-black text-black">{value}</p>
    </div>
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

function getInitials(name = "") {
  const parts = String(name || "User").trim().split(/\s+/);
  return `${parts[0]?.[0] || "U"}${parts[1]?.[0] || ""}`.toUpperCase();
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
