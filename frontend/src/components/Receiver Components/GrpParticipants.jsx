import React from "react";

const GrpParticipants = ({ connectedSenders }) => {
  return (
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
  );
};

export default GrpParticipants;
