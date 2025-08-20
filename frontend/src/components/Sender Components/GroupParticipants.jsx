import React from "react";

const GroupParticipants = ({ connectedReceivers }) => {
  return (
    <div>
      <div className="mb-3 py-3 px-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-xs font-medium mb-1">
          Group Participants ({connectedReceivers.size + 1} total):
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            👤 You (Farah)
          </span>
          {Array.from(connectedReceivers.entries()).map(
            ([receiverId, receiverName]) => (
              <span
                key={receiverId}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800"
              >
                👤 {receiverName}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupParticipants;
