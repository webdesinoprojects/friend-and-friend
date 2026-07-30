const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const chatController = require("../controllers/chat.controller");
const realtime = require("./realtime");
const { isAccountDisabled } = require("./accountLifecycle");

function controllerRequest(handler, socket, { params = {}, body = {}, query = {}, chatThread = null } = {}) {
  return new Promise((resolve) => {
    let statusCode = 200;
    const req = { user: socket.user, params, body, query, chatThread };
    const res = {
      status(code) { statusCode = code; return this; },
      json(payload) { resolve({ ok: statusCode < 400, status: statusCode, ...payload }); return this; },
    };
    Promise.resolve(handler(req, res)).catch((error) => resolve({ ok: false, status: 500, message: error.message || "Chat action failed." }));
  });
}

function ackResult(ack, result) {
  if (typeof ack !== "function") return;
  if (!result.ok || result.success === false) ack({ ok: false, status: result.status, message: result.message || "Chat action failed." });
  else ack({ ok: true, data: result.data ?? result.readAt ?? result });
}

async function authorizedController(controller, handler, socket, request, { allowClosed = true } = {}) {
  const threadId = String(request.params?.threadId || "");
  const thread = await controller.__socket.getAccessibleThread(threadId, socket.user.id);
  if (!thread) return { ok: false, status: 403, message: "This paid booking chat is not available." };
  if (!allowClosed && thread.closed) return { ok: false, status: 409, message: "This booking chat is permanently closed." };
  return controllerRequest(handler, socket, { ...request, chatThread: thread });
}

function initializeChatSocket(httpServer, allowedOrigins, dependencies = {}) {
  const db = dependencies.prisma || prisma;
  const controller = dependencies.chatController || chatController;
  const live = dependencies.realtime || realtime;
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
    transports: ["websocket", "polling"],
    pingInterval: 20000,
    pingTimeout: 15000,
  });
  live.setSocketServer(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || String(socket.handshake.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return next(new Error("Authentication required."));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, fullName: true, role: true, kycStatus: true, isBlocked: true, disabledAt: true, disabledUntil: true },
      });
      if (!user || user.isBlocked || user.kycStatus !== "VERIFIED" || isAccountDisabled(user)) return next(new Error("Account is not available for chat."));
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid or expired session."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.emit("chat:ready", { userId: socket.user.id });

    socket.on("chat:join", async ({ threadId } = {}, ack) => {
      const thread = await controller.__socket.getAccessibleThread(String(threadId || ""), socket.user.id);
      if (!thread) return ack?.({ ok: false, message: "This paid booking chat is not available." });
      socket.join(`chat:${thread.id}`);
      const peerId = controller.__socket.peerIdFor(thread, socket.user.id);
      live.publish(peerId, "presence", { threadId: thread.id, userId: socket.user.id, active: true });
      ack?.({ ok: true, data: { threadId: thread.id, peerOnline: live.online(peerId) } });
    });

    socket.on("chat:leave", async ({ threadId } = {}, ack) => {
      socket.leave(`chat:${threadId}`);
      const thread = await controller.__socket.getAccessibleThread(String(threadId || ""), socket.user.id);
      if (thread) live.publish(controller.__socket.peerIdFor(thread, socket.user.id), "presence", { threadId: thread.id, userId: socket.user.id, active: false });
      ack?.({ ok: true });
    });

    socket.on("chat:send", async (payload = {}, ack) => {
      const result = await authorizedController(controller, controller.sendMessage, socket, {
        params: { threadId: String(payload.threadId || "") },
        body: { ...payload, clientMessageId: String(payload.clientMessageId || "") },
      }, { allowClosed: false });
      ackResult(ack, result);
    });
    socket.on("chat:edit", async (payload = {}, ack) => ackResult(ack, await authorizedController(controller, controller.editMessage, socket, { params: { threadId: String(payload.threadId || ""), messageId: String(payload.messageId || "") }, body: { text: payload.text } }, { allowClosed: false })));
    socket.on("chat:delete", async (payload = {}, ack) => ackResult(ack, await authorizedController(controller, controller.deleteMessage, socket, { params: { threadId: String(payload.threadId || ""), messageId: String(payload.messageId || "") } }, { allowClosed: false })));
    socket.on("chat:read", async (payload = {}, ack) => ackResult(ack, await authorizedController(controller, controller.markRead, socket, { params: { threadId: String(payload.threadId || "") } })));
    socket.on("chat:typing", async (payload = {}, ack) => ackResult(ack, await authorizedController(controller, controller.signalThread, socket, { params: { threadId: String(payload.threadId || "") }, body: { type: "typing", active: payload.active !== false } }, { allowClosed: false })));
    socket.on("chat:presence", async (payload = {}, ack) => ackResult(ack, await authorizedController(controller, controller.signalThread, socket, { params: { threadId: String(payload.threadId || "") }, body: { type: "presence", active: payload.active !== false } })));
    socket.on("chat:location-update", async (payload = {}, ack) => ackResult(ack, await authorizedController(controller, controller.updateLiveLocation, socket, { params: { threadId: String(payload.threadId || ""), messageId: String(payload.messageId || "") }, body: payload }, { allowClosed: false })));
    socket.on("chat:react", async (payload = {}, ack) => ackResult(ack, await authorizedController(controller, controller.reactToMessage, socket, { params: { threadId: String(payload.threadId || ""), messageId: String(payload.messageId || "") }, body: { emoji: payload.emoji } }, { allowClosed: false })));
    socket.on("chat:pin", async (payload = {}, ack) => ackResult(ack, await authorizedController(controller, controller.togglePinMessage, socket, { params: { threadId: String(payload.threadId || ""), messageId: String(payload.messageId || "") } }, { allowClosed: false })));

    socket.on("disconnect", () => {
      setTimeout(() => {
        if (live.online(socket.user.id)) return;
        db.chatThread.findMany({
          where: { OR: [{ userId: socket.user.id }, { providerUserId: socket.user.id }], booking: { paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] } } },
          select: { id: true, userId: true, providerUserId: true },
        }).then((threads) => threads.forEach((thread) => live.publish(controller.__socket.peerIdFor(thread, socket.user.id), "presence", { threadId: thread.id, userId: socket.user.id, active: false }))).catch(() => {});
      }, 250);
    });
  });
  return io;
}

module.exports = initializeChatSocket;
