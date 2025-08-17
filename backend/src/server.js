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

// Store active connections: { room: { senderId: { receivers: Set, name: string } } }
const activeConnections = new Map();

// Store user names: { socketId: name }
const userNames = new Map();

// Socket.IO events
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Listen for client to send their name
  socket.on("set_name", (name) => {
    userNames.set(socket.id, name);
    console.log(`User ${socket.id} set name: ${name}`);
  });

  socket.on("join_room", (room) => {
    socket.join(room);
    const userName = userNames.get(socket.id) || "Unknown";
    console.log(`User ${socket.id} (${userName}) joined room: ${room}`);
  });

  // Sender requests connection
  socket.on("request_connection", ({ room }) => {
    // Store sender's request
    if (!activeConnections.has(room)) {
      activeConnections.set(room, new Map());
    }

    const roomConnections = activeConnections.get(room);
    if (!roomConnections.has(socket.id)) {
      roomConnections.set(socket.id, {
        receivers: new Set(),
        name: userNames.get(socket.id),
      });
    }

    // Notify all receivers in the room
    socket.to(room).emit("request_connection", {
      senderId: socket.id,
      senderName: userNames.get(socket.id),
    });
  });

  // Receiver accepts connection
  socket.on("accept_connection", ({ room, senderId }) => {
    if (
      activeConnections.has(room) &&
      activeConnections.get(room).has(senderId)
    ) {
      const roomConnections = activeConnections.get(room);
      const senderData = roomConnections.get(senderId);
      senderData.receivers.add(socket.id);

      // Notify sender that this specific receiver accepted
      socket.to(senderId).emit("accept_connection", {
        receiverId: socket.id,
        receiverName: userNames.get(socket.id),
      });
      console.log(
        `Receiver ${socket.id} (${userNames.get(
          socket.id
        )}) accepted connection from sender ${senderId} (${
          senderData.name
        }) in room ${room}`
      );
    }
  });

  // Receiver rejects connection
  socket.on("reject_connection", ({ room, senderId }) => {
    if (
      activeConnections.has(room) &&
      activeConnections.get(room).has(senderId)
    ) {
      const roomConnections = activeConnections.get(room);
      const senderData = roomConnections.get(senderId);

      // Only remove from receivers if they were previously accepted
      if (senderData.receivers.has(socket.id)) {
        senderData.receivers.delete(socket.id);
      }

      // Notify sender that this specific receiver rejected
      socket.to(senderId).emit("reject_connection", {
        receiverId: socket.id,
        receiverName: userNames.get(socket.id),
      });
      console.log(
        `Receiver ${socket.id} (${userNames.get(
          socket.id
        )}) rejected connection from sender ${senderId} (${
          senderData.name
        }) in room ${room}`
      );
    }
  });

  // Sender disconnects from all receivers
  socket.on("disconnect_from_receivers", ({ room }) => {
    if (
      activeConnections.has(room) &&
      activeConnections.get(room).has(socket.id)
    ) {
      const roomConnections = activeConnections.get(room);
      const senderData = roomConnections.get(socket.id);

      // Notify all receivers that sender has disconnected
      senderData.receivers.forEach((receiverId) => {
        socket.to(receiverId).emit("sender_disconnected", {
          senderId: socket.id,
          senderName: userNames.get(socket.id),
        });
      });

      // Remove sender from active connections
      roomConnections.delete(socket.id);

      // Remove empty rooms
      if (roomConnections.size === 0) {
        activeConnections.delete(room);
      }

      console.log(
        `Sender ${socket.id} (${userNames.get(
          socket.id
        )}) disconnected from all receivers in room ${room}`
      );
    }
  });

  // Location sharing events - only send to accepted receivers
  socket.on("share_location", ({ room, location }) => {
    console.log(
      `Location shared in room ${room} by sender ${socket.id} (${userNames.get(
        socket.id
      )}):`,
      location
    );

    if (
      activeConnections.has(room) &&
      activeConnections.get(room).has(socket.id)
    ) {
      const senderData = activeConnections.get(room).get(socket.id);
      const acceptedReceivers = senderData.receivers;

      // Send location only to accepted receivers
      acceptedReceivers.forEach((receiverId) => {
        socket.to(receiverId).emit("receive_location", {
          location,
          senderId: socket.id,
          senderName: userNames.get(socket.id),
        });
      });

      console.log(
        `Location sent to ${acceptedReceivers.size} accepted receivers`
      );
    }
  });

  socket.on("stop_location_sharing", ({ room }) => {
    console.log(
      `Location sharing stopped in room ${room} by sender ${
        socket.id
      } (${userNames.get(socket.id)})`
    );

    if (
      activeConnections.has(room) &&
      activeConnections.get(room).has(socket.id)
    ) {
      const senderData = activeConnections.get(room).get(socket.id);
      const acceptedReceivers = senderData.receivers;

      // Notify only accepted receivers
      acceptedReceivers.forEach((receiverId) => {
        socket.to(receiverId).emit("location_sharing_stopped", {
          senderId: socket.id,
          senderName: userNames.get(socket.id),
        });
      });
    }
  });

  // Handle chat messages
  socket.on("send_message", ({ room, message, timestamp }) => {
    console.log(
      `Message sent in room ${room} by ${socket.id} (${userNames.get(
        socket.id
      )}): ${message}`
    );

    if (
      activeConnections.has(room) &&
      activeConnections.get(room).has(socket.id)
    ) {
      const senderData = activeConnections.get(room).get(socket.id);
      const acceptedReceivers = senderData.receivers;

      // Send message to all accepted receivers
      acceptedReceivers.forEach((receiverId) => {
        socket.to(receiverId).emit("receive_message", {
          senderId: socket.id,
          senderName: userNames.get(socket.id),
          message,
          timestamp,
        });
      });

      console.log(
        `Message sent to ${acceptedReceivers.size} accepted receivers`
      );
    } else {
      // This is a receiver sending a message - send to sender and other receivers in the same room
      const roomConnections = activeConnections.get(room);
      if (roomConnections) {
        // Find the sender in this room
        const senderEntry = Array.from(roomConnections.entries()).find(
          ([senderId, data]) => data.receivers.has(socket.id)
        );

        if (senderEntry) {
          const [senderId, senderData] = senderEntry;
          const allParticipants = new Set([senderId, ...senderData.receivers]);

          // Send message to all participants except the sender
          allParticipants.forEach((participantId) => {
            if (participantId !== socket.id) {
              socket.to(participantId).emit("receive_message", {
                senderId: socket.id,
                senderName: userNames.get(socket.id),
                message,
                timestamp,
              });
            }
          });

          console.log(
            `Group message sent to ${allParticipants.size - 1} participants`
          );
        }
      }
    }
  });

  socket.on("disconnect", () => {
    const userName = userNames.get(socket.id);
    console.log(`User Disconnected: ${socket.id} (${userName})`);

    // Clean up connections when user disconnects
    activeConnections.forEach((roomConnections, room) => {
      roomConnections.forEach((senderData, senderId) => {
        if (senderId === socket.id) {
          // Sender disconnected, remove all their connections
          roomConnections.delete(senderId);
        } else if (senderData.receivers.has(socket.id)) {
          // Receiver disconnected, remove them from connections
          senderData.receivers.delete(socket.id);
        }
      });

      // Remove empty rooms
      if (roomConnections.size === 0) {
        activeConnections.delete(room);
      }
    });

    // Clean up user name
    userNames.delete(socket.id);
  });
});

server.listen(PORT, () => {
  console.log("Server Started on port:", PORT);
});
