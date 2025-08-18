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

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
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

const historyLocationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -34],
  shadowSize: [32, 32],
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
function MapUpdater({ locations, mapRef, myCurrentLocation }) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && map) {
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
        map.invalidateSize();
        if (allPositions.length === 1) {
          map.setView(bounds.getCenter(), 15);
        } else {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
        hasInitialized.current = true;
      }
    }
  }, [locations, map, myCurrentLocation]);

  return null;
}

const Receive = () => {
  const name = "Erfan";
  const room = "56";
  const [connectionRequest, setConnectionRequest] = useState(false);
  const [currentSenderId, setCurrentSenderId] = useState(null);
  const [currentSenderName, setCurrentSenderName] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [connectedSenders, setConnectedSenders] = useState(new Map()); // senderId -> senderName
  const [senderLocations, setSenderLocations] = useState(new Map()); // senderId -> { currentLocation, locationHistory, isSharing }
  const [myName, setMyName] = useState("");
  const [messages, setMessages] = useState([]); // Store chat messages
  const [newMessage, setNewMessage] = useState(""); // Current message input
  const [chatCleared, setChatCleared] = useState(false); // Track if chat was cleared
  const mapRef = useRef(null);
  const [myCurrentLocation, setMyCurrentLocation] = useState(null);
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
    // Send my name to the server
    socket.emit("set_name", name);

    socket.on("request_connection", ({ senderId, senderName }) => {
      console.log(
        `Connection request from sender: ${senderName} (${senderId})`
      );
      setConnectionRequest(true);
      setCurrentSenderId(senderId);
      setCurrentSenderName(senderName);
    });

    // Location sharing events
    socket.on("receive_location", ({ location, senderId, senderName }) => {
      console.log(`Received location from ${senderName}:`, location);

      setSenderLocations((prev) => {
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

    // Listen for chat clear event when sender disconnects
    socket.on("clear_chat", ({ senderId, senderName }) => {
      console.log(`Clearing chat for sender ${senderName}`);
      setMessages([]); // Clear all messages
      setChatCleared(true); // Show notification

      // Hide notification after 3 seconds
      setTimeout(() => {
        setChatCleared(false);
      }, 3000);
    });

    // Listen for messages from senders
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
        navigator.geolocation.clearWatch(mapLocationWatchIdRef.current);
        mapLocationWatchIdRef.current = null;
      }
    };
  }, []);

  // When map is shown, automatically track receiver's own location locally (no emit)
  useEffect(() => {
    if (showMap && "geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          setMyCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
      mapLocationWatchIdRef.current = id;
      return () => {
        if (mapLocationWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(mapLocationWatchIdRef.current);
          mapLocationWatchIdRef.current = null;
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
    if (senderLocations.size === 0) return null;

    const locations = Array.from(senderLocations.entries()).map(
      ([senderId, data]) => ({
        senderId,
        senderName: connectedSenders.get(senderId) || "Unknown",
        ...data,
      })
    );

    return (
      <div className="mt-4">
        <MapContainer
          center={[0, 0]}
          zoom={2}
          style={{ height: "600px", width: "100%" }}
          className="rounded-lg border-2 border-gray-300"
          whenCreated={(map) => (mapRef.current = map)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Receiver's own current location */}
          {myCurrentLocation && (
            <Marker
              position={[
                myCurrentLocation.latitude,
                myCurrentLocation.longitude,
              ]}
              icon={myLocationIcon}
            >
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
            if (!sender.currentLocation) return null;

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

                {/* Line between receiver and sender (Uber-style) */}
                {myCurrentLocation && (
                  <Polyline
                    positions={[
                      [myCurrentLocation.latitude, myCurrentLocation.longitude],
                      [
                        sender.currentLocation.latitude,
                        sender.currentLocation.longitude,
                      ],
                    ]}
                    color={color}
                    weight={4}
                    opacity={0.9}
                    dashArray="6,6"
                  />
                )}

                {/* Location history markers */}
                {sender.locationHistory.slice(0, -1).map((loc, locIndex) => (
                  <Marker
                    key={`${sender.senderId}-${locIndex}`}
                    position={[loc.latitude, loc.longitude]}
                    icon={historyLocationIcon}
                  >
                    <Popup>
                      <div className="text-center">
                        <h4 className="font-semibold">
                          📍 {sender.senderName} - Location #{locIndex + 1}
                        </h4>
                        <p className="text-sm">
                          Lat: {loc.latitude.toFixed(6)}
                        </p>
                        <p className="text-sm">
                          Lng: {loc.longitude.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Time: {new Date(loc.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Tracking path polyline */}
                {sender.locationHistory.length > 1 && (
                  <Polyline
                    positions={sender.locationHistory.map((loc) => [
                      loc.latitude,
                      loc.longitude,
                    ])}
                    color={color}
                    weight={3}
                    opacity={0.7}
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
    <div>
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-green-800 font-semibold mb-2">
          📍 Location Receiver
        </h3>
        <p className="text-green-600 text-sm">
          Receive and view location updates from multiple senders
        </p>
      </div>

      {/* Connection Status */}
      {connectedSenders.size > 0 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium mb-2">
            ✅ Connected to {connectedSenders.size} sender(s):
          </p>
          <div className="space-y-1">
            {Array.from(connectedSenders.entries()).map(
              ([senderId, senderName]) => (
                <div
                  key={senderId}
                  className="flex items-center gap-2 text-green-700 text-sm"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{senderName}</span>
                  <span className="text-xs text-green-500">
                    ({senderId.slice(0, 8)}...)
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {connectionRequest && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <p className="text-blue-800 font-medium mb-3">
            📍 Location Sharing Request
          </p>
          <p className="text-blue-600 text-sm mb-3">
            <strong>{currentSenderName}</strong> wants to share their location
            with you.
          </p>
          <div className="flex gap-2">
            <button
              onClick={accept}
              className="btn bg-green-500 text-white hover:bg-green-600"
            >
              Accept
            </button>
            <button
              onClick={reject}
              className="btn bg-red-500 text-white hover:bg-red-600"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Active Senders Overview */}
      {senderLocations.size > 0 && (
        <div className="mt-6 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-xl font-semibold mb-4">
            📍 Active Location Senders
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {Array.from(senderLocations.entries()).map(
              ([senderId, data], index) => {
                const senderName = connectedSenders.get(senderId) || "Unknown";
                const color = senderColors[index % senderColors.length];

                return (
                  <div
                    key={senderId}
                    className="p-4 bg-white rounded-lg border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                      ></div>
                      <h4 className="font-semibold text-gray-800">
                        {senderName}
                      </h4>
                    </div>

                    {data.currentLocation && (
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          <strong>Lat:</strong>{" "}
                          {data.currentLocation.latitude.toFixed(6)}
                        </p>
                        <p className="text-gray-600">
                          <strong>Lng:</strong>{" "}
                          {data.currentLocation.longitude.toFixed(6)}
                        </p>
                        <p className="text-gray-500">
                          <strong>Updated:</strong>{" "}
                          {new Date(
                            data.currentLocation.timestamp
                          ).toLocaleTimeString()}
                        </p>
                        <p className="text-gray-500">
                          <strong>Points:</strong> {data.locationHistory.length}
                        </p>
                      </div>
                    )}

                    <div className="mt-2">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          data.isSharing
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {data.isSharing
                          ? "📍 Sharing Location"
                          : "❌ Not Sharing Location"}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setShowMap(true)}
              className={`px-4 py-2 rounded-lg font-medium ${
                showMap
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              View Map
            </button>
            <button
              onClick={() => setShowMap(false)}
              className={`px-4 py-2 rounded-lg font-medium ${
                !showMap
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Hide Map
            </button>
            {/* Reset Map View removed */}
          </div>

          {showMap && renderLeafletMap()}
        </div>
      )}

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
          <li>Each sender has a different colored marker and tracking path</li>
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
  );
};

export default Receive;
