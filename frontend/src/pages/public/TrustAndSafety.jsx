import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserX,
  Users,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";

const commitments = [
  {
    icon: BadgeCheck,
    title: "Verified members",
    text: "Accounts go through mobile and email verification plus checks before they can book or host.",
  },
  {
    icon: Lock,
    title: "Private by default",
    text: "Your exact location, contact details and payments stay protected inside PPlusOne.",
  },
  {
    icon: Star,
    title: "Ratings & reviews",
    text: "Every meetup is followed by honest feedback so the community stays accountable.",
  },
  {
    icon: UserX,
    title: "Strict account action",
    text: "Admins can permanently block anyone who breaks the rules. Blocked accounts can no longer use PPlusOne.",
  },
];

const guidelines = [
  "Meet only in public, well-lit places for your first few meetups.",
  "Keep all planning and payments inside the PPlusOne app.",
  "Respect boundaries, consent and personal space at all times.",
  "Report suspicious behaviour, harassment or payment scams immediately.",
  "Never share OTPs, passwords or government IDs with another member.",
];

export default function TrustAndSafety() {
  return (
    <div className="min-h-screen bg-[#fffaf3] text-[#17120f]">
      <PublicNavbar />

      <main className="pt-20">
        <section className="bg-[linear-gradient(135deg,#fffaf3_0%,#fff3e6_100%)]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-7 lg:px-8">
            <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-[#b9772f]">
              <ShieldCheck size={18} /> Trust &amp; Safety
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-[-0.02em] text-[#1c1206] sm:text-5xl">
              A safe space for real, platonic connections.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium text-[#5b4a3a]">
              PPlusOne is built around verification, transparency and community accountability. Here is
              how we keep meetups safe and what happens when the rules are broken.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/safety"
                className="rounded-full bg-black px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
              >
                Safety tips
              </Link>
              <Link
                to="/contact"
                className="rounded-full border border-black bg-white px-6 py-3 text-sm font-black text-black transition hover:-translate-y-0.5"
              >
                Report a concern
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-7 lg:px-8">
          <h2 className="text-2xl font-black text-[#1c1206]">Our safety commitments</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {commitments.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_14px_45px_rgba(0,0,0,0.04)]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff3e6] text-[#b9772f]">
                  <Icon size={24} />
                </span>
                <h3 className="mt-4 text-lg font-black text-[#1c1206]">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#5b4a3a]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-7 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="text-2xl font-black text-[#1c1206]">Community guidelines</h2>
              <ul className="mt-6 space-y-4">
                {guidelines.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[#3f3328]">
                    <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#fff3e6] text-[#b9772f]">
                      <ShieldCheck size={14} />
                    </span>
                    <span className="text-sm font-semibold leading-6">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-red-200 bg-red-50 p-7">
              <div className="flex items-center gap-3 text-red-700">
                <ShieldAlert size={22} />
                <h2 className="text-xl font-black">Account blocking</h2>
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-red-700/80">
                If a member violates our guidelines, an admin can block their account. A blocked account is
                permanently disabled and the person will see:
              </p>
              <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4 text-sm font-black text-red-700">
                “You have been blocked by the admin now you are not allowed to use this website again.”
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-red-700/80">
                Blocked users cannot log in, book meetups or host. This keeps the PPlusOne community safe for
                everyone.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-7 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-black/10 bg-[#fff3e6] p-7">
            <div className="flex items-center gap-3">
              <Users size={22} className="text-[#b9772f]" />
              <p className="text-sm font-black text-[#1c1206]">
                Need help or want to report something? Our team is here for you.
              </p>
            </div>
            <Link
              to="/contact"
              className="rounded-full bg-black px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              Contact support
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
