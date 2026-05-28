import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const port = Number(process.env.PORT || 3021);
const app = next({ dev: true, dir: process.cwd() });
const handle = app.getRequestHandler();

await app.prepare();

const httpServer = createServer((request, response) => {
  handle(request, response);
});

const io = new Server(httpServer, {
  path: "/api/realtime",
  cors: { origin: true, credentials: true }
});

const activityFeed = [
  { type: "payment", title: "Cotisation confirmee", region: "Dakar", currency: "XOF" },
  { type: "payment", title: "Versement Apple Pay valide", region: "Paris", currency: "EUR" },
  { type: "join", title: "Nouveau membre approuve", region: "Montreal", currency: "CAD" },
  { type: "risk", title: "Score risque recalcule", region: "Abidjan", currency: "XOF" },
  { type: "wallet", title: "Wallet USD recharge", region: "New York", currency: "USD" },
  { type: "mobile-money", title: "MTN MoMo en attente", region: "Accra", currency: "GHS" },
  { type: "fraud", title: "Alerte comportementale faible", region: "Lagos", currency: "NGN" },
  { type: "wave", title: "Paiement Wave synchronise", region: "Bamako", currency: "XOF" }
];

let tick = 0;

function metrics() {
  tick += 1;
  return {
    onlineUsers: 27 + (tick % 9),
    onlineAdmins: Math.max(1, io.sockets.adapter.rooms.get("admin")?.size ?? 1),
    paymentsPerMinute: 8 + (tick % 6),
    fraudRiskAverage: 14 + (tick % 7),
    pendingPayments: 4 + (tick % 5),
    failedPayments: 1 + (tick % 3),
    activeGroups: 11 + (tick % 4),
    latencyMs: 34 + (tick % 18),
    generatedAt: new Date().toISOString()
  };
}

function nextActivity() {
  const template = activityFeed[tick % activityFeed.length];
  return {
    ...template,
    id: `evt_${Date.now()}_${tick}`,
    amount: 15000 + ((tick * 7250) % 185000),
    generatedAt: new Date().toISOString()
  };
}

io.on("connection", (socket) => {
  socket.emit("server:ready", {
    socketId: socket.id,
    metrics: metrics(),
    event: nextActivity()
  });

  socket.on("join:user", (payload = {}) => {
    socket.join(`user:${payload.userId ?? socket.id}`);
    socket.emit("activity:new", {
      id: `welcome_${socket.id}`,
      type: "session",
      title: `Session securisee active${payload.name ? ` pour ${payload.name}` : ""}`,
      region: "Global",
      currency: payload.currency ?? "XOF",
      amount: 0,
      generatedAt: new Date().toISOString()
    });
  });

  socket.on("join:admin", () => {
    socket.join("admin");
    socket.emit("metrics:update", metrics());
  });

  socket.on("join:tontine", (payload = {}) => {
    if (payload.groupId) socket.join(`tontine:${payload.groupId}`);
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
});

setInterval(() => {
  const currentMetrics = metrics();
  io.to("admin").emit("metrics:update", currentMetrics);
  io.emit("presence:update", {
    onlineUsers: currentMetrics.onlineUsers,
    activeGroups: currentMetrics.activeGroups,
    latencyMs: currentMetrics.latencyMs
  });
}, 4500);

setInterval(() => {
  io.emit("activity:new", nextActivity());
}, 6500);

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`TontineApp ready on http://localhost:${port}`);
  console.log(`Realtime ready on ws://localhost:${port}/api/realtime`);
});
