import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  CreditCard,
  Gamepad2,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Ticket,
  UserRoundCheck,
  Utensils,
  X,
} from "lucide-react";
import api from "../../api/api";
import { getCachedProviders, listProviders } from "../../api/providers";
import { hasAuthToken } from "../../utils/authSession";
import { formatRs, formatRupees } from "../../utils/format";
import friendsHero from "../../assets/buddybook-friends-hero.webp";
import heroHome1 from "../../assets/hero-home-1-arch.jpg";
import heroHome2 from "../../assets/hero-home-2-arch.jpg";
import heroHome3 from "../../assets/hero-home-3-arch.jpg";
import heroHome4 from "../../assets/hero-home-4-arch.jpg";
import heroHome5 from "../../assets/hero-home-5-arch.jpg";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";
import ProviderCard from "../../components/users/ProviderCard";

const activities = [
  { name: "Coffee", icon: Coffee, tone: "bg-[#fff0cf]" },
  { name: "Movies", icon: Ticket, tone: "bg-[#ffe0e0]" },
  { name: "Dinner", icon: Utensils, tone: "bg-[#dff1e9]" },
  { name: "Shopping", icon: ShoppingBag, tone: "bg-[#e5e2ff]" },
  { name: "Gaming", icon: Gamepad2, tone: "bg-[#dfeeff]" },
  { name: "City walk", icon: MapPin, tone: "bg-[#f6e1ff]" },
];

const safetyItems = [
  {
    icon: BadgeCheck,
    title: "Identity verified",
    text: "KYC and face checks add visible trust before a booking begins.",
  },
  {
    icon: MessageCircle,
    title: "Private communication",
    text: "Plan inside BuddyBOOK without sharing personal contact details.",
  },
  {
    icon: CreditCard,
    title: "Protected bookings",
    text: "Clear payment records support cancellations, refunds and disputes.",
  },
  {
    icon: MapPin,
    title: "Public meetup first",
    text: "Choose public locations and use live location during active plans.",
  },
];

const steps = [
  ["1", "Create your profile", "Join as a member or provider and complete basic verification."],
  ["2", "Browse verified companions", "Filter by activity, city, availability, price and community rating."],
  ["3", "Plan inside BuddyBOOK", "Choose a public place, date and time, then confirm the booking."],
  ["4", "Meet with confidence", "Use protected chat, live location and platform support when needed."],
];

const publicSearchDefaults = {
  keyword: "",
  city: "All",
  state: "All",
  gender: "All",
  activity: "All",
  maxPrice: "All",
  rating: "All",
};
const PROVIDERS_PER_PAGE = 8;
const heroSlides = [
  { src: friendsHero, alt: "Friends enjoying a relaxed cafe meetup" },
  { src: heroHome1, alt: "Friends enjoying a city walk together" },
  { src: heroHome2, alt: "Friends sharing food and laughing together" },
  { src: heroHome3, alt: "Friends enjoying a movie together" },
  { src: heroHome4, alt: "Friends enjoying a live concert together" },
  { src: heroHome5, alt: "Friends looking at photos together" },
];

export default function Home() {
  const heroLayerRef = useRef(null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
    } catch {
      return null;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [providerLoading, setProviderLoading] = useState(false);
  const [publicProviders, setPublicProviders] = useState(() =>
    onlyRealProviders(getCachedProviders())
  );
  const [publicFilters, setPublicFilters] = useState(publicSearchDefaults);
  const [providerPage, setProviderPage] = useState(1);
  const [siteContent, setSiteContent] = useState({});

  useEffect(() => {
    let mounted = true;
    if (!hasAuthToken()) {
      return () => {
        mounted = false;
      };
    }

    api
      .get("/auth/me")
      .then(({ data }) => {
        const currentUser = data?.user || data?.data?.user || data?.data;
        if (!mounted || !currentUser?.id) return;

        setUser(currentUser);
        localStorage.setItem("buddybook_auth_user", JSON.stringify(currentUser));
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const syncContent = (event) => setSiteContent(event.detail || readPreviewContent());
    window.addEventListener("buddybook:content-updated", syncContent);
    const syncStorage = (event) => { if (event.key === "buddybook_site_content_preview") syncContent({}); };
    window.addEventListener("storage", syncStorage);
    return () => { window.removeEventListener("buddybook:content-updated", syncContent); window.removeEventListener("storage", syncStorage); };
  }, []);

  useEffect(() => {
    let mounted = true;
    api
      .get("/admin/content")
      .then(({ data }) => {
        if (!mounted) return;
        const remote = data?.data || {};
        setSiteContent(remote);
        localStorage.setItem("buddybook_site_content_preview", JSON.stringify(remote));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const openSearch = () => setDrawerOpen(true);
    window.addEventListener("buddybook:open-public-search", openSearch);
    return () => {
      window.removeEventListener("buddybook:open-public-search", openSearch);
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;

    let mounted = true;
    setProviderLoading(true);

    listProviders({ verified: true, _t: Date.now() })
      .then((rows) => {
        if (!mounted) return;
        setPublicProviders(onlyRealProviders(rows));
      })
      .catch(() => {
        if (mounted) setPublicProviders(onlyRealProviders(getCachedProviders()));
      })
      .finally(() => {
        if (mounted) setProviderLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [drawerOpen]);

  useEffect(() => {
    let mounted = true;
    listProviders({ verified: true, _t: Date.now() })
      .then((rows) => {
        if (mounted) setPublicProviders(onlyRealProviders(rows));
      })
      .catch(() => {
        if (mounted) setPublicProviders(onlyRealProviders(getCachedProviders()));
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    let animationFrame = null;

    const updateHeroDepth = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        const heroStage = heroLayerRef.current;
        if (!heroStage) return;

        const distance = Math.max(window.innerHeight * 0.85, 1);
        const progress = Math.min(Math.max(window.scrollY / distance, 0), 1);
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        if (reduceMotion) {
          heroStage.style.filter = "none";
          heroStage.style.transform = "none";
          heroStage.style.opacity = "1";
          heroStage.style.borderRadius = "0px";
          heroStage.style.boxShadow = "none";
          return;
        }

        if (window.innerWidth < 1024) {
          heroStage.style.transform = "none";
          heroStage.style.opacity = "1";
          heroStage.style.borderRadius = "0px";
          heroStage.style.boxShadow = "none";
          return;
        }

        const scale = 1 - progress * 0.14;
        const translateY = progress * 18;

 heroStage.style.filter = "none";
        heroStage.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
        heroStage.style.opacity = `${1 - progress * 0.008}`;
        heroStage.style.borderRadius = `${progress * 38}px`;
        heroStage.style.boxShadow = `0 ${progress * 35}px ${progress * 90}px rgba(24, 27, 42, ${progress * 0.24})`;
      });
    };

    updateHeroDepth();
    window.addEventListener("scroll", updateHeroDepth, { passive: true });
    window.addEventListener("resize", updateHeroDepth);

    return () => {
      window.removeEventListener("scroll", updateHeroDepth);
      window.removeEventListener("resize", updateHeroDepth);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  const firstName = useMemo(
    () => user?.fullName?.trim().split(/\s+/)[0] || "",
    [user]
  );
  const isProviderAccount = user?.role === "PROVIDER";

  const scrollToCommunity = (event) => {
    event.preventDefault();
    document.getElementById("community")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", "#community");
  };
  const publicCities = useMemo(
    () => ["All", ...uniqueValues(publicProviders.map((item) => item.city))],
    [publicProviders]
  );
  const publicStates = useMemo(
    () => ["All", ...uniqueValues(publicProviders.map((item) => item.state))],
    [publicProviders]
  );
  const publicActivities = useMemo(
    () => [
      "All",
      ...uniqueValues(publicProviders.flatMap((item) => item.activities || [])),
    ],
    [publicProviders]
  );
  const filteredPublicProviders = useMemo(() => {
    const keyword = publicFilters.keyword.trim().toLowerCase();

    return publicProviders.filter((provider) => {
      const activities = provider.activities || [];
      const searchable = [
        provider.name,
        provider.profession,
        provider.city,
        provider.state,
        provider.gender,
        ...activities,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || searchable.includes(keyword)) &&
        (publicFilters.city === "All" || sameText(provider.city, publicFilters.city)) &&
        (publicFilters.state === "All" || sameText(provider.state, publicFilters.state)) &&
        (publicFilters.gender === "All" ||
          String(provider.gender || "").toLowerCase() ===
            publicFilters.gender.toLowerCase()) &&
        (publicFilters.activity === "All" ||
          activities.includes(publicFilters.activity)) &&
        (publicFilters.maxPrice === "All" ||
          Number(provider.price || 0) <= Number(publicFilters.maxPrice)) &&
        (publicFilters.rating === "All" ||
          Number(provider.rating || 0) >= Number(publicFilters.rating))
      );
    });
  }, [publicFilters, publicProviders]);
  const homepageTestimonials = useMemo(
    () => normalizeSiteTestimonials(siteContent.testimonials),
    [siteContent.testimonials]
  );
  const providerPageCount = Math.max(
    1,
    Math.ceil(filteredPublicProviders.length / PROVIDERS_PER_PAGE)
  );
  const paginatedPublicProviders = useMemo(() => {
    const safePage = Math.min(providerPage, providerPageCount);
    const start = (safePage - 1) * PROVIDERS_PER_PAGE;
    return filteredPublicProviders.slice(start, start + PROVIDERS_PER_PAGE);
  }, [filteredPublicProviders, providerPage, providerPageCount]);

  useEffect(() => {
    setProviderPage(1);
  }, [publicFilters]);

  useEffect(() => {
    if (providerPage > providerPageCount) setProviderPage(providerPageCount);
  }, [providerPage, providerPageCount]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffaf3] text-[#171b30]">
      <PublicNavbar />

      <main>
        <section className="hero-shell relative top-0 z-0 overflow-hidden bg-[#d9dce3] lg:min-h-screen">
          <div ref={heroLayerRef} className="hero-stage hero-pattern relative min-h-screen origin-center overflow-hidden px-5 pb-16 pt-28 sm:px-8 lg:h-full lg:px-12 lg:pb-20 lg:pt-36">
          <div className="hero-glow hero-glow-left" aria-hidden="true" />
          <div className="hero-glow hero-glow-right" aria-hidden="true" />
          <BackgroundSparkles />

          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <div className="animate-rise">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e9cbb2] bg-white/85 px-4 py-2 text-xs font-black text-[#bc6e36] shadow-sm backdrop-blur">
                <ShieldCheck size={15} />
                Verified people. Real plans. Safer meetups.
              </div>

              <p className="mt-7 text-sm font-black text-[#d67f3d]">
                {user
                  ? `Welcome back${firstName ? `, ${firstName}` : ""}`
                  : ""}
              </p>

              <h1 className="mt-3 max-w-[650px] text-[2.8rem] font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.8rem]">
                {siteContent.heroTitle || "Safe Meetups."}
                <span className="block text-[#e08c4c]">
                  {siteContent.heroHighlight || "Real Connections."}
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm font-bold leading-6 text-black sm:text-base">
                {siteContent.heroDescription || "BuddyBOOK helps every meetup feel more secure with verified profiles, private chat, safe locations, and protected bookings."}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={isProviderAccount ? "/app/provider/dashboard" : "#community"}
                  onClick={isProviderAccount ? undefined : scrollToCommunity}
                  className="group inline-flex items-center justify-center gap-2 rounded-md bg-[#171b30] px-7 py-4 text-sm font-black text-white shadow-[0_16px_35px_rgba(23,27,48,0.2)] transition hover:-translate-y-1 hover:bg-[#d77f40]"
                >
                  Find trusted people
                  <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                </a>
                               

              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-black text-black/45">
                {parseContentList(siteContent.heroTrustItems, ["KYC profiles", "Public places", "Private chat", "Secure payments"]).map(
                  (item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <Check size={14} className="text-[#d67f3d]" /> {item}
                    </span>
                  )
                )}
              </div>

              <HeroStats siteContent={siteContent} className="mt-10 hidden lg:grid" />
            </div>

            <HeroVisual publicProviders={publicProviders} siteContent={siteContent} />

            <HeroStats siteContent={siteContent} className="mt-6 lg:hidden" />
          </div>
          </div>
        </section>

        <div className="page-stack relative z-20 -mt-6 overflow-hidden rounded-t-[2rem] bg-[#fffaf3] shadow-[0_-28px_70px_rgba(53,35,23,0.16)] sm:rounded-t-[2.5rem]">
        <section className="border-y border-black/5 bg-white px-5 py-7 sm:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {activities.map(({ name, icon: Icon, tone }) => (
              <Link
                key={name}
                to="#providers"
                className="group flex items-center gap-3 rounded-md px-3 py-3 transition hover:bg-[#fff6ea]"
              >
                <span className={`grid h-10 w-10 place-items-center rounded-md ${tone}`}>
                  <Icon size={18} />
                </span>
                <span className="text-sm font-black group-hover:text-[#c97031]">{name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center [&>div]:mx-auto">
            <SectionHeading
              eyebrow="Safety by design"
              title={siteContent.trustTitle || "Trust tools for every part of the meetup"}
              text="BuddyBOOK gives members clear identity, communication, payment and location signals before a plan begins."
            />
            </div>
            <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1fr_1.15fr_1fr]">
              <div className="grid gap-4">
                {safetyItems.slice(0, 2).map((item, index) => (
                  <SafetyCard key={item.title} {...item} index={index} />
                ))}
              </div>

              <SafetyOrbit profiles={publicProviders} />

              <div className="grid gap-4">
                {safetyItems.slice(2, 4).map((item, index) => (
                  <SafetyCard key={item.title} {...item} index={index} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {!isProviderAccount ? (
          <PublicServiceExploreSection
            providers={paginatedPublicProviders}
            mobileProviders={filteredPublicProviders}
            totalProviders={filteredPublicProviders.length}
            loading={providerLoading}
            filters={publicFilters}
            cities={publicCities}
            states={publicStates}
            activities={publicActivities}
            page={providerPage}
            pageCount={providerPageCount}
            title={siteContent.communityTitle || "Explore more Meet - India"}
            content={siteContent}
            onPage={setProviderPage}
            onFilter={(key, value) =>
              setPublicFilters((current) => ({ ...current, [key]: value }))
            }
            onReset={() => setPublicFilters(publicSearchDefaults)}
          />
        ) : null}

        <section className="relative overflow-hidden bg-[#fffaf3] px-5 py-20 sm:px-8 lg:py-28">
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative min-h-[500px]">
              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=85"
                alt="Friends enjoying a public meetup"
                className="absolute inset-0 h-full w-full rounded-lg object-cover"
              />
              <div className="animate-float absolute right-4 top-7 rounded-lg bg-white p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-[#e6f3ec] text-[#267a5b]">
                    <CalendarCheck2 size={19} />
                  </span>
                  <div>
                    <p className="text-xs font-black">Plan confirmed</p>                  </div>
                </div>
              </div>
              <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-[#fffaf3] p-5 text-white shadow-xl backdrop-blur sm:right-auto sm:w-[330px]">
                <div className="flex items-center gap-2 text-[#e08c4c]">
                  <ShieldCheck size={18} />
                  <p className="text-xs font-black uppercase tracking-[0.12em]">Meet safely</p>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-black">
                  Keep your chat, location and booking history inside BuddyBOOK.
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e08c4c]">How it works</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                Four clear steps from an idea to a real plan
              </h2>
              <div className="mt-9 grid gap-6">
                {steps.map(([number, title, text]) => (
                  <div key={number} className="grid grid-cols-[50px_1fr] gap-4">
                    <span className="grid h-12 w-12 place-items-center border-1 border-black rounded-md bg-[#f6d8b5] text-xs font-black text-black">{number}</span>
                    <div>
                      <h3 className="font-black">{title}</h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-black/50">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>



<section className="px-5 pb-20 sm:px-8 lg:pb-28">
           <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-lg bg-[#ffeedd] lg:grid-cols-[1.1fr_0.9fr]">
             <div className="relative z-10 p-8 text-white sm:p-12 lg:p-16">
               <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e08c4c]">Become a verified buddy</p>
               <h2 className="mt-4 max-w-2xl text-3xl text-black font-black leading-tight sm:text-5xl">
                 Share your time, choose your schedule and earn safely.
               </h2>
               <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-black sm:text-base">
                 Set the activities you enjoy, your hourly rate and your available days. Accept only the public plans that feel right for you.
               </p>

               <div className="mt-7 grid gap-3 sm:grid-cols-2">
                 {["Set your price", "Control availability", "Review each request", "Receive recorded payments"].map((item) => (
                   <span key={item} className="flex items-center gap-2 text-sm font-bold text-black">
                     <Check size={15} className="text-black" /> {item}
                   </span>
                 ))}
               </div>

               <Link
                 to="/register?role=PROVIDER"
                 className="mt-9 inline-flex items-center gap-2 rounded-md bg-[#ffd49f] px-7 py-4 text-sm font-black text-[#173f35] transition hover:-translate-y-1 hover:bg-white"
               >
                 Register as provider <ArrowRight size={17} />
               </Link>
             </div>

<img
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1100&auto=format&fit=crop&q=85"
                alt="BuddyBOOK providers"
                className="h-full min-h-[360px] w-full object-cover"
              />
            </div>
          </section>

          <FaqSection content={siteContent} />
          <TestimonialsSection testimonials={homepageTestimonials} content={siteContent} />

        </div>
      </main>

      <PublicFooter />
      <PublicProviderDrawer
        open={drawerOpen}
        loading={providerLoading}
        providers={filteredPublicProviders}
        filters={publicFilters}
        cities={publicCities}
        states={publicStates}
        activities={publicActivities}
        onClose={() => setDrawerOpen(false)}
        onFilter={(key, value) =>
          setPublicFilters((current) => ({ ...current, [key]: value }))
        }
        onReset={() => setPublicFilters(publicSearchDefaults)}
      />

      <style>{`
        .hero-pattern {
          background-color: #fffaf3;
          background-image: linear-gradient(rgba(220, 189, 164, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(220, 189, 164, 0.12) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .hero-glow {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(8px);
        }
        .hero-glow-left {
          left: -10rem;
          top: 18%;
          width: 25rem;
          height: 25rem;
          background: radial-gradient(circle, rgba(244, 173, 117, .2), rgba(244, 173, 117, 0) 70%);
        }
        .hero-glow-right {
          right: -11rem;
          bottom: 4%;
          width: 30rem;
          height: 30rem;
          background: radial-gradient(circle, rgba(118, 173, 152, .2), rgba(118, 173, 152, 0) 70%);
        }
        @keyframes float-soft {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -10px, 0); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.75) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(12deg); }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes provider-page-in {
          from { opacity: 0; transform: translate3d(0, 24px, 0) scale(.97); filter: blur(5px); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
        }
        @keyframes orbit-spin { to { transform: rotate(360deg); } }
        @keyframes heart-pop { 0%,100% { opacity:0; transform:translateY(12px) scale(.5); } 45% { opacity:1; transform:translateY(-24px) scale(1); } }
        .safety-orbiter { animation: orbit-spin 13s linear infinite; }
        .safety-avatar-upright { animation: orbit-spin 13s linear infinite reverse; }
        .orbit-heart { animation: heart-pop 3.8s ease-in-out infinite; }
        @keyframes provider-scroll-rise {
          from { opacity: 0.28; transform: translateY(150px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-float { animation: float-soft 4.5s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        .animate-rise { animation: rise 700ms ease-out both; }
        .provider-page-card { animation: provider-page-in 620ms cubic-bezier(.22, 1, .36, 1) both; }
        .hero-stage {
          transform-origin: center top;
          will-change: filter, transform, opacity;
        }
        .page-stack > section {
          position: relative;
        }
        .community-layer {
          box-shadow: 0 -12px 48px rgba(68, 45, 29, 0.04);
        }
        @supports (animation-timeline: view()) {
          .provider-reveal {
            animation: provider-scroll-rise linear both;
            animation-timeline: view();
            animation-range: entry 0% cover 38%;
          }
        }
        @media (max-width: 767px) {
          .hero-depth {
            transform-origin: center center;
          }
          .page-stack {
            border-radius: 1.5rem 1.5rem 0 0;
          }
          .community-layer {
            box-shadow: none;
          }
        }
@media (prefers-reduced-motion: reduce) {
           .animate-float, .animate-twinkle, .animate-rise, .provider-reveal, .provider-page-card { animation: none; }
         }
       `}</style>
     </div>
   );
}

const testimonials = [
  {
    name: "Priya Desai",
    city: "Mumbai",
    text: "Found a great movie buddy through BuddyBOOK. The KYC verification made me feel safe and the meetup was exactly as promised.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=85",
  },
  {
    name: "Arjun Kumar",
    city: "Bengaluru",
    text: "I love the cafe meetups I've had. The providers are genuine and the platform makes everything so easy.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=85",
  },
  {
    name: "Sneha Patel",
    city: "Delhi",
    text: "Been using BuddyBOOK for 2 months now. Always safe public meetups and great company for city walks.",
    rating: 4,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=85",
  },
  {
    name: "Rohit Verma",
    city: "Jaipur",
    text: "The platform is well designed and the providers are verified. Had an amazing dinner meetup experience!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=85",
  },
];

function ProfileCollageSection({ profiles, title, layout = "side" }) {
  if (!profiles?.length) return null;

  return (
    <section className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e08c4c]">{title}</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">
          Real meetups, real connections
        </h2>

{layout === "side" ? (
           <div className="mt-10 grid gap-6 lg:grid-cols-2">
             {profiles.map((profile, index) => (
               <ProfileCollageCard key={profile.name} profile={profile} index={index} />
             ))}
           </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {profiles.map((profile, index) => (
              <ProfileCollageCard key={profile.name} profile={profile} index={index} grid />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProfileCollageCard({ profile, index, grid = false }) {
  return (
    <div
      className={`group overflow-hidden rounded-[2rem] border-2 border-[#e08c4c] bg-white shadow-[0_16px_45px_rgba(224,140,76,0.12)] transition hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(224,140,76,0.25)] ${
        grid ? "rounded-[1.5rem]" : ""
      }`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className={`relative ${grid ? "h-[140px]" : "h-[180px]"}`}>
        <img
          src={profile.image}
          alt={profile.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute inset-0 ring-4 ring-[#e08c4c]/30 ring-inset rounded-[inherit]" />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-black">{profile.name}</h3>
          <BadgeCheck size={14} className="text-[#e08c4c]" />
        </div>
        <p className="mt-1 text-xs font-bold text-black/45">{profile.city}</p>

        <div className="mt-3 flex items-center gap-1 text-xs font-black text-[#e08c4c]">
          <Star size={12} fill="currentColor" /> {profile.rating}
        </div>
      </div>
    </div>
  );
}

function FaqSection({ content = {} }) {
  const [openIndex, setOpenIndex] = useState(0);
  const defaults = [
    ["How does BuddyBOOK verify members and providers?", "Profiles go through identity and safety checks before verification indicators are shown."],
    ["How do payments and bookings work?", "Choose a verified provider, select your plan details and complete the protected checkout to confirm your booking."],
    ["Where should a first meetup happen?", "Always choose a busy public place, keep your booking chat on BuddyBOOK and share your plan with someone you trust."],
    ["Can I cancel or report a booking?", "Yes. Booking controls and safety reporting remain available from your dashboard and booking history."],
    ["How is my personal information protected?", "BuddyBOOK keeps booking records and platform communication together so you do not need to share unnecessary personal details."],
  ];
  const items = defaults.map(([question, answer], index) => [
    content[`faq${index + 1}Question`] || question,
    content[`faq${index + 1}Answer`] || answer,
  ]);

  return (
    <section className="relative overflow-hidden bg-white px-5 py-20 sm:px-8 lg:py-28">
      <div className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full bg-[#ffeedd] blur-3xl" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e08c4c]">Help centre</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-[#171b30] sm:text-6xl">{content.faqTitle || "Questions, answered clearly"}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-black/50 sm:text-base">{content.faqSubtitle || "Everything you need to know before planning a safe BuddyBOOK meetup."}</p>
        </div>

        <div className="mt-12 grid gap-3">
          {items.map(([question, answer], index) => {
            const open = openIndex === index;
            return (
              <article key={index} className={`overflow-hidden rounded-2xl border-2 transition duration-300 ${open ? "border-[#e08c4c] bg-[#ffeedd] shadow-[8px_8px_0_#171b30]" : "border-black/10 bg-[#fffaf3] hover:border-[#e08c4c]/60"}`}>
                <button type="button" onClick={() => setOpenIndex(open ? -1 : index)} aria-expanded={open} className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left sm:px-7">
                  <span className="flex items-center gap-4"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ${open ? "bg-[#171b30] text-white" : "bg-white text-[#e08c4c]"}`}>0{index + 1}</span><span className="text-sm font-black text-[#171b30] sm:text-lg">{question}</span></span>
                  <ChevronDown size={20} className={`shrink-0 transition duration-300 ${open ? "rotate-180 text-[#e08c4c]" : "text-black/40"}`} />
                </button>
                <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><p className="border-t border-[#e08c4c]/25 px-5 py-5 text-sm font-semibold leading-7 text-black/60 sm:px-20 sm:text-base">{answer}</p></div></div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-5 border-l-4 border-[#e08c4c] bg-[#fffaf3] p-6 sm:flex-row sm:items-center">
          <div><p className="text-lg font-black text-[#171b30]">Still have questions?</p><p className="mt-1 text-sm font-semibold text-black/50">Our support team is ready to help with bookings, safety and verification.</p></div>
          <Link to="/contact" className="shrink-0 rounded-full bg-[#171b30] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#e08c4c]">Get in touch</Link>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ testimonials, content = {} }) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev, 0 idle
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (event) => setIsMobile(event.matches);
    setIsMobile(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    setCurrent(0);
  }, [testimonials.length]);

  if (!testimonials.length) return null;

  const next = () => {
    if (isAnimating) return;
    setDirection(1);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
      setDirection(0);
      setIsAnimating(false);
    }, 300);
  };

  const prev = () => {
    if (isAnimating) return;
    setDirection(-1);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
      setDirection(0);
      setIsAnimating(false);
    }, 300);
  };

  const currentTestimonial = testimonials[current];

  // Keep the component in its place; only fade/scale in position during transition
  const scale = isAnimating ? 0.95 : 1;
  const opacity = isAnimating ? 0 : 1;

  const containerStyle = {
    opacity,
    transform: `scale(${scale})`,
    transition: `opacity 300ms ease, transform 300ms ease`,
  };

  return (
    <section className="relative overflow-hidden bg-[#fffaf3] px-5 py-20 sm:px-8 lg:py-28">
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e08c4c]">
            {content.testimonialsEyebrow || "What buddies say"}
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            {content.testimonialsTitle || "Testimonials from real members"}
          </h2>
        </div>

        <div className="relative mt-12 rounded-[2.5rem] border border-black/10 bg-white px-4 py-10 shadow-[0_35px_100px_rgba(94,56,88,.15)] sm:px-10">
          <div style={containerStyle} className="transition-all duration-300">
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center sm:min-h-[220px]">
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < currentTestimonial.rating ? "text-[#f59e0b]" : "text-black/20"}
                    fill={i < currentTestimonial.rating ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-black/70 sm:text-xl">
                "{currentTestimonial.text}"
              </p>

              <p className="mt-3 text-base font-black text-black">
                {currentTestimonial.name}
                <span className="ml-2 text-sm font-semibold text-black/45">
                  · {currentTestimonial.city}
                </span>
              </p>
            </div>
          </div>

          <div className="relative mx-auto mt-8 h-[270px] max-w-5xl overflow-hidden [perspective:1200px] sm:h-[360px] sm:overflow-visible">
            {testimonials.slice(0, 10).map((item, index) => {
              const total = Math.min(testimonials.length, 10);
              let offset = index - current;
              if (offset > total / 2) offset -= total;
              if (offset < -total / 2) offset += total;
              const active = index === current;
              return (
                <button
                  key={`${item.name}-${index}`}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className="absolute left-1/2 top-1/2 overflow-hidden rounded-[1.8rem] border-4 border-white shadow-2xl transition-all duration-500"
                  style={{
                    width: active ? (isMobile ? 128 : 180) : (isMobile ? 86 : 125),
                    height: active ? (isMobile ? 182 : 250) : (isMobile ? 132 : 190),
                    zIndex: active ? 30 : 15 - Math.abs(offset),
                    transform: `translate(-50%,-50%) translateX(${offset * (isMobile ? 44 : 92)}px) translateY(${Math.abs(offset) * (isMobile ? 12 : 18)}px) rotateY(${offset * -10}deg) scale(${active ? 1 : 0.88})`,
                    background: ["#ef9dcc", "#6c9ce4", "#9b70d2", "#f1c64e", "#9dce9d"][index % 5],
                  }}
                  aria-label={`Show ${item.name}'s testimonial`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={prev}
              className="grid h-12 w-12 place-items-center rounded-full border-2 border-black/10 bg-white text-black transition hover:bg-[#ffeedd]"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex max-w-[280px] flex-wrap items-center justify-center gap-2">
              {testimonials.slice(0, 10).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className={`h-3 w-3 rounded-full transition ${
                    index === current ? "bg-[#e08c4c] scale-125" : "bg-black/20"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              className="grid h-12 w-12 place-items-center rounded-full border-2 border-black/10 bg-white text-black transition hover:bg-[#ffeedd]"
              aria-label="Next testimonial"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStats({ siteContent = {}, className = "" }) {
  return (
    <div className={`grid max-w-xl grid-cols-3 border-t border-[#dbc7b7]/65 pt-7 ${className}`}>
      {[
        [siteContent.statVerifiedMembers || "300+", siteContent.statVerifiedMembersLabel || "Verified members"],
        [siteContent.statPlansCreated || "1,456", siteContent.statPlansCreatedLabel || "Plans created"],
        [siteContent.statAverageRating || "4.8", siteContent.statAverageRatingLabel || "Average rating"],
      ].map(([value, label]) => (
        <div key={label} className="pr-3">
          <p className="text-2xl font-black sm:text-3xl">{value}</p>
          <p className="mt-1 text-[11px] font-bold leading-4 text-black/40 sm:text-xs">{label}</p>
        </div>
      ))}
    </div>
  );
}

function HeroVisual({ publicProviders = [], siteContent = {} }) {
  const popularProfiles = useMemo(() => {
    const ranked = [...publicProviders].sort((a, b) =>
      Number(b.totalBookings || 0) - Number(a.totalBookings || 0) ||
      Number(b.totalSpending || 0) - Number(a.totalSpending || 0)
    );
    const withActivity = ranked.filter((profile) => Number(profile.totalBookings || 0) > 0 || Number(profile.totalSpending || 0) > 0);
    return withActivity.length ? withActivity : ranked;
  }, [publicProviders]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  useEffect(() => {
    if (popularProfiles.length < 2) return undefined;
    setFeaturedIndex(Math.floor(Math.random() * popularProfiles.length));
    const interval = window.setInterval(() => {
      setFeaturedIndex((current) => {
        const offset = 1 + Math.floor(Math.random() * (popularProfiles.length - 1));
        return (current + offset) % popularProfiles.length;
      });
    }, 60000);
    return () => window.clearInterval(interval);
  }, [popularProfiles]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const heroProfile = popularProfiles[featuredIndex % Math.max(popularProfiles.length, 1)] || { name: "Verified Buddy", image: "" };
  const heroName = heroProfile.name?.split(" ")[0] || "Buddy";
  const heroImage = heroProfile.image || heroProfile.avatar || heroProfile.profileImage || "";
  const heroLink = heroProfile.id ? `/providers/${heroProfile.id}` : "#community";
  const totalBookings = Number(heroProfile.totalBookings || heroProfile.completedBookings || 0);
  const heroRating = Number(heroProfile.rating || heroProfile.averageRating || 0);

  return (
    <div className="relative min-h-[490px] animate-rise sm:min-h-[650px] lg:min-h-[690px]">
      <div className="absolute inset-x-[4%] bottom-24 top-4 overflow-hidden rounded-t-[45%] rounded-b-lg sm:inset-x-[10%] sm:bottom-16 lg:inset-x-[8%]">
        {heroSlides.map((slide, index) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={index === activeHeroSlide ? slide.alt : ""}
            aria-hidden={index !== activeHeroSlide}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === 0 ? "object-[90%_center]" : "object-center"
            } ${
              index === activeHeroSlide ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
        ))}

        <div
          className="absolute bottom-4 right-4 z-40 flex flex-col items-center gap-2"
          role="group"
          aria-label="Hero image carousel"
        >
          {heroSlides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setActiveHeroSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#171b30] focus:ring-offset-2 ${
                index === activeHeroSlide
                  ? "h-7 w-2.5 bg-[#e08c4c]"
                  : "w-2.5 bg-[#171b30]/30 hover:bg-[#171b30]/55"
              }`}
              aria-label={`Show hero image ${index + 1}`}
              aria-current={index === activeHeroSlide ? "true" : undefined}
            />
          ))}
        </div>
      </div>

      <div className="animate-float absolute left-0 top-[8%] z-20 rounded-lg bg-white px-4 py-3 shadow-[0_18px_45px_rgba(66,42,27,0.15)] sm:left-[2%]">
        <div className="flex items-center gap-3">
          <span className="hidden h-9 w-9 place-items-center rounded-full bg-[#e8f5ee] text-[#267a5b] sm:grid">
            <UserRoundCheck size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black">{siteContent.heroVerifiedValue || "300+ verified"}</p>
            <p className="text-[10px] font-bold text-black/35">{siteContent.heroVerifiedLabel || "Growing community"}</p>
          </div>
        </div>
      </div>

      <div className="animate-float absolute right-0 top-[17%] z-20 rounded-lg bg-[#171b30] px-4 py-3 text-white shadow-xl [animation-delay:700ms] sm:top-[23%]">
        <div className="flex items-center gap-3">
          <MapPin size={17} className="text-[#f4ad75]" />
          <div>
            <p className="text-xs font-black">{siteContent.heroLocationValue || "Public meetup"}</p>
            <p className="text-[10px] font-bold text-white/45">{siteContent.heroLocationLabel || "Location selected"}</p>
          </div>
        </div>
      </div>

      <Link to={heroLink} className="group absolute bottom-0 left-1/2 z-30 w-[min(66%,240px)] -translate-x-1/2 rounded-lg border-2 border-[#e08c4c] bg-[#fff5ea]/95 p-3 shadow-[0_22px_55px_rgba(66,42,27,0.2)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(66,42,27,0.28)] focus:outline-none focus:ring-4 focus:ring-[#e08c4c]/30 sm:w-[320px] sm:p-4">
        <div className="pointer-events-none absolute bottom-[calc(100%-0.35rem)] right-[calc(100%-0.75rem)] hidden w-56 rounded-2xl border border-[#e08c4c]/40 bg-[#171b30] p-4 text-white shadow-[0_24px_60px_rgba(23,27,48,0.3)] group-hover:block group-focus-visible:block sm:w-64">
          <div className="flex items-center gap-3">
            {heroImage ? <img src={heroImage} alt="" className="h-12 w-12 rounded-full border-2 border-[#f4ad75] object-cover" /> : null}
            <div className="min-w-0"><p className="truncate text-sm font-black">{heroProfile.name || heroName}</p><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#f4ad75]">Star performer</p></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-white/10 p-2"><p className="text-lg font-black">{totalBookings}</p><p className="text-[9px] font-bold text-white/55">Total bookings</p></div>
            <div className="rounded-xl bg-white/10 p-2"><p className="text-lg font-black">{heroRating > 0 ? heroRating.toFixed(1) : "New"}</p><p className="text-[9px] font-bold text-white/55">Provider rating</p></div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          {heroImage ? (
            <img src={heroImage} alt={heroName} className="h-11 w-11 shrink-0 rounded-full object-cover border-4 border-[#e08c4c] sm:h-16 sm:w-16" />
          ) : (
            <div className="h-11 w-11 shrink-0 rounded-full bg-[#ffeedd] grid place-items-center text-lg font-black text-black border-4 border-[#e08c4c] sm:h-16 sm:w-16">
              {heroName[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black sm:text-base">{heroName}</h3>
              <BadgeCheck size={15} className="shrink-0 text-[#e08c4c]" />
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-black/10 pt-3 sm:mt-4 sm:gap-3 sm:pt-4">
          <div className="rounded-lg bg-[#fff5ea] px-3 py-2 text-center">
            <p className="text-base font-black text-black sm:text-lg">{totalBookings}</p>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-black/35">Total bookings</p>
          </div>
          <div className="rounded-lg bg-[#fff5ea] px-3 py-2 text-center">
            <p className="text-base font-black text-[#e08c4c] sm:text-lg">{heroRating > 0 ? heroRating.toFixed(1) : "New"}</p>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-black/35">Provider rating</p>
          </div>
        </div>
      </Link>

    </div>
  );
}

function ProfileCard({ profile, large = false }) {
  const activity = Array.isArray(profile.activities)
    ? profile.activities[0]
    : profile.activity;

  return (
    <article className={large ? "group overflow-hidden rounded-lg border-2 border-[#e08c4c] bg-white shadow-[0_16px_45px_rgba(63,42,28,0.08)] transition hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(224,140,76,0.25)]" : "flex items-center gap-3"}>
      {large ? (
        <img src={profile.image} alt={profile.name} className="h-64 w-full object-cover object-top sm:h-72 border-4 border-[#e08c4c]/30 rounded-t-lg" />
      ) : (
        <img src={profile.image} alt={profile.name} className="h-14 w-10 shrink-0 rounded-md object-cover border-2 border-[#e08c4c]" />
      )}

      <div className={large ? "p-5" : "min-w-0 flex-1"}>
        <div className="flex items-center gap-1.5">
          <h3 className={`${large ? "text-lg" : "truncate text-sm"} font-black`}>{profile.name}</h3>
          <BadgeCheck size={large ? 17 : 14} className="shrink-0 text-[#e08c4c]" />
        </div>
        <p className={`${large ? "mt-2" : "mt-0.5 truncate"} text-xs font-bold text-black/38`}>
          {profile.city} {activity ? `- ${activity}` : ""}
        </p>
        <div className={`${large ? "mt-4" : "mt-1"} flex items-center gap-1 text-xs font-black text-[#e08c4c]`}>
          <Star size={12} fill="currentColor" /> {profile.rating}
          {large ? <span className="ml-2 text-black/30">Verified profile</span> : null}
        </div>
</div>
    </article>
  );
}

function BackgroundSparkles() {
  const sparks = [
    ["spark", "hidden sm:block left-[2%] top-[13%]", "0ms", "text-[#dc955e]/75", 28],
    ["star", "hidden sm:block left-[9%] top-[31%]", "450ms", "text-[#e96975]/65", 21],
    ["dot", "hidden sm:block left-[16%] top-[8%]", "900ms", "bg-[#76ad98]/70", 13],
    ["spark", "hidden sm:block left-[25%] top-[23%]", "1800ms", "text-[#d99058]/65", 23],
    ["star", "hidden sm:block left-[36%] top-[7%]", "500ms", "text-[#dca064]/70", 25],
    ["spark", "hidden sm:block left-[43%] top-[47%]", "1050ms", "text-[#7eae9c]/65", 21],
    ["heart", "left-[47%] top-[78%]", "1550ms", "text-[#e96975]/65", 22],
    ["dot", "hidden sm:block left-[52%] top-[15%]", "2050ms", "bg-[#ef6877]/65", 12],
    ["spark", "hidden sm:block left-[57%] top-[61%]", "2500ms", "text-[#d99058]/70", 29],
    ["star", "hidden sm:block left-[63%] top-[8%]", "300ms", "text-[#e6a875]/75", 22],
    ["dot", "hidden sm:block left-[67%] top-[88%]", "750ms", "bg-[#76ad98]/70", 14],
    ["heart", "hidden sm:block left-[71%] top-[34%]", "1200ms", "text-[#e96975]/65", 24],
    ["spark", "hidden sm:block left-[76%] top-[16%]", "1650ms", "text-[#d99058]/70", 26],
    ["star", "left-[80%] top-[72%]", "2150ms", "text-[#7eae9c]/70", 22],
    ["dot", "left-[84%] top-[48%]", "2600ms", "bg-[#e8ae7d]/75", 13],
    ["spark", "hidden sm:block left-[88%] top-[9%]", "600ms", "text-[#d99058]/75", 30],
    ["heart", "left-[91%] top-[84%]", "1100ms", "text-[#e96975]/65", 21],
    ["star", "hidden sm:block left-[94%] top-[28%]", "1500ms", "text-[#dca064]/75", 24],
    ["dot", "left-[96%] top-[64%]", "1950ms", "bg-[#76ad98]/75", 14],
    ["spark", "hidden sm:block left-[7%] top-[91%]", "2400ms", "text-[#d99058]/70", 23],
    ["star", "left-[3%] top-[3%] sm:hidden", "500ms", "text-[#dca064]/70", 25],
    ["spark", "right-[2%] top-[6%] sm:hidden", "600ms", "text-[#d99058]/75", 28],
    ["spark", "right-[1%] top-[39%] sm:hidden", "0ms", "text-[#dc955e]/70", 25],
    ["heart", "left-[2%] top-[42%] sm:hidden", "1200ms", "text-[#e96975]/60", 22],
    ["star", "right-[2%] top-[46%] sm:hidden", "1500ms", "text-[#dca064]/70", 22],
    ["spark", "left-[2%] top-[55%] sm:hidden", "1650ms", "text-[#7eae9c]/65", 24],
    ["dot", "right-[3%] top-[82%] sm:hidden", "750ms", "bg-[#76ad98]/70", 13],
    ["spark", "right-[2%] top-[96%] sm:hidden", "2400ms", "text-[#d99058]/65", 21],
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {sparks.map(([type, position, delay, color, size], index) => {
        const shared = `animate-twinkle absolute ${position} ${color}`;

        if (type === "dot") {
          return (
            <span
              key={`${position}-${index}`}
              className={`${shared} rounded-full`}
              style={{ width: size, height: size, animationDelay: delay }}
            />
          );
        }

        const Icon = type === "heart" ? Heart : type === "star" ? Star : Sparkles;
        return (
          <Icon
            key={`${position}-${index}`}
            size={size}
            className={shared}
            style={{ animationDelay: delay }}
          />
        );
      })}
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c97031]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-black/48 sm:text-base">{text}</p>
    </div>
  );
}

function PublicServiceExploreSection({
  providers,
  mobileProviders = [],
  totalProviders,
  loading,
  filters,
  cities,
  states,
  activities,
  page,
  pageCount,
  title,
  content = {},
  onPage,
  onFilter,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState(() => ({ ...filters, keyword: "" }));
  const providerRailRef = useRef(null);
  const scrollProviderRail = (direction) => {
    providerRailRef.current?.scrollBy({
      left: direction * Math.min(window.innerWidth * 0.78, 300),
      behavior: "smooth",
    });
  };
  const servicePills = parseContentList(content.serviceTypeOptions, ["City tour", "Events", "Cafe meet", "Gaming", "Dinner", "Shopping", "Sports"]);
  const sortOptions = parseContentList(content.filterSortOptions, ["Recently Active", "Highest Ratings"]);
  const genderOptions = parseContentList(content.filterGenderOptions, ["All", "Male", "Female", "Others"]);
  const priceOptions = parseContentList(content.filterPriceOptions, ["All", "500", "700", "900", "1200", "1500", "2000"]);

  return (
    <section id="community" className="border-y border-black/10 bg-white px-5 py-10 sm:px-8">
      <span id="providers" className="block scroll-mt-28" />
      <div className="mx-auto max-w-[1520px]">
        <div className="flex flex-wrap items-center gap-3 border-b border-black/10 pb-5">
          <p className="mr-2 text-xl font-black text-black">{content.serviceTypeLabel || "Service Type"}</p>
          <Link
            to="/activities"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2.5 text-xs font-black text-white sm:hidden"
          >
            {content.serviceMoreLabel || "View more services"} <ArrowRight size={14} />
          </Link>
          <span className="hidden rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black sm:inline-flex">
            {content.serviceTypePrimary || "Meet up"}
          </span>
          {servicePills.map((label) => (
            <span
              key={label}
              className={`cursor-default rounded-full bg-[#f8f8f8] px-5 py-3 text-sm font-black text-black ${["City tour", "Events", "Cafe meet", "Gaming", "Dinner", "Shopping", "Sports"].includes(label) ? "hidden sm:inline-flex" : ""}`}
            >
              {label}
            </span>
          ))}
          <Link
            to="/activities"
            className="hidden items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-black text-white sm:inline-flex"
          >
            {content.serviceMoreLabel || "View more services"} ({activities.length || 0}) <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-6 pt-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="flex items-center gap-3 lg:hidden">
            <button type="button" onClick={() => { setDraftFilters({ ...filters, keyword: "" }); setShowFilters(true); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#2563eb] px-5 py-3 text-sm font-black text-white shadow-md">
              <SlidersHorizontal size={16} /> {content.filterButtonLabel || "Filter"}
            </button>
            <h2 className="min-w-0 text-lg font-black leading-tight text-black">{title}</h2>
          </div>
          {showFilters ? <button type="button" aria-label="Close filters" onClick={() => setShowFilters(false)} className="fixed inset-x-0 bottom-0 top-[76px] z-[9998] bg-black/40 lg:hidden" /> : null}
          <aside className={`fixed bottom-0 left-0 top-[76px] z-[9999] w-[min(86vw,340px)] overflow-y-auto border-r border-black/10 bg-white p-6 shadow-2xl transition-transform duration-300 lg:sticky lg:top-28 lg:z-auto lg:h-max lg:w-auto lg:translate-x-0 lg:overflow-visible lg:border lg:shadow-none ${showFilters ? "translate-x-0" : "-translate-x-full"}`}>
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="flex w-full items-center justify-between rounded-lg bg-[#2563eb] px-4 py-3 text-white shadow-md lg:pointer-events-none"
              aria-expanded={showFilters}
            >
              <h3 className="text-2xl font-black">{content.filterButtonLabel || "Filter"}</h3>
              <ChevronDown
                size={22}
                className={`text-white transition lg:hidden ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
            <div className="mt-8 grid gap-6">
              <DrawerFilter label={content.filterLocationLabel || "Location"} value={draftFilters.city} placeholder={content.filterLocationPlaceholder || "eg. Gurgaon"} options={cities} onChange={(value) => setDraftFilters((current) => ({ ...current, city: value }))} />
              <DrawerFilter label={content.filterStateLabel || "State"} value={draftFilters.state} placeholder={content.filterStatePlaceholder || "eg. Haryana"} options={states} onChange={(value) => setDraftFilters((current) => ({ ...current, state: value }))} />
              <DrawerFilter label={content.filterActivityLabel || "Activity"} value={draftFilters.activity} placeholder={content.filterActivityPlaceholder || "eg. Cafe meet"} options={activities} onChange={(value) => setDraftFilters((current) => ({ ...current, activity: value }))} />
              <FilterRadioGroup
                title={content.filterSortLabel || "Sort By"}
                value={draftFilters.rating === "4" ? sortOptions[1] : sortOptions[0]}
                options={sortOptions}
                onChange={(value) => setDraftFilters((current) => ({ ...current, rating: value === sortOptions[1] ? "4" : "All" }))}
              />
              <DrawerFilter label={content.filterGenderLabel || "Gender"} value={draftFilters.gender} placeholder={content.filterGenderPlaceholder || "Any gender"} options={genderOptions} onChange={(value) => setDraftFilters((current) => ({ ...current, gender: value }))} />
              <DrawerFilter label={content.filterMaxPriceLabel || "Max price"} value={draftFilters.maxPrice} placeholder={content.filterPricePlaceholder || "eg. Rs 1000"} options={priceOptions} onChange={(value) => setDraftFilters((current) => ({ ...current, maxPrice: value }))} />
              <div className="grid max-w-[230px] grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDraftFilters(publicSearchDefaults)}
                  className="rounded-none border border-black/15 bg-white px-3 py-2.5 text-xs font-black"
                >
                  {content.filterResetLabel || "Reset"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    Object.entries({ ...draftFilters, keyword: "" }).forEach(([key, value]) => onFilter(key, value));
                    setShowFilters(false);
                  }}
                  className="rounded-none bg-black px-3 py-2.5 text-xs font-black text-white"
                >
                  Apply changes
                </button>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <h2 className="hidden text-3xl font-black text-black lg:block">
              {title}
            </h2>
            <p className="mt-2 text-sm font-bold text-black/45">
              {totalProviders} provider profiles available
            </p>

            <div className="mt-5 flex items-center justify-end gap-3 sm:hidden">
              <button type="button" onClick={() => scrollProviderRail(-1)} className="grid h-12 w-12 -rotate-3 place-items-center rounded-xl border border-black/10 bg-white shadow-[5px_7px_0_#171b30] transition active:translate-x-1 active:translate-y-1 active:shadow-none" aria-label="Previous provider profiles">
                <ChevronLeft size={22} />
              </button>
              <button type="button" onClick={() => scrollProviderRail(1)} className="grid h-12 w-12 rotate-3 place-items-center rounded-xl bg-black text-white shadow-[5px_7px_0_#e08c4c] transition active:translate-x-1 active:translate-y-1 active:shadow-none" aria-label="Next provider profiles">
                <ChevronRight size={22} />
              </button>
            </div>

            {loading ? (
              <div ref={providerRailRef} className="provider-mobile-rail mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-5 sm:mt-7 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-9 sm:overflow-visible xl:grid-cols-4">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="h-[390px] w-[82vw] max-w-[290px] shrink-0 snap-center rounded-2xl bg-[#f3f3f3] sm:w-auto sm:max-w-none" />
                ))}
              </div>
            ) : providers.length ? (
              <>
              <div ref={providerRailRef} className="provider-mobile-rail mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-5 lg:hidden">
                {mobileProviders.map((provider, index) => (
                  <div key={provider.id} className="w-[82vw] max-w-[290px] shrink-0 snap-center [transform:perspective(900px)_rotateY(-2deg)] sm:w-auto sm:max-w-none sm:transform-none">
                    <SmallIndianProviderCard provider={provider} index={index} content={content} />
                  </div>
                ))}
              </div>
              <div key={`provider-page-${page}`} className="mt-7 hidden grid-cols-2 gap-x-5 gap-y-9 lg:grid xl:grid-cols-4">
                {providers.map((provider, index) => (
                  <div
                    key={provider.id}
                    className="provider-page-card"
                    style={{ animationDelay: `${index * 65}ms` }}
                  >
                    <SmallIndianProviderCard provider={provider} index={index} content={content} />
                  </div>
                ))}
              </div>
              </>
            ) : (
              <div className="mt-7 grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-black/20 bg-[#fafafa] text-center">
                <div>
                  <Search size={34} className="mx-auto text-black" />
                  <p className="mt-4 text-xl font-black">No profiles found</p>
                  <p className="mt-2 text-sm font-semibold text-black/50">
                    Provider profiles will appear here from backend data.
                  </p>
                </div>
              </div>
            )}

            {pageCount > 1 ? (
              <div className="mt-10 hidden flex-wrap items-center justify-center gap-2 lg:flex">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => onPage(Math.max(1, page - 1))}
                  className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-[#fffaf3] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Previous
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onPage(item)}
                    className={`grid h-11 w-11 place-items-center rounded-full text-sm font-black transition ${
                      page === item
                        ? "bg-black text-white"
                        : "border border-black/10 bg-white text-black hover:bg-[#fffaf3]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => onPage(Math.min(pageCount, page + 1))}
                  className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-[#fffaf3] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicServiceProviderCard({ provider, index }) {
  const activity = provider.activities?.[0] || "e-meet";
  const image = provider.image || provider.images?.[0] || "";
  const sold = 59 + index * 21;
  const booked = (index % 4) + 2;

  return (
    <Link to={`/providers/${provider.id}`} className="group block text-black">
      <article>
        <div className="relative aspect-[0.92] overflow-hidden rounded-2xl bg-[#eeeeee]">
          {image ? (
            <img src={image} alt={provider.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center text-4xl font-black">{provider.name?.[0] || "B"}</div>
          )}
          <span className="absolute right-0 top-0 rounded-bl-2xl bg-black px-3 py-2 text-xs font-black leading-tight text-white">
            {booked}× booked<br />Recently
          </span>
        </div>

        <div className="mt-3">
          <h3 className="text-xl font-black">#{String(activity).toLowerCase().replace(/\s+/g, "-")}</h3>
          <p className="mt-2 line-clamp-2 min-h-[44px] text-sm font-semibold leading-6 text-black">
            {provider.bio || provider.headline || provider.profession || "Friendly companion for meetups"}
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-black">
                🌈 {Number(provider.price || 25).toFixed(2)}/15min- {sold} sold
              </p>
              <p className="mt-1 text-sm font-bold text-black/40">{formatRupees(Math.round(Number(provider.price || 25) * 74))} (INR)</p>
            </div>
            <p className="flex items-center gap-1 text-lg font-black">
              <Star size={20} fill="black" className="text-black" />
              {Number(provider.rating || 5).toFixed(1)}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img src={image || provider.avatar || "/favicon.svg"} alt="" className="h-9 w-9 rounded-full object-cover" loading="lazy" />
              <p className="truncate text-sm font-black">{provider.name} ({provider.age || 24})</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-1.5 text-[10px] font-black shadow-sm">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#ffcf33]">▶</span> {5 + index}s
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function FilterRadioGroup({ title, value, options, onChange }) {
  return (
    <div>
      <p className="text-sm font-black text-black">{title}</p>
      <div className="mt-3 grid gap-3">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-3 text-lg font-medium text-black/65">
            <input
              type="radio"
              checked={value === option}
              onChange={() => onChange(option)}
              className="h-5 w-5 accent-black"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

function SafetyCard({ icon: Icon, title, text, index = 0 }) {
  return (
    <article
      className="group animate-rise rounded-lg border border-black/10 bg-white p-5 shadow-[0_14px_40px_rgba(73,48,30,0.06)] transition duration-300 hover:-translate-y-2 hover:border-[#e6a572]/60 hover:shadow-[0_22px_55px_rgba(73,48,30,0.12)]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <span className="grid h-10 w-10 place-items-center rounded-md bg-[#fff0df] text-[#c97031] transition group-hover:bg-[#171b30] group-hover:text-white">
        <Icon size={18} />
      </span>
      <h3 className="mt-4 text-base font-black">{title}</h3>
      <p className="mt-1.5 text-sm font-semibold leading-6 text-black/50">{text}</p>
    </article>
  );
}

function SafetyOrbit({ profiles: rows }) {
  const [orbitProfiles, setOrbitProfiles] = useState(() => pickRecentProfiles(rows, 7));

  useEffect(() => {
    let active = true;
    const recentProfiles = pickRecentProfiles(rows, 7);
    setOrbitProfiles(recentProfiles);
    const interval = window.setInterval(async () => {
      const nextProfiles = pickRandomProfiles(rows, 7);
      await preloadProfileImages(nextProfiles);
      if (active) setOrbitProfiles(nextProfiles);
    }, 120000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [rows]);
  if (!orbitProfiles.length) {
    return (
      <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-full bg-[radial-gradient(circle,#fff_0%,#fff5ea_52%,transparent_70%)]">
        <div className="absolute inset-[9%] rounded-full border border-[#e6a572]/60" />
        <div className="absolute inset-[25%] rounded-full border border-[#f4ad75]/55" />
        <div className="absolute inset-[40%] grid place-items-center rounded-full bg-white text-[#e08c4c] shadow-xl"><ShieldCheck size={34} /></div>
      </div>
    );
  }
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-full bg-[radial-gradient(circle,#fff_0%,#fff5ea_52%,transparent_70%)]">
      <div className="absolute inset-[9%] rounded-full border border-[#e6a572]/60" />
      <div className="absolute inset-[25%] rounded-full border border-[#f4ad75]/55" />
      <div className="absolute inset-[40%] grid place-items-center rounded-full bg-white text-[#e08c4c] shadow-xl"><ShieldCheck size={34} /></div>
      {orbitProfiles.map((profile, index) => {
        const evenlySpacedDelay = -(index * 13) / orbitProfiles.length;
        return (
        <div key={`orbit-slot-${index}`} className="safety-orbiter absolute inset-[7%]" style={{ animationDelay: `${evenlySpacedDelay}s` }}>
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <div className="safety-avatar-upright" style={{ animationDelay: `${evenlySpacedDelay}s` }}>
              <img src={profile.image} alt={profile.name} className="h-14 w-14 rounded-full border-4 border-white object-cover shadow-xl sm:h-20 sm:w-20" />
            </div>
          </div>
        </div>
        );
      })}
      {[12, 42, 74].map((left, index) => <Heart key={left} size={18 + index * 4} fill="currentColor" className="orbit-heart absolute bottom-[12%] text-[#e08c4c]" style={{ left: `${left}%`, animationDelay: `-${index * 1.2}s` }} />)}
    </div>
  );
}

function pickRecentProfiles(rows, limit) {
  return [...(Array.isArray(rows) ? rows : [])]
    .sort((left, right) => {
      const rightDate = new Date(right.createdAt || right.updatedAt || 0).getTime();
      const leftDate = new Date(left.createdAt || left.updatedAt || 0).getTime();
      return rightDate - leftDate;
    })
    .slice(0, limit);
}

function preloadProfileImages(profiles) {
  return Promise.all((Array.isArray(profiles) ? profiles : []).map((profile) => new Promise((resolve) => {
    if (!profile?.image) return resolve();
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = profile.image;
  })));
}

function pickRandomProfiles(rows, limit) {
  const shuffled = [...(Array.isArray(rows) ? rows : [])];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled.slice(0, limit);
}

function SmallIndianProviderCard({ provider, index, content = {} }) {
  const activity = provider.activities?.[0] || "Sports";
  const image = provider.image || provider.images?.[0] || "";
  const sold = 59 + index * 17;
  const booked = (index % 4) + 2;

  return (
    <Link to={`/providers/${provider.id}`} className="group block text-black">
      <article className="rounded-2xl bg-white">
        <div className="relative aspect-[0.88] overflow-hidden rounded-2xl bg-[#eeeeee]">
          {image ? (
            <img
              src={image}
              alt={provider.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-4xl font-black">
              {provider.name?.[0] || "B"}
            </div>
          )}
          <span className="absolute right-0 top-0 rounded-bl-2xl bg-black px-3 py-2 text-xs font-black leading-tight text-white">
            {booked}x {content.providerCardBadgeText || "booked Recently"}
          </span>
        </div>

        <div className="mt-3">
          <h3 className="text-xl font-black">
            {provider.name || "Verified Buddy"}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-[44px] text-sm font-semibold leading-6 text-black">
            {provider.bio ||
              provider.headline ||
              "Friendly company for coffee, movies, sports or city plans."}
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-black">
                {formatRs(Number(provider.price || 500))}{content.providerCardPriceSuffix || "/hr"}
              </p>
              <p className="mt-1 text-xs font-bold text-black/40">
                {sold} bookings completed
              </p>
            </div>
            <p className="flex items-center gap-1 text-lg font-black">
              <Star size={20} fill="black" className="text-black" />
              {Number(provider.rating || 5).toFixed(1)}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}

function PublicProviderDrawer({
  open,
  loading,
  providers,
  filters,
  cities,
  states,
  activities,
  onClose,
  onFilter,
  onReset,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/45 px-3 py-4 backdrop-blur-sm sm:px-5">
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-lg border border-black/10 bg-[#fffaf3] shadow-[0_30px_120px_rgba(0,0,0,0.28)]">
        <div className="shrink-0 border-b border-black/10 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d67f3d]">
                Public explore
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#171b30] sm:text-3xl">
                Search verified providers
              </h2>
              <p className="mt-1 text-sm font-bold text-black/45">
                Original backend profiles only. Login is required before connecting.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:bg-[#e9ecef]"
              aria-label="Close provider search"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(240px,1.3fr)_repeat(5,minmax(130px,0.7fr))_auto]">
            <label className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
              />
              <input
                value={filters.keyword}
                onChange={(event) => onFilter("keyword", event.target.value)}
                placeholder="Name, city, activity..."
                className="h-[54px] w-full rounded-md border border-black/10 bg-[#fbfaf7] pl-11 pr-4 text-sm font-bold outline-none transition focus:border-[#d67f3d]"
              />
            </label>

            <DrawerFilter label="City" value={filters.city} placeholder="eg. Gurgaon" options={cities} onChange={(value) => onFilter("city", value)} />
            <DrawerFilter label="State" value={filters.state} placeholder="eg. Haryana" options={states} onChange={(value) => onFilter("state", value)} />
            <DrawerFilter label="Gender" value={filters.gender} placeholder="Any gender" options={["All", "Male", "Female", "Others"]} onChange={(value) => onFilter("gender", value)} />
            <DrawerFilter label="Activity" value={filters.activity} placeholder="eg. Cafe meet" options={activities} onChange={(value) => onFilter("activity", value)} />
            <DrawerFilter label="Max price" value={filters.maxPrice} placeholder="eg. Rs 1000" options={["All", "500", "700", "900", "1200", "1500", "2000"]} onChange={(value) => onFilter("maxPrice", value)} />
            <DrawerFilter label="Rating" value={filters.rating} placeholder="Any rating" options={["All", "1", "2", "3", "4", "5"]} onChange={(value) => onFilter("rating", value)} />

            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-[54px] items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-5 text-sm font-black text-[#d67f3d] transition hover:bg-[#fff4e6]"
            >
              <SlidersHorizontal size={16} /> Reset
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#171b30]">
                Recent provider profiles
              </h3>
              <p className="mt-1 text-sm font-bold text-black/45">
                {providers.length} profiles available
              </p>
            </div>
            <Link
              to="/login"
              className="hidden rounded-md bg-[#171b30] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-1 sm:inline-flex"
            >
              Get Started
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-[410px] animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
          ) : providers.length ? (
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  link={`/providers/${provider.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-black/15 bg-white text-center">
              <div>
                <Search size={30} className="mx-auto text-[#d67f3d]" />
                <p className="mt-3 text-xl font-black">No provider profiles found</p>
                <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-black/45">
                  Only approved backend profiles appear here. Try a different filter or check again after providers publish their profiles.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DrawerFilter({ label, value, options, onChange, placeholder }) {
  return (
    <label className="relative">
      <span className="absolute left-3 top-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-black">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-[54px] w-full appearance-none rounded-none border border-black/10 bg-[#fbfaf7] px-3 pb-1 pt-5 text-sm font-black outline-none transition focus:border-[#d67f3d] ${value === "All" ? "text-black/35" : "text-black"}`}
      >
        {options.map((option) => (
          <option key={option} value={option} className={option === "All" ? "text-black/40" : ""}>
            {option === "All" ? placeholder || `eg. ${label}` : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b))
  );
}

function sameText(left, right) {
  return String(left || "").trim().toLocaleLowerCase() === String(right || "").trim().toLocaleLowerCase();
}

function parseContentList(value, fallback) {
  const items = String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
  return items.length ? items : fallback;
}

function readPreviewContent() {
  try { return JSON.parse(localStorage.getItem("buddybook_site_content_preview") || "{}"); } catch { return {}; }
}

function normalizeSiteTestimonials(value) {
  const rows = Array.isArray(value) ? value : [];
  const cleaned = rows
    .map((item, index) => ({
      name: String(item?.name || "").trim(),
      city: String(item?.city || item?.role || "").trim(),
      text: String(item?.text || "").trim(),
      rating: Math.min(5, Math.max(1, Number(item?.rating || 5))),
      published: item?.published !== false,
      image:
        item?.image ||
        testimonials[index % testimonials.length]?.image ||
        testimonials[0]?.image,
    }))
    .filter((item) => item.name && item.text && item.published !== false);

  return cleaned.length ? cleaned : testimonials;
}

function getHeroTitleParts(value) {
  const fallback = "Safe Meetups. Real Connections.";
  const text = String(value || fallback).trim();
  const pieces = text.split(". ");

  if (pieces.length >= 2) {
    return {
      main: `${pieces[0]}.`,
      highlight: pieces.slice(1).join(". "),
    };
  }

  return {
    main: "Make the plan.",
    highlight: text,
  };
}

function onlyRealProviders(rows) {
  return (Array.isArray(rows) ? rows : []).filter(
    (provider) => provider?.id && !String(provider.id).startsWith("demo-")
  );
}

function mergePublicProviders(...groups) {
  const map = new Map();
  groups.flat().forEach((provider) => {
    if (!provider?.id) return;
    map.set(provider.id, provider);
  });
  return Array.from(map.values());
}

