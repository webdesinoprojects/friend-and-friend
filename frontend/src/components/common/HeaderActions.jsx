import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CalendarCheck, Clock3, MessageCircle, Star, X } from "lucide-react";
import { listBookings } from "../../api/bookings";
import { listChats } from "../../api/chats";

function readList(key) {
  try {
    const rows = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function formatTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildNotifications() {
  const bookings = readList("buddybook_bookings")
    .slice()
    .map((booking) => ({
      id: booking.id || `${booking.providerName}-${booking.createdAt || booking.date}`,
      kind: "booking",
      title: booking.providerName
        ? `Booking with ${booking.providerName}`
        : "Booking created",
      detail: booking.date
        ? `${booking.service || booking.activity || "Meetup"} on ${booking.date}${booking.time ? ` at ${booking.time}` : ""}`
        : booking.service || booking.activity || "Your booking is saved",
      time: formatTime(booking.createdAt || booking.date),
      sortAt: booking.createdAt || booking.date,
    }));

  const reviews = readList("buddybook_reviews").map((review) => ({
    id: review.id,
    kind: "review",
    title:
      review.targetRole === "PROVIDER"
        ? `Review for ${review.targetName || "provider"}`
        : "User review submitted",
    detail: `${review.rating}/5 stars - ${review.description || "Review submitted"}`,
    time: formatTime(review.createdAt),
    sortAt: review.createdAt,
  }));

  return [...bookings, ...reviews]
    .sort((a, b) => new Date(b.sortAt || 0) - new Date(a.sortAt || 0));
}

async function buildBackendNotifications() {
  const [bookings, chats] = await Promise.all([
    listBookings().catch(() => []),
    listChats().catch(() => []),
  ]);

  const bookingRows = bookings.map((booking) => ({
    id: `booking-${booking.id}`,
    kind: "booking",
    title: booking.providerName ? `Booking with ${booking.providerName}` : `Booking from ${booking.userName || "user"}`,
    detail: `${booking.service || booking.activity || "Meetup"} on ${booking.date || "scheduled date"}${booking.time ? ` at ${booking.time}` : ""}`,
    time: formatTime(booking.updatedAt || booking.createdAt || booking.date),
    sortAt: booking.updatedAt || booking.createdAt || booking.date,
  }));

  const chatRows = chats
    .filter((chat) => Number(chat.unreadCount || 0) > 0)
    .map((chat) => ({
      id: `chat-${chat.id}`,
      kind: "chat",
      title: `${chat.unreadCount} unread message${Number(chat.unreadCount) > 1 ? "s" : ""}`,
      detail: `New message in ${chat.service || "chat"} with ${chat.userName || chat.providerName || "BuddyBOOK"}`,
      time: formatTime(chat.updatedAt),
      sortAt: chat.updatedAt,
    }));

  return [...chatRows, ...bookingRows, ...buildNotifications()]
    .filter((item, index, rows) => rows.findIndex((row) => row.id === item.id) === index)
    .sort((a, b) => new Date(b.sortAt || 0) - new Date(a.sortAt || 0));
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => buildNotifications());

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      buildBackendNotifications()
        .then((rows) => {
          if (mounted) setNotifications(rows);
        })
        .catch(() => {
          if (mounted) setNotifications(buildNotifications());
        });
    };
    refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("storage", refresh);
    window.addEventListener("buddybook:data-changed", refresh);
    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("buddybook:data-changed", refresh);
    };
  }, []);

  const latest = notifications[0];
  const unread = notifications.length > 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-11 w-11 place-items-center rounded-2xl bg-[#fffaf3] text-[#56655f] shadow-sm transition hover:bg-[#fff4e6]"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#e08c4c]" /> : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.7rem)] z-50 w-[18rem] rounded-2xl border border-[#ecd9c8] bg-white p-3 shadow-[0_22px_60px_rgba(65,40,22,0.18)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8b7563]">
              Notifications
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setDrawerOpen(true);
              }}
              className="rounded-lg bg-black px-3 py-1.5 text-[10px] font-black text-[#fffaf3]"
            >
              View all
            </button>
          </div>

          {latest ? (
            <div className="mt-3 rounded-xl bg-[#fffaf3] p-3">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ffeedd] text-black">
                  {latest.kind === "review" ? <Star size={17} /> : latest.kind === "chat" ? <MessageCircle size={17} /> : <CalendarCheck size={17} />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-black">{latest.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#6b5d52]">
                    {latest.detail}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[10px] font-black text-[#e08c4c]">
                    <Clock3 size={11} /> {latest.time}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-[#fffaf3] p-4 text-center">
              <p className="text-sm font-black text-black">No notifications yet</p>
              <p className="mt-1 text-xs font-bold text-[#8b7563]">
                New booking updates will appear here.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {drawerOpen ? createPortal(
        <div className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
          <aside
            className="ml-auto flex h-full w-full max-w-sm flex-col bg-[#fffaf3] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#e08c4c]">
                  History
                </p>
                <h2 className="text-2xl font-black text-black">Notifications</h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-black text-[#fffaf3]"
                aria-label="Close notifications"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 overflow-y-auto">
              {notifications.length ? (
                notifications.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-[#ecd9c8] bg-white p-4">
                    <p className="text-sm font-black text-black">{item.title}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#6b5d52]">{item.detail}</p>
                    <p className="mt-3 flex items-center gap-1 text-[10px] font-black text-[#e08c4c]">
                      <Clock3 size={11} /> {item.time}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#d9bfaa] bg-white p-6 text-center">
                  <p className="text-sm font-black text-black">Nothing here yet</p>
                  <p className="mt-1 text-xs font-bold text-[#8b7563]">
                    Booking notifications will stay available here afterwards.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>,
        document.body
      ) : null}
    </div>
  );
}

export function ComingSoonMessageButton({ className = "" }) {
  const [pulse, setPulse] = useState(false);
  const label = useMemo(() => (pulse ? "Coming soon" : "Messages"), [pulse]);

  return (
    <button
      type="button"
      onMouseEnter={() => setPulse(true)}
      onMouseLeave={() => setPulse(false)}
      className={`group relative grid h-11 w-11 place-items-center rounded-2xl bg-[#fffaf3] text-[#56655f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#ffeedd] hover:text-black ${className}`}
      aria-label={label}
    >
      <MessageCircle size={16} />
      <span className="pointer-events-none absolute right-0 top-[calc(100%+0.65rem)] z-50 origin-top-right scale-90 rounded-xl bg-black px-3 py-2 text-[10px] font-black text-[#fffaf3] opacity-0 shadow-[0_14px_34px_rgba(0,0,0,0.22)] transition duration-300 group-hover:translate-y-1 group-hover:scale-100 group-hover:opacity-100">
        Coming soon
      </span>
    </button>
  );
}
