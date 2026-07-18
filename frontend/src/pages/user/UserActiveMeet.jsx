import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Phone, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import UserAppLayout from "../../components/users/UserAppLayout";
import { completeBookingApi, listBookings } from "../../api/bookings";
import { listChats, sendChatMessage } from "../../api/chats";
import { notify } from "../../components/common/Feedback";
import { getBookings, updateBooking } from "../../utils/userFlowStorage";

export default function UserActiveMeet() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking,setBooking]=useState(()=>getBookings().find(item=>item.id===bookingId)); const [thread,setThread]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [sharing,setSharing]=useState(false);
  const load=useCallback(()=>{setLoading(true);setError("");Promise.all([listBookings(),listChats()]).then(([rows,chats])=>{setBooking(rows.find(item=>item.id===bookingId));setThread(chats.find(chat=>chat.bookingId===bookingId));}).catch(()=>setError("Active meet details could not be loaded.")).finally(()=>setLoading(false));},[bookingId]);
  useEffect(()=>{load();},[load]);

  if (loading) return <UserAppLayout title="Active Meet"><div className="h-64 animate-pulse rounded-[2rem] bg-black/5" /></UserAppLayout>;
  if (error) return <UserAppLayout title="Active Meet"><div role="alert" className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center font-black text-red-700">{error}<button onClick={load} className="ml-3 rounded-xl bg-black px-4 py-2 text-white">Retry</button></div></UserAppLayout>;

  if (!booking) {
    return (
      <UserAppLayout title="Active Meet">
        <div className="rounded-[2rem] bg-white p-8 text-center font-black">
          Booking not found.
        </div>
      </UserAppLayout>
    );
  }

  const handleEndMeet = async () => {
    try {
      const completed = await completeBookingApi(bookingId);
      updateBooking(bookingId, { status: "COMPLETED" });
      setBooking(completed?.booking || completed || {...booking,status:"COMPLETED"});
      notify("Meet completed successfully.","success");
      navigate("/app/user/dashboard");
    } catch (error) {
      notify(error.response?.data?.message || "Failed to end the meet.","error");
    }
  };

  const handleCall = () => { if(booking.providerPhone) window.location.href=`tel:${booking.providerPhone}`; else notify("Provider phone number is unavailable.","error"); };

  const handleSOS = () => {
    window.location.href="tel:112";
  };

  const shareLocation=()=>{if(!navigator.geolocation||!thread?.id){notify("Location sharing is unavailable for this booking.","error");return;}setSharing(true);navigator.geolocation.getCurrentPosition(async({coords})=>{try{await sendChatMessage(thread.id,{type:"LOCATION",latitude:coords.latitude,longitude:coords.longitude});notify("Current location shared in booking chat.","success");}catch{notify("Location could not be shared.","error");}finally{setSharing(false);}},()=>{setSharing(false);notify("Location permission was denied.","error");},{enableHighAccuracy:true,timeout:15000});};

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
                Share your current location
              </p>
              <p className="mt-1 text-sm font-bold text-black/50">
                Your coordinates are securely shared in this booking chat.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-between rounded-[1.5rem] bg-[#eef4ff] p-4 text-sm font-bold text-slate-600">
            <span>Location sharing is off by default</span>
            <button type="button" disabled={sharing} onClick={shareLocation} className="font-black text-[#3f37ff]">{sharing?"Sharing...":"Share now"}</button>
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
            <button
              onClick={handleCall}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#eef4ff] px-5 py-3 text-sm font-black text-[#3f37ff] shadow-sm"
            >
              <Phone size={16} />
              Call
            </button>

            <button
              onClick={handleSOS}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#eef4ff] px-5 py-3 text-sm font-black text-[#3f37ff] shadow-sm"
            >
              <ShieldCheck size={16} />
              SOS
            </button>
          </div>

          <button
            onClick={handleEndMeet}
            className="mt-5 w-full rounded-2xl bg-[#3f37ff] px-5 py-4 text-sm font-black text-white"
          >
            End Meet
          </button>
        </div>
      </section>
    </UserAppLayout>
  );
}







