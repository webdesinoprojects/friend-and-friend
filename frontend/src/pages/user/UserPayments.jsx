import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import {
  getBookings,
  getPayments,
  subscribeToUserData,
} from "../../utils/userFlowStorage";

function readTransactions() {
  const payments = getPayments();
  if (payments.length) return payments;

  return getBookings()
    .filter((booking) => booking.amount)
    .map((booking) => ({
      id: booking.paymentId || `LEGACY-${booking.id}`,
      bookingId: booking.id,
      providerName: booking.providerName,
      service: booking.service,
      amount: booking.amount,
      method: booking.paymentMethod || "Online",
      status:
        booking.paymentStatus ||
        (["PAID", "CONFIRMED", "COMPLETED"].includes(String(booking.status).toUpperCase())
          ? "PAID"
          : "PENDING"),
      createdAt: booking.createdAt,
    }));
}

const statusClass = {
  PAID: "bg-[#ffeedd] text-black",
  PENDING: "bg-[#fff4e6] text-[#b66b12]",
  FAILED: "bg-rose-50 text-rose-700",
  REFUNDED: "bg-[#fffaf3] text-black",
};

export default function UserPayments() {
  const [transactions, setTransactions] = useState(() => readTransactions());

  useEffect(
    () => subscribeToUserData(() => setTransactions(readTransactions())),
    []
  );

  const summary = useMemo(() => {
    const amountFor = (status) =>
      transactions
        .filter((item) => String(item.status).toUpperCase() === status)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      paid: amountFor("PAID"),
      pending: amountFor("PENDING"),
      refunded: amountFor("REFUNDED"),
      count: transactions.length,
    };
  }, [transactions]);

  const visible = transactions;

  return (
    <UserAppLayout title="Payments">
      <section className="flex min-h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-[1.5rem] border border-[#eddac7] bg-[#fffaf3] shadow-sm">
        <header className="border-b border-[#eddac7] bg-white p-5 lg:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#e08c4c]">
                Payment center
              </p>
              <h2 className="mt-1 text-2xl font-black text-black lg:text-3xl">
                Spending and transactions
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Every successful and pending BuddyBOOK payment is recorded here.
              </p>
            </div>
            <Link
              to="/app/user/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3] shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
            >
              <Search size={17} /> Book a provider
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MoneyStat icon={IndianRupee} label="Total paid" value={summary.paid} tone="indigo" />
            <MoneyStat icon={Clock3} label="Pending" value={summary.pending} tone="amber" />
            <MoneyStat icon={Wallet} label="Refunded" value={summary.refunded} tone="purple" />
            <MoneyStat icon={ReceiptText} label="Transactions" value={summary.count} count tone="green" />
          </div>

        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-7">
          {visible.length === 0 ? (
            <div className="grid min-h-[18rem] place-items-center rounded-2xl border border-dashed border-[#d9bfaa] bg-white text-center">
              <div>
                <CreditCard className="mx-auto text-[#e08c4c]" size={42} />
                <p className="mt-4 text-xl font-black text-black">No transactions found</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Completed checkout payments will appear automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#eddac7] bg-white">
              <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.7fr_auto] gap-4 bg-[#fffaf3] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[#8b7563] md:grid">
                <span>Transaction</span>
                <span>Date</span>
                <span>Method</span>
                <span>Status</span>
                <span>Amount</span>
              </div>
              {visible.map((transaction) => {
                const status = String(transaction.status || "PENDING").toUpperCase();
                const date = transaction.createdAt
                  ? new Date(transaction.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Date unavailable";

                return (
                  <article
                    key={transaction.id}
                    className="grid gap-4 border-t border-[#f0dfcf] p-5 first:border-t-0 md:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_auto] md:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffeedd] text-black">
                        {status === "PAID" ? <CheckCircle2 size={19} /> : <CreditCard size={19} />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-black">
                          {transaction.service || "BuddyBOOK meetup"}
                        </p>
                        <p className="truncate text-xs font-bold text-slate-500">
                          {transaction.providerName || "Provider"} · {transaction.id}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-600">{date}</p>
                    <p className="text-sm font-extrabold text-black">
                      {transaction.method || "Online"}
                    </p>
                    <span className={`w-max rounded-full px-3 py-1.5 text-[10px] font-black ${statusClass[status] || statusClass.PENDING}`}>
                      {status}
                    </span>
                    <p className="flex items-center gap-1 text-base font-black text-black md:justify-end">
                      ₹{Number(transaction.amount || 0).toLocaleString("en-IN")}
                      <ArrowUpRight size={15} className="text-slate-400" />
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </UserAppLayout>
  );
}

function MoneyStat({ icon: Icon, label, value, tone, count }) {
  const tones = {
    indigo: "bg-[#ffeedd] text-black",
    amber: "bg-[#fff4e6] text-[#b45309]",
    purple: "bg-[#fffaf3] text-black",
    green: "bg-[#ffeedd] text-black",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon size={19} />
      </span>
      <div>
        <p className="text-xl font-black text-black">
          {count ? value : `₹${Number(value).toLocaleString("en-IN")}`}
        </p>
        <p className="text-xs font-bold text-slate-500">{label}</p>
      </div>
    </div>
  );
}


