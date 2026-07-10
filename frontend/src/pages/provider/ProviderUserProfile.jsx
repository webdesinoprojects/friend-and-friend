import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarCheck, Mail, MapPin, MessageCircle, Phone, User } from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import { listBookings } from "../../api/bookings";
import { listChats } from "../../api/chats";

export default function ProviderUserProfile() {
  const { userId } = useParams();
  const [bookings, setBookings] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      listBookings().catch(() => []),
      listChats().catch(() => []),
    ])
      .then(([nextBookings, nextChats]) => {
        if (!mounted) return;
        setBookings(nextBookings.filter((booking) => booking.userId === userId));
        setChats(nextChats.filter((chat) => chat.userId === userId));
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [userId]);

  const profile = useMemo(() => {
    const booking = bookings[0] || {};
    const chat = chats[0] || {};
    return {
      name: booking.userName || chat.userName || "BuddyBOOK user",
      image: chat.userImage || "",
      city: booking.city || "Location not shared",
      email: booking.userEmail || "",
      phone: booking.userPhone || "",
    };
  }, [bookings, chats]);

  return (
    <AppShell type="provider">
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
          <div className="grid place-items-center text-center">
            {profile.image ? (
              <img src={profile.image} alt={profile.name} className="h-28 w-28 rounded-full object-cover" />
            ) : (
              <span className="grid h-28 w-28 place-items-center rounded-full bg-[#ffeedd] text-4xl font-black text-black">
                {(profile.name || "U").charAt(0).toUpperCase()}
              </span>
            )}
            <h1 className="mt-4 text-2xl font-black">{profile.name}</h1>
            <p className="mt-1 text-sm font-bold text-[#6b5d52]">User profile</p>
          </div>

          <div className="mt-6 grid gap-3 text-sm font-bold text-[#5d4a3c]">
            <Info icon={MapPin} label={profile.city} />
            <Info icon={Mail} label={profile.email || "Email not shared"} />
            <Info icon={Phone} label={profile.phone || "Phone not shared"} />
          </div>

          <Link to="/app/provider/chat" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-black text-white">
            <MessageCircle size={16} /> Open chat
          </Link>
        </section>

        <section className="rounded-2xl border border-[#eddac7] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">Bookings with you</h2>
              <p className="mt-1 text-xs font-bold text-[#8b7563]">Real booking history for this user.</p>
            </div>
            <CalendarCheck size={20} className="text-[#e08c4c]" />
          </div>

          <div className="mt-5 grid gap-3">
            {loading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-[#fffaf3]" />
            ) : bookings.length ? (
              bookings.map((booking) => (
                <article key={booking.id} className="rounded-2xl border border-[#eddac7] bg-[#fffaf3] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">{booking.service || booking.activity || "Public meetup"}</p>
                      <p className="mt-1 text-xs font-bold text-[#6b5d52]">{booking.date || "Flexible"} {booking.time || ""}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">{booking.status || "CONFIRMED"}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d9bfaa] bg-[#fffaf3] p-8 text-center">
                <p className="text-sm font-black">No booking details found for this user yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Info({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#fffaf3] p-3">
      <Icon size={16} />
      <span>{label}</span>
    </div>
  );
}
