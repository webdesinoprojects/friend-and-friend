import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Navigation,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";

const steps = [
  {
    icon: UserRoundPlus,
    number: "01",
    kicker: "Account",
    title: "Create your BuddyBOOK profile",
    text: "Start with mobile verification, role selection and public profile details.",
    drawerTitle: "Profile setup",
    badge: "2 min setup",
    points: [
      "Register with mobile and optional email verification.",
      "Choose whether you are joining as a user or provider.",
    ],
    flow: ["Signup", "Role"],
  },
  {
    icon: BadgeCheck,
    number: "02",
    kicker: "Trust",
    title: "Complete identity checks",
    text: "KYC, selfie capture and admin review build confidence before anyone meets.",
    drawerTitle: "Verification layer",
    badge: "Verified access",
    points: [
      "Submit supported identity details for review.",
      "Complete selfie or face verification when required.",
    ],
    flow: ["KYC", "Selfie"],
  },
  {
    icon: CalendarCheck,
    number: "03",
    kicker: "Booking",
    title: "Choose activity, time and place",
    text: "Users pick a provider, public activity, schedule and safe meetup location.",
    drawerTitle: "Booking plan",
    badge: "Public plan",
    points: [
      "Browse providers by city, activity, price and availability.",
      "View full provider profile before booking.",
    ],
    flow: ["Explore", "Profile"],
  },
  {
    icon: MapPin,
    number: "04",
    kicker: "Meet",
    title: "Meet safely with support signals",
    text: "In-app chat, location cues and reporting tools keep the meetup accountable.",
    drawerTitle: "Active meetup",
    badge: "Live support",
    points: [
      "Use in-app chat before and during the booking.",
      "Share live location during the active booking window.",
    ],
    flow: ["Chat", "Location"],
  },
];

const supportPanels = [
  {
    icon: MessageCircle,
    title: "Chat",
    text: "Message inside booking only",
    className: "right-[7%] top-[16%] rotate-[-3deg]",
  },
  {
    icon: Navigation,
    title: "Location",
    text: "Share active meetup location",
    className: "right-[17%] top-[43%] rotate-[4deg]",
  },
  {
    icon: ShieldCheck,
    title: "Report",
    text: "Escalate unsafe plans fast",
    className: "right-[6%] bottom-[14%] rotate-[-2deg]",
  },
];

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(null);
  const sectionRef = useRef(null);
  const pathRef = useRef(null);
  const nodePositions = [
    "left-[5%] top-[69%]",
    "left-[28%] top-[49%]",
    "left-[56%] top-[39%]",
    "left-[76%] top-[12%]",
  ];
  const popupPositions = [
    "left-0 bottom-[calc(100%+0.9rem)] -translate-x-8",
    "left-1/2 top-[calc(100%+0.9rem)] -translate-x-1/2",
    "left-[calc(100%+0.9rem)] top-0",
    "right-0 top-[calc(100%+0.9rem)]",
  ];

  useEffect(() => {
    const context = gsap.context(() => {
      const path = pathRef.current;
      const length = path?.getTotalLength?.() || 0;

      if (path && length) {
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 1.35,
          ease: "power3.out",
        });
      }

      gsap.from(".how-copy", {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.07,
      });

      gsap.from(".path-node", {
        scale: 0.6,
        y: 24,
        opacity: 0,
        duration: 0.58,
        ease: "back.out(1.6)",
        stagger: 0.1,
        delay: 0.25,
      });

      gsap.from(".support-panel", {
        x: 36,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.45,
      });

      if (window.matchMedia("(min-width: 1024px)").matches) {
        gsap.from(".how-step-mobile", {
          y: 30,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.2,
        });
      }
    }, sectionRef);

    return () => context.revert();
  }, []);

  const setActive = (index) => {
    setActiveIndex(index);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffaf3] text-[#1f1a17]">
      <PublicNavbar />

      <main className="pt-20 lg:min-h-[calc(100vh-5rem)]">
        <section
          ref={sectionRef}
          className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-6 sm:px-5 lg:px-8"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(255,255,255,0.95),transparent_25%),radial-gradient(circle_at_82%_24%,rgba(255,210,183,0.48),transparent_26%),radial-gradient(circle_at_48%_100%,rgba(117,89,255,0.10),transparent_34%)]" />
          <div className="pointer-events-none absolute -right-24 top-16 h-[34rem] w-[34rem] rounded-full bg-[#fff8ef]/75" />
          <div className="pointer-events-none absolute bottom-8 left-10 h-36 w-36 rounded-full bg-white/70 blur-2xl" />

          {supportPanels.map((panel) => {
            const Icon = panel.icon;

            return (
              <div
                key={panel.title}
                className={`support-panel group absolute z-0 hidden w-52 rounded-[1.7rem] bg-white/38 p-4 shadow-[0_24px_70px_rgba(71,52,36,0.12)] backdrop-blur-md transition duration-300 hover:-translate-y-2 hover:bg-white/78 hover:shadow-[0_28px_90px_rgba(255,116,95,0.18)] xl:block ${panel.className}`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0ec] text-[#ff745f]">
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-black text-[#211713]">{panel.title}</p>
                    <p className="text-xs font-bold text-[#7b6c61]">{panel.text}</p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="relative z-10 mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div className="relative">
              <div className="pointer-events-none absolute -left-16 top-6 h-[24rem] w-[24rem] rounded-full bg-white/45" />

              <div className="how-copy relative z-10 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#f26d54] shadow-sm">
                  <ShieldCheck size={15} />
                  Safe operation flow
                </div>

                <h1 className="mt-4 text-[clamp(2.1rem,4.8vw,4.8rem)] font-black leading-[0.98] tracking-tight text-[#17120f]">
                  How BuddyBOOK keeps every meetup structured.
                </h1>

                <p className="mt-4 max-w-md text-sm font-semibold leading-7 text-[#75665b] sm:text-base">
                  Hover on the zig-zag path. Each number opens transparent step details on the same screen.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-[#ff745f] px-6 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,116,95,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ef604c]"
                  >
                    Get started
                    <ArrowRight size={16} />
                  </a>
                  <a
                    href="/safety"
                    className="inline-flex items-center gap-2 rounded-full bg-white/65 px-6 py-3 text-sm font-black text-[#3a3029] transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    Safety rules
                  </a>
                </div>
              </div>

              <div className="relative z-10 mt-8 grid gap-4 lg:hidden">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const active = activeIndex === index;

                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setActiveIndex(active ? null : index)}
                    className={`how-step-mobile rounded-[1.5rem] p-3.5 text-left shadow-[0_16px_44px_rgba(71,52,36,0.09)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 active:scale-[0.99] ${
                        active ? "bg-white/80 shadow-[0_22px_60px_rgba(255,116,95,0.16)]" : "bg-white/46"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform duration-300 ${active ? "scale-105 bg-[#ff745f] text-white" : "bg-[#fff0ec] text-[#ff745f]"}`}>
                          <Icon size={22} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ff745f]">
                            {step.number} / {step.kicker}
                          </p>
                          <h3 className="mt-1 text-base font-black leading-tight text-[#17120f]">
                            {step.title}
                          </h3>
                          <p className="mt-1.5 text-xs font-semibold leading-5 text-[#6f6158]">
                            {step.text}
                          </p>
                        </div>
                      </div>

                      {active ? (
                        <div className="mt-3 animate-[hiwFade_.25s_ease-out]">
                          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
                            {step.flow.map((item, itemIndex) => (
                              <div
                                key={item}
                                className="min-w-[96px] rounded-xl bg-white/62 px-3 py-2"
                              >
                                <p className="text-[10px] font-black text-[#ff745f]">
                                  0{itemIndex + 1}
                                </p>
                                <p className="text-xs font-black text-[#251b16]">
                                  {item}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-2 grid gap-1.5">
                            {step.points.map((point) => (
                              <div key={point} className="flex items-start gap-2">
                                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#ff745f]" />
                                <p className="text-xs font-bold leading-5 text-[#65564c]">
                                  {point}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative hidden h-[min(650px,calc(100vh-7.2rem))] min-h-[520px] overflow-visible lg:block">
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 840 560"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M48 414 C138 498 190 290 294 318 C390 344 420 414 526 242 C602 118 673 220 790 102"
                  stroke="rgba(255,255,255,0.72)"
                  strokeWidth="46"
                  strokeLinecap="round"
                />
                <path
                  d="M48 414 C138 498 190 290 294 318 C390 344 420 414 526 242 C602 118 673 220 790 102"
                  stroke="rgba(255,116,95,0.16)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                <path
                  ref={pathRef}
                  d="M48 414 C138 498 190 290 294 318 C390 344 420 414 526 242 C602 118 673 220 790 102"
                  stroke="#ff745f"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>

              <div className="pointer-events-none absolute left-[5%] top-[69%] -translate-x-1/2 -translate-y-1/2 text-[clamp(4.5rem,12vw,11rem)] font-black leading-none text-white/50">
                1
              </div>
              <div className="pointer-events-none absolute left-[28%] top-[49%] -translate-x-1/2 -translate-y-1/2 text-[clamp(4.5rem,12vw,11rem)] font-black leading-none text-white/45">
                2
              </div>
              <div className="pointer-events-none absolute left-[56%] top-[39%] -translate-x-1/2 -translate-y-1/2 text-[clamp(4.5rem,12vw,11rem)] font-black leading-none text-white/45">
                3
              </div>
              <div className="pointer-events-none absolute left-[76%] top-[12%] -translate-x-1/2 -translate-y-1/2 text-[clamp(4.5rem,12vw,11rem)] font-black leading-none text-white/50">
                4
              </div>

              {steps.map((step, index) => {
                const Icon = step.icon;
                const active = activeIndex === index;

                return (
                  <div
                    key={step.title}
                    onMouseEnter={() => setActive(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActiveIndex(null)}
                    className={`path-node group absolute z-20 -translate-x-1/2 -translate-y-1/2 ${nodePositions[index]}`}
                    tabIndex={0}
                  >
                    <button
                      type="button"
                      className={`grid h-14 w-14 place-items-center rounded-full text-base font-black shadow-[0_18px_42px_rgba(73,48,31,0.18)] transition duration-300 group-hover:-translate-y-2 ${
                        active
                          ? "bg-[#ff745f] text-white"
                          : "bg-white/88 text-[#211713]"
                      }`}
                    >
                      {index + 1}
                    </button>

                    {active ? (
                      <div
                        className={`step-popup-${index} absolute z-40 w-[min(280px,32vw)] max-w-[280px] animate-[fadeIn_.18s_ease-out] rounded-[1.45rem] bg-white/42 p-3 shadow-[0_22px_60px_rgba(61,42,28,0.14)] backdrop-blur-2xl ${popupPositions[index]}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0ec] text-[#ff745f]">
                            <Icon size={19} />
                          </span>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ff745f]">
                              {step.number} / {step.kicker}
                            </p>
                            <h3 className="mt-1 text-base font-black leading-tight text-[#17120f]">
                              {step.title}
                            </h3>
                            <p className="mt-1.5 text-[11px] font-semibold leading-5 text-[#6f6158]">
                              {step.text}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
                          {step.flow.map((item, itemIndex) => (
                            <div
                              key={item}
                              className="min-w-[96px] rounded-xl bg-white/50 px-3 py-2"
                            >
                              <p className="text-[10px] font-black text-[#ff745f]">
                                0{itemIndex + 1}
                              </p>
                              <p className="text-xs font-black text-[#251b16]">
                                {item}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-1 max-h-[92px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                          <div className="grid gap-1.5">
                            {step.points.map((point) => (
                              <div key={point} className="flex items-start gap-2">
                                <CheckCircle2
                                  size={15}
                                  className="mt-0.5 shrink-0 text-[#ff745f]"
                                />
                                <p className="text-xs font-bold leading-5 text-[#65564c]">
                                  {point}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div className="pointer-events-none absolute left-[46%] top-[12%] hidden items-center gap-2 rounded-full bg-white/55 px-4 py-2 text-xs font-black text-[#ff745f] shadow-sm backdrop-blur-md sm:flex">
                <Sparkles size={14} />
                Hover path steps
              </div>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes hiwFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
