import {
  CheckCircle2,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  BadgeCheck ,
  ArrowRight ,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";

export default function Safety() {
  const benefits = [
    {
      icon: ShieldCheck,
      title: "Verified community",
      text: "Designed around KYC, safer onboarding and visible trust signals.",
    },
    {
      icon: MessageCircle,
      title: "Private in-app chat",
      text: "Connect before the meetup without exposing personal contact details.",
    },
    {
      icon: CreditCard,
      title: "Platform payments",
      text: "Cleaner payment flow for users, providers, refunds and admin control.",
    },
    {
      icon: Users,
      title: "Real-world activities",
      text: "Useful for movies, shopping, dinner, gaming, city tours and events.",
    },
  ];

  const safetyItems = [
    "Mobile + Email OTP",
    "KYC Verification",
    "Face Selfie Check",
    "Live Location During Booking",
    "In-App Chat Only",
    "Admin Reports & Disputes",
  ];

  return (
    <div className="min-h-screen bg-[#e8e8e4] text-black">
      <PublicNavbar />

      <main className="pt-20">
       {/* TRUST, SAFETY & ROLES */}
<section className="relative overflow-hidden bg-[#e8e8e4] px-5 py-16">
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(255,255,255,0.90),transparent_30%),radial-gradient(circle_at_88%_15%,rgba(173,232,244,0.85),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.70),transparent_35%)]" />

  <div className="relative mx-auto max-w-7xl">
    {/* TOP HEADING */}
{/* TOP HEADING */}
<div className="mb-12 w-full text-center">


  <h2 className="mx-auto mt-5 max-w-6xl text-4xl font-black leading-tight tracking-tight text-black md:text-6xl">
    Safety built into every
    <span className="mx-2 inline-block rounded-2xl bg-black px-4 py-1 text-white">
      real meetup
    </span>
    from start to finish.
  </h2>

</div>

    {/* MAIN TRUST GRID */}
    <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      {/* LEFT TRUST CARDS */}
{/* LEFT TRUST STRUCTURE */}
<div className="group relative transform-gpu overflow-hidden rounded-[2.3rem] border border-black/10 bg-white/80 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.10)] backdrop-blur-xl transition-all duration-500 ease-out hover:shadow-[0_38px_100px_rgba(0,0,0,0.18)] hover:[transform:perspective(1200px)_rotateX(2deg)_rotateY(-3deg)_translateY(-8px)] md:p-7">
  <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#a2d2ff]/30 blur-3xl transition duration-500 group-hover:scale-125 group-hover:bg-[#b5e48c]/35" />
  <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-white/80 blur-3xl transition duration-500 group-hover:scale-125" />  <div className="mb-6 flex items-center justify-between gap-4">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-black/50">
        Why people choose BuddyBOOK
      </p>

      <h3 className="mt-2 text-2xl font-black text-black">
        One clear safety structure for every meetup.
      </h3>
    </div>

    <div className="hidden rounded-2xl bg-black px-4 py-2 text-xs font-black text-white shadow-lg sm:block">
      Verified platform
    </div>
  </div>

  {/* STRUCTURED TRUST FLOW */}
  <div className="grid gap-4">
    {[
      {
        icon: "🛡️",
        label: "Before booking",
        title: "Verified profiles",
        points: ["KYC flow", "Face check", "Profile review"],
      },
      {
        icon: "🔒",
        label: "Before meetup",
        title: "Private planning",
        points: ["In-app chat", "No contact sharing", "Booking details"],
      },
      {
        icon: "📍",
        label: "During meetup",
        title: "Public safety tools",
        points: ["Public place", "Live location", "Report tools"],
      },
    ].map((item) => (
      <div
        key={item.title}
        className="group relative transform-gpu overflow-hidden rounded-[1.7rem] border border-black/10 bg-[#e8e8e4] p-4 text-black shadow-[0_14px_40px_rgba(0,0,0,0.07)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:bg-white hover:shadow-[0_22px_55px_rgba(0,0,0,0.12)]"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#a2d2ff]/35 blur-2xl transition duration-300 group-hover:bg-[#b5e48c]/45" />

        <div className="relative z-10 flex gap-4">
          <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-black text-2xl text-white shadow-md transition duration-300 group-hover:rotate-6 group-hover:scale-105">
            {item.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-black/55">
                {item.label}
              </p>
            </div>

            <h4 className="mt-2 text-lg font-black text-black">
              {item.title}
            </h4>

            <p className="mt-1 text-sm leading-6 text-black/60">
              {item.text}
            </p>


          </div>
        </div>
      </div>
    ))}
  </div>

</div>

      {/* RIGHT SAFETY PANEL */}
<div
  id="safety"
  className="group relative transform-gpu overflow-hidden rounded-[2.3rem] border border-black/10 bg-white/80 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.10)] backdrop-blur-xl transition-all duration-500 ease-out hover:shadow-[0_38px_100px_rgba(0,0,0,0.18)] hover:[transform:perspective(1200px)_rotateX(-4deg)_rotateY(-3deg)_translateY(8px)] md:p-7"
>
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#a2d2ff]/45 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-white blur-3xl" />

        <div className="relative z-10">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-black text-white">
              <ShieldCheck size={15} />
              Safety by design
            </div>

            <h3 className="mt-4 text-3xl font-black text-black">
              Strictly platonic. Verified. Monitored.
            </h3>
          </div>

          {/* SAFETY SCORE CARD */}
          <div className="mb-5 rounded-[1.8rem] border border-black/10 bg-black p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.20)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                  Trust layer
                </p>
                <h4 className="mt-1 text-2xl font-black">Safety score</h4>
              </div>

              <div className="rounded-2xl bg-[#b5e48c] px-4 py-2 text-xl font-black text-black">
                96%
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {[
                ["KYC verification", "92%"],
                ["Public meetup flow", "100%"],
                ["In-app safety tools", "96%"],
              ].map(([label, width]) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs font-bold text-white/70">
                    <span>{label}</span>
                    <span>{width}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-[#a2d2ff]"
                      style={{ width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* PROVIDER CTA */}
    <section id="provider" className="pt-8">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-black/10 bg-black p-6 shadow-[0_35px_100px_rgba(0,0,0,0.25)] md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(173,232,244,0.24),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.14),transparent_32%)]" />

        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur-xl">
              <BadgeCheck size={16} className="text-[#a2d2ff]" />
              Become a verified provider
            </div>

            <h2 className="mt-4 max-w-3xl text-3xl font-black text-white md:text-5xl">
              Offer safe and meaningful social experiences.
            </h2>

            <p className="mt-4 max-w-2xl leading-8 text-white/75">
              Build your profile, complete verification, add services, manage
              pricing and availability, then receive secure booking requests.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["01", "Verify profile"],
                ["02", "Add services"],
                ["03", "Accept bookings"],
              ].map(([number, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur-xl"
                >
                  <p className="text-xs font-black text-[#a2d2ff]">{number}</p>
                  <p className="mt-1 text-sm font-black">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
            <div className="rounded-[1.5rem] bg-white p-5 text-black">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-black text-white">
                  <Users size={22} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">
                    Provider profile
                  </p>
                  <h3 className="text-lg font-black">Ready to start</h3>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {[
                  "Trusted onboarding",
                  "Safer bookings",
                  "Verified profile badge",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-[#e8e8e4] p-3 text-sm font-black text-black"
                  >
                    <CheckCircle2 size={17} />
                    {item}
                  </div>
                ))}
              </div>

              <Link
                to="/register"
                className="mt-5 inline-flex w-full transform-gpu items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-black text-white shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-[#a2d2ff] hover:text-black"
              >
                Start Provider Registration
                <ArrowRight size={16} />
              </Link>
            </div>

            <p className="mt-4 text-center text-sm font-semibold text-white/70">
              Public plans • Verified profiles • Safer platform flow
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</section>
      </main>

      <PublicFooter />
    </div>
  );
}