import { ArrowRight, CheckCircle2, MapPin, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCachedProviders, listProviders } from "../../api/providers";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";

function buildActivities(providers) {
  const names = [...new Set((Array.isArray(providers) ? providers : []).flatMap((provider) =>
    Array.isArray(provider.activities) ? provider.activities : String(provider.activities || "").split(",")
  ).map((item) => String(item).trim()).filter(Boolean))];
  const icons = ["☕", "🎬", "🍽️", "🎮", "🚶", "📸"];
  return names.map((name, index) => ({ name, tag: "Live provider activity", icon: icons[index % icons.length] }));
}

export default function Activities() {
  const [activities,setActivities]=useState(() => buildActivities(getCachedProviders()));
  useEffect(()=>{let mounted=true;listProviders({verified:true}).then((providers)=>{if(mounted)setActivities(buildActivities(providers));}).catch(()=>{});return()=>{mounted=false;};},[]);
  const marqueeActivities = [
    ...activities.slice(0, 10),
    ...activities.slice(0, 10),
  ];

  return (
    <div className="min-h-screen bg-[#fffaf3] text-[#2b211b]">
      <PublicNavbar />

      <main className="pt-20">
        <section
          id="explore"
          className="relative overflow-hidden bg-[#f5efe7] px-4 py-12 sm:px-5 lg:py-16"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,250,243,0.84)_42%,rgba(255,210,183,0.30))]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/75 to-transparent" />
          <div className="pointer-events-none absolute -right-28 top-24 h-72 w-72 rounded-full bg-[#ff745f]/12 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-16 h-72 w-72 rounded-full bg-white/80 blur-3xl" />

          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.2rem] bg-white/72 shadow-[0_35px_100px_rgba(93,70,50,0.14)] backdrop-blur-xl">
            <div className="px-4 py-6 sm:px-6">
              <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full bg-[#fffaf3] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#b8644d] shadow-sm">
                <Sparkles size={15} />
                Popular activities
              </div>

              <div className="activity-marquee-perspective relative overflow-x-auto overflow-y-hidden rounded-[2rem] bg-[#fffaf3]/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_24px_70px_rgba(93,70,50,0.12)] [transform-style:preserve-3d] before:pointer-events-none before:absolute before:inset-2 before:rounded-[1.6rem] before:bg-[linear-gradient(135deg,rgba(255,255,255,0.82),transparent_45%,rgba(255,116,95,0.10))] before:content-['']">
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[#fffaf3] to-transparent sm:w-32" />
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-[#fffaf3] to-transparent sm:w-32" />

                <div className="activity-marquee-3d relative z-10 flex w-max gap-4 px-6 py-2">
                  {marqueeActivities.map((activity, index) => (
                    <div
                      key={`${activity.name}-${index}`}
                      className="activity-pill-3d group flex min-w-[215px] items-center gap-3 rounded-[1.35rem] bg-white/82 px-4 py-3 text-[#3a3029] shadow-[0_18px_44px_rgba(93,70,50,0.12)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-[#fffaf3] hover:shadow-[0_24px_60px_rgba(255,116,95,0.16)]"
                    >
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fffaf3] text-xl text-[#b8644d] shadow-[inset_0_0_0_1px_rgba(255,116,95,0.12),0_12px_24px_rgba(93,70,50,0.10)] transition group-hover:scale-110 group-hover:bg-[#fff0e8]">
                        {activity.icon}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#b58a78]">
                          {activity.tag}
                        </p>
                        <h3 className="mt-0.5 truncate text-[15px] font-black tracking-tight text-[#3a3029]">
                          {activity.name}
                        </h3>
                      </div>

                      <ArrowRight
                        size={16}
                        className="ml-auto shrink-0 text-[#d86f55] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-9 px-5 py-9 sm:px-7 md:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:px-12 lg:py-14">
              <div className="flex flex-col justify-center">
                <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#fffaf3] px-4 py-2 text-sm font-black text-[#6f6158] shadow-sm">
                  <Star size={16} className="text-[#d86f55]" />
                  Real plans, real people
                </div>

                <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-[#2b211b] md:text-6xl">
                  Choose an activity.
                  <span className="block text-[#8a7468]">
                    Find your right buddy.
                  </span>
                </h2>

                <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-[#75665b] md:text-lg">
                  BuddyBOOK turns everyday plans into safer, verified social
                  experiences with clear booking flow and public meetup signals.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    "Verified activity partners",
                    "Safe public meetup flow",
                    "In-app chat before booking",
                    "Live location during meetup",
                  ].map((item) => (
                    <div
                      key={item}
                      className="group flex items-center gap-3 rounded-2xl bg-white/72 p-3.5 text-sm font-black text-[#4f4037] shadow-sm transition hover:-translate-y-1 hover:bg-[#fffaf3] hover:shadow-[0_18px_42px_rgba(93,70,50,0.12)]"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fffaf3] text-[#d86f55] transition group-hover:bg-[#fff0e8]">
                        <CheckCircle2 size={17} />
                      </span>
                      {item}
                    </div>
                  ))}
                </div>

                 <div className="mt-8 flex flex-wrap gap-3">
                  
                </div>
              </div>

              <div className="relative flex items-center justify-center overflow-visible">
                <div className="pointer-events-none absolute -right-6 top-8 h-52 w-52 rounded-full bg-[#ff745f]/15 blur-3xl" />
                <div className="pointer-events-none absolute -left-6 bottom-8 h-52 w-52 rounded-full bg-[#ffcf33]/20 blur-3xl" />

                <div className="activity-showcase-3d relative w-full max-w-xl rounded-[2rem] bg-gradient-to-br from-[#fff5ee] to-[#fffaf3] p-4 shadow-[0_35px_90px_rgba(93,70,50,0.18)] ring-1 ring-[#ffcf33]/60 transition duration-500 hover:-translate-y-2 hover:shadow-[0_45px_110px_rgba(255,116,95,0.18)]">
                  <div className="rounded-[1.55rem] bg-white p-4 shadow-inner shadow-[#ffcf33]/40">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b8644d]">
                          Activity board
                        </p>

                        <h3 className="mt-1 text-2xl font-black text-[#2b211b]">
                          Trending this week
                        </h3>
                      </div>

                      <div className="rounded-full bg-[#ff745f] px-4 py-2 text-xs font-black text-white shadow-lg shadow-[#ff745f]/30">
                        Verified
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {activities.slice(0, 5).map((activity, index) => (
                        <div
                          key={activity.name}
                          className="group flex items-center justify-between gap-3 rounded-2xl bg-[#fff5ee] p-3 transition hover:translate-x-1 hover:bg-white hover:shadow-[0_16px_36px_rgba(255,116,95,0.18)]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fffaf3] text-xl text-[#b8644d] shadow-[inset_0_0_0_1px_rgba(255,116,95,0.25),0_10px_20px_rgba(93,70,50,0.10)] transition group-hover:bg-[#fff0e8]">
                              {activity.icon}
                            </div>

                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-black text-[#2b211b]">
                                {activity.name}
                              </h4>

                              <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-bold text-[#75665b]">
                                <MapPin size={12} className="shrink-0 text-[#d86f55]" />
                                {index + 2} nearby verified plans
                              </p>
                            </div>
                          </div>

                           <Link
                            to="/#providers"
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-[#d86f55] transition hover:bg-[#ff745f] hover:text-white shadow-sm"
                          >
                            Book
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute -bottom-5 left-7 rounded-2xl bg-[#ff745f] px-5 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(93,70,50,0.18)]">
                    10+ meetup plans
                  </div>

                  <div className="absolute -right-3 top-3 rounded-2xl bg-[#171b30] px-4 py-2.5 text-xs font-black text-[#ffcf33] shadow-[0_14px_32px_rgba(93,70,50,0.14)]">
                    Safe companionship
                  </div>
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
