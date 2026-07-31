import { useEffect, useState } from "react";
import AdminShell from "../../components/layout/AdminShell";
import { getAdminPage } from "../../api/admin";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAdminPage("/admin/payments", getAdminHeaders())
      .then(({ data }) => {
        if (mounted) setPayments(data?.data || []);
      })
      .catch(() => setPayments([]))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminShell
      eyebrow="Payment Records"
      title="Payments, Refunds & Payouts"
      text="All payment transactions, refund requests and provider payouts are listed here."
    >
      <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_14px_45px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-black/5" />
            ))}
          </div>
        ) : payments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-[#f7f7f5] text-xs font-black uppercase tracking-[0.16em] text-black/45">
                <tr>
                  <th className="px-5 py-4">Transaction ID</th>
                  <th>User/Provider</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {payments.map((payment) => (
                  <tr key={payment.id} className="transition hover:bg-black/5">
                    <td className="px-5 py-4 font-black text-black">{payment.id}</td>
                    <td className="font-semibold text-black/65">{payment.userName || "System"}</td>
                    <td className="font-bold text-black">
                      ${payment.amount}
                    </td>
                    <td>
                      <span className="inline-flex items-center rounded-full bg-black/5 px-3 py-1 text-xs font-black text-black">
                        {payment.type || "PAYMENT"}
                      </span>
                    </td>
                    <td>
                      <StatusPill status={payment.status?.toLowerCase() || "completed"} />
                    </td>
                    <td className="font-semibold text-black/55">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("en-IN") : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-sm font-black text-black/45">No payment records yet.</p>
            <p className="mt-2 text-xs font-semibold text-black/40">
              Payment data will appear when bookings are made.
            </p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function getAdminHeaders() {
  return {};
}

function StatusPill({ status }) {
  const isSuccess = status === "completed" || status === "success" || status === "paid";
  const isFailed = status === "failed" || status === "refunded";
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
      isSuccess ? "bg-emerald-50 text-emerald-700" :
      isFailed ? "bg-red-50 text-red-700" :
      "bg-black/5 text-black/65"
    }`}>
      {status}
    </span>
  );
}
