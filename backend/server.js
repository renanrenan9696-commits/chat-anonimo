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
    methods: ["GET", "POST"]
  }
});

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.id);

  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("matched");
    waitingUser.emit("matched");

    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
    }

    socket.partner = null;

    if (waitingUser === socket) {
      waitingUser = null;
    }

    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("matched");
      waitingUser.emit("matched");

      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
    }

    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

server.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});