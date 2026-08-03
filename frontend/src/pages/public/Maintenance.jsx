import { Bell, Clock3, Mail, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import cafeImage from "../../assets/safety-cafe-hero.jpg";

const improvements = [
  { icon: Wrench, title: "System upgrade", text: "Improving performance and speed", tone: "orange" },
  { icon: ShieldCheck, title: "Security enhancement", text: "Making PPlusOne more secure", tone: "blue" },
  { icon: Sparkles, title: "New features", text: "Adding exciting new features for you", tone: "green" },
];

const tones = {
  orange: "bg-orange-500 text-white",
  blue: "bg-blue-500 text-white",
  green: "bg-emerald-500 text-white",
};

export default function Maintenance({ onCheckAgain, checking = false }) {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#fffaf4] text-[#102b50]">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1600px] items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.94fr)_minmax(420px,1.06fr)] lg:px-14 lg:py-10 xl:gap-16 xl:px-24">
        <section className="mx-auto w-full max-w-2xl lg:mx-0">
          <div className="mb-6 flex items-center justify-between gap-4">
            <img src="/pplusone-logo.png" alt="PPlusOne" className="h-16 w-auto object-contain sm:h-20" />
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-300 bg-white/80 px-3.5 py-2 text-xs font-extrabold text-orange-600 shadow-sm sm:px-5 sm:text-sm">
              <Wrench size={16} /> Maintenance in progress
            </span>
          </div>

          <h1 className="text-[clamp(2.7rem,7vw,5.4rem)] font-black leading-[0.95] tracking-[-0.055em]">
            We&apos;re making<br />things better<br /><span className="text-orange-500">for you!</span>
          </h1>
          <p className="mt-5 max-w-xl text-base font-bold leading-relaxed text-[#102b50]/75 sm:text-lg lg:text-xl">
            Our platform is currently under maintenance. We&apos;ll be back shortly with a faster, smoother and even better experience.
          </p>

          <div className="mt-6 rounded-3xl border border-black/5 bg-white/90 p-3 shadow-[0_18px_50px_rgba(31,41,55,0.08)] sm:p-4">
            {improvements.map(({ icon: Icon, title, text, tone }, index) => (
              <div key={title} className={`flex items-center gap-3 py-3 sm:gap-4 ${index ? "border-t border-black/5" : ""}`}>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tones[tone]}`}><Icon size={20} /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-black sm:text-base">{title}</h2>
                  <p className="text-xs font-semibold text-[#102b50]/60 sm:text-sm">{text}</p>
                </div>
                <span className="hidden rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-500 sm:block">In progress</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-4 rounded-3xl border border-orange-200 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-500"><Bell size={21} /></span>
              <div><p className="font-black">We&apos;ll be back soon!</p><p className="text-xs font-semibold text-[#102b50]/60 sm:text-sm">Thank you for your patience and support.</p></div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-2 text-sm font-black text-orange-500">
              <Clock3 size={19} /> Expected back shortly
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm font-bold text-[#102b50]/70"><Mail size={20} className="text-orange-500" /> Updates will be shared on your registered email.</div>
            <button type="button" onClick={onCheckAgain} disabled={checking} className="rounded-full bg-[#102b50] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#183d6e] disabled:opacity-60">
              {checking ? "Checking..." : "Check again"}
            </button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl lg:max-w-none">
          <div className="relative mx-auto aspect-[4/4.75] max-h-[84dvh] w-full overflow-hidden rounded-t-[45%] rounded-b-[2rem] bg-orange-100 shadow-[0_28px_80px_rgba(192,108,52,0.18)]">
            <img src={cafeImage} alt="Friends meeting in a cafe" className="h-full w-full object-cover object-[63%_center]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#8b4c20]/15 via-transparent to-white/5" />
          </div>
        </section>
      </div>
    </main>
  );
}
