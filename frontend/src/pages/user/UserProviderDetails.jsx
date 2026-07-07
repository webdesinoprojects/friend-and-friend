import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CalendarCheck, Heart, MapPin, Star } from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";
import { buddyProfiles } from "../../data/userDashboardData";

export default function UserProviderDetails() {
  const { id } = useParams();
  const profile = buddyProfiles.find((item) => item.id === id);

  if (!profile) {
    return (
      <UserAppLayout title="Profile Not Found">
        <div className="rounded-[2rem] bg-white p-8 text-center font-black">
          Profile not found.
        </div>
      </UserAppLayout>
    );
  }

  return (
    <UserAppLayout title="Choose Profile">
      <section className="rounded-[2rem] border border-[#dbe0ff] bg-white p-5 shadow-sm">
        <Link
          to="/app/user/dashboard"
          className="mb-5 inline-flex items-center gap-2 rounded-2xl bg-[#eef4ff] px-4 py-2 text-sm font-black text-[#17213a]"
        >
          <ArrowLeft size={16} />
          Back to search
        </Link>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#eef4ff] via-[#eef4ff] to-white shadow-inner shadow-[#3f37ff]/10">
            <img
              src={profile.image}
              className="h-[520px] w-full object-cover"
            />

            <button className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white text-[#ef4444] shadow-lg shadow-slate-300">
              <Heart fill="currentColor" />
            </button>
          </div>

          <div className="flex flex-col">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-black text-[#3f37ff]">
              <BadgeCheck size={15} />
              Premium Buddy
            </div>

            <h2 className="text-4xl font-black text-[#11153b]">
              {profile.name}
            </h2>

            <p className="mt-2 text-lg font-bold text-black/55">
              {profile.profession}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <InfoBadge icon={Star} text={`${profile.rating} (${profile.reviews} Reviews)`} />
              <InfoBadge icon={MapPin} text={profile.city} />
              <InfoBadge icon={CalendarCheck} text={profile.availability} />
            </div>

            <div className="mt-6 grid gap-3 text-sm font-bold text-black/60">
              <p>Experience: {profile.experience}</p>
              <p>Language: {profile.language}</p>
              <p>Services: {profile.services.join(", ")}</p>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-[#eef4ff] p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                About me
              </p>
              <p className="mt-3 text-sm font-bold leading-7 text-black/60">
                {profile.about}
              </p>
            </div>

            <div className="mt-auto pt-6">
              <div className="mb-4 flex items-center justify-between rounded-[1.5rem] bg-[#eef4ff] p-5">
                <div>
                  <p className="text-3xl font-black text-[#11153b]">
                    ₹{profile.price}
                    <span className="text-sm font-bold text-slate-500"> /hr</span>
                  </p>
                  <p className="mt-1 text-xs font-bold text-black/45">
                    Hourly rate
                  </p>
                </div>

                <Link
                  to={`/app/user/booking/${profile.id}`}
                  className="rounded-2xl bg-[#3f37ff] px-8 py-4 text-sm font-black text-white shadow-lg shadow-[#3f37ff]/20"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </UserAppLayout>
  );
}

function InfoBadge({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-sm font-black text-[#17213a]">
      <Icon size={16} className="text-[#3f37ff]" />
      {text}
    </div>
  );
}






