import React, { useState, useEffect, useRef, useMemo } from 'react';
import EmojiPicker from "emoji-picker-react";
import {
  CheckCheck,
  Clipboard,
  MapPin,
  MessageCircle,
  Mic,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Search,
  Send,
  StopCircle,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { deleteChat, deleteChatMessage, editChatMessage, listChats, markChatRead, sendChatMessage } from "../../api/chats";
import {
  addChatMessage,
  deleteLocalChat,
  deleteLocalChatMessage,
  editLocalChatMessage,
  getChats,
  subscribeToUserData,
} from "../../utils/userFlowStorage";

export default function ChatWorkspace({ role }) {
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [locationOptionOpen, setLocationOptionOpen] = useState(false);
  const [locationPending, setLocationPending] = useState(false);
  const locationWatchIdRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [playingDraft, setPlayingDraft] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingText, setEditingText] = useState("");
  const bottomRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recorderStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const draftAudioRef = useRef(null);
  const pendingMessagesRef = useRef(new Map());
  const shareStartTimeRef = useRef(null);
  const shareHasErrorRef = useRef(false);

  // OTP and timer state
  const [otpStatus, setOtpStatus] = useState('idle'); // 'idle', 'waitingStart', 'running', 'waitingEnd', 'completed', 'failed'
  const [timer, setTimer] = useState(0); // remaining time in seconds
  const [bookingDuration, setBookingDuration] = useState(0); // total booked duration in minutes
  const [startOtpInput, setStartOtpInput] = useState('');
  const [endOtpInput, setEndOtpInput] = useState('');
  const [bookingId, setBookingId] = useState(''); // current booking ID for OTP verification

  // Timer reference
  const timerRef = useRef(null);

  const stopRecorderTracks = () => {
    recorderStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    recorderStreamRef.current = null;
    mediaRecorderRef.current = null;
  };

  const load = async () => {
    try {
      const rows = await listChats();
      const merged = mergePendingMessages(mergeChatsForRole(rows, role), pendingMessagesRef.current);
      setChats(merged);
      try {
        sessionStorage.setItem(`buddybook_chat_cache_${role}`, JSON.stringify(merged));
      } catch {}
      setOfflineMode(false);
      setActiveId((current) => current || merged[0]?.id || merged[0]?.bookingId || "");
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
    try {
      const cached = JSON.parse(sessionStorage.getItem(`buddybook_chat_cache_${role}`) || "[]");
      if (Array.isArray(cached) && cached.length) {
        setChats(cached);
        setActiveId((current) => current || cached[0]?.id || cached[0]?.bookingId || "");
        setLoading(false);
      }
    } catch {}
    load();
    const timer = window.setInterval(load, 10000); // Increased interval to 10 seconds to reduce frequent reloads
    const unsubscribe = subscribeToUserData(() => setChats((rows) => mergeChatsForRole(rows, role)));
    return () => {
      window.clearInterval(timer);
      unsubscribe();
      stopRecorderTracks();
    };
  }, [role, offlineMode]);

  useEffect(() => {
    if (!recordingStartedAt) return undefined;
    const timer = window.setInterval(() => {
      setRecordingSeconds(Math.max(1, Math.floor((Date.now() - recordingStartedAt) / 1000)));
    }, 250);
    return () => window.clearInterval(timer);
  }, [recordingStartedAt]);

  // Effect to handle OTP and timer when active chat changes
  useEffect(() => {
    // Reset OTP state when chat changes
    resetOtpState();
    // If there's an active chat, check for booking OTP requirements
    if (activeId) {
      const activeChat = chats.find((chat) => (chat.id || chat.bookingId) === activeId);
      if (activeChat && activeChat.booking) {
        const booking = activeChat.booking;
        // Assuming booking has: id, durationMinutes, otpStatus (from backend)
        // We'll initialize our state based on booking data
        setBookingId(booking.id || "");
        setBookingDuration(booking.durationMinutes || 0);
        // Set initial OTP status based on booking.otpStatus (if available) or default to 'waitingStart'
        // For simplicity, we assume when chat loads, we are waiting for start OTP
        setOtpStatus('waitingStart');
        // If there's a timer running from previous session, we could restore it, but for simplicity we reset
      }
    }
  }, [activeId, chats]);

  // Timer effect
  useEffect(() => {
    if (otpStatus === 'running' && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          const newTime = prev - 1;
          return newTime <= 0 ? (clearInterval(timerRef.current), handleGenerateEndOtp(), 0) : newTime;
        });
      }, 1000);
    } else if (otpStatus !== 'running') {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [otpStatus, timer]);

  const resetOtpState = () => {
    setOtpStatus('idle');
    setTimer(0);
    setStartOtpInput('');
    setEndOtpInput('');
    clearInterval(timerRef.current);
  };

  // Function to generate and send end OTP when timer expires
  const handleGenerateEndOtp = async () => {
    try {
      // Call backend API to generate and send end OTP to provider
      const response = await fetch(`/api/bookings/${bookingId}/end-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate end OTP');
      }

      // Update state to indicate we're waiting for the end OTP
      setOtpStatus('waitingEnd');

      console.log('End OTP sent to provider successfully');
    } catch (error) {
      console.error("Failed to generate end OTP:", error.message);
      setOtpStatus('failed');
      // In a real app, you might want to show an error to the user
    }
  };

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
  const peerId = role === "PROVIDER" ? active?.userId : active?.providerId;

  // We assume the booking object is available in active.booking
  const booking = active?.booking || {};

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    // Mark chat as read if online and not local
    if (active?.id && !offlineMode && !active.localOnly) {
      markChatRead(active.id).catch(() => {});
    }
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
    pendingMessagesRef.current.set(optimistic.id, { threadId: active.id, message: optimistic });
    setChats((rows) => patchChat(rows, active.id, (chat) => ({
      ...chat,
      messages: [...(chat.messages || []), optimistic],
    })));

    try {
      const saved = await sendChatMessage(active.id, payload);
      pendingMessagesRef.current.delete(optimistic.id);
      setChats((rows) =>
        patchChat(rows, active.id, (chat) => ({
          ...chat,
          messages: (chat.messages || []).map((item) => (item.id === optimistic.id ? saved : item)),
        }))
      );
      window.setTimeout(load, 150);
    } catch {
      pendingMessagesRef.current.delete(optimistic.id);
      await load();
    }
  };

  const handleLocationClick = async () => {
    if (!active || active.closed || locationPending) return;
    setLocationOptionOpen(true);
  };

  const shareLiveLocation = () => {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const mapUrl = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;
            const locationText = `📍 Live location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

            await sendMessage({
              type: "LIVE_LOCATION",
              text: locationText,
              mediaUrl: mapUrl
            });
            resolve();
          } catch (error) {
            console.error("Failed to send live location:", error);
            reject(new Error("Failed to share live location"));
          }
        },
        (error) => {
          console.error("Live location error:", error);
          reject(new Error("Unable to get live location"));
        },
        options
      );
    });
  };

  const handleCurrentLocation = async () => {
    if (!active || active.closed) return;

    try {
      setLocationPending(true);

      if (!navigator.geolocation) {
        setText((value) => `${value} Location sharing is not supported in this browser.`.trim());
        setLocationPending(false);
        return;
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const mapUrl = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;
      const locationText = `📍 Shared location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      await sendMessage({
        type: "LOCATION",
        text: locationText,
        mediaUrl: mapUrl
      });

      setLocationPending(false);
    } catch (error) {
      console.error("Location error:", error);
      setText((value) => `${value} Unable to get location. Please try again.`.trim());
      setLocationPending(false);
    }
  };

  const handleLiveLocation = async () => {
    if (!active || active.closed) return;

    try {
      setLocationPending(true);

      if (!navigator.geolocation) {
        setText((value) => `${value} Location sharing is not supported in this browser.`.trim());
        setLocationPending(false);
        return;
      }

      await shareLiveLocation();

      setLocationPending(false);
    } catch (error) {
      console.error("Live location error:", error);
      setText((value) => `${value} Unable to start live location sharing. Please try again.`.trim());
      setLocationPending(false);
    }
  };

  const deleteMessage = async (message) => {
    if (!active || message.system) return;
    const user = getStoredUser();
    if (!user || message.senderId !== user.id) {
      // not authorized to delete this message
      return;
    }
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

  const startEditMessage = (message) => {
    if (!canEditMessage(message)) return;
    setEditingMessage(message);
    setEditingText(message.text || "");
  };

  const cancelEditMessage = () => {
    setEditingMessage(null);
    setEditingText("");
  };

  const submitEditMessage = async () => {
    const value = editingText.trim();
    if (!active || !editingMessage || !value) return;
    const message = editingMessage;
    cancelEditMessage();

    if (active.localOnly || !active.id || String(message.id).startsWith("MSG-")) {
      editLocalChatMessage(active.bookingId || active.id, message.id, value);
      setChats((rows) =>
        patchChat(rows, active.id || active.bookingId, (chat) => ({
          ...chat,
          messages: (chat.messages || []).map((item) => (item.id === message.id ? { ...item, text: value } : item)),
        }))
      );
      return;
    }

    setChats((rows) =>
      patchChat(rows, active.id, (chat) => ({
        ...chat,
        messages: (chat.messages || []).map((item) => (item.id === message.id ? { ...item, text: value } : item)),
      }))
    );

    try {
      const saved = await editChatMessage(active.id, message.id, value);
      setChats((rows) =>
        patchChat(rows, active.id, (chat) => ({
          ...chat,
          messages: (chat.messages || []).map((item) => (item.id === message.id ? saved : item)),
        }))
      );
      window.setTimeout(load, 150);
    } catch {
      await load();
    }
  };

  const canEditMessage = (message) => {
    if (!isCurrentUserMessage(message) || message.type !== "TEXT") return false;
    const sentAt = new Date(message.createdAt).getTime();
    return Number.isFinite(sentAt) && Date.now() - sentAt <= 2 * 60 * 1000;
  };

  const isCurrentUserMessage = (message) => {
    const user = getStoredUser();
    const userIds = [user?.id, user?._id].filter(Boolean).map(String);
    return Boolean(
      (message?.senderId && userIds.includes(String(message.senderId))) ||
      (!message?.senderId && message?.senderRole === role)
    );
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

  // OTP handling functions
  const handleStartOtpSubmit = async () => {
    if (!startOtpInput.trim()) return;
    try {
      // Call backend API to verify start OTP
      const response = await fetch(`/api/bookings/${bookingId}/verify-start-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: startOtpInput.trim() }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      // If successful, start the timer
      setOtpStatus('running');
      setTimer(bookingDuration * 60); // convert minutes to seconds
      setStartOtpInput('');

      // Show success message (you could use a toast or update UI)
      console.log('Start OTP verified successfully');
    } catch (error) {
      setOtpStatus('failed');
      setStartOtpInput('');
      console.error("Start OTP verification failed:", error.message);
      // In a real app, show error to user
    }
  };

  const handleEndOtpSubmit = async () => {
    if (!endOtpInput.trim()) return;
    try {
      // Call backend API to verify end OTP
      const response = await fetch(`/api/bookings/${bookingId}/verify-end-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: endOtpInput.trim() }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      // If successful, mark as completed
      setOtpStatus('completed');
      setEndOtpInput('');

      // Here you would typically trigger payment processing
      console.log('End OTP verified successfully. Payment can be processed.');

      // Show success message
    } catch (error) {
      setOtpStatus('failed');
      setEndOtpInput('');
      console.error("End OTP verification failed:", error.message);
      // In a real app, show error to user
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
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
            <div className="gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-white" />)}</div>
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
                    <MenuAction icon={Clipboard} label="Copy booking ID" onClick={copyBookingId} />
                    <MenuAction icon={User} label="View profile" onClick={() => {
                      if (peerId) {
                        window.location.href = role === "PROVIDER" ? `/app/provider/users/${peerId}` : `/app/user/provider/${peerId}`;
                      }
                    }} />
                    <MenuAction icon={Trash2} label="Delete chat" danger onClick={deleteActiveChat} />
                  </div>
                ) : null}
              </div>
            </header>

            {/* OTP/Timer Card */}
            {otpStatus !== 'idle' && (
              <div className="absolute bottom-[60px] left-0 right-0 z-20 mx-4 mb-4">
                <div className="bg-white rounded-xl shadow-lg p-4 transform transition-all duration-300 ease-out"
                     style={{
                       transform: otpStatus === 'idle' ? 'translateY(100%)' : 'translateY(0)',
                       opacity: otpStatus === 'idle' ? 0 : 1
                     }}>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-black">Session Status</h2>
                    <p className="mt-2 text-sm text-gray-600">
                      {otpStatus === 'waitingStart' && 'Waiting for you to enter the OTP received from the provider'}
                      {otpStatus === 'running' && `Session active: ${formatTime(timer)} remaining`}
                      {otpStatus === 'waitingEnd' && 'Time expired. Waiting for you to enter the OTP received from the provider'}
                      {otpStatus === 'completed' && 'Session completed successfully'}
                      {otpStatus === 'failed' && 'Verification failed. Please try again.'}
                    </p>
                  </div>
                  {otpStatus === 'waitingStart' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={startOtpInput}
                        onChange={(e) => setStartOtpInput(e.target.value)}
                        placeholder="Enter the OTP you received from the provider"
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={handleStartOtpSubmit}
                        disabled={!startOtpInput.trim()}
                        className="w-full bg-black text-white px-3 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                      >
                        Validate OTP & Start Session
                      </button>
                    </div>
                  )}
                  {otpStatus === 'running' && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-black mb-2">{formatTime(timer)}</div>
                      <p className="text-sm text-gray-600">
                        Session is active. Timer will expire automatically.
                      </p>
                    </div>
                  )}
                  {otpStatus === 'waitingEnd' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={endOtpInput}
                        onChange={(e) => setEndOtpInput(e.target.value)}
                        placeholder="Enter the OTP you received from the provider"
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={handleEndOtpSubmit}
                        disabled={!endOtpInput.trim()}
                        className="w-full bg-black text-white px-3 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                      >
                        Validate OTP & End Session
                      </button>
                    </div>
                  )}
                  {otpStatus === 'completed' && (
                    <div className="text-center text-green-600">
                      <p className="font-medium">Session completed! Payment will be processed.</p>
                    </div>
                  )}
                  {otpStatus === 'failed' && (
                    <div className="text-center text-red-600">
                      <p className="font-medium">Verification failed. Please check the OTP and try again.</p>
                      <button
                        onClick={() => {
                          setOtpStatus('idle');
                          setStartOtpInput('');
                          setEndOtpInput('');
                        }}
                        className="mt-2 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="mx-auto grid max-w-4xl gap-3">
                {(active.messages || []).map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    mine={message.senderRole === role}
                    canDelete={isCurrentUserMessage(message)}
                    canEdit={canEditMessage(message)}
                    editing={editingMessage?.id === message.id}
                    editingText={editingText}
                    onEditingTextChange={setEditingText}
                    onEdit={() => startEditMessage(message)}
                    onCancelEdit={cancelEditMessage}
                    onSubmitEdit={submitEditMessage}
                    onDelete={() => deleteMessage(message)}
                  />
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
                  <button type="button" onClick={() => setEmojiOpen((value) => !value)} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fffaf3] text-black">😀</button>
                  <button type="button" onClick={() => setLocationOptionOpen(true)} className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fffaf3] text-black ${locationPending ? 'opacity-50 cursor-not-allowed' : ''}`}><MapPin size={20} /></button>
                  {emojiOpen ? (
                    <div className="absolute bottom-[60px] left-0 z-20 overflow-hidden rounded-2xl border border-[#eddac7] bg-white shadow-2xl">
                      <EmojiPicker
                        height={360}
                        width={320}
                        previewConfig={{ showPreview: false }}
                        onEmojiClick={(emojiData) => {
                          setText((value) => `${value}${emojiData.emoji}`.trim());
                        }}
                      />
                    </div>
                  ) : null}
                  {locationOptionOpen ? (
                    <div className="absolute bottom-[60px] left-0 z-20 w-56 rounded-2xl border border-[#eddac7] bg-white p-4 shadow-2xl">
                      <div className="mb-3">
                        <p className="text-sm font-black">Share location as:</p>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={async () => {
                            setLocationOptionOpen(false);
                            await handleCurrentLocation();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-black hover:bg-[#fffaf3]"
                        >
                          <span>Current Location</span>
                          <MapPin size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            setLocationOptionOpen(false);
                            await handleLiveLocation();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-black hover:bg-[#fffaf3]"
                        >
                          <span>Live Location (2 min)</span>
                          <MapPin size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => setLocationOptionOpen(false)}
                        className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-xs text-[#6b5d52] hover:text-black"
                      >
                        Cancel
                      </button>
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

function MessageBubble({
  message,
  mine,
  canDelete,
  canEdit,
  editing,
  editingText,
  onEditingTextChange,
  onEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
}) {
  if (message.system) {
    return (
      <div className="mx-auto max-w-[86%] rounded-2xl bg-[#ffeedd] px-4 py-3 text-center text-sm font-bold text-black/65">
        <p>{message.text}</p>
        <p className="mt-1 text-[10px] text-black/35">{formatMessageTime(message.createdAt)}</p>
      </div>
    );
  }

  const isLocation = message.type === "LOCATION" || message.type === "LIVE_LOCATION";

  return (
    <div className={`group relative max-w-[86%] rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm sm:max-w-[72%] ${mine ? "ml-auto rounded-br-md bg-black text-[#fffaf3]" : "mr-auto rounded-bl-md bg-white text-black"}`}>
      {(canEdit || canDelete) ? (
        <div className={`absolute -top-2 ${mine ? "-left-16" : "-right-16"} flex gap-1 opacity-0 transition group-hover:opacity-100`}>
          {canEdit ? (
            <button type="button" onClick={onEdit} className="grid h-7 w-7 place-items-center rounded-full bg-white text-black shadow" aria-label="Edit message">
              <Pencil size={13} />
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" onClick={onDelete} className="grid h-7 w-7 place-items-center rounded-full bg-white text-rose-600 shadow" aria-label="Delete message">
              <Trash2 size={13} />
            </button>
          ) : null}
        </div>
      ) : null}
      {editing ? (
        <div className="min-w-[240px]">
          <textarea
            value={editingText}
            onChange={(event) => onEditingTextChange(event.target.value)}
            className={`min-h-[76px] w-full resize-none rounded-xl border px-3 py-2 text-sm font-bold outline-none ${mine ? "border-white/25 bg-white/10 text-white" : "border-[#eddac7] bg-[#fffaf3] text-black"}`}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={onCancelEdit} className={`grid h-8 w-8 place-items-center rounded-lg ${mine ? "bg-white/15 text-white" : "bg-[#fffaf3] text-black"}`} aria-label="Cancel edit">
              <X size={14} />
            </button>
            <button type="button" onClick={onSubmitEdit} disabled={!editingText.trim()} className={`grid h-8 w-8 place-items-center rounded-lg disabled:opacity-40 ${mine ? "bg-white text-black" : "bg-black text-white"}`} aria-label="Save edit">
              <CheckCheck size={14} />
            </button>
          </div>
        </div>
      ) : message.type === "VOICE" ? (
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className={`grid h-9 w-9 place-items-center rounded-full ${mine ? "bg-white/15" : "bg-[#fffaf3]"}`}><Mic size={17} /></span>
            <div><p className="font-black">Voice message</p><p className={`text-xs ${mine ? "text-white/55" : "text-black/45"}`}>{formatDuration(message.durationSeconds || 1)}</p></div>
          </div>
          {message.mediaUrl ? <audio controls preload="metadata" src={message.mediaUrl} className="mt-3 h-10 w-full min-w-[220px] max-w-[320px]" /> : null}
        </div>
      ) : isLocation ? (
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${mine ? "bg-white/15" : "bg-[#fffaf3]"}`}><MapPin size={17} /></span>
            <div className="min-w-0">
              <p className="break-words">{message.text}</p>
              {message.mediaUrl ? (
                <a href={message.mediaUrl} target="_blank" rel="noreferrer" className={`mt-1 inline-block text-xs font-black underline ${mine ? "text-white" : "text-black"}`}>
                  Open map
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : <p className="break-words">{message.text}</p>}
      <p className={`mt-1 text-[10px] ${mine ? "text-white/55" : "text-black/35"}`}>{formatMessageTime(message.createdAt)}</p>
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

function mergePendingMessages(rows, pendingMap) {
  if (!pendingMap.size) return rows;
  return rows.map((chat) => {
    const pending = Array.from(pendingMap.values())
      .filter((item) => item.threadId === chat.id)
      .map((item) => item.message)
      .filter((message) => !(chat.messages || []).some((row) => row.id === message.id));
    return pending.length ? { ...chat, messages: [...(chat.messages || []), ...pending] } : chat;
  });
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
      return providerName === currentName || providerName.includes(currentName) || currentName.includes(providerName) || looseNameMatch(providerName, currentName) || chat.providerId === currentProviderId || chat.providerUserId === currentUserId;
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

function formatMessageTime(value) {
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
