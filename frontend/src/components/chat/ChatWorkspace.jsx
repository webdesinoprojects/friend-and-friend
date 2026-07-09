import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  Clipboard,
  Mic,
  MessageCircle,
  MoreVertical,
  Pause,
  Play,
  Search,
  Send,
  Smile,
  StopCircle,
  Trash2,
  X,
} from "lucide-react";
import { deleteChat, deleteChatMessage, listChats, markChatRead, sendChatMessage } from "../../api/chats";
import {
  addChatMessage,
  deleteLocalChat,
  deleteLocalChatMessage,
  getChats,
  subscribeToUserData,
} from "../../utils/userFlowStorage";

const quickEmojis = [":)", ":D", "<3", "OK", "Thanks", "Coffee", "Movie", "Game", "Shop", "Star", "Yes", "No"];

export default function ChatWorkspace({ role }) {
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [playingDraft, setPlayingDraft] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recorderStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const draftAudioRef = useRef(null);

  const stopRecorderTracks = () => {
    recorderStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    recorderStreamRef.current = null;
    mediaRecorderRef.current = null;
  };

  const load = async () => {
    try {
      const rows = mergeChatsForRole(await listChats(), role);
      setChats(rows);
      setOfflineMode(false);
      setActiveId((current) => current || rows[0]?.id || rows[0]?.bookingId || "");
    } catch {
      const localRows = mergeChatsForRole([], role);
      setChats(localRows);
      setOfflineMode(true);
      setActiveId((current) => current || localRows[0]?.id || localRows[0]?.bookingId || "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 3500);
    const unsubscribe = subscribeToUserData(() => setChats((rows) => mergeChatsForRole(rows, role)));
    return () => {
      window.clearInterval(timer);
      unsubscribe();
      stopRecorderTracks();
    };
  }, [offlineMode]);

  useEffect(() => {
    if (!recordingStartedAt) return undefined;
    const timer = window.setInterval(() => {
      setRecordingSeconds(Math.max(1, Math.floor((Date.now() - recordingStartedAt) / 1000)));
    }, 250);
    return () => window.clearInterval(timer);
  }, [recordingStartedAt]);

  const visibleChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = chats.filter((chat) => chat.bookingId || chat.id);
    if (!q) return rows;
    return rows.filter((chat) =>
      [chat.providerName, chat.userName, chat.service, chat.bookingCode, chat.bookingId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [chats, query]);

  const active = visibleChats.find((chat) => (chat.id || chat.bookingId) === activeId) || visibleChats[0];
  const activeKey = active?.id || active?.bookingId || "";
  const peerName = active ? (role === "PROVIDER" ? active.userName : active.providerName) : "";
  const peerImage = active?.providerImage || "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    if (active?.id && !offlineMode && !active.localOnly) markChatRead(active.id).catch(() => {});
  }, [active?.id, active?.messages?.length, offlineMode, active?.localOnly]);

  const sendText = async () => {
    const value = text.trim();
    if (!active || !value || active.closed || voiceDraft || recordingStartedAt) return;
    setText("");
    await sendMessage({ type: "TEXT", text: value });
  };

  const startRecording = async () => {
    if (!active || active.closed || voiceDraft) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceDraft({
        mediaUrl: "",
        durationSeconds: 0,
        text: "Voice recording is not supported in this browser.",
        error: true,
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const startedAt = Date.now();
      audioChunksRef.current = [];
      recorderStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const seconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
        const mediaUrl = blob.size ? await blobToDataUrl(blob) : "";
        stopRecorderTracks();
        setRecordingStartedAt(null);
        setRecordingSeconds(0);
        setVoiceDraft({
          mediaUrl,
          durationSeconds: seconds,
          text: mediaUrl ? `Voice message (${formatDuration(seconds)})` : "Voice recording failed. Please try again.",
          error: !mediaUrl,
        });
        audioChunksRef.current = [];
      };
      recorder.start(250);
      setRecordingStartedAt(startedAt);
      setRecordingSeconds(0);
    } catch {
      setVoiceDraft({
        mediaUrl: "",
        durationSeconds: 0,
        text: "Microphone permission was blocked.",
        error: true,
      });
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  };

  const deleteVoiceDraft = () => {
    draftAudioRef.current?.pause();
    setPlayingDraft(false);
    setVoiceDraft(null);
  };

  const sendVoiceDraft = async () => {
    if (!voiceDraft || voiceDraft.error || !voiceDraft.mediaUrl) return;
    const draft = voiceDraft;
    setVoiceDraft(null);
    await sendMessage({
      type: "VOICE",
      text: draft.text,
      mediaUrl: draft.mediaUrl,
      durationSeconds: draft.durationSeconds,
    });
  };

  const sendMessage = async (payload) => {
    if (!active) return;
    if (offlineMode || !active.id || active.localOnly) {
      addChatMessage({
        bookingId: active.bookingId,
        senderRole: role,
        text: payload.text,
        type: payload.type,
        mediaUrl: payload.mediaUrl,
        durationSeconds: payload.durationSeconds,
        system: false,
      });
      setChats(mergeChatsForRole([], role));
      return;
    }

    const optimistic = {
      id: `tmp-${Date.now()}`,
      senderRole: role,
      senderId: getStoredUser()?.id,
      system: false,
      createdAt: new Date().toISOString(),
      ...payload,
    };
    setChats((rows) => patchChat(rows, active.id, (chat) => ({ ...chat, messages: [...(chat.messages || []), optimistic] })));

    try {
      const saved = await sendChatMessage(active.id, payload);
      setChats((rows) =>
        patchChat(rows, active.id, (chat) => ({
          ...chat,
          messages: (chat.messages || []).map((item) => (item.id === optimistic.id ? saved : item)),
        }))
      );
    } catch {
      await load();
    }
  };

  const deleteMessage = async (message) => {
    if (!active || message.system) return;
    if (active.localOnly || !active.id || String(message.id).startsWith("MSG-")) {
      deleteLocalChatMessage(active.bookingId || active.id, message.id);
      setChats(mergeChatsForRole([], role));
      return;
    }
    try {
      await deleteChatMessage(active.id, message.id);
      setChats((rows) =>
        patchChat(rows, active.id, (chat) => ({
          ...chat,
          messages: (chat.messages || []).filter((item) => item.id !== message.id),
        }))
      );
    } catch {
      await load();
    }
  };

  const deleteActiveChat = async () => {
    if (!active) return;
    setMenuOpen(false);
    if (active.localOnly || !active.id) {
      deleteLocalChat(active.bookingId || active.id);
      setChats(mergeChatsForRole([], role));
      setActiveId("");
      return;
    }
    try {
      await deleteChat(active.id);
      const next = chats.filter((chat) => chat.id !== active.id);
      setChats(next);
      setActiveId(next[0]?.id || next[0]?.bookingId || "");
    } catch {
      await load();
    }
  };

  const markActiveRead = async () => {
    if (!active) return;
    setMenuOpen(false);
    if (active.id && !active.localOnly) await markChatRead(active.id).catch(() => {});
    setChats((rows) => rows.map((chat) => (chat.id === active.id ? { ...chat, unreadCount: 0 } : chat)));
  };

  const copyBookingId = async () => {
    setMenuOpen(false);
    const value = active?.bookingCode || active?.bookingId || "";
    if (value) await navigator.clipboard?.writeText(value).catch(() => {});
  };

  return (
    <section className="grid h-[calc(100dvh-10rem)] min-h-[560px] overflow-hidden rounded-[1.5rem] border border-[#eddac7] bg-white shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-b border-[#eddac7] bg-[#fffaf3] lg:border-b-0 lg:border-r">
        <div className="shrink-0 p-4 sm:p-5">
          <h1 className="text-2xl font-black text-black">Chats</h1>
          <p className="mt-1 text-sm font-semibold text-[#6b5d52]">Conversations open after a paid booking.</p>
          <label className="mt-4 flex h-12 items-center gap-3 rounded-2xl border border-[#eddac7] bg-white px-4">
            <Search size={18} className="text-black/45" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats..." className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" />
          </label>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-white" />)}</div>
          ) : visibleChats.length ? visibleChats.map((chat) => {
            const selected = activeKey === (chat.id || chat.bookingId);
            const name = role === "PROVIDER" ? chat.userName : chat.providerName;
            const last = chat.messages?.[chat.messages.length - 1];
            return (
              <button key={chat.id || chat.bookingId} type="button" onClick={() => setActiveId(chat.id || chat.bookingId)} className={`mb-3 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${selected ? "border-black bg-white shadow-sm" : "border-[#eddac7] bg-[#fffaf3] hover:bg-white"}`}>
                <Avatar name={name} image={role === "USER" ? chat.providerImage : ""} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-black text-black">{name}</p>
                    {chat.unreadCount ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-black px-1.5 text-[10px] font-black text-white">{chat.unreadCount}</span> : null}
                  </div>
                  <p className="mt-1 truncate text-xs font-bold text-[#6b5d52]">{last?.text || chat.service || "Public meetup"}</p>
                </div>
              </button>
            );
          }) : (
            <div className="rounded-2xl border border-dashed border-[#d9bfaa] bg-white p-6 text-center">
              <MessageCircle size={30} className="mx-auto text-[#e08c4c]" />
              <p className="mt-3 text-sm font-black">No chats yet</p>
              <p className="mt-1 text-xs font-semibold text-[#6b5d52]">Book and pay for a provider to start chatting.</p>
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-h-0 flex-col bg-[#fffaf3]">
        {active ? (
          <>
            <header className="flex shrink-0 items-center justify-between border-b border-[#eddac7] bg-white p-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={peerName} image={role === "USER" ? peerImage : ""} large />
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-black">{peerName}</p>
                  <p className="truncate text-xs font-bold text-[#6b5d52]">{active.bookingCode || active.bookingId} - {active.service}</p>
                </div>
              </div>
              <div className="relative">
                <button type="button" onClick={() => setMenuOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full bg-[#fffaf3] text-black" aria-label="Chat options">
                  <MoreVertical size={19} />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-2xl border border-[#eddac7] bg-white p-2 shadow-2xl">
                    <MenuAction icon={CheckCheck} label="Mark as read" onClick={markActiveRead} />
                    <MenuAction icon={Clipboard} label="Copy booking ID" onClick={copyBookingId} />
                    <MenuAction icon={Trash2} label="Delete chat" danger onClick={deleteActiveChat} />
                  </div>
                ) : null}
              </div>
            </header>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="mx-auto grid max-w-4xl gap-3">
                {(active.messages || []).map((message) => (
                  <MessageBubble key={message.id} message={message} mine={message.senderRole === role} onDelete={() => deleteMessage(message)} />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            <footer className="shrink-0 border-t border-[#eddac7] bg-white p-3 sm:p-4">
              {active.closed ? (
                <p className="rounded-2xl bg-rose-50 p-4 text-sm font-black text-rose-700">This chat is closed because the booking was cancelled.</p>
              ) : voiceDraft ? (
                <VoicePreview
                  draft={voiceDraft}
                  playing={playingDraft}
                  audioRef={draftAudioRef}
                  onPlayToggle={() => toggleDraftPlayback(draftAudioRef, setPlayingDraft)}
                  onEnded={() => setPlayingDraft(false)}
                  onDelete={deleteVoiceDraft}
                  onSend={sendVoiceDraft}
                />
              ) : (
                <div className="relative flex items-center gap-2 sm:gap-3">
                  <button type="button" onClick={() => setEmojiOpen((value) => !value)} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fffaf3] text-black"><Smile size={21} /></button>
                  {emojiOpen ? (
                    <div className="absolute bottom-[60px] left-0 z-20 grid grid-cols-3 gap-2 rounded-2xl border border-[#eddac7] bg-white p-3 shadow-2xl sm:grid-cols-4">
                      {quickEmojis.map((emoji) => <button key={emoji} type="button" onClick={() => { setText((value) => `${value} ${emoji}`.trim()); setEmojiOpen(false); }} className="rounded-xl px-3 py-2 text-sm font-black hover:bg-[#fffaf3]">{emoji}</button>)}
                    </div>
                  ) : null}
                  <input
                    value={recordingStartedAt ? `Recording... ${formatDuration(recordingSeconds)}` : text}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") sendText(); }}
                    disabled={Boolean(recordingStartedAt)}
                    placeholder="Type a message..."
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-[#eddac7] bg-[#fffaf3] px-4 text-sm font-bold outline-none focus:border-black"
                  />
                  <button type="button" onClick={recordingStartedAt ? stopRecording : startRecording} className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${recordingStartedAt ? "bg-rose-600 text-white" : "bg-[#fffaf3] text-black"}`}>
                    {recordingStartedAt ? <StopCircle size={20} /> : <Mic size={20} />}
                  </button>
                  <button type="button" onClick={sendText} disabled={!text.trim() || Boolean(recordingStartedAt)} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black text-[#fffaf3] disabled:opacity-40"><Send size={18} /></button>
                </div>
              )}
            </footer>
          </>
        ) : (
          <div className="grid h-full min-h-[420px] place-items-center text-center">
            <div><MessageCircle size={44} className="mx-auto text-[#e08c4c]" /><p className="mt-3 text-xl font-black">No active chat</p></div>
          </div>
        )}
      </main>
    </section>
  );
}

function VoicePreview({ draft, playing, audioRef, onPlayToggle, onEnded, onDelete, onSend }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${draft.error ? "border-rose-200 bg-rose-50" : "border-[#eddac7] bg-[#fffaf3]"}`}>
      <button type="button" onClick={onPlayToggle} disabled={!draft.mediaUrl} className="grid h-11 w-11 place-items-center rounded-full bg-black text-white disabled:opacity-40">
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
      {draft.mediaUrl ? <audio ref={audioRef} src={draft.mediaUrl} onEnded={onEnded} className="hidden" /> : null}
      <div className="min-w-[160px] flex-1">
        <p className="text-sm font-black">{draft.error ? draft.text : "Voice note ready"}</p>
        {!draft.error ? <p className="text-xs font-bold text-[#6b5d52]">{formatDuration(draft.durationSeconds)}</p> : null}
      </div>
      <button type="button" onClick={onDelete} className="grid h-11 w-11 place-items-center rounded-xl bg-white text-rose-600"><Trash2 size={18} /></button>
      {!draft.error ? <button type="button" onClick={onSend} className="grid h-11 w-11 place-items-center rounded-xl bg-black text-white"><Send size={18} /></button> : null}
    </div>
  );
}

function MessageBubble({ message, mine, onDelete }) {
  if (message.system) {
    return (
      <div className="mx-auto max-w-[86%] rounded-2xl bg-[#ffeedd] px-4 py-3 text-center text-sm font-bold text-black/65">
        <p>{message.text}</p>
        <p className="mt-1 text-[10px] text-black/35">{formatTime(message.createdAt)}</p>
      </div>
    );
  }

  return (
    <div className={`group relative max-w-[86%] rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm sm:max-w-[72%] ${mine ? "ml-auto rounded-br-md bg-black text-[#fffaf3]" : "mr-auto rounded-bl-md bg-white text-black"}`}>
      <button type="button" onClick={onDelete} className={`absolute -top-2 ${mine ? "-left-2" : "-right-2"} grid h-7 w-7 place-items-center rounded-full bg-white text-rose-600 opacity-0 shadow transition group-hover:opacity-100`}>
        <Trash2 size={13} />
      </button>
      {message.type === "VOICE" ? (
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className={`grid h-9 w-9 place-items-center rounded-full ${mine ? "bg-white/15" : "bg-[#fffaf3]"}`}><Mic size={17} /></span>
            <div><p className="font-black">Voice message</p><p className={`text-xs ${mine ? "text-white/55" : "text-black/45"}`}>{formatDuration(message.durationSeconds || 1)}</p></div>
          </div>
          {message.mediaUrl ? <audio controls src={message.mediaUrl} className="mt-2 h-8 w-full max-w-[260px]" /> : null}
        </div>
      ) : <p>{message.text}</p>}
      <p className={`mt-1 text-[10px] ${mine ? "text-white/55" : "text-black/35"}`}>{formatTime(message.createdAt)}</p>
    </div>
  );
}

function MenuAction({ icon: Icon, label, onClick, danger = false }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black transition ${danger ? "text-rose-600 hover:bg-rose-50" : "text-black hover:bg-[#fffaf3]"}`}><Icon size={17} />{label}</button>;
}

function Avatar({ name, image, large = false }) {
  const size = large ? "h-12 w-12" : "h-11 w-11";
  return image ? <img src={image} alt={name || "Chat"} className={`${size} shrink-0 rounded-full object-cover`} /> : <span className={`${size} grid shrink-0 place-items-center rounded-full bg-[#ffeedd] text-sm font-black text-black`}>{(name || "B").charAt(0).toUpperCase()}</span>;
}

function patchChat(rows, id, updater) {
  return rows.map((chat) => (chat.id === id ? updater(chat) : chat));
}

function mergeChatsForRole(serverRows = [], role) {
  const currentUser = getStoredUser();
  const currentProviderId = currentUser?.providerProfile?.id || currentUser?.providerProfileId || "";
  const currentUserId = currentUser?.id || currentUser?._id || "";
  const currentName = normalizeName(currentUser?.fullName);

  const allLocalRows = getChats();
  let localRows = allLocalRows
    .filter((chat) => {
      if (role !== "PROVIDER") return true;
      const providerName = normalizeName(chat.providerName);
      return normalizeName(chat.providerName) === currentName || providerName.includes(currentName) || currentName.includes(providerName) || looseNameMatch(providerName, currentName) || chat.providerId === currentProviderId || chat.providerUserId === currentUserId;
    })
    .map((chat) => ({ ...chat, id: chat.id || `local-${chat.bookingId}`, localOnly: true }));

  if (role === "PROVIDER" && !localRows.length && !serverRows.length) {
    localRows = allLocalRows.map((chat) => ({ ...chat, id: chat.id || `local-${chat.bookingId}`, localOnly: true, needsProviderMatch: true }));
  }

  const merged = new Map();
  [...localRows, ...serverRows].forEach((chat) => {
    const key = chat.bookingId || chat.id;
    if (!key) return;
    const previous = merged.get(key);
    if (!previous || previous.localOnly) merged.set(key, chat);
  });

  return Array.from(merged.values()).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function looseNameMatch(left, right) {
  const leftTokens = left.split(/\s+/).filter((item) => item.length > 2);
  const rightTokens = right.split(/\s+/).filter((item) => item.length > 2);
  return Boolean(leftTokens.length && rightTokens.length && leftTokens.some((token) => rightTokens.includes(token)));
}

function toggleDraftPlayback(audioRef, setPlaying) {
  const audio = audioRef.current;
  if (!audio) return;
  if (!audio.paused) {
    audio.pause();
    setPlaying(false);
    return;
  }
  audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds) {
  const safe = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = String(safe % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getSupportedAudioMimeType() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return types.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}
