const prisma = require("../config/prisma");

function imageFromProvider(provider) {
  const images = Array.isArray(provider?.profileImages) ? provider.profileImages : [];
  const first = images[0];
  if (typeof first === "string") return first;
  return first?.thumbnailUrl || first?.url || provider?.user?.profileImage || "";
}

function canAccessThread(thread, userId) {
  return thread?.userId === userId || thread?.providerUserId === userId;
}

function serializeThread(thread, viewerId) {
  const booking = thread.booking || {};
  const provider = booking.provider || {};
  const user = booking.user || {};
  return {
    id: thread.id,
    bookingId: thread.bookingId,
    bookingCode: booking.code,
    userId: thread.userId,
    userName: user.fullName || "BuddyBOOK user",
    userImage: user.profileImage || "",
    providerId: thread.providerId,
    providerUserId: thread.providerUserId,
    providerName: provider.user?.fullName || "BuddyBOOK provider",
    providerImage: imageFromProvider(provider),
    service: booking.service,
    status: booking.status,
    closed: thread.closed || booking.status === "CANCELLED",
    closedReason: thread.closedReason || booking.cancelReason,
    unreadCount: (thread.messages || []).filter((message) => !message.readAt && message.senderId !== viewerId && !message.system).length,
    messages: (thread.messages || []).map(serializeMessage),
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
}

function serializeMessage(message) {
  return {
    id: message.id,
    threadId: message.threadId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    type: message.type,
    text: message.text,
    mediaUrl: message.mediaUrl,
    durationSeconds: message.durationSeconds,
    system: message.system,
    readAt: message.readAt,
    createdAt: message.createdAt,
  };
}

function canModifyMessage(message, userId) {
  return !message.system && message.senderId === userId;
}

function isWithinEditWindow(message) {
  const sentAt = new Date(message.createdAt).getTime();
  return Number.isFinite(sentAt) && Date.now() - sentAt <= 2 * 60 * 1000;
}

exports.listMyChats = async (req, res) => {
  try {
    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [{ userId: req.user.id }, { providerUserId: req.user.id }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        booking: {
          include: {
            user: true,
            provider: { include: { user: true } },
          },
        },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    return res.json({
      success: true,
      data: threads.map((thread) => serializeThread(thread, req.user.id)),
    });
  } catch (error) {
    console.error("LIST_CHATS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load chats." });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text, type = "TEXT", mediaUrl, durationSeconds } = req.body;
    const cleanText = String(text || "").trim();
    const cleanType = String(type || "TEXT").toUpperCase();

    if (!cleanText && !mediaUrl) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const thread = await prisma.chatThread.findUnique({
      where: { id: req.params.threadId },
    });

    if (!canAccessThread(thread, req.user.id)) {
      return res.status(404).json({ success: false, message: "Chat not found." });
    }

    if (thread.closed) {
      return res.status(400).json({ success: false, message: "This chat is closed." });
    }

    const senderRole = req.user.id === thread.providerUserId ? "PROVIDER" : "USER";
    const message = await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        senderId: req.user.id,
        senderRole,
        type: cleanType,
        text: cleanText || (cleanType === "VOICE" ? "Voice message" : ""),
        mediaUrl: mediaUrl || null,
        durationSeconds: durationSeconds ? Number(durationSeconds) : null,
      },
    });

    await prisma.chatThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    return res.status(201).json({ success: true, data: serializeMessage(message) });
  } catch (error) {
    console.error("SEND_MESSAGE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not send message." });
  }
};

exports.markRead = async (req, res) => {
  try {
    const thread = await prisma.chatThread.findUnique({ where: { id: req.params.threadId } });
    if (!canAccessThread(thread, req.user.id)) {
      return res.status(404).json({ success: false, message: "Chat not found." });
    }

    await prisma.chatMessage.updateMany({
      where: {
        threadId: thread.id,
        senderId: { not: req.user.id },
        system: false,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("MARK_CHAT_READ_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not mark messages read." });
  }
};

exports.deleteThread = async (req, res) => {
  try {
    const thread = await prisma.chatThread.findUnique({ where: { id: req.params.threadId } });
    if (!canAccessThread(thread, req.user.id)) {
      return res.status(404).json({ success: false, message: "Chat not found." });
    }

    await prisma.chatThread.delete({ where: { id: thread.id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE_CHAT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not delete chat." });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await prisma.chatMessage.findUnique({
      where: { id: req.params.messageId },
      include: { thread: true },
    });

    if (!message || !canAccessThread(message.thread, req.user.id)) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    if (!canModifyMessage(message, req.user.id)) {
      return res.status(403).json({ success: false, message: "You can delete only your own messages." });
    }

    await prisma.chatMessage.delete({ where: { id: message.id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE_MESSAGE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not delete message." });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const cleanText = String(req.body.text || "").trim();
    if (!cleanText) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: req.params.messageId },
      include: { thread: true },
    });

    if (!message || message.threadId !== req.params.threadId || !canAccessThread(message.thread, req.user.id)) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    if (!canModifyMessage(message, req.user.id)) {
      return res.status(403).json({ success: false, message: "You can edit only your own messages." });
    }

    if (message.type !== "TEXT") {
      return res.status(400).json({ success: false, message: "Only text messages can be edited." });
    }

    if (!isWithinEditWindow(message)) {
      return res.status(400).json({ success: false, message: "Messages can be edited only within 2 minutes." });
    }

    const updated = await prisma.chatMessage.update({
      where: { id: message.id },
      data: { text: cleanText },
    });

    await prisma.chatThread.update({
      where: { id: message.threadId },
      data: { updatedAt: new Date() },
    });

    return res.json({ success: true, data: serializeMessage(updated) });
  } catch (error) {
    console.error("EDIT_MESSAGE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not edit message." });
  }
};
