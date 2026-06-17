import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";

export default function HowItWorks() {
  const steps = [
    {
      icon: User,
      title: "Create account",
    },
    {
      icon: BadgeCheck,
      title: "Verify identity",
    },
    {
      icon: Calendar,
      title: "Choose your plan",
    },
    {
      icon: MapPin,
      title: "Meet safely",
    },
  ];

  const [activeStep, setActiveStep] = useState(null);
  const ActiveStepIcon = activeStep?.icon;

  const stepDetails = [
    {
      label: "Step 01",
      heading: "Account setup",
      badge: "Start here",
      time: "2 min setup",
      points: [
        "Create profile with mobile and email.",
        "Choose user or provider role.",
        "Accept platform safety rules.",
      ],
      timeline: ["Signup", "Role", "Safety rules"],
    },
    {
      label: "Step 02",
      heading: "Trust verification",
      badge: "KYC layer",
      time: "Verified access",
      points: [
        "Complete identity document verification.",
        "Add face selfie for profile trust.",
        "Admin reviews suspicious accounts.",
      ],
      timeline: ["KYC", "Selfie", "Approval"],
    },
    {
      label: "Step 03",
      heading: "Booking process",
      badge: "Plan safely",
      time: "Public meetup",
      points: [
        "Choose activity, date and time.",
        "Select public meetup location.",
        "Confirm request through platform flow.",
      ],
      timeline: ["Activity", "Location", "Confirm"],
    },
    {
      label: "Step 04",
      heading: "Safe meetup",
      badge: "Live support",
      time: "During booking",
      points: [
        "Chat inside the app before meeting.",
        "Use live location during active booking.",
        "Report issues through support system.",
      ],
      timeline: ["Chat", "Location", "Report"],
    },
  ];

  return (
    <div className="min-h-screen bg-[#e8e8e4] text-black">
      <PublicNavbar />

      <main className="pt-20">
        <section
          id="how"
          className="relative overflow-hidden bg-[#e8e8e4] px-5 py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(255,255,255,0.70),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(173,232,244,0.80),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.55),transparent_36%)]" />
        
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black text-black shadow-sm">
                <ShieldCheck size={16} />
                How BuddyBOOK works
              </div>
        
              <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight text-black md:text-5xl">
                Tap a step. See the complete safe flow.
              </h2>
        
            </div>
        
            {/* USER TO PROVIDER FLOW */}
            <div className="mb-9 rounded-[2rem] border-1 border-black  bg-white/80 p-4 shadow-[0_25px_70px_rgba(0,0,0,0.10)] backdrop-blur-xl">
              <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-[1.5rem] border-1 border-black  bg-white p-4 shadow-[0_18px_45px_rgba(0,0,0,0.10)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_25px_60px_rgba(0,0,0,0.14)]">
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded-[1.3rem] bg-[#e8e8e4] text-4xl shadow-lg">
                      👨
                    </div>
        
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-black/55">
                        User
                      </p>
                      <h3 className="text-lg font-black text-black">
                        Finds a verified buddy
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-black/60">
                        Chooses activity, time and safe public location.
                      </p>
                    </div>
                  </div>
                </div>
        
                <div className="flex items-center justify-center">
                  <div className="rounded-full border border-black bg-black px-5 py-2 text-xs font-black text-white shadow-lg">
                    In-app booking flow
                  </div>
                </div>
        
                <div className="rounded-[1.5rem] border-1 border-black  bg-white p-4 shadow-[0_18px_45px_rgba(0,0,0,0.10)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_25px_60px_rgba(0,0,0,0.14)]">
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded-[1.3rem] bg-[#e8e8e4] text-4xl shadow-lg">
                      👩
                    </div>
        
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-black/55">
                        Provider
                      </p>
                      <h3 className="text-lg font-black text-black">
                        Accepts safe bookings
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-black/60">
                        Shares services, pricing and availability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        
            {/* DRAWER STEP CARDS */}
        <div className="relative mx-auto max-w-7xl">
          <div className="pointer-events-none absolute left-[10%] right-[10%] top-8 hidden h-1 rounded-full bg-gradient-to-r from-black/10 via-black/60 to-black/10 lg:block" />
        
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, index) => {
              const details = stepDetails[index];
        
              return (
                <div key={title} className="relative">
                  <div className="relative z-20 mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border-4 border-black bg-black text-sm font-black text-white shadow-[0_16px_35px_rgba(0,0,0,0.22)]">
                    0{index + 1}
                  </div>
        
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStep({
                        icon: Icon,
                        title,
                        text,
                        index,
                        ...details,
                      })
                    }
                    className="group relative min-h-[250px] w-full transform-gpu overflow-hidden rounded-[2rem] border border-black/10 bg-white p-5 text-left text-black shadow-[0_24px_70px_rgba(0,0,0,0.12)] transition-all duration-500 ease-out hover:-translate-y-3 hover:scale-[1.03] hover:-rotate-1 hover:shadow-[0_40px_95px_rgba(0,0,0,0.22)]"
                  >
                    {/* 3D LIGHT EFFECTS */}
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,255,255,0.50),rgba(173,232,244,0.18))]" />
                    <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#a2d2ff]/45 blur-2xl transition duration-500 group-hover:scale-125 group-hover:bg-[#b5e48c]/55" />
                    <div className="pointer-events-none absolute -bottom-14 -left-14 h-36 w-36 rounded-full bg-black/10 blur-3xl transition duration-500 group-hover:bg-black/15" />
        
                    <div className="relative z-10">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-black text-white shadow-[0_14px_30px_rgba(0,0,0,0.22)] transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 ">
                          <Icon size={24} />
                        </div>
        
                        <span className="rounded-full border border-black/10 bg-[#e8e8e4] px-3 py-1 text-[11px] font-black text-black shadow-sm transition duration-300 group-hover:bg-[#b5e48c]">
                          {details.badge}
                        </span>
                      </div>
        
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-black/45">
                        {details.label}
                      </p>
        
                      <h3 className="mt-2 text-xl font-black leading-tight text-black">
                        {title}
                      </h3>
        
                      <p className="mt-2 text-sm leading-6 text-black/60">
                        {text}
                      </p>
        
                      {/* IMPORTANT INFO ONLY */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        {details.timeline.slice(0, 3).map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-black/10 bg-[#e8e8e4] px-3 py-1 text-[11px] font-black text-black/70"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
        
                      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-black text-white shadow-lg shadow-black/20 transition-all duration-300">
                        View details
                        <ArrowRight
                          size={14}
                          className="transition duration-300 group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
          </div>
        
        {/* CUSTOM DRAWER */}
        {activeStep && (
          <div className="fixed inset-0 z-[9998]">
            <button
              type="button"
              onClick={() => setActiveStep(null)}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
              aria-label="Close drawer"
            />
        
            <div className="absolute inset-x-3 bottom-3 mx-auto max-h-[82vh] max-w-xl overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_-28px_90px_rgba(0,0,0,0.32)] sm:inset-x-5">
              <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#a2d2ff]/50 blur-3xl" />
                <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-[#b5e48c]/35 blur-3xl" />
        
                {/* DRAWER HEADER */}
                <div className="relative z-10 border-b border-black/10 bg-white/85 px-5 py-4 backdrop-blur-xl">
                  <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-black/20" />
        
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black text-white shadow-lg">
                        {ActiveStepIcon && <ActiveStepIcon size={23} />}
                      </div>
        
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/45">
                          {activeStep.label}
                        </p>
        
                        <h3 className="mt-1 text-xl font-black leading-tight text-black">
                          {activeStep.heading}
                        </h3>
        
                        <p className="mt-1 text-xs font-bold leading-5 text-black/55">
                          {activeStep.text}
                        </p>
                      </div>
                    </div>
        
                    <button
                      type="button"
                      onClick={() => setActiveStep(null)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-[#e8e8e4] text-black transition hover:scale-105 hover:bg-black hover:text-white"
                      aria-label="Close drawer"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
        
                {/* DRAWER BODY */}
                <div className="relative z-10 max-h-[62vh] overflow-y-auto px-5 py-5">
                  <div className="grid gap-4">
                    {/* MINI STATUS CARD */}
                    <div className="rounded-[1.6rem] border border-black/10 bg-[#e8e8e4] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/45">
                            Current stage
                          </p>
                          <h4 className="mt-1 text-lg font-black text-black">
                            {activeStep.title}
                          </h4>
                        </div>
        
                        <span className="rounded-full bg-[#b5e48c] px-3 py-1 text-[11px] font-black text-black">
                          {activeStep.time}
                        </span>
                      </div>
        
                      <div className="mt-4 h-2 rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-black transition-all duration-500"
                          style={{
                            width: `${((activeStep.index + 1) / steps.length) * 100}%`,
                          }}
                        />
                      </div>
        
                      <p className="mt-2 text-[11px] font-bold text-black/50">
                        Progress {activeStep.index + 1} of {steps.length}
                      </p>
                    </div>
        
                    {/* POINTS */}
                    <div className="rounded-[1.6rem] border border-black/10 bg-white p-4 shadow-[0_16px_45px_rgba(0,0,0,0.08)]">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/45">
                        Key actions
                      </p>
        
                      <div className="mt-3 grid gap-2.5">
                        {activeStep.points.map((point) => (
                          <div
                            key={point}
                            className="flex items-start gap-3 rounded-2xl border border-black/10 bg-[#f8f9fa] p-3"
                          >
                            <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black text-white">
                              <CheckCircle2 size={14} />
                            </div>
        
                            <p className="text-sm font-bold leading-6 text-black/65">
                              {point}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
        
                    {/* MINI TIMELINE */}
                    <div className="grid grid-cols-3 gap-2">
                      {activeStep.timeline.map((item, itemIndex) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-black/10 bg-[#dee2e6] p-3 text-center shadow-sm"
                        >
                          <p className="text-[10px] font-black text-black/40">
                            0{itemIndex + 1}
                          </p>
                          <p className="mt-1 text-xs font-black text-black">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}