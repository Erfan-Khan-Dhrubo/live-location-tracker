import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import socket from "../utilities/socket";
import SenderInfo from "../components/Receiver Components/SenderInfo";
import SenderConnectionRequest from "../components/Receiver Components/SenderConnectionRequest";
import SenderOverview from "../components/Receiver Components/SenderOverview";

// Remove Leaflet's default method of finding marker image URLs
// (because in React/Vite/Webpack builds, the default local image path breaks)
delete L.Icon.Default.prototype._getIconUrl;
// Override Leaflet's default marker options with custom URLs (from CDN)
L.Icon.Default.mergeOptions({
  // High-resolution icon for Retina/HiDPI screens
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  // Standard marker icon
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  // Shadow image that appears under the marker
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons for different senders
const createSenderIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

// Receiver's own location marker icon
const myLocationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [28, 45],
  iconAnchor: [14, 45],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to handle map updates
// A small React component whose only job is to “update” the Leaflet map view when locations are available
function MapUpdater({ locations, mapRef, myCurrentLocation }) {
  const map = useMap(); // comes from react-leaflet, gives you the Leaflet map object
  const hasInitialized = useRef(false); // It ensures the map fitting runs only once (when the map first loads), not on every update.

  useEffect(() => {
    if (!hasInitialized.current && map) {
      // map exists (so the map is already created).
      // hasInitialized.current === false (so it hasn’t adjusted bounds yet).
      // Only fit bounds initially when the map first loads
      const allPositions = [
        ...locations.flatMap((sender) =>
          sender.locationHistory.map((loc) => [loc.latitude, loc.longitude])
        ),
        ...(myCurrentLocation
          ? [[myCurrentLocation.latitude, myCurrentLocation.longitude]]
          : []),
      ];

      if (allPositions.length > 0) {
        const bounds = L.latLngBounds(allPositions);
        // L.latLngBounds() is a Leaflet helper that creates a bounding box around a list of coordinates.
        // Example: if you have points in Dhaka, Chittagong, and your location, it finds the smallest rectangle that covers all points.
        // This is useful so the map automatically zooms/pans to fit everyone.

        map.invalidateSize(); // forces Leaflet to recalculate the map layout and fix any glitches
        if (allPositions.length === 1) {
          // map.setView(center, 15) → directly zooms in on that location (zoom level 15 ≈ city block level, quite close).
          // This makes sense: if there’s only one person, we want to zoom in close to them, not show the whole world.

          map.setView(bounds.getCenter(), 15);
        } else {
          map.fitBounds(bounds, { padding: [20, 20] });
          // map.fitBounds(bounds, { padding: [20, 20] }) → zooms/pans out so all points are visible on the screen, with a small padding (20px margin) so they aren’t right on the edge.
          // This is like Google Maps’ “fit all markers” feature.
        }
        hasInitialized.current = true;
        // It ensures the map auto-fits only on first load, not every time a new location is added
      }
    }
  }, [locations, map, myCurrentLocation]);

  return null;
}

const Receive = () => {
  // Your fixed name (could be the person using this client)
  const name = "Erfan";

  // A fixed room number (used to group people together in the app)
  const room = "56";

  // React state to track whether a new connection request has arrived
  const [connectionRequest, setConnectionRequest] = useState(false);

  // React state to store the ID of the sender who requested connection
  const [currentSenderId, setCurrentSenderId] = useState(null);

  // React state to store the name of the sender who requested connection
  const [currentSenderName, setCurrentSenderName] = useState("");

  // React state to control whether the map is visible
  const [showMap, setShowMap] = useState(false);

  // React state to keep track of all connected senders (users who connected to you)
  // We use a Map because:
  //   - Keys can be anything (not just strings)
  //   - Maintains insertion order
  //   - Has built-in methods like set(), get(), delete(), has()
  // Example: connectedSenders.set("user123", "Alice");
  const [connectedSenders, setConnectedSenders] = useState(new Map());

  // React state to keep track of sender locations
  // Map where key = senderId, value = { currentLocation, locationHistory, isSharing }
  //   - currentLocation → { latitude, longitude }
  //   - locationHistory → array of past { latitude, longitude }
  //   - isSharing → boolean, whether sender is actively sharing location
  const [senderLocations, setSenderLocations] = useState(new Map());

  // React state to store your own name (can be updated by input field)
  const [myName, setMyName] = useState("");

  // React state to keep a list of chat messages (array of objects or strings)
  const [messages, setMessages] = useState([]);

  // React state for the text input of the current message being typed
  const [newMessage, setNewMessage] = useState("");

  // React state to track if the chat was cleared (so UI can reset accordingly)
  const [chatCleared, setChatCleared] = useState(false);

  // useRef to store reference to the map instance (so you can interact with it directly without re-rendering)
  const mapRef = useRef(null);

  // React state to store your current location { latitude, longitude }
  const [myCurrentLocation, setMyCurrentLocation] = useState(null);

  // useRef to store the ID returned by navigator.geolocation.watchPosition()
  // This allows you to stop watching later with navigator.geolocation.clearWatch()
  const mapLocationWatchIdRef = useRef(null);

  // Color palette for different senders
  const senderColors = [
    "red",
    "green",
    "orange",
    "purple",
    "darkred",
    "darkgreen",
    "darkblue",
    "cadetblue",
  ];

  useEffect(() => {
    socket.emit("join_room", room);
    // Send my name to the server !
    socket.emit("set_name", name);

    socket.on("request_connection", ({ senderId, senderName }) => {
      console.log(
        `Connection request from sender: ${senderName} (${senderId})`
      );
      setConnectionRequest(true);
      setCurrentSenderId(senderId);
      setCurrentSenderName(senderName);
    });

    // Location sharing events !
    socket.on("receive_location", ({ location, senderId, senderName }) => {
      console.log(`Received location from ${senderName}:`, location);

      setSenderLocations((prev) => {
        // Updating setSenderLocations
        const newMap = new Map(prev);
        const senderData = newMap.get(senderId) || {
          currentLocation: null,
          locationHistory: [],
          isSharing: false,
        };

        newMap.set(senderId, {
          currentLocation: location,
          locationHistory: [...senderData.locationHistory, location],
          isSharing: true,
        });

        return newMap;
      });
    });

    // Location sharing stopped event !
    socket.on("location_sharing_stopped", ({ senderId, senderName }) => {
      console.log(`Location sharing stopped by ${senderName}`);

      setSenderLocations((prev) => {
        const newMap = new Map(prev);
        const senderData = newMap.get(senderId);
        if (senderData) {
          newMap.set(senderId, {
            ...senderData,
            isSharing: false,
          });
        }
        return newMap;
      });
    });

    // Location Disconnect Event !
    socket.on("sender_disconnected", ({ senderId, senderName }) => {
      console.log(`Sender ${senderName} disconnected`);

      // Remove sender from connected senders
      setConnectedSenders((prev) => {
        const newMap = new Map(prev);
        newMap.delete(senderId);
        return newMap;
      });

      // Remove sender from locations
      setSenderLocations((prev) => {
        const newMap = new Map(prev);
        newMap.delete(senderId);
        return newMap;
      });
    });

    // Listen for chat clear event when sender disconnects !
    socket.on("clear_chat", ({ senderId, senderName }) => {
      console.log(`Clearing chat for sender ${senderName}`);
      setMessages([]); // Clear all messages
      setChatCleared(true); // Show notification
    });

    // Listen for messages from senders !
    socket.on(
      "receive_message",
      ({ senderId, senderName, message, timestamp }) => {
        console.log(`Received message from ${senderName}: ${message}`);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            senderId,
            senderName,
            message,
            timestamp,
            isFromMe: false,
          },
        ]);
      }
    );

    return () => {
      socket.off("request_connection");
      socket.off("receive_location");
      socket.off("location_sharing_stopped");
      socket.off("sender_disconnected");
      socket.off("clear_chat");
      socket.off("receive_message");
      if (mapLocationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(mapLocationWatchIdRef.current); // ?
        mapLocationWatchIdRef.current = null;
      }
    };
  }, []);

  // When map is shown, automatically track receiver's own location locally (no emit)
  useEffect(() => {
    if (showMap && "geolocation" in navigator) {
      // The map is visible and The map is visible, and
      const id = navigator.geolocation.watchPosition(
        // navigator.geolocation.watchPosition(success, error, options)
        // Starts continuous tracking of the user’s device location.
        // Unlike getCurrentPosition (which runs once), watchPosition keeps updating whenever location changes.
        (position) => {
          // success callback → called every time location updates.
          setMyCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
          });
        },
        () => {}, // error callback → called if tracking fails (here it’s empty () => {}).
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
        // options:
        // enableHighAccuracy: true → use GPS if available (better accuracy, more battery).
        // maximumAge: 10000 → allow cached location up to 10s old.
        // timeout: 10000 → wait max 10s for a location before failing.
      );
      mapLocationWatchIdRef.current = id; // Stores that ID in a useRef, so we can later stop tracking with clearWatch(id).
      // When you call navigator.geolocation.watchPosition(...), the browser starts continuously tracking your location.
      // That function returns an ID number (like id = 12) which identifies that specific tracking session.
      // To stop tracking later, you must call:
      //        navigator.geolocation.clearWatch(id);

      return () => {
        // Cleanup function (return () => { ... })
        // React automatically runs this when:
        // showMap changes from true → false
        // OR the component unmounts.
        if (mapLocationWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(mapLocationWatchIdRef.current); // Stops the GPS tracking
          mapLocationWatchIdRef.current = null; // Resets the ref to null (so a new session can start cleanly).
        }
      };
    }
  }, [showMap]);

  const accept = () => {
    if (currentSenderId) {
      socket.emit("accept_connection", { room, senderId: currentSenderId });
      setConnectedSenders((prev) =>
        new Map(prev).set(currentSenderId, currentSenderName)
      );
      setConnectionRequest(false);
      setCurrentSenderId(null);
      setCurrentSenderName("");
    }
  };

  const reject = () => {
    if (currentSenderId) {
      socket.emit("reject_connection", { room, senderId: currentSenderId });
      setConnectionRequest(false);
      setCurrentSenderId(null);
      setCurrentSenderName("");
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && connectedSenders.size > 0) {
      const messageData = {
        message: newMessage.trim(),
        timestamp: Date.now(),
        senderId: socket.id,
        senderName: name,
      };

      // Add message to local messages
      setMessages((prev) => [
        ...prev,
        {
          ...messageData,
          id: Date.now() + Math.random(),
          isFromMe: true,
        },
      ]);

      // Send message to all connected senders
      socket.emit("send_message", {
        room,
        message: newMessage.trim(),
        timestamp: Date.now(),
      });

      setNewMessage(""); // Clear input field
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderLeafletMap = () => {
    if (senderLocations.size === 0) return null; // If there are no senderLocations, it immediately returns null

    // Converts the senderLocations Map into an array of objects.
    // Each object contains:
    // senderId
    // senderName (looked up in connectedSenders, fallback "Unknown")
    // all other data (spread operator ...data → currentLocation, locationHistory, isSharing, etc.).
    const locations = Array.from(senderLocations.entries()).map(
      ([senderId, data]) => ({
        senderId,
        senderName: connectedSenders.get(senderId) || "Unknown",
        ...data,
      })
    );

    return (
      <div className="mt-4">
        <MapContainer // MapContainer: The main Leaflet map component from react-leaflet.
          center={[0, 0]} // Initial center of the map (latitude 0, longitude 0 → near the Atlantic ocean).
          zoom={2} // Initial zoom level (world view).
          style={{ height: "600px", width: "100%" }}
          className="rounded-lg border-2 border-gray-300"
          whenCreated={(map) => (mapRef.current = map)} // When the map is created, store a reference to the actual Leaflet map object in mapRef.
        >
          {/* The TileLayer component in Leaflet is used to display the map imagery/tiles. */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Receiver's own current location */}
          {myCurrentLocation && (
            <Marker // Marker → Leaflet component to show a pin on the map.
              position={[
                myCurrentLocation.latitude,
                myCurrentLocation.longitude,
              ]}
              icon={myLocationIcon}
              // Uses your custom violet icon (so your marker looks different from senders).
            >
              {/* A small info box that shows up when you click the marker. */}
              <Popup>
                <div className="text-center">
                  <h4 className="font-semibold">📍 You ({name})</h4>
                  <p className="text-sm">
                    Lat: {myCurrentLocation.latitude.toFixed(6)}
                  </p>
                  <p className="text-sm">
                    Lng: {myCurrentLocation.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated:{" "}
                    {new Date(myCurrentLocation.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Render markers and paths for each sender */}
          {locations.map((sender, index) => {
            if (!sender.currentLocation) return null; // Skip this sender if they don’t have a current location yet.

            const color = senderColors[index % senderColors.length];
            const senderIcon = createSenderIcon(color);
            const center = [
              sender.currentLocation.latitude,
              sender.currentLocation.longitude,
            ];

            return (
              <div key={sender.senderId}>
                {/* Current location marker */}
                <Marker position={center} icon={senderIcon}>
                  <Popup>
                    <div className="text-center">
                      <h4 className="font-semibold">📍 {sender.senderName}</h4>
                      <p className="text-sm">
                        Lat: {sender.currentLocation.latitude.toFixed(6)}
                      </p>
                      <p className="text-sm">
                        Lng: {sender.currentLocation.longitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Updated:{" "}
                        {new Date(
                          sender.currentLocation.timestamp
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>

                {/* Line between receiver and sender */}
                {myCurrentLocation && (
                  <Polyline // Polyline → Leaflet component to show a line on the map.
                    positions={[
                      [myCurrentLocation.latitude, myCurrentLocation.longitude],
                      [
                        sender.currentLocation.latitude,
                        sender.currentLocation.longitude,
                      ],
                    ]}
                    color={color}
                    weight={4} // (line thickness
                    opacity={0.9}
                    dashArray="6,6" // Alternating dash and gap pattern (6 pixels dash, 6 pixels gap). (dotted effect)
                  />
                )}
              </div>
            );
          })}

          <MapUpdater
            locations={locations}
            mapRef={mapRef}
            myCurrentLocation={myCurrentLocation}
          />
        </MapContainer>

        <div className="mt-3 text-center text-sm text-gray-600">
          <p>
            Professional map view showing all connected senders' locations and
            tracking paths.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Each sender has a different colored marker and path. Use mouse wheel
            to zoom, drag to pan.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-blue-50">
      <div className="w-9/10 mx-auto py-12">
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-green-800 font-semibold mb-2">
            📍 Location Receiver
          </h3>
          <p className="text-green-600 text-sm">
            Receive and view location updates from multiple senders
          </p>
        </div>

        {/* showing a list of connected senders in your UI */}
        <SenderInfo connectedSenders={connectedSenders}></SenderInfo>

        {/* Connection Status */}
        <SenderConnectionRequest
          connectionRequest={connectionRequest}
          currentSenderName={currentSenderName}
          accept={accept}
          reject={reject}
        ></SenderConnectionRequest>

        {/* This block is about showing a list of active location senders (those who are sharing their location), 
        plus controls for showing/hiding the map.*/}
        <SenderOverview
          senderLocations={senderLocations}
          connectedSenders={connectedSenders}
          senderColors={senderColors}
          showMap={showMap}
          setShowMap={setShowMap}
          renderLeafletMap={renderLeafletMap}
        ></SenderOverview>

        {/* Chat Section */}
        {connectedSenders.size > 0 && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💬 Group Chat with Senders
            </h3>

            {/* Group Participants Info */}
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-xs font-medium mb-1">
                Group Participants ({connectedSenders.size + 1} total):
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  👤 You (Erfan)
                </span>
                {Array.from(connectedSenders.entries()).map(
                  ([senderId, senderName]) => (
                    <span
                      key={senderId}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      👤 {senderName}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Chat Clear Notification */}
            {chatCleared && (
              <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm text-center">
                  💬 Chat history cleared. Starting fresh conversation.
                </p>
              </div>
            )}

            {/* Messages Display */}
            <div className="mb-4 h-64 overflow-y-auto border rounded-lg bg-white p-3">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center text-sm">
                  No messages yet. Start the group conversation!
                </p>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.isFromMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          msg.isFromMe
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <div className="font-medium text-xs mb-1">
                          {msg.isFromMe ? "You (Erfan)" : msg.senderName}
                        </div>
                        <div>{msg.message}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message to the group..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                disabled={connectedSenders.size === 0}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || connectedSenders.size === 0}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">How it works:</h4>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Multiple senders can request connections to you</li>
            <li>Accept or reject each sender individually</li>
            <li>View all accepted senders' locations on one map</li>
            <li>
              Each sender has a different colored marker and tracking path
            </li>
            <li>
              The map automatically fits to show all locations when first opened
            </li>
            <li>
              Use "Reset Map View" to return to the overview of all locations
            </li>
            <li>
              Status shows "📍 Sharing Location" when active and "❌ Not Sharing
              Location" when stopped
            </li>
            <li>
              After accepting connections, use the chat to communicate with
              senders
            </li>
            <li>
              Multiple receivers can join the same group chat and communicate
              together
            </li>
            <li>All participants can see each other's messages in real-time</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Receive;
