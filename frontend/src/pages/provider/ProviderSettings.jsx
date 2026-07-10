import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  CreditCard,
  Download,
  Eye,
  Headphones,
  Lock,
  LogOut,
  ShieldCheck,
  Trash2,
  UserX,
  Wallet,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";

const options = [
  ["Login security", "Password, sessions and devices", Lock],
  ["Booking alerts", "Requests, reminders and review notifications", Bell],
  ["Profile visibility", "Public listing and search visibility", Eye],
  ["Availability defaults", "Weekly schedule and buffer times", Calendar],
  ["Payout settings", "Bank, UPI and settlement preferences", Wallet],
  ["Payment records", "Invoices, refunds and deductions", CreditCard],
  ["KYC and safety", "Identity records and provider agreement", ShieldCheck],
  ["Blocked users", "Users you do not want to accept again", UserX],
  ["Download provider data", "Export profile, bookings and reviews", Download],
  ["Help and support", "Contact BuddyBOOK operations", Headphones],
];

export default function ProviderSettings() {
  const navigate = useNavigate();
  const [deleteText, setDeleteText] = useState("");

  const logout = () => {
    localStorage.removeItem("buddybook_auth_user");
    localStorage.removeItem("buddybook_token");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const deleteAccount = () => {
    if (deleteText !== "DELETE") return;
    [
      "buddybook_auth_user",
      "buddybook_token",
      "token",
      "buddybook_bookings",
      "buddybook_payments",
      "buddybook_reviews",
      "buddybook_explore_providers_cache",
    ].forEach((key) => localStorage.removeItem(key));
    navigate("/");
  };

  return (
    <AppShell type="provider">
      <section className="min-h-0 bg-[#fff7ed] text-black">
        <div className="mb-5 rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-5">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#e08c4c]">Provider settings</p>
          <h1 className="mt-1 text-3xl font-black">Control your panel</h1>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {options.map(([title, text, Icon]) => (
            <button key={title} type="button" className="flex items-center gap-4 rounded-2xl border border-[#eddac7] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:bg-[#ffeedd]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fffaf3] text-[#e08c4c]"><Icon size={19} /></span>
              <span>
                <span className="block text-sm font-black">{title}</span>
                <span className="mt-1 block text-xs font-bold leading-5 text-[#6b5d52]">{text}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#eddac7] bg-white p-5">
            <h2 className="text-lg font-black">Logout</h2>
            <p className="mt-1 text-sm font-semibold text-[#6b5d52]">End this provider session and return to login.</p>
            <button type="button" onClick={logout} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-black text-[#fffaf3]">
              <LogOut size={16} /> Logout
            </button>
          </section>

          <section className="rounded-2xl border border-[#f0b8a8] bg-white p-5">
            <h2 className="text-lg font-black">Delete account permanently</h2>
            <p className="mt-1 text-sm font-semibold text-[#6b5d52]">Choose a temporary offline mode or permanently remove local provider data.</p>
            <div className="mt-4 grid gap-3 rounded-2xl bg-[#fffaf3] p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-black"
                  onChange={(event) =>
                    localStorage.setItem(
                      "buddybook_offline_24h",
                      event.target.checked ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : ""
                    )
                  }
                />
                <span>
                  <span className="block text-sm font-black text-black">Disable account for 24 hours</span>
                  <span className="mt-1 block text-xs font-semibold text-[#6b5d52]">You will appear offline and can return after the 24-hour pause.</span>
                </span>
              </label>
              <p className="text-xs font-bold leading-5 text-rose-700">
                Permanent deletion means you must register again from the beginning.
              </p>
            </div>
            <input
              value={deleteText}
              onChange={(event) => setDeleteText(event.target.value)}
              placeholder="Type DELETE"
              className="mt-4 h-12 w-full rounded-xl border border-[#eddac7] bg-[#fffaf3] px-4 text-sm font-black outline-none focus:border-black"
            />
            <button type="button" onClick={deleteAccount} disabled={deleteText !== "DELETE"} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#d84e58] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45">
              <Trash2 size={16} /> Delete forever
            </button>
          </section>
        </div>
      </section>
    </AppShell>
  );
}
