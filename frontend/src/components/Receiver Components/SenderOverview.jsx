import React from "react";

const SenderOverview = ({
  senderLocations,
  connectedSenders,
  senderColors,
  showMap,
  setShowMap,
  renderLeafletMap,
}) => {
  return (
    <div>
      {/* Check if we have any sender locations */}
      {senderLocations.size > 0 && (
        <div className="mt-6 p-6 border rounded-lg bg-gray-50">
          {/* Section heading */}
          <h3 className="text-xl text-black font-semibold mb-4">
            📍 Active Location Senders
          </h3>

          {/* Grid layout: responsive columns (1 on small, 2 on medium, 3 on large screens) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Loop through all sender locations (Map -> entries = [key, value]) */}
            {Array.from(senderLocations.entries()).map(
              ([senderId, data], index) => {
                // Get sender name from connectedSenders Map, fallback to "Unknown"
                const senderName = connectedSenders.get(senderId) || "Unknown";

                // Assign a color from senderColors array (rotate by index)
                const color = senderColors[index % senderColors.length];

                return (
                  <div
                    key={senderId} // React key for each sender card
                    className="p-4 bg-white rounded-lg border"
                  >
                    {/* Sender header with color dot and name */}
                    <div className="flex items-center gap-2 mb-2">
                      {/* Colored dot (unique for each sender) */}
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                      ></div>
                      <h4 className="font-semibold text-gray-800">
                        {senderName}
                      </h4>
                    </div>

                    {/* Show current location details if available */}
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
                      </div>
                    )}

                    {/* Status badge showing if user is sharing or not */}
                    <div className="mt-2">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          data.isSharing
                            ? "bg-green-100 text-green-800" // green if sharing
                            : "bg-gray-100 text-gray-800" // gray if not
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

          {/* Buttons to toggle map visibility */}
          <div className="flex gap-3 mb-4">
            {/* Show map button */}
            <button
              onClick={() => setShowMap(true)}
              className={`px-4 py-2 rounded-lg font-medium ${
                showMap
                  ? "bg-blue-600 text-white" // active
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300" // inactive
              }`}
            >
              View Map
            </button>

            {/* Hide map button */}
            <button
              onClick={() => setShowMap(false)}
              className={`px-4 py-2 rounded-lg font-medium ${
                !showMap
                  ? "bg-blue-600 text-white" // active
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300" // inactive
              }`}
            >
              Hide Map
            </button>
          </div>

          {/* Conditionally render map if showMap is true */}
          {showMap && renderLeafletMap()}
        </div>
      )}
    </div>
  );
};

export default SenderOverview;
