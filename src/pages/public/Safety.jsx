import friendsHero from "../../assets/buddybook-friends-hero.webp";
import PublicNavbar from "../../components/layout/PublicNavbar";

const tips = [
  {
    number: "01",
    title: "Check the profile first",
    text: "Look at verification, photos, city, activity details and profile completeness before you book.",
    className: "lg:left-[48%] lg:top-[26%]",
    accent: "bg-[#f5efe7]",
  },
  {
    number: "02",
    title: "Meet only in public",
    text: "Choose cafes, malls, events, parks or other visible places where people are around.",
    className: "lg:left-[18%] lg:top-[42%]",
    accent: "bg-[#d8c9bb]",
  },
  {
    number: "03",
    title: "Keep chat inside BuddyBOOK",
    text: "Use in-app chat for planning so activity, timing and expectations stay clear.",
    className: "lg:right-[10%] lg:top-[50%]",
    accent: "bg-[#fffaf5]",
  },
  {
    number: "04",
    title: "Never send extra money",
    text: "Pay through the platform flow only. Avoid cash transfers or side deals.",
    className: "lg:left-[24%] lg:top-[64%]",
    accent: "bg-[#c9b8a7]",
  },
  {
    number: "05",
    title: "Trust your comfort",
    text: "If something feels wrong, cancel, report it, or leave the meetup. Your comfort comes first.",
    className: "lg:right-[13%] lg:top-[75%]",
    accent: "bg-[#f5efe7]",
  },
];

export default function Safety() {
  return (
    <div className="min-h-screen bg-[#fffaf3] text-[#17120f]">
      <PublicNavbar />

      <main className="pt-20">
        <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
          <img
            src={friendsHero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#f5efe7]/38" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,239,231,0.88)_0%,rgba(245,239,231,0.58)_45%,rgba(245,239,231,0.18)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#f5efe7]/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#f5efe7]/85 to-transparent" />

          <div className="relative mx-auto min-h-[calc(100vh-5rem)] max-w-7xl px-5 py-7 sm:px-7 lg:px-8">
            <div className="max-w-4xl">
              <h1 className="text-[clamp(3rem,8vw,7.6rem)] font-black uppercase leading-[0.95] tracking-tight text-[#050403]">
                5 safe meetup tips
              </h1>


            </div>

            <div className="mt-8 grid gap-5 pb-8 lg:absolute lg:inset-0 lg:mt-0 lg:block lg:pb-0">
              {tips.map((tip) => (
                <article
                  key={tip.number}
                  className={`group relative max-w-sm bg-[#fffaf5]/56 p-3 shadow-[0_16px_38px_rgba(41,38,34,0.08)] backdrop-blur-sm lg:absolute lg:bg-white/12 lg:p-1.5 lg:shadow-none lg:backdrop-blur-[2px] ${tip.className}`}
                >
                  <div className="absolute -left-3 top-5 h-3 w-3 bg-[#17120f]" />
                  <div className="absolute -left-3 top-[1.65rem] h-px w-16 bg-[#17120f]/35" />
                  <div className="absolute left-12 top-[1.65rem] h-16 w-px bg-[#17120f]/18" />

                  <div className="pl-7">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-8 w-8 place-items-center text-xs font-black text-[#17120f] ${tip.accent}`}
                      >
                        {tip.number}
                      </span>
                      <h2 className="text-[clamp(1.25rem,2vw,1.8rem)] font-black leading-tight text-[#050403]">
                        {tip.title}
                      </h2>
                    </div>

                    <p className="mt-2 max-w-[22rem] text-sm font-semibold leading-6 text-[#292622]">
                      {tip.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <p className="relative z-10 pb-6 text-xs font-black uppercase tracking-[0.22em] text-[#4b4038] lg:absolute lg:bottom-7 lg:left-8 lg:pb-0">
              Public plans • verified profiles • in-app safety flow
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
