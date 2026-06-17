import {
  BadgeCheck,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Logo from "../common/Logo";

export default function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#071422] px-5 pt-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(250,204,21,0.12),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.14),transparent_32%)]" />
      <div className="absolute left-[-120px] top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute right-[-120px] bottom-0 h-72 w-72 rounded-full bg-yellow-300/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-white/10 pb-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr]">
          {/* BRAND */}
          <div>
            <div className="w-fit rounded-2xl bg-yellow-50 p-3">
              <Logo />
            </div>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              BuddyBOOK is a verified social activity platform for safe,
              friendly and strictly platonic real-world meetups.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-200">
                <ShieldCheck size={16} className="text-yellow-300" />
                Verified profiles
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-200">
                <BadgeCheck size={16} className="text-yellow-300" />
                Platonic only
              </div>
            </div>
          </div>

          {/* PLATFORM */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-yellow-200">
              Platform
            </h4>

            <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-300">
              <p>How BuddyBOOK works</p>
              <p>Popular activities</p>
              <p>Safety verification</p>
              <p>Provider onboarding</p>
            </div>
          </div>

          {/* SAFETY */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-yellow-200">
              Safety
            </h4>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-center gap-3">
                  <Sparkles size={18} className="text-yellow-300" />
                  <p className="text-sm font-black text-white">
                    Safe meetup policy
                  </p>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Public places first, in-app chat, live location support and
                  report controls.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-yellow-300" />
                  <p className="text-sm font-black text-white">
                    Support
                  </p>
                </div>

                <p className="mt-2 text-sm text-slate-300">
                  support@buddybook.in
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="flex flex-col gap-3 py-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} BuddyBOOK. All rights reserved.</p>

          <div className="flex items-center gap-2 font-semibold text-slate-300">
            <MapPin size={16} className="text-yellow-300" />
            Built for safe public meetups.
          </div>
        </div>
      </div>
    </footer>
  );
}