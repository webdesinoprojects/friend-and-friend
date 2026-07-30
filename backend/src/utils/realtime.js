const clients = new Map();
let socketServer = null;
const socketEvents = {
  chat: "chat:message",
  edit: "chat:edited",
  delete: "chat:deleted",
  cleared: "chat:cleared",
  read: "chat:read-update",
  typing: "chat:typing",
  presence: "chat:presence",
  location: "chat:location-update",
  reaction: "chat:reaction-update",
  pin: "chat:pin-update",
};
function subscribe(userId, res) { const rows=clients.get(userId)||new Set(); rows.add(res); clients.set(userId,rows); return ()=>{rows.delete(res);if(!rows.size)clients.delete(userId);}; }
function publish(userId, event, data={}) {
  (clients.get(userId)||[]).forEach((res)=>res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  if (socketServer) socketServer.to(`user:${userId}`).emit(socketEvents[event] || event, data);
}
function online(userId) {
  return Boolean(clients.get(userId)?.size || socketServer?.sockets?.adapter?.rooms?.get(`user:${userId}`)?.size);
}
function setSocketServer(io) { socketServer = io; }
module.exports={subscribe,publish,online,setSocketServer};
