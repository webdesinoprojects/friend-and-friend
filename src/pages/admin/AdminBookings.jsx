import { useEffect, useState } from "react";
import AdminShell from "../../components/layout/AdminShell";
import api from "../../api/api";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get("/admin/bookings", getAdminHeaders())
      .then(({ data }) => {
        if (mounted) setBookings(data?.data || []);
      })
      .catch(() => setBookings([]))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminShell
      eyebrow="Booking Management"
      title="All Bookings"
      text="Track every booked meetup, payment status and completion records."
    >
      <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_14px_45px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-black/5" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-[#f7f7f5] text-xs font-black uppercase tracking-[0.16em] text-black/45">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th>Activity</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {bookings.length ? (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="transition hover:bg-black/5">
                      <td className="px-5 py-4 font-black text-black">{booking.id}</td>
                      <td className="font-semibold text-black/65">{booking.message || "Booking"}</td>
                      <td>
                        <StatusPill status={booking.success ? "completed" : "pending"} />
                      </td>
                      <td className="font-bold text-black/55">
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("en-IN") : "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center text-sm font-black text-black/45">
                      No bookings found.
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

function getAdminHeaders() {
  const token = localStorage.getItem("buddybook_admin_token") || localStorage.getItem("buddybook_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

function StatusPill({ status }) {
  const isCompleted = status === "completed";
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
      isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/65"
    }`}>
      {status}
    </span>
  );
}