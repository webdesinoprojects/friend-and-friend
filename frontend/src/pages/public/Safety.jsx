import { useEffect } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Check,
  CircleDollarSign,
  Clock3,
  FileText,
  HeartHandshake,
  Mail,
  Navigation,
  LockKeyhole,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Siren,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";
import safetyHero from "../../assets/safety-cafe-hero.jpg";

const essentials = [
  [UserCheck, "Adults only", "PPlusOne is strictly for people aged 18+."],
  [BadgeCheck, "Verified identity", "Review the complete profile before booking."],
  [MessageCircle, "In-app planning", "Keep timing, place and expectations in chat."],
  [CircleDollarSign, "Platform payments", "Never send money or accept side deals."],
  [Siren, "Report quickly", "Leave and report whenever something feels wrong."],
];

const sharedRules = [
  "Use your real identity and accurate details.",
  "Choose a visible, public meeting place.",
  "Keep conversation and planning in PPlusOne.",
  "Respect personal, physical and emotional boundaries.",
  "Never share passwords, OTPs or private documents.",
];

const userRules = [
  "Review photos, verification, activities and reviews.",
  "Book and pay only through PPlusOne.",
  "Share the plan with someone you trust.",
  "Do not request services outside the listed activity.",
  "Report pressure, misconduct or suspicious requests.",
  "Set clear boundaries before confirming the plan.",
  "Stay sober and alert throughout the meetup.",
  "Do not bring an unapproved guest.",
  "Protect the provider's personal information.",
  "End the meetup if identity details do not match.",
];

const providerRules = [
  "Keep your profile, photos and services truthful.",
  "Accept only clearly agreed platonic activities.",
  "Never request tips, gifts or off-platform payment.",
  "Do not move the chat away from PPlusOne.",
  "End and report unsafe or disrespectful bookings.",
  "Meet only at the agreed public location.",
  "Respect physical and emotional boundaries.",
  "Protect the user's privacy and personal details.",
  "Never discriminate, threaten or intimidate.",
  "Deliver only the activity shown on your profile.",
];

const prohibited = [
  [HeartHandshake, "Romantic or sexual services"],
  [Ban, "Threats or harassment"],
  [Users, "Anyone under 18"],
  [CircleDollarSign, "Fraud or side payments"],
  [LockKeyhole, "Recording without consent"],
  [AlertTriangle, "Drugs or illegal activity"],
  [MapPin, "Stalking or unwanted contact"],
  [ShieldCheck, "Hate or discrimination"],
  [Ban, "Blackmail or exploitation"],
  [Users, "Human trafficking"],
];

const risks = [
  [UserCheck, "Identity mismatch", "Profile details do not match the person."],
  [AlertTriangle, "Boundary violations", "Pressure, harassment or unsafe conduct."],
  [CircleDollarSign, "Financial scams", "Requests for transfers or side payments."],
  [MapPin, "Unsafe locations", "Private or isolated meeting places."],
  [WalletCards, "Property risk", "Loss, theft or damage to belongings."],
  [Ban, "Substance risk", "Alcohol or drugs affecting judgement."],
  [LockKeyhole, "Digital privacy", "Photos, chats or data shared without consent."],
  [Siren, "Medical emergency", "Illness, injury or allergic reactions."],
  [Navigation, "Transport risk", "Unverified or unsafe travel arrangements."],
  [HeartHandshake, "Expectation mismatch", "Different assumptions about the activity."],
];

const commitments = [
  [UserCheck, "Identity checks", "Selected account details may be verified before access."],
  [FileText, "In-app records", "Chats, bookings and payments create a clear activity record."],
  [ShieldCheck, "Reporting tools", "Users can report, block and flag concerning behaviour."],
  [Ban, "Account action", "Serious or repeated violations may lead to removal."],
  [Mail, "Grievance support", "Safety concerns are reviewed through a documented process."],
];

const meetupStages = [
  {
    label: "Before",
    title: "Prepare the plan",
    tone: "bg-[#f1f7ef] text-[#3e6849]",
    items: ["Check the profile and reviews", "Agree on activity, time and cost", "Pick a public location", "Tell someone where you are going"],
  },
  {
    label: "During",
    title: "Stay in control",
    tone: "bg-[#eef3f8] text-[#3d5f7a]",
    items: ["Confirm they match the profile", "Keep your belongings with you", "Communicate boundaries clearly", "Leave whenever you feel uncomfortable"],
  },
  {
    label: "After",
    title: "Close the loop",
    tone: "bg-[#fff0ed] text-[#a84e3e]",
    items: ["Return using safe transport", "Block contact if necessary", "Report unsafe behaviour", "Leave a fair, honest review"],
  },
];

function RuleList({ items, accent }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-xs font-semibold leading-5 text-black/65 sm:text-sm">
          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${accent}`}><Check size={11} strokeWidth={3} /></span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function Safety() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);
  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#1d1d1b]">
      <PublicNavbar />

      <main className="overflow-hidden pt-20">
        <div>
        <section className="grid min-h-[520px] bg-[#fffaf4] lg:grid-cols-[.9fr_1.1fr]">
          <div className="order-2 flex items-center justify-center px-5 pb-11 pt-32 sm:px-8 sm:py-14 lg:px-10 xl:px-14">
            <div className="mx-auto w-full max-w-[52rem]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f1c9c0] bg-white/85 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#2b2926] shadow-[0_8px_22px_rgba(43,33,25,.05)]">
                <ShieldCheck size={16} className="text-[#ff745f]" /> Your safety, our priority
              </div>
              <h1 className="mt-6 max-w-[48rem] font-sans text-[2.7rem] font-extrabold leading-[.96] tracking-[-.055em] text-[#1d1d1b] sm:text-6xl xl:text-[4.7rem]">
                Meet confidently.<br /><span className="text-[#ff745f]">Stay in control.</span>
              </h1>
              <p className="mt-5 max-w-[44rem] text-sm font-medium leading-6 text-black/58 sm:text-base sm:leading-7">PPlusOne is designed for platonic companionship and public social activities. Respect boundaries, communicate clearly and follow the safety rules before, during and after every meetup.</p>
              <div className="mt-7 grid max-w-[47rem] grid-cols-3 gap-x-3 gap-y-5 border-y border-black/8 py-5 sm:grid-cols-6 sm:gap-x-5">
                {[
                  [UserCheck, "Adults only", "18+"], [BadgeCheck, "Identity", "checks"], [MessageCircle, "In-app", "chat"],
                  [CircleDollarSign, "Secure", "payments"], [Ban, "Report &", "block"], [ShieldCheck, "Safety", "support"],
                ].map(([Icon, lineOne, lineTwo]) => (
                  <div key={lineOne} className="text-center">
                    <span className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[#f1c9c0] bg-white text-[#ff745f] shadow-[0_7px_18px_rgba(43,33,25,.05)]"><Icon size={17} /></span>
                    <p className="mt-2 text-[10px] font-extrabold leading-4 text-black/62">{lineOne}<br />{lineTwo}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex max-w-[47rem] items-center gap-3 rounded-xl border border-[#f1c9c0] bg-white/80 px-4 py-3.5 text-xs font-semibold leading-5 text-black/55 shadow-[0_10px_26px_rgba(43,33,25,.04)]">
                <AlertTriangle size={18} className="shrink-0 text-[#ff745f]" /> PPlusOne is not a dating, escort, medical, transport or accommodation platform.
              </div>
            </div>
          </div>
          <div className="order-1 relative min-h-[430px] overflow-visible sm:min-h-[390px] lg:min-h-full lg:overflow-hidden">
            <img src={safetyHero} alt="Two adults meeting safely in a busy public cafe" className="absolute inset-0 h-full w-full object-cover object-[76%_center] [mask-image:radial-gradient(ellipse_82%_82%_at_center,#000_52%,transparent_100%)] sm:object-[74%_center]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[4.25rem] bg-gradient-to-b from-[#fffaf4]/85 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#fffaf4]/90 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#fffaf4]/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[4.25rem] bg-gradient-to-l from-[#fffaf4]/90 to-transparent" />
            <aside className="absolute bottom-0 left-1/2 z-10 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 translate-y-1/2 rounded-xl border border-black/8 bg-[#fffdf9]/96 p-3.5 text-[#1d1d1b] shadow-[0_18px_48px_rgba(35,27,20,.16)] backdrop-blur sm:bottom-5 sm:translate-y-0 sm:p-5">
              <p className="text-sm font-extrabold">Before every meetup</p>
                <ol className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                {["Review the complete profile", "Keep communication in PPlusOne", "Select a public location", "Share the plan with someone you trust", "Leave immediately if uncomfortable"].map((item, index) => (
                  <li key={item} className="flex items-center gap-3 text-[11px] font-semibold text-black/65"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#fff0ed] text-[9px] font-black text-[#d85f48]">{index + 1}</span>{item}</li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#d85f48]">The essentials</p>
            <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-[-.04em] sm:text-5xl">Five things to remember</h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {essentials.map(([Icon, title, copy], index) => (
              <article key={title} className={`rounded-xl border border-black/8 bg-white p-4 shadow-[0_10px_28px_rgba(48,35,24,.04)] ${index === essentials.length - 1 ? "col-span-2 flex min-h-0 items-center gap-4 sm:col-span-1 sm:block" : ""}`}>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#fff0ed] text-[#df644d]"><Icon size={18} /></span>
                    <h3 className="text-sm font-extrabold">{title}</h3>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold leading-5 text-black/50">{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="rules" className="bg-[#fffaf2] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[.22em] text-[#d85f48]">Clear expectations</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold leading-[1.02] tracking-[-.04em] sm:text-5xl">Respect works both ways.</h2>
              <p className="mt-4 text-base font-medium leading-7 text-black/55">Everyone follows the shared rules. Users and providers also have a few responsibilities of their own.</p>
            </div>
            <div className="mt-7 flex snap-x gap-0 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:divide-x md:divide-black/10 md:overflow-visible md:pb-0">
              <article className="min-w-[82vw] snap-start px-4 py-5 md:min-w-0 md:px-6 md:last:pr-0">
                <BadgeCheck size={22} className="mb-4 text-[#d85f48]" />
                <span className="text-xs font-black uppercase tracking-[.18em] text-[#d85f48]">Provider rules</span>
                <h3 className="mt-2 text-2xl font-black">What every provider must follow</h3>
                <RuleList items={providerRules} accent="bg-[#fff0ed] text-[#d85f48]" />
              </article>
              <article className="min-w-[82vw] snap-start border-r border-black/10 px-4 py-5 md:min-w-0 md:border-r-0 md:px-6">
                <UserCheck size={22} className="mb-4 text-[#d85f48]" />
                <span className="text-xs font-black uppercase tracking-[.18em] text-[#d85f48]">For users</span>
                <h3 className="mt-2 text-2xl font-black">Book thoughtfully</h3>
                <RuleList items={userRules} accent="bg-[#fff0ed] text-[#d85f48]" />
              </article>
                 <article className="min-w-[82vw] snap-start border-r border-black/10 px-4 py-5 first:pl-0 md:min-w-0 md:border-r-0 md:px-6 md:first:pl-0">
                <Users size={22} className="mb-4 text-[#d85f48]" />
                <span className="text-xs font-black uppercase tracking-[.18em] text-[#796652]">Member rules</span>
                <h3 className="mt-2 text-2xl font-black">What every member must follow</h3>
                <RuleList items={sharedRules} accent="bg-[#ded3c2] text-[#4c4036]" />
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[#18241d] px-4 py-10 text-white sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[.22em] text-[#ff947f]">Zero tolerance</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em] sm:text-4xl">Never acceptable on PPlusOne</h2>
              <p className="mt-3 max-w-2xl text-xs font-medium leading-6 text-white/55">These behaviours can lead to immediate restriction or permanent removal.</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
              {prohibited.map(([Icon, title]) => (
                <article key={title} className="flex min-w-0 items-center gap-2.5 py-1.5">
                  <Icon size={17} className="shrink-0 text-[#ff947f]" />
                  <h3 className="text-[10px] font-extrabold leading-4 sm:text-xs">{title}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#fffaf2] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[.22em] text-[#d85f48]">Stay aware</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-[-.04em] sm:text-5xl">Safety concerns to recognise</h2>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-black/50">Knowing the warning signs makes it easier to pause, leave or report early.</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {risks.map(([Icon, title, copy]) => (
                <article key={title} className="rounded-xl border border-[#efdcd5] bg-white p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff0ed] text-[#df604b]"><Icon size={18} /></span>
                    <h3 className="text-sm font-black">{title}</h3>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold leading-5 text-black/45">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#d85f48]">Simple safety rhythm</p>
            <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-[-.04em] sm:text-5xl">Before, during and after</h2>
          </div>
          <div className="mt-5 flex snap-x gap-0 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:divide-x sm:divide-black/10 sm:overflow-visible sm:pb-0">
            {meetupStages.map((stage) => (
              <article key={stage.label} className="min-w-[78vw] snap-start border-r border-black/10 px-4 py-3 text-[#d85f48] first:pl-0 last:border-r-0 sm:min-w-0 sm:border-r-0 sm:px-6 sm:py-4 sm:first:pl-0 sm:last:pr-0">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em]">{stage.label}</span>
                  <Clock3 size={20} />
                </div>
                <h3 className="mt-6 text-2xl font-black text-[#1d1d1b]">{stage.title}</h3>
                <RuleList items={stage.items} accent="bg-white/80 text-black/65" />
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#fffaf2] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <ShieldCheck size={27} className="text-[#e66b4f]" />
                <p className="text-xs font-black uppercase tracking-[.22em] text-[#d85f48]">What PPlusOne does</p>
              </div>
              <h2 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight tracking-[-.04em] sm:text-5xl">Safety tools from us. Safe choices from you.</h2>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-black/55">We provide identity checks, activity records, reporting and account enforcement. You remain responsible for checking profiles, choosing public places, protecting your information and leaving any unsafe situation.</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {commitments.map(([Icon, title, copy], index) => (
                <article key={title} className={`rounded-xl border border-black/8 bg-white p-4 ${index === commitments.length - 1 ? "col-span-2 flex min-h-0 items-center gap-4 sm:col-span-1 sm:block" : ""}`}>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Icon size={18} className="shrink-0 text-[#e66b4f]" />
                      <h3 className="text-sm font-extrabold">{title}</h3>
                    </div>
                    <p className="mt-1.5 text-[11px] font-semibold leading-5 text-black/45">{copy}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[.9fr_1.1fr]">
              <article className="rounded-xl bg-[#1d1d1b] p-5 text-white sm:p-6">
                <p className="text-xs font-black uppercase tracking-[.18em] text-[#ff947f]">Responsibility & legal notice</p>
                <p className="mt-3 rounded-lg border border-white/10 bg-white/[.06] p-3 text-xs font-extrabold leading-5 text-white/85">Your personal safety remains in your hands. PPlusOne supplies platform tools but cannot guarantee another member's identity, intentions, behaviour or actions outside reasonable platform controls.</p>
                <ul className="mt-5 space-y-3 text-xs font-semibold leading-5 text-white/60">
                  <li>• PPlusOne helps independent adults discover, communicate and arrange lawful platonic activities.</li>
                  <li>• Verification confirms information at a point in time and is not a guarantee of future conduct.</li>
                  <li>• PPlusOne is not an emergency service and does not provide transport, accommodation, escort or medical services.</li>
                  <li>• Members remain responsible for personal judgement, boundaries and lawful behaviour.</li>
                  <li>• Serious violations may lead to restriction or permanent account removal.</li>
                </ul>
              </article>

              <article className="rounded-xl border border-[#efdcd5] bg-white p-5 sm:p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.18em] text-[#d85f48]">Grievance contact</p>
                    <p className="mt-4 text-sm font-black">Safety and account concerns</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-black/50">Use PPlusOne’s Contact page and include your booking or report reference. For immediate danger, call emergency services first.</p>
                    <Link to="/contact" className="mt-4 inline-flex rounded-full bg-[#e66b4f] px-4 py-2.5 text-xs font-black text-white">Open contact support</Link>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.18em] text-[#d85f48]">Safety acknowledgement</p>
                    <ul className="mt-4 space-y-2 text-[11px] font-semibold leading-5 text-black/55">
                      {["I am 18 or older.", "I will use PPlusOne only for lawful platonic activities.", "I will respect boundaries, privacy and consent.", "I will meet in public and report unsafe behaviour."].map((item) => <li key={item} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-[#e66b4f]" />{item}</li>)}
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
