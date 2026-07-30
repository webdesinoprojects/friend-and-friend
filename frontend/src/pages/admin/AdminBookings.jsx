import { useEffect, useState } from "react";
import AdminShell from "../../components/layout/AdminShell";
import { formatRs } from "../../utils/format";
import api from "../../api/api";

export default function AdminBookings() {
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get("/admin/bookings", getAdminHeaders()).catch(() => ({ data: { data: [] } })),
      api.get("/admin/logins", getAdminHeaders()).catch(() => ({ data: { data: [] } })),
    ])
      .then(([bookingRes, loginRes]) => {
        if (!mounted) return;
        setBookings(bookingRes.data?.data || []);
        setLogins(loginRes.data?.data || []);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminShell eyebrow="Booking Management" title="Bookings & Login Accounts" text="Track meetup bookings and account login activity.">
      <div className="mb-4 flex gap-3">
        {[
          ["bookings", "Bookings"],
          ["logins", "Login Accounts"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`rounded-2xl px-5 py-3 text-sm font-black ${activeTab === key ? "bg-black text-white" : "bg-white text-black/60"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_14px_45px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="space-y-4 p-8">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-black/5" />)}</div>
        ) : activeTab === "bookings" ? (
          <BookingsTable rows={bookings} />
        ) : (
          <LoginsTable rows={logins} />
        )}
      </div>
    </AdminShell>
  );
}

function BookingsTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="bg-[#f7f7f5] text-xs font-black uppercase tracking-[0.16em] text-black/45">
          <tr>
            <th className="px-5 py-4">Booking ID</th>
            <th>User</th>
            <th>Provider</th>
            <th>Activity</th>
            <th>Amount</th>
            <th>Date & Time</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {rows.length ? rows.map((booking) => (
            <tr key={booking.id} className="transition hover:bg-black/5">
              <td className="px-5 py-4 font-black text-black">{booking.id}</td>
              <td className="font-semibold text-black/65">{booking.userName || "User"}</td>
              <td className="font-semibold text-black/65">{booking.providerName || "Provider"}</td>
              <td className="font-semibold text-black/65">{booking.activity || booking.service || "Meetup"}</td>
              <td className="font-black text-black">{formatRs(Number(booking.amount || 0))}</td>
              <td className="font-semibold text-black/65">{formatDateTime(booking.date, booking.time)}</td>
              <td><StatusPill status={booking.paymentStatus || "PAID"} /></td>
              <td><StatusPill status={booking.status || "CONFIRMED"} /></td>
            </tr>
          )) : (
            <tr><td colSpan="8" className="px-5 py-12 text-center text-sm font-black text-black/45">No backend bookings found yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LoginsTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-[#f7f7f5] text-xs font-black uppercase tracking-[0.16em] text-black/45">
          <tr>
            <th className="px-5 py-4">Account</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Role</th>
            <th>Result</th>
            <th>Message</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {rows.length ? rows.map((login) => (
            <tr key={login.id} className="transition hover:bg-black/5">
              <td className="px-5 py-4 font-black text-black">{login.user?.fullName || "Unknown"}</td>
              <td className="font-semibold text-black/65">{login.email || "Not added"}</td>
              <td className="font-semibold text-black/65">{login.user?.phone || "Not added"}</td>
              <td className="font-semibold text-black/65">{login.user?.role || "-"}</td>
              <td><StatusPill status={login.success ? "SUCCESS" : "FAILED"} /></td>
              <td className="font-semibold text-black/65">{login.message || "-"}</td>
              <td className="font-semibold text-black/65">{formatDateTime(login.createdAt)}</td>
            </tr>
          )) : (
            <tr><td colSpan="7" className="px-5 py-12 text-center text-sm font-black text-black/45">No login attempts found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }) {
  const value = String(status || "").toUpperCase();
  const good = ["PAID", "CONFIRMED", "SUCCESS", "COMPLETED"].includes(value);
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${good ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/65"}`}>{value}</span>;
}

function formatDateTime(dateValue, timeValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return `${dateValue}${timeValue ? ` ${timeValue}` : ""}`;
  return `${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}${timeValue ? `, ${timeValue}` : ""}`;
}

function getAdminHeaders() {
  return {};
}
