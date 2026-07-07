import { RotateCcw } from "lucide-react";
import AdminShell from "../../components/layout/AdminShell";
import { getReturnRefundOrders } from "./adminData";
import { AdminHeader, OrderTable } from "./AdminOrders";

export default function AdminReturns() {
  const rows = getReturnRefundOrders();

  return (
    <AdminShell>
      <section className="grid gap-5">
        <AdminHeader
          icon={RotateCcw}
          eyebrow="Return and refund desk"
          title="Returns & Refunds"
          text="Returned, refunded, replaced and cancelled orders are shown here in one review table."
        />

        <div className="grid gap-3 md:grid-cols-3">
          <Stat label="Return rows" value={rows.length} />
          <Stat label="Refunded" value={rows.filter((item) => item.paymentStatus === "REFUNDED" || item.status === "REFUNDED").length} />
          <Stat label="Replaced" value={rows.filter((item) => item.status === "REPLACED").length} />
        </div>

        <OrderTable orders={rows} empty="No return or refund orders found yet." />
      </section>
    </AdminShell>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
      <p className="text-2xl font-black text-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#8b7563]">{label}</p>
    </div>
  );
}
