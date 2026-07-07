import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  HeartHandshake,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";

const benefits = [
  {
    icon: HeartHandshake,
    title: "Make real social impact",
    text: "Help people enjoy safer public plans like coffee, movies, shopping, city tours and events.",
  },
  {
    icon: Clock,
    title: "Control your schedule",
    text: "Choose your availability, preferred activities and how many bookings you want to accept.",
  },
  {
    icon: IndianRupee,
    title: "Earn from your time",
    text: "Set your hourly price, offer trusted experiences and earn from safe public companionship.",
  },
  {
    icon: ShieldCheck,
    title: "Verified safety flow",
    text: "BuddyBOOK uses KYC, selfie verification, in-app safety rules and admin review systems.",
  },
];

const steps = [
  "Create your provider profile",
  "Complete KYC and live selfie verification",
  "Add services, price and availability",
  "Accept booking requests from users",
  "Meet safely at public locations",
  "Receive payment and reviews",
];

export default function EarnWithBuddyBook() {
  return (
    <div className="min-h-screen bg-[#fffaf3] text-black">
      <PublicNavbar />

      <main className="relative overflow-hidden pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(173,232,244,0.85),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(255,255,255,0.95),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(181,228,140,0.35),transparent_38%)]" />

        {/* HERO */}
        <section className="relative mx-auto max-w-7xl px-5 pb-16">
          <div className="mx-auto mb-12 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black text-black shadow-sm">
              <Sparkles size={16} />
              Become a verified Buddy
            </div>

            <h1 className="mx-auto mt-5 max-w-5xl text-4xl font-black leading-tight tracking-tight text-black md:text-6xl">
              Earn by helping people enjoy
              <span className="mx-2 inline-block rounded-2xl bg-black px-4 py-1 text-white">
                safe meetups.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-base font-bold leading-8 text-black/65 md:text-lg">
              BuddyBOOK lets verified providers offer friendly, strictly
              platonic companionship for public activities like coffee, dinner,
              shopping, events, gaming and city tours.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {["Verified profiles", "Public meetups", "Flexible schedule", "Paid bookings"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black text-black shadow-sm"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            {/* LEFT CONTENT */}
            <div className="group relative transform-gpu overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/85 p-6 shadow-[0_35px_100px_rgba(0,0,0,0.13)] backdrop-blur-xl transition-all duration-500 lg:hover:[transform:perspective(1200px)_rotateX(2deg)_rotateY(-3deg)_translateY(-8px)] md:p-8">
              <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#a2d2ff]/45 blur-3xl transition duration-500 group-hover:scale-125" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#b5e48c] px-4 py-2 text-xs font-black uppercase tracking-wide text-black">
                  <BadgeCheck size={16} />
                  Provider opportunity
                </div>

                <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight text-[#11153b] md:text-5xl">
                  Make a difference in someone’s day.
                </h2>

                <p className="mt-5 max-w-xl text-base font-bold leading-8 text-black/65">
                  Many people want a trusted companion for public plans, but do
                  not always have someone available. As a BuddyBOOK provider,
                  you can offer your time, personality and local knowledge in a
                  safe, verified way.
                </p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {benefits.slice(0, 2).map(({ icon: Icon, title, text }) => (
                    <div
                      key={title}
                      className="rounded-[1.6rem] border border-black/10 bg-[#e8e8e4] p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]"
                    >
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-black text-white">
                        <Icon size={20} />
                      </div>
                      <h3 className="mt-4 text-lg font-black text-black">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm font-bold leading-6 text-black/60">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* IMAGE CARD */}
            <div className="relative">
              <div className="pointer-events-none absolute -left-6 top-8 h-full w-full rotate-[-3deg] rounded-[2.5rem] bg-[#a2d2ff]" />
              <div className="pointer-events-none absolute -right-5 top-16 h-full w-full rotate-[3deg] rounded-[2.5rem] bg-[#3f37ff]" />

              <div className="relative overflow-hidden rounded-[2.5rem] border border-black/10 bg-white p-4 shadow-[0_35px_100px_rgba(0,0,0,0.18)]">
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop"
                  alt="Friendly public meetup"
                  className="h-[360px] w-full rounded-[2rem] object-cover md:h-[520px]"
                />

                <div className="absolute bottom-8 left-8 right-8 rounded-[1.8rem] border border-white/20 bg-white/85 p-5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-black text-white">
                      <Users size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-black">
                        Safe companionship
                      </p>
                      <p className="text-xs font-bold text-black/55">
                        Public plans • Verified profiles • Trusted flow
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 */}
        <section className="relative mx-auto max-w-7xl px-5 py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            {/* IMAGE */}
            <div className="relative order-2 lg:order-1">
              <div className="pointer-events-none absolute -left-5 top-10 h-full w-full rotate-[3deg] rounded-[2.5rem] bg-[#a2d2ff]" />
              <div className="pointer-events-none absolute -right-5 top-16 h-full w-full rotate-[-2deg] rounded-[2.5rem] bg-[#3f37ff]" />

              <div className="relative overflow-hidden rounded-[2.5rem] border border-black/10 bg-white p-4 shadow-[0_35px_100px_rgba(0,0,0,0.18)]">
                <img
                  src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop"
                  alt="People meeting in cafe"
                  className="h-[360px] w-full rounded-[2rem] object-cover md:h-[500px]"
                />
              </div>
            </div>

            {/* TEXT */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black text-black shadow-sm">
                <IndianRupee size={16} />
                Earn with flexibility
              </div>

              <h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight text-[#11153b] md:text-6xl">
                Control your time, price and availability.
              </h2>

              <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-black/65 md:text-lg">
                You decide the activities you are comfortable with, your hourly
                rate, your available days and the locations where you want to
                accept public meetups.
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {benefits.slice(2).map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="rounded-[1.6rem] border border-black/10 bg-white/85 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(0,0,0,0.14)]"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-black text-white">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-4 text-lg font-black text-black">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-black/60">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="relative mx-auto max-w-7xl px-5 py-16">
          <div className="overflow-hidden rounded-[2.8rem] border border-black/10 bg-black p-6 text-white shadow-[0_35px_100px_rgba(0,0,0,0.25)] md:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black backdrop-blur-xl">
                  <CalendarDays size={16} className="text-[#b5e48c]" />
                  Provider journey
                </div>

                <h2 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                  Start earning in a safer verified flow.
                </h2>

                <p className="mt-4 max-w-lg text-sm font-semibold leading-7 text-white/65">
                  BuddyBOOK is not random social networking. It is a structured
                  booking platform with KYC, public meetups, pricing and safety
                  controls.
                </p>

                <Link
                  to="/register"
                  className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-black transition hover:-translate-y-1 hover:bg-[#b5e48c]"
                >
                  Register as Provider
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/15"
                  >
                    <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-[#b5e48c] text-sm font-black text-black">
                      {index + 1}
                    </div>
                    <p className="text-sm font-black leading-6 text-white">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative mx-auto max-w-7xl px-5 pb-20">
          <div className="rounded-[2.5rem] border border-black/10 bg-white/85 p-7 text-center shadow-[0_30px_90px_rgba(0,0,0,0.12)] backdrop-blur-xl md:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#3f37ff] text-white">
              <CheckCircle2 size={30} />
            </div>

            <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-tight text-[#11153b] md:text-5xl">
              Build trust. Meet safely. Earn from your time.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-7 text-black/60">
              Join BuddyBOOK as a verified provider and help people enjoy
              public experiences with confidence.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-7 py-4 text-sm font-black text-white shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:bg-[#3f37ff]"
              >
                Become a Provider
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-[#e8e8e4] px-7 py-4 text-sm font-black text-black transition hover:-translate-y-1 hover:bg-white"
              >
                Talk to support
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}