import React from "react";

const LocationSharingBtn = ({
  connected,
  isSharingLocation,
  connectedReceivers,
  startLocationSharing,
  stopLocationSharing,
}) => {
  return (
    <div>
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
    </div>
  );
};

export default LocationSharingBtn;
