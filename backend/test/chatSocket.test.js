const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const jwt = require("jsonwebtoken");
const { io: createClient } = require("../../node_modules/socket.io-client");
const initializeChatSocket = require("../src/utils/chatSocket");

function response(handler) {
  return async (req, res) => handler(req, res);
}

function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(1500).emit(event, payload, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

function connect(url, token) {
  return new Promise((resolve, reject) => {
    const socket = createClient(url, {
      extraHeaders: token ? { Cookie: `buddybook_session=${encodeURIComponent(token)}` } : {},
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
    });
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
  });
}

test("Socket.IO chat authenticates, authorizes, deduplicates, and delivers immediately", async (context) => {
  process.env.JWT_SECRET = "socket-test-secret";
  const users = new Map(["u1", "u2", "u3"].map((id) => [id, { id, fullName: id, role: id === "u2" ? "PROVIDER" : "USER", kycStatus: "VERIFIED", isBlocked: false, disabledAt: null, disabledUntil: null }]));
  const threads = {
    paid: { id: "paid", userId: "u1", providerUserId: "u2", closed: false },
    cancelled: { id: "cancelled", userId: "u1", providerUserId: "u2", closed: true },
  };
  const messages = new Map();
  let socketIo;
  const eventNames = { chat: "chat:message", typing: "chat:typing", presence: "chat:presence" };
  const live = {
    setSocketServer(io) { socketIo = io; },
    publish(userId, event, data) { socketIo.to(`user:${userId}`).emit(eventNames[event] || event, data); },
    online(userId) { return Boolean(socketIo?.sockets.adapter.rooms.get(`user:${userId}`)?.size); },
  };
  const accessible = async (threadId, userId) => {
    const thread = threads[threadId];
    return thread && [thread.userId, thread.providerUserId].includes(userId) ? thread : null;
  };
  const success = response((_req, res) => res.json({ success: true, data: {} }));
  const controller = {
    __socket: {
      getAccessibleThread: accessible,
      peerIdFor(thread, userId) { return thread.userId === userId ? thread.providerUserId : thread.userId; },
    },
    sendMessage: response((req, res) => {
      const key = req.body.clientMessageId;
      let message = messages.get(key);
      if (!message) {
        message = { id: `message-${messages.size + 1}`, clientMessageId: key, threadId: req.params.threadId, senderId: req.user.id, senderRole: req.user.role, type: "TEXT", text: req.body.text, reactions: {}, createdAt: new Date().toISOString() };
        messages.set(key, message);
        const thread = threads[req.params.threadId];
        [thread.userId, thread.providerUserId].forEach((id) => live.publish(id, "chat", { threadId: thread.id, message }));
      }
      res.status(201).json({ success: true, data: message });
    }),
    signalThread: response((req, res) => {
      const thread = threads[req.params.threadId];
      live.publish(controller.__socket.peerIdFor(thread, req.user.id), req.body.type, { threadId: thread.id, userId: req.user.id, active: req.body.active });
      res.json({ success: true, data: {} });
    }),
    editMessage: success,
    deleteMessage: success,
    markRead: success,
    updateLiveLocation: success,
    reactToMessage: success,
    togglePinMessage: success,
  };
  const db = {
    user: { findUnique: ({ where }) => Promise.resolve(users.get(where.id) || null) },
    chatThread: { findMany: () => Promise.resolve([]) },
  };
  const server = http.createServer((_req, res) => res.end("ok"));
  const io = initializeChatSocket(server, ["http://127.0.0.1"], { prisma: db, chatController: controller, realtime: live });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const tokens = Object.fromEntries([...users.keys()].map((id) => [
    id,
    jwt.sign({ id, purpose: "user-session" }, process.env.JWT_SECRET),
  ]));
  const sockets = await Promise.all([connect(url, tokens.u1), connect(url, tokens.u2), connect(url, tokens.u3)]);
  context.after(async () => {
    sockets.forEach((socket) => socket.disconnect());
    await io.close();
    await new Promise((resolve) => server.close(resolve));
  });

  assert.equal((await emitAck(sockets[0], "chat:join", { threadId: "paid" })).ok, true);
  assert.equal((await emitAck(sockets[1], "chat:join", { threadId: "paid" })).ok, true);
  assert.equal((await emitAck(sockets[2], "chat:join", { threadId: "paid" })).ok, false);

  const startedAt = Date.now();
  const delivered = new Promise((resolve) => sockets[1].once("chat:message", resolve));
  const acknowledged = await emitAck(sockets[0], "chat:send", { threadId: "paid", clientMessageId: "client-1", type: "TEXT", text: "Hello now" });
  const received = await delivered;
  const deliveryMs = Date.now() - startedAt;
  assert.equal(acknowledged.ok, true);
  assert.equal(received.message.id, acknowledged.data.id);
  assert.ok(deliveryMs < 250, `Expected sub-250ms delivery, received in ${deliveryMs}ms`);
  context.diagnostic(`In-memory Socket.IO delivery: ${deliveryMs}ms`);

  const duplicate = await emitAck(sockets[0], "chat:send", { threadId: "paid", clientMessageId: "client-1", type: "TEXT", text: "Hello now" });
  assert.equal(duplicate.data.id, acknowledged.data.id);
  assert.equal(messages.size, 1);

  const cancelled = await emitAck(sockets[0], "chat:send", { threadId: "cancelled", clientMessageId: "client-2", type: "TEXT", text: "Blocked" });
  assert.equal(cancelled.ok, false);
  assert.match(cancelled.message, /closed/i);

  await assert.rejects(() => connect(url, ""), /Authentication required/);
});
