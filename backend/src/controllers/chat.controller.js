const crypto = require("crypto");
const prisma = require("../config/prisma");
const realtime = require("../utils/realtime");
const { uploadChatVoice, deleteImageKitFile } = require("../utils/imagekit");
const { isAccountDisabled } = require("../utils/accountLifecycle");

const TEXT_LIMIT = 2000;
const MESSAGE_PAGE_SIZE = 50;
const MESSAGE_PAGE_MAX = 100;
const VOICE_DURATION_MAX = 120;
const SENDABLE_TYPES = new Set(["TEXT", "LOCATION", "LIVE_LOCATION"]);
const CHAT_PAYMENT_STATUSES = ["PAID", "PARTIALLY_REFUNDED"];

function imageFromProvider(provider) {
  const images = Array.isArray(provider?.profileImages) ? provider.profileImages : [];
  const first = images[0];
  if (typeof first === "string") return first;
  return first?.thumbnailUrl || first?.url || provider?.user?.profileImage || "";
}

function canAccessThread(thread, userId) {
  return thread?.userId === userId || thread?.providerUserId === userId;
}

function isProviderParticipant(thread, userId) {
  return thread?.providerUserId === userId;
}

function conversationWhere(thread) {
  return { userId: thread.userId, providerId: thread.providerId };
}

function clearedAtForViewer(thread, viewerId) {
  return isProviderParticipant(thread, viewerId) ? thread.clearedForProviderAt : thread.clearedForUserAt;
}

function serializeMessage(message) {
  const deleted = Boolean(message.deletedAt);
  return {
    id: message.id,
    threadId: message.threadId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    clientMessageId: message.clientMessageId,
    replyToId: message.replyToId,
    reactions: message.reactions || {},
    pinnedAt: message.pinnedAt,
    pinnedBy: message.pinnedBy,
    type: deleted ? "DELETED" : message.type,
    text: deleted ? "This message was deleted." : message.text,
    mediaUrl: deleted ? null : message.mediaUrl,
    durationSeconds: deleted ? null : message.durationSeconds,
    system: message.system,
    readAt: message.readAt,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
    createdAt: message.createdAt,
  };
}

function serializeBooking(booking) {
  return {
    id: booking.id,
    code: booking.code,
    service: booking.service,
    date: booking.date,
    time: booking.time,
    durationHours: booking.durationHours,
    status: booking.status,
  };
}

function groupConversationThreads(threads, viewerId) {
  const groups = new Map();
  for (const thread of threads) {
    const key = `${thread.userId}:${thread.providerId}`;
    const rows = groups.get(key) || [];
    rows.push(thread);
    groups.set(key, rows);
  }

  return Array.from(groups.values())
    .map((rows) => {
      rows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const active = rows.find(
        (row) => !row.closed && String(row.booking?.status || "").toUpperCase() !== "CANCELLED"
      ) || rows[0];
      const booking = active.booking || {};
      const provider = booking.provider || {};
      const user = booking.user || {};
      const userUnavailable = user.isBlocked || isAccountDisabled(user);
      const providerUnavailable = provider.user?.isBlocked || isAccountDisabled(provider.user);
      const allMessages = rows
        .flatMap((row) => {
          const clearedAt = clearedAtForViewer(row, viewerId);
          return (row.messages || [])
            .filter((message) => !clearedAt || new Date(message.createdAt) > new Date(clearedAt))
            .map(serializeMessage);
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const messages = allMessages.slice(-MESSAGE_PAGE_SIZE);
      const hasMore = rows.some((row) => {
        if ((row.messages || []).length < MESSAGE_PAGE_SIZE) return false;
        const clearedAt = clearedAtForViewer(row, viewerId);
        const oldestLoaded = row.messages?.[0]?.createdAt;
        return !clearedAt || (oldestLoaded && new Date(oldestLoaded) > new Date(clearedAt));
      });

      return {
        id: active.id,
        threadIds: rows.map((row) => row.id),
        bookingId: active.bookingId,
        bookingCode: booking.code,
        userId: active.userId,
        userName: userUnavailable ? "Account unavailable" : user.fullName || "BuddyBOOK user",
        userImage: userUnavailable ? "" : user.profileImage || "",
        providerId: active.providerId,
        providerUserId: active.providerUserId,
        providerName: providerUnavailable ? "Account unavailable" : provider.user?.fullName || "BuddyBOOK provider",
        providerImage: providerUnavailable ? "" : imageFromProvider(provider),
        peerUnavailable: viewerId === active.userId ? providerUnavailable : userUnavailable,
        service: booking.service,
        status: booking.status,
        closed: active.closed || String(booking.status || "").toUpperCase() === "CANCELLED",
        closedReason: active.closedReason || booking.cancelReason,
        peerOnline: realtime.online(viewerId === active.userId ? active.providerUserId : active.userId),
        unreadCount: allMessages.filter(
          (message) => !message.readAt && message.senderId !== viewerId && !message.system && !message.deletedAt
        ).length,
        messages,
        hasMore,
        bookingHistory: rows.map((row) => serializeBooking(row.booking)),
        createdAt: rows[rows.length - 1]?.createdAt || active.createdAt,
        updatedAt: rows[0]?.updatedAt || active.updatedAt,
      };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function getAccessibleThread(threadId, userId) {
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: {
      booking: {
        select: {
          paymentStatus: true,
          user: { select: { id: true, isBlocked: true, disabledAt: true, disabledUntil: true } },
          provider: {
            select: {
              user: { select: { id: true, isBlocked: true, disabledAt: true, disabledUntil: true } },
            },
          },
        },
      },
    },
  });
  return canAccessThread(thread, userId) && CHAT_PAYMENT_STATUSES.includes(thread.booking?.paymentStatus) ? thread : null;
}

async function isPeerUnavailable(thread, userId) {
  const peerId = peerIdFor(thread, userId);
  const includedPeer = userId === thread.userId ? thread.booking?.provider?.user : thread.booking?.user;
  const peer = includedPeer || await prisma.user.findUnique({
    where: { id: peerId },
    select: { isBlocked: true, disabledAt: true, disabledUntil: true },
  });
  return !peer || peer.isBlocked || isAccountDisabled(peer);
}

async function getConversationThreads(thread, select = { id: true }) {
  return prisma.chatThread.findMany({
    where: { ...conversationWhere(thread), booking: { paymentStatus: { in: CHAT_PAYMENT_STATUSES } } },
    select,
    orderBy: { updatedAt: "desc" },
  });
}

function peerIdFor(thread, userId) {
  return userId === thread.userId ? thread.providerUserId : thread.userId;
}

function publishToParticipants(thread, event, data) {
  realtime.publish(thread.userId, event, data);
  realtime.publish(thread.providerUserId, event, data);
}

function parseCoordinates(body) {
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function locationContent(coordinates, live) {
  const latitude = coordinates.latitude.toFixed(6);
  const longitude = coordinates.longitude.toFixed(6);
  return {
    text: `${live ? "Live location" : "Shared location"}: ${latitude}, ${longitude}`,
    mediaUrl: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`,
  };
}

async function unhideConversation(thread) {
  await prisma.chatThread.updateMany({
    where: conversationWhere(thread),
    data: { hiddenForUser: false, hiddenForProvider: false },
  });
}

async function createMessage(thread, sender, payload) {
  const senderRole = isProviderParticipant(thread, sender.id) ? "PROVIDER" : "USER";
  let message;
  try {
    message = await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        senderId: sender.id,
        senderRole,
        clientMessageId: payload.clientMessageId || null,
        replyToId: payload.replyToId || null,
        type: payload.type,
        text: payload.text || null,
        mediaUrl: payload.mediaUrl || null,
        mediaFileId: payload.mediaFileId || null,
        durationSeconds: payload.durationSeconds || null,
      },
    });
  } catch (error) {
    if (payload.clientMessageId && error.code === "P2002") {
      message = await prisma.chatMessage.findUnique({ where: { clientMessageId: payload.clientMessageId } });
      if (!message || message.senderId !== sender.id || message.threadId !== thread.id) throw error;
      return serializeMessage(message);
    }
    throw error;
  }
  const serialized = serializeMessage(message);
  publishToParticipants(thread, "chat", { threadId: thread.id, message: serialized });

  Promise.all([
    prisma.chatThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } }),
    unhideConversation(thread),
  ]).catch((error) => console.error("CHAT_METADATA_UPDATE_ERROR:", error));

  const recipient = peerIdFor(thread, sender.id);
  prisma.$executeRawUnsafe(
    'INSERT INTO "Notification" ("id","userId","type","title","message","link","createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())',
    crypto.randomUUID(),
    recipient,
    "CHAT",
    `New message from ${sender.fullName}`,
    payload.type === "TEXT" ? payload.text.slice(0, 160) : payload.type === "VOICE" ? "Voice message" : "Location shared",
    senderRole === "PROVIDER" ? "/app/user/chat" : "/app/provider/chat"
  ).catch(() => {});

  return serialized;
}

exports.listMyChats = async (req, res) => {
  try {
    const loadThreads = () => prisma.chatThread.findMany({
      where: {
        booking: { paymentStatus: { in: CHAT_PAYMENT_STATUSES } },
        OR: [{ userId: req.user.id, hiddenForUser: false }, { providerUserId: req.user.id, hiddenForProvider: false }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        booking: {
          include: {
            user: { select: { id: true, fullName: true, profileImage: true, isBlocked: true, disabledUntil: true } },
            provider: { include: { user: { select: { id: true, fullName: true, profileImage: true, isBlocked: true, disabledUntil: true } } } },
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: MESSAGE_PAGE_SIZE },
        _count: { select: { messages: true } },
      },
    });
    let threads = await loadThreads();
    // Older bookings may predate automatic thread creation. Repair only when
    // the user has no threads so the normal chat path stays one fast query.
    if (!threads.length) {
      const missingThreads = await prisma.booking.findMany({
        where: { paymentStatus: { in: CHAT_PAYMENT_STATUSES }, OR: [{ userId: req.user.id }, { providerUserId: req.user.id }], chatThread: null },
        select: { id: true, userId: true, providerId: true, providerUserId: true },
      });
      if (missingThreads.length) {
        await prisma.chatThread.createMany({
          data: missingThreads.map((booking) => ({ bookingId: booking.id, userId: booking.userId, providerId: booking.providerId, providerUserId: booking.providerUserId })),
          skipDuplicates: true,
        });
        threads = await loadThreads();
      }
    }
    for (const thread of threads) thread.messages.reverse();
    return res.json({ success: true, data: groupConversationThreads(threads, req.user.id) });
  } catch (error) {
    console.error("LIST_CHATS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load chats." });
  }
};

exports.listMessages = async (req, res) => {
  try {
    const thread = await getAccessibleThread(req.params.threadId, req.user.id);
    if (!thread) return res.status(404).json({ success: false, message: "Chat not found." });
    const threadRows = await getConversationThreads(thread, {
      id: true,
      providerUserId: true,
      clearedForUserAt: true,
      clearedForProviderAt: true,
    });
    const limit = Math.min(MESSAGE_PAGE_MAX, Math.max(1, Number(req.query.limit) || MESSAGE_PAGE_SIZE));
    const before = req.query.before ? new Date(req.query.before) : null;
    const validBefore = before && !Number.isNaN(before.getTime()) ? before : null;
    const rows = await prisma.chatMessage.findMany({
      where: {
        OR: threadRows.map((row) => {
          const clearedAt = clearedAtForViewer(row, req.user.id);
          return {
            threadId: row.id,
            ...(clearedAt || validBefore ? {
              createdAt: {
                ...(clearedAt ? { gt: clearedAt } : {}),
                ...(validBefore ? { lt: validBefore } : {}),
              },
            } : {}),
          };
        }),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit).reverse().map(serializeMessage);
    return res.json({ success: true, data, hasMore });
  } catch (error) {
    console.error("LIST_CHAT_MESSAGES_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load older messages." });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const thread = req.chatThread || await getAccessibleThread(req.params.threadId, req.user.id);
    if (!thread) return res.status(404).json({ success: false, message: "Chat not found." });
    if (thread.closed) return res.status(400).json({ success: false, message: "This booking chat is closed." });
    if (await isPeerUnavailable(thread, req.user.id)) return res.status(409).json({ success: false, message: "This account is currently unavailable." });

    const type = String(req.body?.type || "TEXT").toUpperCase();
    if (!SENDABLE_TYPES.has(type)) {
      return res.status(400).json({ success: false, message: "Unsupported message type." });
    }

    let payload;
    if (type === "TEXT") {
      const text = String(req.body?.text || "").trim();
      if (!text) return res.status(400).json({ success: false, message: "Message cannot be empty." });
      if (text.length > TEXT_LIMIT) return res.status(400).json({ success: false, message: `Messages are limited to ${TEXT_LIMIT} characters.` });
      const replyToId = String(req.body?.replyToId || "").trim() || null;
      if (replyToId) {
        const replied = await prisma.chatMessage.findFirst({
          where: {
            id: replyToId,
            deletedAt: null,
            thread: {
              ...conversationWhere(thread),
              booking: { paymentStatus: { in: CHAT_PAYMENT_STATUSES } },
            },
          },
          select: { id: true },
        });
        if (!replied) return res.status(400).json({ success: false, message: "The replied message is no longer available." });
      }
      payload = { type, text, replyToId, clientMessageId: String(req.body?.clientMessageId || "").trim() || null };
    } else {
      const coordinates = parseCoordinates(req.body);
      if (!coordinates) return res.status(400).json({ success: false, message: "Valid location coordinates are required." });
      payload = { type, clientMessageId: String(req.body?.clientMessageId || "").trim() || null, ...locationContent(coordinates, type === "LIVE_LOCATION") };
    }

    const message = await createMessage(thread, req.user, payload);
    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("SEND_MESSAGE_ERROR:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Could not send message." });
  }
};

exports.sendVoiceMessage = async (req, res) => {
  let uploaded = null;
  try {
    const thread = await getAccessibleThread(req.params.threadId, req.user.id);
    if (!thread) return res.status(404).json({ success: false, message: "Chat not found." });
    if (thread.closed) return res.status(400).json({ success: false, message: "This booking chat is closed." });
    if (await isPeerUnavailable(thread, req.user.id)) return res.status(409).json({ success: false, message: "This account is currently unavailable." });
    const durationSeconds = Math.round(Number(req.body?.durationSeconds));
    if (!Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > VOICE_DURATION_MAX) {
      return res.status(400).json({ success: false, message: `Voice recordings must be between 1 and ${VOICE_DURATION_MAX} seconds.` });
    }
    uploaded = await uploadChatVoice(req.file, thread.id);
    const message = await createMessage(thread, req.user, {
      type: "VOICE",
      text: "Voice message",
      mediaUrl: uploaded.url,
      mediaFileId: uploaded.fileId,
      durationSeconds,
    });
    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    if (uploaded?.fileId) await deleteImageKitFile(uploaded.fileId).catch(() => {});
    console.error("SEND_VOICE_MESSAGE_ERROR:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Could not send voice message." });
  }
};

exports.updateLiveLocation = async (req, res) => {
  try {
    const message = await prisma.chatMessage.findUnique({ where: { id: req.params.messageId }, include: { thread: true } });
    if (!message || message.threadId !== req.params.threadId || !canAccessThread(message.thread, req.user.id)) {
      return res.status(404).json({ success: false, message: "Live location message not found." });
    }
    if (message.senderId !== req.user.id || message.type !== "LIVE_LOCATION" || message.deletedAt) {
      return res.status(403).json({ success: false, message: "You cannot update this live location." });
    }
    const coordinates = parseCoordinates(req.body);
    if (!coordinates) return res.status(400).json({ success: false, message: "Valid location coordinates are required." });
    const content = locationContent(coordinates, true);
    const updated = await prisma.chatMessage.update({
      where: { id: message.id },
      data: { ...content, editedAt: new Date() },
    });
    await prisma.chatThread.update({ where: { id: message.threadId }, data: { updatedAt: new Date() } });
    const serialized = serializeMessage(updated);
    publishToParticipants(message.thread, "location", { threadId: message.threadId, message: serialized });
    return res.json({ success: true, data: serialized });
  } catch (error) {
    console.error("UPDATE_LIVE_LOCATION_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not update live location." });
  }
};

exports.markRead = async (req, res) => {
  try {
    const thread = await getAccessibleThread(req.params.threadId, req.user.id);
    if (!thread) return res.status(404).json({ success: false, message: "Chat not found." });
    const rows = await getConversationThreads(thread);
    const readAt = new Date();
    await prisma.chatMessage.updateMany({
      where: {
        threadId: { in: rows.map((row) => row.id) },
        senderId: { not: req.user.id },
        system: false,
        deletedAt: null,
        readAt: null,
      },
      data: { readAt },
    });
    publishToParticipants(thread, "read", {
      threadIds: rows.map((row) => row.id),
      readBy: req.user.id,
      readAt,
    });
    return res.json({ success: true, readAt });
  } catch (error) {
    console.error("MARK_CHAT_READ_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not mark messages read." });
  }
};

exports.streamEvents = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write(`event: connected\ndata: ${JSON.stringify({ userId: req.user.id })}\n\n`);
  const unsubscribe = realtime.subscribe(req.user.id, res);
  const peerRows = await prisma.chatThread.findMany({
    where: { booking: { paymentStatus: { in: CHAT_PAYMENT_STATUSES } }, OR: [{ userId: req.user.id }, { providerUserId: req.user.id }] },
    select: { userId: true, providerUserId: true },
  }).catch(() => []);
  const peers = new Set(peerRows.map((row) => peerIdFor(row, req.user.id)));
  peers.forEach((peerId) => realtime.publish(peerId, "presence", { userId: req.user.id, active: true }));
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 20000);
  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    if (!realtime.online(req.user.id)) {
      peers.forEach((peerId) => realtime.publish(peerId, "presence", { userId: req.user.id, active: false }));
    }
  });
};

exports.signalThread = async (req, res) => {
  try {
    const thread = await getAccessibleThread(req.params.threadId, req.user.id);
    if (!thread) return res.status(404).json({ success: false, message: "Chat not found." });
    const type = String(req.body?.type || "typing");
    if (!new Set(["typing", "presence"]).has(type)) {
      return res.status(400).json({ success: false, message: "Unsupported chat signal." });
    }
    const peer = peerIdFor(thread, req.user.id);
    realtime.publish(peer, type, { threadId: thread.id, userId: req.user.id, active: req.body?.active !== false });
    return res.json({ success: true, peerOnline: realtime.online(peer) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not update chat presence." });
  }
};

exports.hideConversation = async (req, res) => {
  try {
    const thread = await getAccessibleThread(req.params.threadId, req.user.id);
    if (!thread) return res.status(404).json({ success: false, message: "Chat not found." });
    await prisma.chatThread.updateMany({
      where: conversationWhere(thread),
      data: isProviderParticipant(thread, req.user.id) ? { hiddenForProvider: true } : { hiddenForUser: true },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("HIDE_CHAT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not hide conversation." });
  }
};

exports.clearConversationMessages = async (req, res) => {
  try {
    const thread = await getAccessibleThread(req.params.threadId, req.user.id);
    if (!thread) return res.status(404).json({ success: false, message: "Chat not found." });
    const rows = await getConversationThreads(thread);
    const threadIds = rows.map((row) => row.id);
    const clearedAt = new Date();
    await prisma.chatThread.updateMany({
      where: { id: { in: threadIds } },
      data: isProviderParticipant(thread, req.user.id)
        ? { clearedForProviderAt: clearedAt, hiddenForProvider: false }
        : { clearedForUserAt: clearedAt, hiddenForUser: false },
    });
    realtime.publish(req.user.id, "cleared", { threadIds, clearedAt, clearedBy: req.user.id });
    return res.json({ success: true, data: { threadIds, clearedAt } });
  } catch (error) {
    console.error("CLEAR_CHAT_MESSAGES_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not delete conversation messages." });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await prisma.chatMessage.findUnique({ where: { id: req.params.messageId }, include: { thread: true } });
    if (!message || message.threadId !== req.params.threadId || !canAccessThread(message.thread, req.user.id)) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }
    if (message.system || message.senderId !== req.user.id) {
      return res.status(403).json({ success: false, message: "You can delete only your own messages." });
    }
    if (message.deletedAt) return res.json({ success: true, data: serializeMessage(message) });
    const mediaFileId = message.mediaFileId;
    const updated = await prisma.chatMessage.update({
      where: { id: message.id },
      data: {
        text: null,
        mediaUrl: null,
        mediaFileId: null,
        durationSeconds: null,
        deletedAt: new Date(),
      },
    });
    if (mediaFileId) await deleteImageKitFile(mediaFileId).catch(() => {});
    const serialized = serializeMessage(updated);
    publishToParticipants(message.thread, "delete", { threadId: message.threadId, message: serialized });
    return res.json({ success: true, data: serialized });
  } catch (error) {
    console.error("DELETE_MESSAGE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not delete message." });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ success: false, message: "Message cannot be empty." });
    if (text.length > TEXT_LIMIT) return res.status(400).json({ success: false, message: `Messages are limited to ${TEXT_LIMIT} characters.` });
    const message = await prisma.chatMessage.findUnique({ where: { id: req.params.messageId }, include: { thread: true } });
    if (!message || message.threadId !== req.params.threadId || !canAccessThread(message.thread, req.user.id)) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }
    if (message.system || message.senderId !== req.user.id) {
      return res.status(403).json({ success: false, message: "You can edit only your own messages." });
    }
    if (message.type !== "TEXT" || message.deletedAt) {
      return res.status(400).json({ success: false, message: "Only active text messages can be edited." });
    }
    if (Date.now() - new Date(message.createdAt).getTime() > 2 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "Messages can be edited only within 2 minutes." });
    }
    const updated = await prisma.chatMessage.update({ where: { id: message.id }, data: { text, editedAt: new Date() } });
    await prisma.chatThread.update({ where: { id: message.threadId }, data: { updatedAt: new Date() } });
    const serialized = serializeMessage(updated);
    publishToParticipants(message.thread, "edit", { threadId: message.threadId, message: serialized });
    return res.json({ success: true, data: serialized });
  } catch (error) {
    console.error("EDIT_MESSAGE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not edit message." });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const allowed = new Set(["👍", "❤️", "😂", "😮", "😢", "🙏"]);
    const emoji = String(req.body?.emoji || "");
    if (!allowed.has(emoji)) return res.status(400).json({ success: false, message: "Unsupported reaction." });
    const message = await prisma.chatMessage.findUnique({ where: { id: req.params.messageId }, include: { thread: true } });
    if (!message || message.threadId !== req.params.threadId || !canAccessThread(message.thread, req.user.id)) return res.status(404).json({ success: false, message: "Message not found." });
    if (message.system || message.deletedAt) return res.status(400).json({ success: false, message: "This message cannot be reacted to." });
    const reactions = message.reactions && typeof message.reactions === "object" ? { ...message.reactions } : {};
    const alreadySelected = Array.isArray(reactions[emoji]) && reactions[emoji].includes(req.user.id);
    Object.keys(reactions).forEach((key) => {
      reactions[key] = Array.isArray(reactions[key]) ? reactions[key].filter((id) => id !== req.user.id) : [];
      if (!reactions[key].length) delete reactions[key];
    });
    if (!alreadySelected) reactions[emoji] = [...(reactions[emoji] || []), req.user.id];
    const updated = await prisma.chatMessage.update({ where: { id: message.id }, data: { reactions } });
    const serialized = serializeMessage(updated);
    publishToParticipants(message.thread, "reaction", { threadId: message.threadId, message: serialized });
    return res.json({ success: true, data: serialized });
  } catch (error) {
    console.error("REACT_CHAT_MESSAGE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not update reaction." });
  }
};

exports.togglePinMessage = async (req, res) => {
  try {
    const message = await prisma.chatMessage.findUnique({ where: { id: req.params.messageId }, include: { thread: true } });
    if (!message || message.threadId !== req.params.threadId || !canAccessThread(message.thread, req.user.id)) return res.status(404).json({ success: false, message: "Message not found." });
    if (message.system || message.deletedAt) return res.status(400).json({ success: false, message: "This message cannot be pinned." });
    const updated = await prisma.chatMessage.update({ where: { id: message.id }, data: message.pinnedAt ? { pinnedAt: null, pinnedBy: null } : { pinnedAt: new Date(), pinnedBy: req.user.id } });
    const serialized = serializeMessage(updated);
    publishToParticipants(message.thread, "pin", { threadId: message.threadId, message: serialized });
    return res.json({ success: true, data: serialized });
  } catch (error) {
    console.error("PIN_CHAT_MESSAGE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not update pinned message." });
  }
};

exports.__socket = { getAccessibleThread, peerIdFor };
