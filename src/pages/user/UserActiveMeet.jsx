import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Phone, ShieldCheck } from "lucide-react";
import UserAppLayout from "../../components/users/UserAppLayout";

export default function UserActiveMeet() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const bookings = JSON.parse(localStorage.getItem("buddybook_bookings") || "[]");
  const booking = bookings.find((item) => item.id === bookingId);

  if (!booking) {
    return (
      <UserAppLayout title="Active Meet">
        <div className="rounded-[2rem] bg-white p-8 text-center font-black">
          Booking not found.
        </div>
      </UserAppLayout>
    );
  }

  return (
    <UserAppLayout title="Location Transfer / Active Meet">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[2rem] border border-[#dbe0ff] bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-[#11153b]">
            Live Location
          </h2>

          <div className="mt-5 grid h-[420px] place-items-center rounded-[1.7rem] bg-[#eef4ff]">
            <div className="text-center">
              <MapPin className="mx-auto text-[#3f37ff]" size={60} />
              <p className="mt-3 text-lg font-black text-black">
                Location sharing demo
              </p>
              <p className="mt-1 text-sm font-bold text-black/50">
                Real map/live location will be added later.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-between rounded-[1.5rem] bg-[#eef4ff] p-4 text-sm font-bold text-slate-600">
            <span>You are sharing live location</span>
            <span>Accuracy: High</span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#dbe0ff] bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-[#11153b]">
            Active Meet Details
          </h2>

          <div className="mt-5 grid gap-3">
            {[
              ["Buddy", booking.providerName],
              ["Meetup", booking.service],
              ["Started At", `${booking.date} • ${booking.time}`],
              ["Status", "You are now in Active Meet"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl bg-[#eef4ff] p-4"
              >
                <p className="text-xs font-black uppercase text-black/35">
                  {label}
                </p>
                <p className="mt-1 text-sm font-black text-black">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#eef4ff] px-5 py-3 text-sm font-black text-[#3f37ff] shadow-sm">
              <Phone size={16} />
              Call
            </button>

            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#eef4ff] px-5 py-3 text-sm font-black text-[#3f37ff] shadow-sm">
              <ShieldCheck size={16} />
              SOS
            </button>
          </div>

          <button
            onClick={() => navigate("/app/user/dashboard")}
            className="mt-5 w-full rounded-2xl bg-[#3f37ff] px-5 py-4 text-sm font-black text-white"
          >
            End Meet
          </button>
        </div>
      </section>
    </UserAppLayout>
  );
}







