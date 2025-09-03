import React from "react";

const SenderInfo = ({ connectedSenders }) => {
  return (
    <div>
      {connectedSenders.size > 0 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium mb-2">
            ✅ Connected to {connectedSenders.size} sender(s):
          </p>
          <div className="space-y-1">
            {/* Converts the Map (connectedSenders) into an array of [senderId, senderName] pairs, then loops through them with .map() */}
            {Array.from(connectedSenders.entries()).map(
              ([senderId, senderName]) => (
                <div
                  key={senderId}
                  className="flex items-center gap-2 text-green-700 text-sm"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{senderName}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SenderInfo;
