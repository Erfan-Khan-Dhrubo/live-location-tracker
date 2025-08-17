import React, { useState, useEffect } from "react";
import socket from "../utilities/socket"; // your client-side Socket.IO instance.

const Send = () => {
  const name = "Farah";
  const [connected, setConnected] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [locationInterval, setLocationInterval] = useState(null);
  const [connectedReceivers, setConnectedReceivers] = useState(new Map());
  const [pendingRequests, setPendingRequests] = useState(0);
  const [respondedReceivers, setRespondedReceivers] = useState(new Set()); // Track which receivers have responded
  const [hasInitiatedConnection, setHasInitiatedConnection] = useState(false); // Track if sender has initiated connection
  const [myName, setMyName] = useState("");
  const room = "56"; // static room for demo

  useEffect(() => {
    // Join the room when component mounts
    socket.emit("join_room", room);
    // Send my name to the server
    socket.emit("set_name", name);
    // "join_room" is the event name. Your server should be listening for it:
    //  room is the payload (in this case, the string "56" from your component).
    // By doing this, your socket (the client) tells the server: “I want to join the chat room with ID 56.”
    // So now, the server can send messages only to people inside that room.

    // Get my name from socket
    socket.on("connect", () => {
      // This listens for the built-in "connect" event from Socket.IO.
      // "connect" fires when the client successfully connects to the server.
    });
  }, []);

  useEffect(() => {
    socket.on("accept_connection", ({ receiverId, receiverName }) => {
      // This listens for the "accept_connection" event from the server.
      // The server must emit it when a receiver accepts a sender's request, e.g.:
      //          socket.to(senderId).emit("accept_connection", {
      //            receiverId: socket.id,
      //            receiverName: someName
      //          });

      console.log(
        `Receiver ${receiverName} (${receiverId}) accepted connection`
      );
      setConnectedReceivers(
        (prev) => new Map(prev).set(receiverId, receiverName)
        // prev = the previous Map stored in state.
        // new Map(prev) = creates a copy of the old Map (important: React state must be immutable, so we don't directly mutate prev).
        // .set(receiverId, receiverName) = adds (or updates) one entry in the new Map.
      );
      setConnected(true);

      // Mark this receiver as responded
      setRespondedReceivers((prev) => new Set(prev).add(receiverId));

      // Only decrease pending requests if this receiver hasn't responded before
      if (!respondedReceivers.has(receiverId)) {
        setPendingRequests((prev) => Math.max(0, prev - 1));
      }
    });

    socket.on("reject_connection", ({ receiverId, receiverName }) => {
      console.log(
        `Receiver ${receiverName} (${receiverId}) rejected connection`
      );

      // Mark this receiver as responded
      setRespondedReceivers((prev) => new Set(prev).add(receiverId));

      // Only decrease pending requests if this receiver hasn't responded before
      if (!respondedReceivers.has(receiverId)) {
        setPendingRequests((prev) => Math.max(0, prev - 1));
      }
    });

    return () => {
      socket.off("accept_connection");
      socket.off("reject_connection");
      // When the component unmounts(cancel the page), you remove these listeners.
    };
  }, []);

  // Cleanup location interval when component unmounts
  useEffect(() => {
    return () => {
      // return () => { ... }
      // In React, the function you return from useEffect is the cleanup function.
      // Cleanup is called:
      //    Before the effect runs again (when dependencies change).
      //    When the component is removed from the screen (unmounted).
      // So this ensures we don’t leave background timers running after the component goes away → prevents memory leaks.
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [locationInterval]);

  const requestConnect = () => {
    // when Connect to Receivers button is pressed it send request connection to the server
    socket.emit("request_connection", { room });
    setPendingRequests((prev) => prev + 1);
    setConnectedReceivers(new Map()); // Reset connections
    setConnected(false); // Reset connection state
    setRespondedReceivers(new Set()); // Reset responded receivers tracking
    setHasInitiatedConnection(true); // Mark that connection has been initiated
  };

  const disconnectFromReceivers = () => {
    // Disconnect from all receivers
    socket.emit("disconnect_from_receivers", { room });
    setConnectedReceivers(new Map()); // Clear all connections
    setConnected(false); // Reset connection state
    setPendingRequests(0); // Clear pending requests
    setRespondedReceivers(new Set()); // Reset responded receivers tracking
    setIsSharingLocation(false); // Stop location sharing if active
    if (locationInterval) {
      clearInterval(locationInterval);
      setLocationInterval(null);
    }
    setHasInitiatedConnection(false); // Reset initiated connection state
  };

  const startLocationSharing = () => {
    console.log("Starting location sharing...");

    // navigator is a built-in object in your browser that provides information about the browser and the device. It’s part of the Web APIs that browsers expose to JavaScript.
    // For example:
    // navigator.geolocation → gives access to the device’s location (latitude & longitude).
    // navigator.userAgent → gives information about the browser version.
    // navigator.language → gives your browser’s language.
    if ("geolocation" in navigator) {
      setIsSharingLocation(true);
      // The navigator.geolocation API is built into modern browsers.
      // This line checks if the user’s browser supports geolocation.

      // Get initial location
      navigator.geolocation.getCurrentPosition(
        // This asks the browser for the current location.
        (position) => {
          // Sends the first location immediately to the server.
          console.log("Got initial position:", position);
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
          };
          console.log("Emitting share_location:", { room, location });
          socket.emit("share_location", { room, location }); // send the room and info to the server
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Error getting location. Please check permissions.");
          setIsSharingLocation(false);
        }
      );

      // Set up continuous location tracking
      const interval = setInterval(() => {
        console.log("Getting updated position...");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: Date.now(),
            };
            console.log("Emitting updated location:", location);
            socket.emit("share_location", { room, location });
          },
          (error) => {
            console.error("Error getting location:", error);
          }
        );
      }, 5000); // Update every 5 seconds

      setLocationInterval(interval);
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const stopLocationSharing = () => {
    console.log("Stopping location sharing...");
    setIsSharingLocation(false);
    if (locationInterval) {
      clearInterval(locationInterval);
      setLocationInterval(null);
    }
    socket.emit("stop_location_sharing", { room });
  };

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-blue-800 font-semibold mb-2">📍 Location Sender</h3>
        <p className="text-blue-600 text-sm">
          Share your location with receivers in the room
        </p>
      </div>

      <button
        onClick={
          hasInitiatedConnection ? disconnectFromReceivers : requestConnect
        }
        className={`btn ${
          hasInitiatedConnection
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600"
        } text-white`}
      >
        {hasInitiatedConnection
          ? "Disconnect from Receivers"
          : "Connect to Receivers"}
      </button>

      {/* Connected Receivers Info */}
      {connectedReceivers.size > 0 && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium mb-2">
            ✅ Connected to {connectedReceivers.size} receiver(s):
          </p>
          <div className="space-y-1">
            {Array.from(connectedReceivers.entries()).map(
              ([receiverId, receiverName]) => (
                <div
                  key={receiverId}
                  className="flex items-center gap-2 text-green-700 text-sm"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{receiverName}</span>
                  <span className="text-xs text-green-500">
                    ({receiverId.slice(0, 8)}...)
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {connected && (
        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            {!isSharingLocation ? (
              <button
                onClick={startLocationSharing}
                className="btn bg-green-500 text-white"
              >
                Start Sharing Location
              </button>
            ) : (
              <button
                onClick={stopLocationSharing}
                className="btn bg-red-500 text-white"
              >
                Stop Sharing Location
              </button>
            )}
          </div>

          {isSharingLocation && (
            <div className="text-sm text-green-600">
              📍 Sharing location every 5 seconds with {connectedReceivers.size}{" "}
              receiver(s)...
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">How it works:</h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Click "Connect to Receivers" to send connection requests</li>
          <li>
            Receivers will see your request and can accept/reject independently
          </li>
          <li>
            If one receiver rejects, others can still accept your connection
          </li>
          <li>Only accepted receivers will receive your location updates</li>
          <li>You can see exactly which receivers are connected</li>
          <li>
            The disconnect button stays active until you manually disconnect
          </li>
          <li>
            Click "Disconnect from Receivers" to end all connections and reset
          </li>
          <li>
            Disconnecting will stop location sharing and reset to initial state
          </li>
        </ol>
      </div>
    </div>
  );
};

export default Send;
