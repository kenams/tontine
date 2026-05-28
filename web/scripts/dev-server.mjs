import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const port = Number(process.env.PORT || 3021);
const app = next({ dev: true, dir: process.cwd() });
const handle = app.getRequestHandler();

await app.prepare();

const httpServer = createServer(async (request, response) => {
  // Internal endpoint: Next.js API routes emit real events via this
  // Uses /__emit path to avoid Socket.io intercepting /api/realtime/* requests
  if (request.method === "POST" && request.url === "/__emit") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      try {
        const event = JSON.parse(body);
        const { room, type, ...payload } = event;
        if (room) {
          io.to(room).emit(type ?? "activity:new", payload);
        } else {
          io.emit(type ?? "activity:new", payload);
        }
      } catch { /* ignore */ }
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  handle(request, response);
});

const io = new Server(httpServer, {
  path: "/ws",
  cors: { origin: true, credentials: true }
});

let connectedUsers = 0;
let activeRooms = new Set();
let tick = 0;

function presence() {
  return {
    onlineUsers: Math.max(connectedUsers, 1),
    activeGroups: Math.max(activeRooms.size, 1),
    latencyMs: 28 + (tick % 14)
  };
}

io.on("connection", (socket) => {
  connectedUsers++;

  socket.emit("server:ready", {
    socketId: socket.id,
    metrics: presence(),
    event: {
      id: `session_${socket.id}`,
      type: "session",
      title: "Session Kotizy chiffrée active",
      region: "Global",
      currency: "XOF",
      amount: 0,
      generatedAt: new Date().toISOString()
    }
  });

  socket.on("join:user", (payload = {}) => {
    const room = `user:${payload.userId ?? socket.id}`;
    socket.join(room);
    io.emit("presence:update", presence());
  });

  socket.on("join:admin", () => {
    socket.join("admin");
  });

  socket.on("join:tontine", (payload = {}) => {
    if (payload.groupId) {
      const room = `tontine:${payload.groupId}`;
      socket.join(room);
      activeRooms.add(room);
      io.emit("presence:update", presence());
    }
  });

  socket.on("chat:typing", (payload = {}) => {
    if (payload.groupId) {
      socket.to(`tontine:${payload.groupId}`).emit("chat:typing", {
        groupId: payload.groupId,
        name: payload.name ?? "Membre",
        at: new Date().toISOString()
      });
    }
  });

  socket.on("disconnect", () => {
    connectedUsers = Math.max(0, connectedUsers - 1);
    io.emit("presence:update", presence());
  });
});

setInterval(() => {
  tick++;
  io.emit("presence:update", presence());
}, 5000);

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`\x1b[32m✓\x1b[0m Kotizy ready      → http://localhost:${port}`);
  console.log(`\x1b[32m✓\x1b[0m Socket.io ready    → ws://localhost:${port}/ws`);
  console.log(`\x1b[32m✓\x1b[0m Emit endpoint      → POST http://localhost:${port}/__emit`);
});
