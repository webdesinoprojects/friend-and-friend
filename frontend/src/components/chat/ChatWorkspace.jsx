import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Mic,
  MoreVertical,
  Pencil,
  Search,
  Send,
  StopCircle,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  deleteChat,
  deleteChatMessage,
  editChatMessage,
  listChatMessages,
  listChats,
  markChatRead,
  sendChatMessage,
  signalChat,
  subscribeChatEvents,
  updateLiveLocation,
  uploadVoiceMessage,
} from "../../api/chats";
import { confirmAction, notify } from "../common/Feedback";

const MAX_TEXT_LENGTH = 2000;
const MAX_VOICE_SECONDS = 120;

function storedUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null") || {};
  } catch {
    return {};
  }
}

function errorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function mergeMessages(current, incoming) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, { ...byId.get(message.id), ...message }));
  return [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function timeLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function dateLabel(value) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function lastMessageLabel(chat) {
  const message = chat.messages?.[chat.messages.length - 1];
  if (!message) return "Start the conversation";
  if (message.type === "VOICE") return "Voice message";
  if (message.type === "LOCATION") return "Location shared";
  if (message.type === "LIVE_LOCATION") return "Live location shared";
  return message.text || "Message";
}

export default function ChatWorkspace({ role }) {
  const [user] = useState(() => storedUser());
  const myId = String(user.id || user._id || "");
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [streamOnline, setStreamOnline] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sendingLocation, setSendingLocation] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [editing, setEditing] = useState(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [voiceSending, setVoiceSending] = useState(false);
  const [liveSharing, setLiveSharing] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const bottomRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingSecondsRef = useRef(0);
  const liveWatchRef = useRef(null);
  const liveMessageRef = useRef(null);
  const liveLastUpdateRef = useRef(0);
  const typingTimerRef = useRef(null);

  const active = useMemo(() => chats.find((chat) => chat.id === activeId) || null, [chats, activeId]);
  const currentChatId = active?.id || "";
  const initialPeerOnline = Boolean(active?.peerOnline);
  const activeThreadIds = useMemo(() => active?.threadIds || (active ? [active.id] : []), [active]);
  const activeThreadKey = activeThreadIds.join("|");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return chats;
    return chats.filter((chat) => {
      const peer = role === "PROVIDER" ? chat.userName : chat.providerName;
      return `${peer} ${chat.service || ""} ${chat.bookingCode || ""}`.toLowerCase().includes(needle);
    });
  }, [chats, query, role]);

  const refreshChats = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const rows = await listChats();
      setChats(rows);
      setActiveId((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id || "");
    } catch (error) {
      if (!quiet) notify(errorMessage(error, "Could not load your chats."), "error");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(refreshChats, 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshChats({ quiet: true });
    }, 30000);
    const visible = () => document.visibilityState === "visible" && refreshChats({ quiet: true });
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refreshChats]);

  useEffect(() => {
    let stopped = false;
    let controller;
    let reconnectTimer;
    const handleEvent = (event, payload) => {
      if (event === "connected" || event === "ready") {
        setStreamOnline(true);
        return;
      }
      if (event === "chat") {
        let found = false;
        setChats((rows) => rows.map((chat) => {
          if (!(chat.threadIds || [chat.id]).includes(payload.threadId)) return chat;
          found = true;
          return { ...chat, messages: mergeMessages(chat.messages || [], [payload.message]), updatedAt: payload.message.createdAt };
        }));
        if (!found) refreshChats({ quiet: true });
        return;
      }
      if (["edit", "delete", "location"].includes(event)) {
        setChats((rows) => rows.map((chat) => ({
          ...chat,
          messages: (chat.messages || []).map((message) => message.id === payload.message?.id ? payload.message : message),
        })));
        return;
      }
      if (event === "read") {
        setChats((rows) => rows.map((chat) => ({
          ...chat,
          messages: (chat.messages || []).map((message) =>
            payload.threadIds?.includes(message.threadId) && message.senderId !== payload.readBy
              ? { ...message, readAt: payload.readAt }
              : message
          ),
        })));
        return;
      }
      const visibleThreadIds = activeThreadKey ? activeThreadKey.split("|") : [];
      if (event === "typing" && visibleThreadIds.includes(payload.threadId) && payload.userId !== myId) {
        setPeerTyping(Boolean(payload.active));
      }
      if (event === "presence" && visibleThreadIds.includes(payload.threadId) && payload.userId !== myId) {
        setPeerOnline(Boolean(payload.active ?? payload.online));
      }
    };
    const connect = async () => {
      controller = new AbortController();
      try {
        await subscribeChatEvents(handleEvent, { signal: controller.signal });
      } catch {
        if (!controller.signal.aborted) setStreamOnline(false);
      }
      if (!stopped) reconnectTimer = window.setTimeout(connect, 2500);
    };
    connect();
    return () => {
      stopped = true;
      controller?.abort();
      window.clearTimeout(reconnectTimer);
    };
  }, [activeThreadKey, myId, refreshChats]);

  useEffect(() => {
    if (!currentChatId) return;
    const stateTimer = window.setTimeout(() => {
      setPeerOnline(initialPeerOnline);
      setPeerTyping(false);
      setChats((rows) => rows.map((chat) => chat.id === currentChatId ? { ...chat, unreadCount: 0 } : chat));
    }, 0);
    markChatRead(currentChatId).catch(() => {});
    signalChat(currentChatId, "presence", true).catch(() => {});
    return () => {
      window.clearTimeout(stateTimer);
      signalChat(currentChatId, "presence", false).catch(() => {});
    };
  }, [currentChatId, initialPeerOnline]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages?.length, activeId]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const stopLiveLocation = useCallback(() => {
    if (liveWatchRef.current != null) navigator.geolocation?.clearWatch(liveWatchRef.current);
    liveWatchRef.current = null;
    liveMessageRef.current = null;
    setLiveSharing(false);
  }, []);

  useEffect(() => () => {
    window.clearInterval(recordingTimerRef.current);
    window.clearTimeout(typingTimerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    if (voiceDraft?.url) URL.revokeObjectURL(voiceDraft.url);
    stopLiveLocation();
  }, [stopLiveLocation, voiceDraft?.url]);

  const patchMessage = useCallback((chatId, optimisticId, saved) => {
    setChats((rows) => rows.map((chat) => chat.id === chatId ? {
      ...chat,
      messages: mergeMessages((chat.messages || []).filter((message) => message.id !== optimisticId), [saved]),
      updatedAt: saved.createdAt,
    } : chat));
  }, []);

  const sendPayload = useCallback(async (payload, { optimisticText } = {}) => {
    if (!active || active.closed) return null;
    const chatId = active.id;
    const optimisticId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      id: optimisticId,
      threadId: chatId,
      senderId: myId,
      senderRole: role,
      type: payload.type || "TEXT",
      text: optimisticText ?? payload.text,
      mediaUrl: payload.mediaUrl || null,
      durationSeconds: payload.durationSeconds || null,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setChats((rows) => rows.map((chat) => chat.id === chatId ? { ...chat, messages: [...(chat.messages || []), optimistic] } : chat));
    try {
      const saved = await sendChatMessage(chatId, payload);
      patchMessage(chatId, optimisticId, saved);
      return saved;
    } catch (error) {
      setChats((rows) => rows.map((chat) => chat.id === chatId ? {
        ...chat,
        messages: (chat.messages || []).map((message) => message.id === optimisticId
          ? { ...message, pending: false, failed: true, retryPayload: payload }
          : message),
      } : chat));
      notify(errorMessage(error, "Message was not sent."), "error");
      return null;
    }
  }, [active, myId, patchMessage, role]);

  const submitText = async () => {
    const value = text.trim();
    if (!value || value.length > MAX_TEXT_LENGTH) return;
    setText("");
    setEmojiOpen(false);
    await signalChat(active.id, "typing", false).catch(() => {});
    await sendPayload({ type: "TEXT", text: value });
  };

  const retryMessage = async (message) => {
    setChats((rows) => rows.map((chat) => chat.id === active.id ? {
      ...chat,
      messages: (chat.messages || []).filter((row) => row.id !== message.id),
    } : chat));
    await sendPayload(message.retryPayload, { optimisticText: message.text });
  };

  const onTextChange = (value) => {
    setText(value.slice(0, MAX_TEXT_LENGTH));
    if (!active) return;
    signalChat(active.id, "typing", Boolean(value.trim())).catch(() => {});
    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => signalChat(active.id, "typing", false).catch(() => {}), 1500);
  };

  const position = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported by this browser."));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  });

  const shareLocation = async (live = false) => {
    if (!active || sendingLocation) return;
    setSendingLocation(true);
    setLocationOpen(false);
    try {
      const result = await position();
      const coordinates = { latitude: result.coords.latitude, longitude: result.coords.longitude };
      const saved = await sendPayload({ type: live ? "LIVE_LOCATION" : "LOCATION", ...coordinates });
      if (live && saved) {
        stopLiveLocation();
        liveMessageRef.current = saved;
        setLiveSharing(true);
        liveWatchRef.current = navigator.geolocation.watchPosition((next) => {
          const now = Date.now();
          if (!liveMessageRef.current || now - liveLastUpdateRef.current < 5000) return;
          liveLastUpdateRef.current = now;
          const coords = { latitude: next.coords.latitude, longitude: next.coords.longitude };
          updateLiveLocation(liveMessageRef.current.threadId, liveMessageRef.current.id, coords)
            .then((updated) => {
              liveMessageRef.current = updated;
              setChats((rows) => rows.map((chat) => ({
                ...chat,
                messages: (chat.messages || []).map((message) => message.id === updated.id ? updated : message),
              })));
            })
            .catch(() => {});
        }, () => stopLiveLocation(), { enableHighAccuracy: true, maximumAge: 10000 });
      }
    } catch (error) {
      notify(errorMessage(error, "Could not access your location."), "error");
    } finally {
      setSendingLocation(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      notify("Voice recording is not supported by this browser.", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
        .find((mimetype) => MediaRecorder.isTypeSupported(mimetype));
      const recorder = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data);
      recorder.onstop = () => {
        window.clearInterval(recordingTimerRef.current);
        setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size) setVoiceDraft({ blob, url: URL.createObjectURL(blob), duration: Math.max(1, recordingSecondsRef.current) });
      };
      recorderRef.current = recorder;
      recorder.start(250);
      recordingSecondsRef.current = 0;
      setRecordingSeconds(0);
      setRecording(true);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((seconds) => {
          const next = Math.min(MAX_VOICE_SECONDS, seconds + 1);
          recordingSecondsRef.current = next;
          if (next >= MAX_VOICE_SECONDS && recorder.state === "recording") recorder.stop();
          return next;
        });
      }, 1000);
    } catch {
      notify("Microphone permission is required to record a voice message.", "error");
    }
  };

  const stopRecording = () => {
    window.clearInterval(recordingTimerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  };

  const discardVoice = () => {
    if (voiceDraft?.url) URL.revokeObjectURL(voiceDraft.url);
    setVoiceDraft(null);
    setRecordingSeconds(0);
  };

  const sendVoice = async () => {
    if (!voiceDraft || !active || voiceSending) return;
    setVoiceSending(true);
    const chatId = active.id;
    const optimisticId = `tmp-voice-${Date.now()}`;
    const optimistic = {
      id: optimisticId, threadId: chatId, senderId: myId, senderRole: role, type: "VOICE",
      text: "Voice message", mediaUrl: voiceDraft.url, durationSeconds: voiceDraft.duration,
      createdAt: new Date().toISOString(), pending: true,
    };
    setChats((rows) => rows.map((chat) => chat.id === chatId ? { ...chat, messages: [...(chat.messages || []), optimistic] } : chat));
    try {
      const saved = await uploadVoiceMessage(chatId, voiceDraft.blob, voiceDraft.duration);
      patchMessage(chatId, optimisticId, saved);
      discardVoice();
    } catch (error) {
      setChats((rows) => rows.map((chat) => chat.id === chatId ? { ...chat, messages: (chat.messages || []).filter((message) => message.id !== optimisticId) } : chat));
      notify(errorMessage(error, "Voice message was not sent."), "error");
    } finally {
      setVoiceSending(false);
    }
  };

  const loadOlder = async () => {
    if (!active?.hasMore || loadingOlder || !active.messages?.length) return;
    setLoadingOlder(true);
    try {
      const result = await listChatMessages(active.id, { before: active.messages[0].createdAt });
      setChats((rows) => rows.map((chat) => chat.id === active.id ? {
        ...chat, messages: mergeMessages(result.messages, chat.messages || []), hasMore: result.hasMore,
      } : chat));
    } catch (error) {
      notify(errorMessage(error, "Could not load older messages."), "error");
    } finally {
      setLoadingOlder(false);
    }
  };

  const saveEdit = async () => {
    const value = editing?.text?.trim();
    if (!value || !editing?.message) return;
    try {
      const updated = await editChatMessage(editing.message.threadId, editing.message.id, value);
      setChats((rows) => rows.map((chat) => ({ ...chat, messages: (chat.messages || []).map((message) => message.id === updated.id ? updated : message) })));
      setEditing(null);
    } catch (error) {
      notify(errorMessage(error, "Could not edit this message."), "error");
    }
  };

  const removeMessage = async (message) => {
    if (!await confirmAction({ title: "Delete message?", message: "It will show as deleted for both people.", confirmLabel: "Delete", danger: true })) return;
    try {
      const updated = await deleteChatMessage(message.threadId, message.id);
      setChats((rows) => rows.map((chat) => ({ ...chat, messages: (chat.messages || []).map((row) => row.id === updated.id ? updated : row) })));
    } catch (error) {
      notify(errorMessage(error, "Could not delete this message."), "error");
    }
  };

  const hideChat = async () => {
    if (!active || !await confirmAction({ title: "Hide conversation?", message: "This removes the conversation only from your chat list. A new message will make it visible again.", confirmLabel: "Hide", danger: true })) return;
    try {
      await deleteChat(active.id);
      setChats((rows) => rows.filter((chat) => chat.id !== active.id));
      setActiveId("");
      setMobileOpen(false);
    } catch (error) {
      notify(errorMessage(error, "Could not hide this conversation."), "error");
    }
  };

  const selectChat = (chat) => {
    stopLiveLocation();
    setActiveId(chat.id);
    setMobileOpen(true);
    setMenuOpen(false);
    setEmojiOpen(false);
    setLocationOpen(false);
  };

  const peerName = active ? (role === "PROVIDER" ? active.userName : active.providerName) : "";
  const peerImage = active ? (role === "PROVIDER" ? active.userImage : active.providerImage) : "";

  return (
    <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
      <div className="grid h-[calc(100vh-10rem)] min-h-[620px] grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={`${mobileOpen ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-black/10 bg-[#fffaf5]`}>
          <div className="border-b border-black/10 p-5">
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-black">Messages</h1><p className="mt-1 text-xs font-bold text-black/45">{streamOnline ? "Live updates connected" : "Reconnecting…"}</p></div>
              <MessageCircle className="text-[#df843f]" />
            </div>
            <label className="mt-4 flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3">
              <Search size={17} className="text-black/40" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" />
              {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {loading ? <div className="grid gap-3">{[1, 2, 3].map((row) => <div key={row} className="h-20 animate-pulse rounded-2xl bg-black/5" />)}</div> : null}
            {!loading && !filtered.length ? <div className="grid h-full place-items-center p-8 text-center"><div><MessageCircle className="mx-auto text-black/25" size={38} /><h2 className="mt-3 font-black">No conversations</h2><p className="mt-1 text-sm font-semibold text-black/45">Booking conversations will appear here.</p></div></div> : null}
            {filtered.map((chat) => {
              const name = role === "PROVIDER" ? chat.userName : chat.providerName;
              const image = role === "PROVIDER" ? chat.userImage : chat.providerImage;
              return <button key={chat.id} onClick={() => selectChat(chat)} className={`mb-2 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${chat.id === activeId ? "bg-black text-white" : "hover:bg-white"}`}>
                <Avatar name={name} image={image} />
                <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{name}</strong><small className={`shrink-0 text-[10px] font-bold ${chat.id === activeId ? "text-white/55" : "text-black/40"}`}>{timeLabel(chat.updatedAt)}</small></span><span className={`mt-1 block truncate text-xs font-semibold ${chat.id === activeId ? "text-white/60" : "text-black/45"}`}>{lastMessageLabel(chat)}</span></span>
                {chat.unreadCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#df843f] px-1 text-[10px] font-black text-white">{chat.unreadCount}</span>}
              </button>;
            })}
          </div>
        </aside>

        <main className={`${mobileOpen ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-col bg-[#f8f5f1]`}>
          {!active ? <div className="grid h-full place-items-center p-8 text-center"><div><MessageCircle className="mx-auto text-[#df843f]" size={48} /><h2 className="mt-4 text-2xl font-black">Your conversations</h2><p className="mt-2 text-sm font-semibold text-black/45">Choose a chat to start messaging.</p></div></div> : <>
            <header className="flex items-center gap-3 border-b border-black/10 bg-white px-4 py-3 sm:px-5">
              <button onClick={() => setMobileOpen(false)} className="md:hidden" aria-label="Back to conversations"><ArrowLeft /></button>
              <Avatar name={peerName} image={peerImage} small />
              <div className="min-w-0 flex-1"><h2 className="truncate font-black">{peerName}</h2><p className={`text-xs font-bold ${peerTyping ? "text-[#df843f]" : "text-black/45"}`}>{peerTyping ? "typing…" : peerOnline ? "Online" : active.service || "Conversation"}</p></div>
              {liveSharing && <button onClick={stopLiveLocation} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-600">Stop live</button>}
              <div className="relative"><button onClick={() => setMenuOpen((open) => !open)} className="rounded-full p-2 hover:bg-black/5" aria-label="Conversation menu"><MoreVertical /></button>{menuOpen && <div className="absolute right-0 top-11 z-30 w-52 rounded-2xl border border-black/10 bg-white p-2 shadow-xl"><button onClick={hideChat} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-rose-600 hover:bg-rose-50"><Trash2 size={16} /> Hide conversation</button></div>}</div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {active.hasMore && <div className="mb-5 text-center"><button disabled={loadingOlder} onClick={loadOlder} className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black disabled:opacity-50">{loadingOlder ? "Loading…" : "Load older messages"}</button></div>}
              {!active.messages?.length && <div className="grid h-full place-items-center text-center"><div><MessageCircle className="mx-auto text-black/20" size={40} /><p className="mt-3 font-black">Say hello to {peerName}</p><p className="mt-1 text-sm font-semibold text-black/40">Messages are saved securely to your account.</p></div></div>}
              {(active.messages || []).map((message, index) => {
                const mine = String(message.senderId) === myId || (!message.senderId && message.senderRole === role);
                const previous = active.messages[index - 1];
                const showDate = !previous || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                const canEdit = mine && message.type === "TEXT" && !message.deletedAt && clock - new Date(message.createdAt).getTime() <= 120000;
                return <div key={message.id}>{showDate && <div className="my-5 text-center"><span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-black text-black/45">{dateLabel(message.createdAt)}</span></div>}<MessageBubble message={message} mine={mine} canEdit={canEdit} onEdit={() => setEditing({ message, text: message.text })} onDelete={() => removeMessage(message)} onRetry={() => retryMessage(message)} /></div>;
              })}
              <div ref={bottomRef} />
            </div>

            <footer className="border-t border-black/10 bg-white p-3 sm:p-4">
              {active.closed ? <div className="rounded-2xl bg-black/5 p-3 text-center text-sm font-bold text-black/50">This booking chat is closed{active.closedReason ? `: ${active.closedReason}` : "."}</div> : <>
                {editing && <div className="mb-3 flex items-center gap-2 rounded-2xl bg-amber-50 p-3"><Pencil size={16} className="text-amber-700" /><input autoFocus value={editing.text} onChange={(event) => setEditing({ ...editing, text: event.target.value.slice(0, MAX_TEXT_LENGTH) })} onKeyDown={(event) => event.key === "Enter" && saveEdit()} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" /><button onClick={saveEdit} className="font-black text-emerald-700">Save</button><button onClick={() => setEditing(null)}><X size={17} /></button></div>}
                {recording && <div className="mb-3 flex items-center gap-3 rounded-2xl bg-rose-50 p-3"><span className="h-3 w-3 animate-pulse rounded-full bg-rose-500" /><strong className="flex-1 text-sm text-rose-700">Recording {recordingSeconds}s / {MAX_VOICE_SECONDS}s</strong><button onClick={stopRecording} className="flex items-center gap-1 rounded-full bg-rose-600 px-3 py-2 text-xs font-black text-white"><StopCircle size={15} /> Stop</button></div>}
                {voiceDraft && <div className="mb-3 flex items-center gap-3 rounded-2xl bg-orange-50 p-3"><audio controls src={voiceDraft.url} className="h-9 min-w-0 flex-1" /><button disabled={voiceSending} onClick={sendVoice} className="rounded-full bg-black p-2 text-white disabled:opacity-50">{voiceSending ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={17} />}</button><button disabled={voiceSending} onClick={discardVoice}><Trash2 size={17} className="text-rose-600" /></button></div>}
                <div className="flex items-end gap-2">
                  <div className="relative"><button disabled={recording || Boolean(voiceDraft)} onClick={() => setEmojiOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-full border border-black/10 text-lg disabled:opacity-40">☺</button>{emojiOpen && <div className="absolute bottom-14 left-0 z-30"><EmojiPicker onEmojiClick={(emoji) => onTextChange(text + emoji.emoji)} width={300} height={380} /></div>}</div>
                  <div className="relative"><button disabled={sendingLocation} onClick={() => setLocationOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-full border border-black/10 disabled:opacity-40">{sendingLocation ? <LoaderCircle className="animate-spin" size={18} /> : <MapPin size={18} />}</button>{locationOpen && <div className="absolute bottom-14 left-0 z-20 w-52 rounded-2xl border border-black/10 bg-white p-2 shadow-xl"><button onClick={() => shareLocation(false)} className="w-full rounded-xl px-3 py-2 text-left text-sm font-black hover:bg-black/5">Share current location</button><button onClick={() => shareLocation(true)} className="w-full rounded-xl px-3 py-2 text-left text-sm font-black hover:bg-black/5">Share live location</button></div>}</div>
                  <textarea value={text} onChange={(event) => onTextChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitText(); } }} rows={1} maxLength={MAX_TEXT_LENGTH} placeholder="Write a message…" className="max-h-28 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-black/10 bg-[#f8f5f1] px-4 py-3 text-sm font-semibold outline-none focus:border-[#df843f]" />
                  {!text.trim() ? <button disabled={recording || Boolean(voiceDraft)} onClick={startRecording} className="grid h-11 w-11 place-items-center rounded-full bg-black text-white disabled:opacity-40" aria-label="Record voice message"><Mic size={18} /></button> : <button onClick={submitText} className="grid h-11 w-11 place-items-center rounded-full bg-[#df843f] text-white" aria-label="Send message"><Send size={18} /></button>}
                </div>
                <div className="mt-1 px-2 text-right text-[10px] font-bold text-black/30">{text.length}/{MAX_TEXT_LENGTH}</div>
              </>}
            </footer>
          </>}
        </main>
      </div>
    </section>
  );
}

function Avatar({ name, image, small = false }) {
  const size = small ? "h-10 w-10" : "h-12 w-12";
  return <span className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#f2d8c2] font-black text-[#9a5124]`}>{image ? <img src={image} alt="" className="h-full w-full object-cover" /> : name ? name.trim().charAt(0).toUpperCase() : <User size={18} />}</span>;
}

function MessageBubble({ message, mine, canEdit, onEdit, onDelete, onRetry }) {
  if (message.system) return <div className="my-3 text-center"><span className="inline-block max-w-xl rounded-full bg-black/5 px-4 py-2 text-xs font-bold text-black/50">{message.text}</span></div>;
  const deleted = message.type === "DELETED" || message.deletedAt;
  return <div className={`group mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-[85%] sm:max-w-[72%] ${mine ? "items-end" : "items-start"}`}>
      <div className={`rounded-2xl px-4 py-3 shadow-sm ${deleted ? "border border-dashed border-black/15 bg-white text-black/40" : mine ? "rounded-br-md bg-black text-white" : "rounded-bl-md bg-white text-black"}`}>
        {deleted ? <p className="text-sm italic">This message was deleted.</p> : null}
        {!deleted && message.type === "TEXT" ? <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6">{message.text}</p> : null}
        {!deleted && message.type === "VOICE" ? <audio controls preload="metadata" src={message.mediaUrl} className="h-10 max-w-full" /> : null}
        {!deleted && ["LOCATION", "LIVE_LOCATION"].includes(message.type) ? <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="flex min-w-48 items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-full ${mine ? "bg-white/15" : "bg-orange-50 text-[#df843f]"}`}><MapPin size={19} /></span><span><strong className="block text-sm">{message.type === "LIVE_LOCATION" ? "Live location" : "Shared location"}</strong><small className={mine ? "text-white/60" : "text-black/45"}>Open in map</small></span></a> : null}
        <div className={`mt-1 flex items-center justify-end gap-1 text-[9px] font-bold ${mine && !deleted ? "text-white/45" : "text-black/35"}`}><span>{message.editedAt && !deleted ? "edited · " : ""}{timeLabel(message.createdAt)}</span>{mine && !message.failed ? message.pending ? <LoaderCircle className="animate-spin" size={11} /> : message.readAt ? <CheckCheck size={13} /> : <Check size={12} /> : null}</div>
      </div>
      {message.failed ? <button onClick={onRetry} className="mt-1 text-xs font-black text-rose-600">Not sent · Retry</button> : null}
      {mine && !deleted && !message.pending && !message.failed ? <div className="mt-1 flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">{canEdit && <button onClick={onEdit} className="rounded-full p-1.5 text-black/45 hover:bg-white" aria-label="Edit message"><Pencil size={13} /></button>}<button onClick={onDelete} className="rounded-full p-1.5 text-rose-500 hover:bg-white" aria-label="Delete message"><Trash2 size={13} /></button></div> : null}
    </div>
  </div>;
}
