import {
  Bike,
  BookOpen,
  Camera,
  Coffee,
  Dumbbell,
  Gamepad2,
  Heart,
  MapPin,
  Music2,
  Palette,
  PartyPopper,
  ShoppingBag,
  Sparkles,
  Ticket,
  Trees,
  Utensils,
  Waves,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import PublicFooter from "../../components/layout/PublicFooter";
import heroImage from "../../assets/explore-hero.jpg";

const activities = [
  { title: "Coffee & conversation", note: "An easy hello over chai or coffee", icon: Coffee, image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=85", size: "feature" },
  { title: "Neighbourhood walks", note: "Stories hidden in familiar lanes", icon: MapPin, image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1000&q=85", size: "medium" },
  { title: "Street food trail", note: "One more plate to share", icon: Utensils, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=85", size: "medium" },
  { title: "Movie evening", note: "Good stories, better company", icon: Ticket, image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=85", size: "compact" },
  { title: "Morning cycling", note: "Quiet roads and an early start", icon: Bike, image: "https://images.unsplash.com/photo-1528629297340-d1d466945dc5?auto=format&fit=crop&w=900&q=85", size: "compact" },
  { title: "Local market day", note: "Browse, bargain and discover", icon: ShoppingBag, image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1000&q=85", size: "wide" },
  { title: "Live music night", note: "Share the front-row feeling", icon: Music2, image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=85", size: "medium" },
  { title: "Museum afternoon", note: "Art without awkward silence", icon: Palette, image: "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=85", size: "compact" },
  { title: "Gym partner", note: "Show up and stay motivated", icon: Dumbbell, image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=85", size: "compact" },
  { title: "Bookstore browsing", note: "Swap stories and recommendations", icon: BookOpen, image: "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=900&q=85", size: "medium" },
  { title: "Street photography", note: "Chase light through the city", icon: Camera, image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1000&q=85", size: "wide" },
  { title: "Sunday brunch", note: "Slow plates and easy laughs", icon: Utensils, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=85", size: "compact" },
  { title: "Board game café", note: "Friendly competition included", icon: Gamepad2, image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=900&q=85", size: "compact" },
  { title: "Park picnic", note: "Blanket, snacks and no rush", icon: Trees, image: heroImage, size: "feature" },
  { title: "Yoga together", note: "A calmer start to the day", icon: Heart, image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=85", size: "medium" },
  { title: "Concert buddy", note: "Never miss the encore alone", icon: PartyPopper, image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85", size: "wide" },
  { title: "Pool day", note: "Swim, unwind, repeat", icon: Waves, image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=85", size: "compact" },
  { title: "Shopping companion", note: "A second opinion you can trust", icon: ShoppingBag, image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85", size: "compact" },
  { title: "Pottery workshop", note: "Make something imperfectly yours", icon: Palette, image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1000&q=85", size: "medium" },
  { title: "Weekend wander", note: "See your city with fresh eyes", icon: Sparkles, image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=85", size: "wide" },
  { title: "Lakeside sunset", note: "A slower end to the day", icon: Waves, image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=85", size: "medium" },
  { title: "Cricket evening", note: "Cheer for every boundary", icon: PartyPopper, image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1000&q=85", size: "compact" },
  { title: "Garden stroll", note: "Fresh air and unhurried conversation", icon: Trees, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85", size: "compact" },
  { title: "Creative sketch day", note: "Bring a notebook and notice more", icon: Palette, image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=85", size: "medium" },
];

export default function Activities() {
  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#1d1d1b]">
      <PublicNavbar />
      <main className="overflow-hidden bg-[#f6f1e8] pt-20">
        <div>
          <section className="relative min-h-[560px] overflow-hidden sm:min-h-[650px]">
            <img src={heroImage} alt="Indian friends sharing a relaxed picnic" width="1600" height="900" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-[66%_center]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,241,232,.94)_0%,rgba(246,241,232,.78)_38%,rgba(246,241,232,.18)_72%)] max-sm:bg-[linear-gradient(180deg,rgba(246,241,232,.2)_0%,rgba(246,241,232,.88)_66%,rgba(246,241,232,.98)_100%)]" />
            <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-end px-4 pb-12 pt-20 sm:min-h-[650px] sm:items-center sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-4xl text-[#1d1d1b]">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-[#fffaf2]/80 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.2em] backdrop-blur">
                <Sparkles size={15} className="text-[#d85f48]" /> Made for real life
              </div>
              <h1 className="mt-6 text-5xl font-extrabold leading-[.94] tracking-[-.055em] sm:text-7xl lg:text-[6.25rem]">
                Explore all plans.<br /><span className="text-[#e08c4c]">choose what suits you best.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-black/60 sm:text-lg sm:leading-8">From one-hour coffee plans to full weekend afternoons, discover simple ways to enjoy your city with good company.</p>
            </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="mb-7 flex items-end justify-between gap-6 border-b border-black/15 pb-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#d85f48]">Explore together</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-[-.04em] sm:text-5xl">Choose your kind of day</h2>
              </div>
              <p className="hidden text-sm font-bold text-black/45 sm:block">24 everyday possibilities</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
              {activities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <article key={activity.title} className="group relative min-h-[220px] overflow-hidden rounded-[1.1rem] bg-[#1d1d1b] shadow-[0_14px_35px_rgba(35,26,20,.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(35,26,20,.16)] sm:min-h-[310px] sm:rounded-[1.5rem] lg:min-h-[300px]">
                    <img src={activity.image} alt={`${activity.title} in India`} width="800" height="620" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.05]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3.5 text-white sm:p-6">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/20 backdrop-blur sm:mb-3 sm:h-9 sm:w-9">
                        <Icon size={15} className="text-[#ffad9c] sm:h-[17px] sm:w-[17px]" />
                      </div>
                      <p className="line-clamp-2 text-[10px] font-semibold leading-4 text-white/65 sm:text-xs">{activity.note}</p>
                      <h3 className="mt-1 text-base font-extrabold leading-tight tracking-[-.03em] sm:text-2xl">{activity.title}</h3>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="border-t border-black/10 bg-[#fffaf2]/92 px-4 py-14 backdrop-blur-sm sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
              <div className="max-w-xl">
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#d85f48]">The plans you remember</p>
                <h2 className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-[-.045em] sm:text-6xl">Ordinary days can become your favourite stories.</h2>
                <p className="mt-5 text-base font-medium leading-7 text-black/55">A shared plate. A neighbourhood walk. A concert you nearly skipped. The plan does not need to be extraordinary—the company can make it matter.</p>
                <div className="mt-7 flex items-center gap-4 border-t border-black/10 pt-5">
                  <div className="flex -space-x-3">
                    {["photo-1494790108377-be9c29b29330", "photo-1500648767791-00dcc994a43e", "photo-1534528741775-53994a69daeb"].map((photo) => (
                      <img key={photo} src={`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=100&q=80`} alt="PPlusOne community member" className="h-11 w-11 rounded-full border-2 border-[#fffaf2] object-cover" />
                    ))}
                  </div>
                  <p className="text-xs font-extrabold leading-5 text-black/55">Real people.<br />Plans at your pace.</p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] bg-[#1d1d1b]">
                <img src={heroImage} alt="Indian friends sharing a relaxed picnic" width="1200" height="800" loading="lazy" className="h-[360px] w-full object-cover object-[68%_center] opacity-80 sm:h-[470px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <p className="absolute bottom-6 left-6 right-6 max-w-md text-2xl font-extrabold leading-tight text-white sm:bottom-8 sm:left-8 sm:text-3xl">Make room for the plans you keep saying “someday” to.</p>
              </div>
            </div>
          </section>

        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
