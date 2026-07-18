import { PackageCheck, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/layout/AdminShell";
import { formatDate, formatMoney } from "./adminData";
import api from "../../api/api";

export default function AdminOrders() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadOrders = useCallback(() => {
    setLoading(true); setError("");
    api.get("/admin/bookings").then(({ data }) => setOrders((data?.data || []).map(toOrder))).catch(() => setError("Orders could not be loaded from the server.")).finally(() => setLoading(false));
  }, []);
  useEffect(() => { loadOrders(); }, [loadOrders]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) =>
      [order.id, order.name, order.customerName, order.providerName, order.status]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [orders, query]);

  return (
    <AdminShell>
      <section className="grid gap-5">
        <AdminHeader
          icon={PackageCheck}
          eyebrow="Order management"
          title="All Orders"
          text="Every booked order is listed with image, name, quantity, price, customer and payment status."
        />

        <div className="rounded-2xl border border-[#eddac7] bg-white p-4 shadow-sm">
          <label className="relative block">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7563]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, customer, provider or status"
              className="h-12 w-full rounded-xl border border-[#eddac7] bg-[#fffaf3] pl-11 pr-4 text-sm font-bold outline-none focus:border-black"
            />
          </label>
        </div>

        {error ? <LoadError message={error} onRetry={loadOrders} /> : loading ? <LoadingRows /> : <OrderTable orders={visible} empty="No booked orders found yet." />}
      </section>
    </AdminShell>
  );
}

export function toOrder(booking) {
  return { id: booking.id, image: booking.providerImage || "", name: booking.service || booking.activity || "BuddyBOOK booking", customerName: booking.userName || "Customer", providerName: booking.providerName || "Provider", quantity: Number(booking.durationHours || 1), price: Number(booking.amount || 0), date: booking.date || booking.createdAt, status: String(booking.status || "PENDING").toUpperCase(), paymentStatus: String(booking.paymentStatus || "PENDING").toUpperCase() };
}
export function LoadingRows() { return <div className="space-y-3 rounded-2xl border bg-white p-6">{Array.from({length:6},(_,i)=><div key={i} className="h-12 animate-pulse rounded-xl bg-black/5" />)}</div>; }
export function LoadError({ message, onRetry }) { return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p className="text-sm font-black text-red-700">{message}</p><button type="button" onClick={onRetry} className="mt-3 rounded-xl bg-black px-5 py-2.5 text-xs font-black text-white">Retry</button></div>; }

export function OrderTable({ orders, empty }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eddac7] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1050px] w-full text-left">
          <thead className="bg-[#fffaf3] text-[10px] font-black uppercase tracking-[0.12em] text-[#8b7563]">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0dfcf]">
            {orders.length ? (
              orders.map((order) => (
                <tr key={order.id} className="transition hover:bg-[#fffaf3]">
                  <td className="px-4 py-3">
                    {order.image ? <img src={order.image} alt={order.name} className="h-14 w-14 rounded-xl object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-xl bg-[#ffeedd] text-xs font-black">BB</div>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-black text-black">{order.name}</p>
                    <p className="mt-1 text-xs font-bold text-[#8b7563]">{order.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-black">{order.customerName}</p>
                    <p className="mt-1 text-xs font-bold text-[#8b7563]">{order.providerName}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-black">{order.quantity}</td>
                  <td className="px-4 py-3 text-sm font-black">{formatMoney(order.price)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#ffeedd] px-3 py-1 text-[10px] font-black text-black">
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-[#6b5d52]">{formatDate(order.date)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-14 text-center text-sm font-black text-[#8b7563]">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminHeader({ icon: Icon, eyebrow, title, text }) {
  return (
    <div className="rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-black text-[#fffaf3]">
          <Icon size={22} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#e08c4c]">{eyebrow}</p>
          <h1 className="mt-1 text-3xl font-black text-black">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#6b5d52]">{text}</p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const tone = ["RETURNED", "REFUNDED", "CANCELLED"].includes(status)
    ? "bg-[#fff1f1] text-[#c03545]"
    : status === "COMPLETED"
      ? "bg-[#e8f6ef] text-[#16815f]"
      : "bg-[#fff4e6] text-[#b66b12]";

  return <span className={`rounded-full px-3 py-1 text-[10px] font-black ${tone}`}>{status}</span>;
}

export { AdminHeader, StatusPill };
