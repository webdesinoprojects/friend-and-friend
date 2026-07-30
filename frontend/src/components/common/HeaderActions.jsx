import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CalendarCheck, Clock3, MessageCircle, Star, X } from "lucide-react";
import api from "../../api/api";
import { fetchQuery, getQueryData, setQueryData } from "../../utils/queryCache";

const NOTIFICATIONS_KEY = "notifications:list";

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

async function buildBackendNotifications() {
  return fetchQuery(
    NOTIFICATIONS_KEY,
    async () => {
      const { data } = await api.get("/notifications", { suppressGlobalError: true });
      const rows = Array.isArray(data?.data) ? data.data : [];
      return rows.map((row) => ({ id: row.id, kind: String(row.type || "notification").toLowerCase(), title: row.title, detail: row.message, link: row.link, readAt: row.readAt, time: formatTime(row.createdAt), sortAt: row.createdAt }));
    },
    { staleTime: 15_000 }
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => getQueryData(NOTIFICATIONS_KEY, []));

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      buildBackendNotifications()
        .then((rows) => {
          if (mounted) setNotifications(rows);
        })
        .catch(() => {
          if (mounted) setNotifications([]);
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
  const unread = notifications.some((item) => !item.readAt);
  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications((current) => setQueryData(
      NOTIFICATIONS_KEY,
      current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)
    ));
  };
  const markAllRead = async () => {
    await api.patch("/notifications/all/read").catch(() => {});
    setNotifications((current) => setQueryData(
      NOTIFICATIONS_KEY,
      current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))
    ));
  };

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
        <div className="fixed inset-x-0 bottom-0 top-[76px] z-[80] bg-black/30 backdrop-blur-sm lg:top-[92px]" onClick={() => setDrawerOpen(false)}>
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
              {unread ? <button type="button" onClick={markAllRead} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-black">Mark all as read</button> : null}
              {notifications.length ? (
                notifications.map((item) => (
                  <article key={item.id} onClick={() => markRead(item.id)} className={`cursor-pointer rounded-2xl border border-[#ecd9c8] p-4 ${item.readAt ? "bg-white" : "bg-[#fff0df]"}`}>
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
