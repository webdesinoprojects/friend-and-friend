import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  CreditCard,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import homeBg from "../../assets/home-bg.jpg";
import meetupPanel from "../../assets/meetup-panel.jpg";
import { activities } from "../../data/mockData";
import { PrimaryButton, SecondaryButton } from "../../components/common/Button";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";

export default function Home() {
  const steps = [
    {
      icon: User,
      title: "Create account",    },
    {
      icon: BadgeCheck,
      title: "Verify identity", },
    {
      icon: Calendar,
      title: "Choose your plan",    },
    {
      icon: MapPin,
      title: "Meet safely",    },
  ];

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
      "Select a public meetup location.",
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

      <main>
        {/* HERO */}
<section
  className="relative overflow-hidden bg-white"
  style={{
    backgroundImage: `url(${homeBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
  {/* MOBILE ONLY SOFT OVERLAY */}
  <div className="pointer-events-none absolute inset-0 bg-white/75 sm:bg-white/60 lg:bg-transparent" />

  <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-10 sm:px-5 sm:pt-28 sm:pb-14 md:pt-32 md:pb-20 lg:pt-36 lg:pb-24">
    <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
      {/* LEFT CONTENT */}
      <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-3xl lg:text-left">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/40 bg-[#b5e48c] px-3.5 py-2 text-xs font-black text-black shadow-sm backdrop-blur-md sm:mb-5 sm:px-4 sm:text-sm">
          <ShieldCheck size={17} />
          Verified. Platonic. Public-meetup focused.
        </div>

        <h1 className="text-[2.45rem] font-black leading-[0.95] tracking-tight text-black sm:text-5xl md:text-4xl lg:text-7xl">
          Find a trusted buddy for every plan.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-black/70 sm:mt-6 sm:max-w-2xl sm:text-lg sm:leading-8 lg:mx-0">
          Book verified companions for movies, dinner, shopping, gaming, tours
          and events.
        </p>

        <div className="relative z-30 mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row lg:justify-start">
          <Link
            to="/register"
            className="inline-flex w-full transform-gpu items-center justify-center rounded-2xl border border-black bg-black px-6 py-3.5 text-sm font-black text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:bg-[#a2d2ff] hover:text-black hover:shadow-[0_25px_55px_rgba(0,0,0,0.25)] sm:w-auto sm:py-3"
          >
            Find a Buddy
          </Link>

          <Link
            href="/contact"
            className="inline-flex w-full transform-gpu items-center justify-center rounded-2xl border border-black/10 bg-white/90 px-6 py-3.5 text-sm font-black text-black shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:bg-black hover:text-white sm:w-auto sm:py-3"
          >
            Contact Us
          </Link>
        </div>

        {/* MOBILE BETTER CHIPS */}
        <div className="mt-6 flex max-w-full gap-3 overflow-x-auto pb-2 sm:mt-8 sm:grid sm:max-w-2xl sm:grid-cols-4 sm:overflow-visible sm:pb-0">
          {["KYC Flow", "Face Check", "Live Location", "Safe Chat"].map(
            (item) => (
              <div
                key={item}
                className="min-w-[135px] rounded-2xl border border-black/10 bg-[#dee2e6]/95 p-3 text-center text-xs font-black text-black shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white sm:min-w-0"
              >
                <CheckCircle2 className="mx-auto mb-1 text-black" size={18} />
                {item}
              </div>
            )
          )}
        </div>
      </div>

      {/* RIGHT IMAGE PANEL */}
      <div className="group relative z-0 mt-2 lg:z-20 lg:mt-0">
        {/* SOFT GLOW */}
        <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-[#a2d2ff]/30 blur-2xl transition duration-500 group-hover:bg-[#a2d2ff]/40 sm:-inset-5 sm:rounded-[2.7rem]" />

        {/* FLOATING TOP BADGE */}
        <div className="absolute -left-4 top-32 z-10 hidden rounded-2xl border border-black/10 bg-white/90 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.16)] backdrop-blur-xl transition duration-500 group-hover:-translate-y-2 group-hover:scale-105 md:block">
          <div className="flex items-center gap-2 border-2 border-transparent">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#b5e48c] text-black">
              <ShieldCheck size={17} />
            </div>
            <div>
              <p className="text-xs font-black text-black">Verified</p>
              <p className="text-[11px] font-bold text-black/55">
                Safe profile flow
              </p>
            </div>
          </div>
        </div>

        {/* FLOATING RIGHT BADGE */}
        <div className="absolute -right-4 top-24 z-10 hidden rounded-2xl border border-[#979dac] bg-black px-4 py-3 text-white shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition duration-500 group-hover:-translate-y-2 group-hover:scale-105 lg:block">
          <div className="flex items-center gap-2">
            <MapPin size={17} className="text-[#a2d2ff]" />
            <div>
              <p className="text-xs font-black">Public places</p>
              <p className="text-[11px] font-bold text-white/60">
                Meetup focused
              </p>
            </div>
          </div>
        </div>

        {/* MAIN IMAGE CARD */}
        <div className="relative z-0 transform-gpu overflow-hidden rounded-[1.8rem] border-2 border-black/40 bg-white/80 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.01] group-hover:shadow-[0_35px_90px_rgba(0,0,0,0.22)] sm:rounded-[2.3rem] sm:border-black/50 sm:p-3 lg:group-hover:-translate-y-2 lg:group-hover:scale-[1.02]">
          <div className="relative overflow-hidden rounded-[1.35rem] sm:rounded-[1.8rem]">
            <img
              src={meetupPanel}
              alt="People meeting safely in a cafe"
              className="h-[310px] w-full object-cover object-center transition duration-700 group-hover:scale-105 sm:h-[430px] sm:object-[70%_center] lg:h-[500px]"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/82 via-black/20 to-transparent" />

            {/* TOP MINI LABEL */}
            <div className="absolute left-3 top-3 rounded-full border border-white/25 bg-white/20 px-3 py-1.5 text-[11px] font-black text-white shadow-lg backdrop-blur-xl sm:left-5 sm:top-5 sm:px-4 sm:py-2 sm:text-xs">
              Safe social planning
            </div>

            {/* MOBILE FLOATING RATING */}
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/65 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur-xl sm:hidden">
              <Star size={12} className="fill-white" />
              4.9
            </div>

            {/* BOTTOM CONTENT CARD */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5">
              <div className="rounded-2xl border border-white/25 bg-white/20 p-4 text-white shadow-xl backdrop-blur-xl transition duration-500 group-hover:bg-white/25 sm:rounded-3xl sm:p-5">
                <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
                  <p className="rounded-full bg-[#a2d2ff] px-3 py-1 text-xs font-black text-black sm:text-sm">
                    Public meetup
                  </p>

                  <div className="hidden items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white sm:flex">
                    <Star size={13} className="fill-white" />
                    4.9
                  </div>
                </div>

                <h3 className="text-xl font-black leading-tight sm:text-2xl">
                  Coffee, conversation and safe planning
                </h3>

                <p className="mt-2 text-xs leading-5 text-white/85 sm:text-sm sm:leading-6">
                  Choose activity, place and time before connecting safely
                  through in-app chat.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM STATS */}
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 sm:mt-5 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
          {[
            ["Verified", "Profile checks"],
            ["Public", "Meetup places"],
            ["Support", "Report system"],
          ].map(([title, text]) => (
            <div
              key={title}
              className="min-w-[145px] transform-gpu rounded-2xl border border-black/10 bg-[#dee2e6]/95 p-4 text-center shadow-lg backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:bg-white hover:shadow-[0_22px_45px_rgba(0,0,0,0.16)] sm:min-w-0"
            >
              <div className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-black text-white transition">
                <CheckCircle2 size={16} />
              </div>

              <p className="text-base font-black text-black sm:text-lg">
                {title}
              </p>
              <p className="mt-1 text-xs font-bold text-black/60">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</section>
      </main>

      <PublicFooter />
    </div>
  );
}