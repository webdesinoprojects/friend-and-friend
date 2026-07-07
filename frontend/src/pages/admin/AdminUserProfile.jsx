import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import AdminShell from "../../components/layout/AdminShell";
import api from "../../api/api";

export default function AdminUserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .get(`/admin/users/${userId}`, getAdminHeaders())
      .then(({ data }) => {
        if (mounted) setUser(data?.data || null);
      })
      .catch(() => setUser(null))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const toggleBlock = async () => {
    if (!user) return;
    const action = user.isBlocked ? "unblock" : "block";
    const ok = window.confirm(`Are you sure you want to ${action} ${user.fullName}?`);
    if (!ok) return;
    try {
      await api.post(`/admin/users/${user.id}/${action}`, {}, getAdminHeaders());
      setUser((current) => ({ ...current, isBlocked: !current.isBlocked }));
    } catch (error) {
      alert(error.response?.data?.message || `Could not ${action} user.`);
    }
  };

  if (loading) {
    return (
      <AdminShell eyebrow="User Profile" title="Loading user..." text="Fetching account details.">
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-[28px] bg-black/5" />
          ))}
        </div>
      </AdminShell>
    );
  }

  if (!user) {
    return (
      <AdminShell eyebrow="User Profile" title="User not found" text="This account could not be loaded.">
        <Link to="/admin/users" className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-black text-white">
          <ArrowLeft size={16} /> Back to users
        </Link>
      </AdminShell>
    );
  }

  const profile = user.userProfile || {};
  const providerProfile = user.providerProfile || {};
  const summary = user.bookingSummary || {};
  const avatar = user.profileImage || user.referenceSelfie || "";

  return (
    <AdminShell
      eyebrow="User Profile"
      title={user.fullName}
      text="Complete account, verification, booking, and profile information."
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/users" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black text-black">
          <ArrowLeft size={16} /> Back to users
        </Link>
        <button
          type="button"
          onClick={toggleBlock}
          className={`rounded-full px-5 py-3 text-sm font-black ${
            user.isBlocked ? "bg-black/5 text-black" : "bg-red-50 text-red-700"
          }`}
        >
          {user.isBlocked ? "Unblock account" : "Block account"}
        </button>
      </div>

      <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-[30px] border border-black/10 bg-white p-6 shadow-[0_18px_55px_rgba(0,0,0,0.05)]">
          <div className="grid place-items-center">
            {avatar ? (
              <img src={avatar} alt={user.fullName} className="h-44 w-44 rounded-full object-cover" />
            ) : (
              <div className="grid h-44 w-44 place-items-center rounded-full bg-[#fff3d8] text-5xl font-black text-black">
                {getInitials(user.fullName)}
              </div>
            )}
          </div>
          <div className="mt-6 text-center">
            <h2 className="text-3xl font-black text-black">{user.fullName}</h2>
            <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-black/45">{user.role}</p>
          </div>
          <div className="mt-6 grid gap-3">
            <StatusLine label="KYC" value={user.kycStatus || "PENDING"} good={user.kycStatus === "VERIFIED"} />
            <StatusLine label="Face" value={user.faceStatus || "PENDING"} good={user.faceStatus === "VERIFIED"} />
            <StatusLine label="Mobile" value={user.mobileVerified ? "Verified" : "Not verified"} good={user.mobileVerified} />
            <StatusLine label="Email" value={user.emailVerified ? "Verified" : "Not verified"} good={user.emailVerified} />
          </div>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-4">
            <Stat label="Total bookings" value={summary.totalBookings ?? 0} />
            <Stat label="Total spending" value={formatMoney(summary.totalSpending)} />
            <Stat label="Total earning" value={formatMoney(summary.totalEarning)} />
            <Stat label="Last booking" value={formatDate(summary.lastBooking)} />
          </div>

          <Panel title="Account Details">
            <div className="grid gap-3 md:grid-cols-3">
              <Info icon={Mail} label="Email" value={user.email || "Not added"} />
              <Info icon={Phone} label="Phone / Mobile" value={user.phone || "Not added"} />
              <Info icon={MapPin} label="Location" value={[user.city, user.state].filter(Boolean).join(", ") || "Not set"} />
              <Info icon={CalendarDays} label="Joined" value={formatDate(user.createdAt)} />
              <Info icon={User} label="Gender" value={user.gender || "Not added"} />
              <Info icon={CalendarDays} label="DOB" value={user.dob || "Not added"} />
              <Info icon={ShieldCheck} label="Aadhaar" value={user.aadhaarLast4 ? `**** ${user.aadhaarLast4}` : "Not added"} />
              <Info label="Blocked" value={user.isBlocked ? user.blockReason || "Yes" : "No"} />
            </div>
            <div className="mt-5 rounded-3xl border border-black/10 bg-[#fff7ed] p-5">
              <p className="text-sm font-black text-black">Live selfie uploaded during registration</p>
              {user.referenceSelfie ? (
                <button
                  type="button"
                  onClick={() => setPreviewImage(user.referenceSelfie)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-black text-white"
                >
                  <Eye size={16} /> View selfie
                </button>
              ) : (
                <p className="mt-2 text-sm font-semibold text-black/50">No selfie uploaded.</p>
              )}
            </div>
          </Panel>

          <Panel title="User Preferences">
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Bio" value={profile.bio || "Not added"} />
              <Info label="Interests" value={profile.interests || "Not added"} />
              <Info label="Preferred activities" value={profile.preferredActivities || profile.activityPreferences || "Not added"} />
              <Info label="Preferred language" value={profile.preferredLanguage || "Not added"} />
              <Info label="Emergency contact" value={profile.emergencyContact || "Not added"} />
            </div>
          </Panel>

          {user.role === "PROVIDER" || providerProfile.id ? (
            <Panel title="Provider Profile">
              <div className="grid gap-3 md:grid-cols-3">
                <Info label="Headline" value={providerProfile.headline || "Not added"} />
                <Info label="Profession" value={providerProfile.profession || "Not added"} />
                <Info label="Hourly price" value={formatMoney(providerProfile.hourlyPrice)} />
                <Info label="Activities" value={providerProfile.activities || "Not added"} />
                <Info label="Languages" value={providerProfile.languages || "Not added"} />
                <Info label="Education" value={providerProfile.education || "Not added"} />
                <Info label="Provider location" value={providerProfile.location || "Not added"} />
                <Info label="Approved" value={providerProfile.approved ? "Yes" : "No"} />
              </div>
              <p className="mt-4 whitespace-pre-line rounded-3xl bg-[#f7f7f5] p-4 text-sm font-semibold text-black/65">
                {providerProfile.bio || "No provider bio added."}
              </p>
            </Panel>
          ) : null}

          <Panel title="Bookings">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs font-black uppercase tracking-[0.14em] text-black/40">
                  <tr>
                    <th className="py-3">Booking ID</th>
                    <th>User</th>
                    <th>Provider</th>
                    <th>Activity</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {(user.bookings || []).length ? (
                    user.bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="py-4 font-black text-black">{booking.id}</td>
                        <td className="font-semibold text-black/65">{booking.userName || "-"}</td>
                        <td className="font-semibold text-black/65">{booking.providerName || "-"}</td>
                        <td className="font-semibold text-black/65">{booking.activity || booking.service || "-"}</td>
                        <td className="font-semibold text-black/65">{booking.date || formatDate(booking.createdAt)}</td>
                        <td className="font-black text-black">{formatMoney(booking.amount)}</td>
                        <td>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                            {booking.status || "CONFIRMED"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-sm font-black text-black/40">
                        No bookings found for this account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </section>

      {previewImage ? <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} /> : null}
    </AdminShell>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_14px_45px_rgba(0,0,0,0.04)]">
      <h3 className="text-xl font-black text-black">{title}</h3>
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
    <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-black/40">{label}</p>
      <p className="mt-3 text-2xl font-black text-black">{value}</p>
    </div>
  );
}

function StatusLine({ label, value, good }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#f7f7f5] px-4 py-3">
      <span className="text-sm font-black text-black/55">{label}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-black ${good ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/55"}`}>
        {value}
      </span>
    </div>
  );
}

function ImagePreview({ src, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/55 p-4" onClick={onClose}>
      <div className="relative max-w-md rounded-3xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black text-white">
          <X size={16} />
        </button>
        <img src={src} alt="Live selfie" className="max-h-[75vh] w-full rounded-2xl object-contain" />
      </div>
    </div>
  );
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "-";
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
