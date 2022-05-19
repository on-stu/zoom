import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(io, {
  auth: false,
});

function publicRooms() {
  const sids = io.sockets.adapter.sids;
  const rooms = io.sockets.adapter.rooms;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return io.sockets.adapter.rooms.get(roomName)?.size;
}

io.on("connection", (socket) => {
  socket["nickname"] = "Anonymous";
  io.sockets.emit("room_change", publicRooms());
  socket.on("enter_room", (roomName, nickname, done) => {
    socket.join(roomName);
    socket["nickname"] = nickname;
    done();
    socket.to(roomName).emit("welcome", countRoom(roomName));
    io.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (roomName, message, done) => {
    socket.to(roomName).emit("new_message", `${socket.nickname} : ${message}`);
    done();
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", countRoom(room) - 1)
    );
    console.log(publicRooms());
    io.sockets.emit("room_change", publicRooms());
  });
});

server.listen(3000, handleListen);
