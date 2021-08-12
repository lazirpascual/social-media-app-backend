const app = require("./app"); // the actual Express application
const http = require("http");
const config = require("./utils/config");
const logger = require("./utils/logger");
const { addUser, removeUser, getUser } = require("./utils/socketUsers");

const server = http.createServer(app);

/* Socket.IO Server */
const io = require("socket.io")(server, {
  cors: {
    origins: "*:*",
  },
});
let users = [];

io.on("connection", (socket) => {
  /* connect to socket server */
  console.log("A user has connected.");
  // after connecting to server, take userId and socketId from client
  socket.on("addUser", (userId) => {
    // add user to array and send all users (userId and socketId) to every client
    addUser(userId, socket.id, users);
    io.emit("getUsers", users);
  });

  /* send and fetch message */
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    // get user who will receive the message
    const user = getUser(receiverId, users);
    io.to(user.socketId).emit("getMessage", {
      // send message to receiver
      senderId,
      text,
    });
  });

  /* disconnect from socket server */
  socket.on("disconnect", () => {
    // when a user disconnects, remove from users array and send updated array to client
    console.log("A user has disconnected.");
    users = removeUser(socket.id, users);
    io.emit("getUsers", users);
  });
});

server.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
});
