import { ArrowRight, CheckCircle2, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { activities } from "../../data/mockData";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";

export default function Activities() {
  return (
    <div className="min-h-screen bg-white text-black">
      <PublicNavbar />

      <main className="pt-20">
        {/* POPULAR ACTIVITIES */}
        <section
          id="explore"
          className="relative overflow-hidden bg-white px-5 py-14"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(173,232,244,0.70),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.80),transparent_35%)]" />

          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.4rem] border border-black/10 bg-white shadow-[0_35px_100px_rgba(0,0,0,0.12)]">
            <div className="border-b border-black/10 px-0 py-4">
              <p className="mb-4 text-center text-xl font-black uppercase tracking-[0.25em] text-black">
                Popular activities
              </p>

              <div className="relative mt-4 overflow-hidden">
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-28 bg-gradient-to-r from-white to-transparent" />
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-28 bg-gradient-to-l from-white to-transparent" />

                <div className="activity-marquee mt-2 flex w-max  gap-4 px-5">
                  {[...activities.slice(0, 10), ...activities.slice(0, 10)].map(
                    (activity, index) => (
                      <div
                        key={`${activity.name}-${index}`}
                        className="group flex min-w-[180px] items-center gap-3 rounded-2xl border-1 border-black bg-[#e8e8e4] px-4 py-2.5 text-black shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:bg-white"
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-black text-xl text-white shadow-lg">
                          {activity.icon}
                        </div>

                        <div>
                          <h3 className="text-sm font-black text-black">
                            {activity.name}
                          </h3>
                          <p className="mt-0.5 text-[11px] font-bold text-black/55">
                            {activity.tag}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-9 px-6 py-10 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-14">
              <div className="flex flex-col justify-center">
                <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-[#e8e8e4] px-4 py-2 text-sm font-black text-black">
                  <Star size={16} />
                  Real plans, real people
                </div>

                <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-black md:text-6xl">
                  Choose an activity.
                  <span className="block text-black/70">
                    Find your right buddy.
                  </span>
                </h2>

                <p className="mt-5 max-w-xl text-base leading-8 text-black/65 md:text-lg">
                 — BuddyBOOK turns everyday plans into safer, verified
                  social experiences.
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
                      className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[#e8e8e4] p-3.5 text-sm font-black text-black"
                    >
                      <CheckCircle2 size={18} className="text-black" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-black text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-black/80"
                  >
                    Explore all activities
                    <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute h-72 w-72 rounded-full bg-[#e8e8e4]/70 blur-3xl" />

                <div className="activity-3d-card relative w-full max-w-xl rounded-[2.2rem] border border-black/10 bg-[#e8e8e4] p-4 shadow-[0_35px_90px_rgba(0,0,0,0.16)]">
                  <div className="rounded-[1.7rem] border border-black/10 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-black/45">
                          Activity board
                        </p>

                        <h3 className="mt-1 text-2xl font-black text-black">
                          Trending this week
                        </h3>
                      </div>

                      <div className="rounded-2xl bg-black px-4 py-2 text-xs font-black text-white">
                        Verified
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {activities.slice(0, 5).map((activity) => (
                        <div
                          key={activity.name}
                          className="group flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[#e8e8e4] p-3 transition hover:translate-x-1 hover:bg-white"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black text-xl text-white shadow-md">
                              {activity.icon}
                            </div>

                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-black text-black">
                                {activity.name}
                              </h4>

                              <p className="mt-0.5 truncate text-[11px] font-bold text-black/55">
                                {activity.tag}
                              </p>
                            </div>
                          </div>

                          <Link
                            to="/register"
                            className="shrink-0 rounded-full bg-black px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-black/80"
                          >
                            Book
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute -bottom-5 left-7 rounded-2xl border border-black/10  bg-black px-5 py-3 text-sm font-black text-[#b5e48c] shadow-xl">
                    <span>10+</span> meetup plans
                  </div>

                  <div className="absolute -right-4 top-0 rounded-2xl border border-black/10 bg-black px-4 py-2.5 text-xs font-black text-[#b5e48c]">
                    Safe companionship
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>      </main>

      <PublicFooter />
    </div>
  );
}