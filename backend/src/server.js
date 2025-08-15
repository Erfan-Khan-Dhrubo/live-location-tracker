import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app = express();
const PORT = 5001;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

server.listen(PORT, () => {
  console.log("Server Started on port:", PORT);
});
