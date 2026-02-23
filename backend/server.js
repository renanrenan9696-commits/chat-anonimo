const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let queue = [];

io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.id);

  // === ENTRADA AUTOMÁTICA NA FILA ===
  queue.push(socket);

  tryMatch();

  // === RECEBER MENSAGEM ===
  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  // === BOTÃO PRÓXIMO ===
  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("partnerDisconnected");
      socket.partner.partner = null;
    }

    socket.partner = null;
    queue.push(socket);
    tryMatch();
  });

  // === DESCONECTAR ===
  socket.on("disconnect", () => {
    console.log("Usuário saiu:", socket.id);

    queue = queue.filter((s) => s !== socket);

    if (socket.partner) {
      socket.partner.emit("partnerDisconnected");
      socket.partner.partner = null;
    }
  });
});

// === FUNÇÃO PARA CONECTAR PARES ===
function tryMatch() {
  while (queue.length >= 2) {
    const user1 = queue.shift();
    const user2 = queue.shift();

    user1.partner = user2;
    user2.partner = user1;

    user1.emit("matched");
    user2.emit("matched");

    console.log("Usuários conectados:", user1.id, user2.id);
  }
}

server.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});