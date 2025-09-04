import React from "react";

const SenderConnectionRequest = ({
  connectionRequest,
  currentSenderName,
  accept,
  reject,
}) => {
  return (
    <div>
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
    </div>
  );
};

export default SenderConnectionRequest;
