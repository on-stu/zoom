const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

const room = document.getElementById("room");
room.hidden = true;

let roomName = "";
let count = 0;

function setTitle() {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${count})`;
  const form = room.querySelector("form");
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;

  form.addEventListener("submit", handleMessageSubmit);
}

function addMessage(msg) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = msg;
  ul.appendChild(li);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  // console.log(event);
  const roomInput = form.querySelector("#roomName");
  const nameInput = form.querySelector("#nickName");
  socket.emit("enter_room", roomInput.value, nameInput.value, showRoom);
  roomName = roomInput.value;
  roomInput.value = "";
  nameInput.value = "";
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("input");
  const value = input.value;
  socket.emit("new_message", roomName, input.value, () => {
    addMessage(`You : ${value}`);
  });
  input.value = "";
}

socket.on("welcome", (newCount) => {
  addMessage("someone joined");
  count = newCount;
  setTitle();
});

socket.on("bye", (newCount) => {
  addMessage("someone left");
  count = newCount;
  setTitle();
});

socket.on("new_message", (message) => {
  addMessage(message);
});

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});

form.addEventListener("submit", handleRoomSubmit);
