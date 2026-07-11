const clients = new Map();
function subscribe(userId, res) { const rows=clients.get(userId)||new Set(); rows.add(res); clients.set(userId,rows); return ()=>{rows.delete(res);if(!rows.size)clients.delete(userId);}; }
function publish(userId, event, data={}) { (clients.get(userId)||[]).forEach((res)=>res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)); }
function online(userId) { return Boolean(clients.get(userId)?.size); }
module.exports={subscribe,publish,online};
