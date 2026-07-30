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
import { formatRupees } from "../../utils/format";
import { getCachedBookings, listBookings } from "../../api/bookings";

function toTransactions(bookings) {
  return bookings
    .filter((booking) => booking.amount)
    .map((booking) => ({
      id: booking.paymentId || `LEGACY-${booking.id}`,
      bookingId: booking.id,
      providerId: booking.providerId,
      providerName: booking.providerName,
      service: booking.service,
      date: booking.date,
      time: booking.time,
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

export default function UserPayments() {
  const cachedTransactions = toTransactions(getCachedBookings({ pageSize: 100 }));
  const [transactions, setTransactions] = useState(cachedTransactions);
  const [loading, setLoading] = useState(!cachedTransactions.length);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    listBookings({ pageSize: 100 })
      .then((rows) => mounted && setTransactions(toTransactions(rows)))
      .catch(() => mounted && setError("Transactions could not be loaded."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

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
          {loading ? (
            <div className="grid min-h-[18rem] place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" /></div>
          ) : error ? (
            <div className="grid min-h-[18rem] place-items-center text-center"><div><p className="text-xl font-black">Transactions unavailable</p><p className="mt-2 text-sm font-bold text-black/45">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-full bg-black px-5 py-2.5 text-sm font-black text-white">Try again</button></div></div>
          ) : visible.length === 0 ? (
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
            <div className="grid gap-3">
              {visible.map((transaction) => {
                const status = String(transaction.status || "PENDING").toUpperCase();
                const date = transaction.createdAt
                  ? new Date(transaction.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Date unavailable";
                const meetingTime = [transaction.date, transaction.time]
                  .filter(Boolean)
                  .join(" · ");
                const providerTo = transaction.providerId
                  ? `/app/user/provider/${transaction.providerId}`
                  : transaction.bookingId
                    ? `/app/user/provider/${transaction.bookingId}`
                    : "#";

                return (
                  <article
                    key={transaction.id}
                    className="grid gap-4 rounded-2xl border border-[#eddac7] bg-white p-4 shadow-sm md:grid-cols-[1.5fr_1.1fr_1fr_0.8fr_0.8fr_auto] md:items-center md:gap-4 md:p-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffeedd] text-black">
                        {status === "PAID" ? <CheckCircle2 size={19} /> : <CreditCard size={19} />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-black">
                          {transaction.providerName || "Provider"}
                        </p>
                        <p className="truncate text-xs font-bold text-slate-500">
                          Pay ID: {transaction.id}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#8b7563]">Activity</p>
                      <p className="truncate text-sm font-black text-black">
                        {transaction.service || "BuddyBOOK meetup"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#8b7563]">Meeting</p>
                      <p className="truncate text-xs font-bold text-slate-600">
                        {meetingTime || date}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#8b7563]">Method</p>
                      <p className="text-sm font-extrabold text-black">
                        {transaction.method || "Online"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#8b7563]">Amount</p>
                      <p className="flex items-center gap-1 text-base font-black text-black">
                         {formatRupees(Number(transaction.amount || 0))}
                      </p>
                    </div>

                    <Link
                      to={providerTo}
                      className="grid h-11 w-11 shrink-0 place-items-center justify-self-end rounded-xl bg-black text-[#fffaf3] transition hover:-translate-y-0.5"
                      aria-label="Open provider profile"
                    >
                      <ArrowUpRight size={18} />
                    </Link>
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
          {count ? value : formatRupees(Number(value))}
        </p>
        <p className="text-xs font-bold text-slate-500">{label}</p>
      </div>
    </div>
  );
}


