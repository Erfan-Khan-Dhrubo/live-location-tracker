import React from "react";

const ReceiverInfo = ({ connectedReceivers }) => {
  return (
    <div>
      {connectedReceivers.size > 0 && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium mb-2">
            ✅ Connected to {connectedReceivers.size} receiver(s):
          </p>
          <div className="space-y-1">
            {/* Array.from() converts it into an array, so we can use .map() in JSX. 
            connectedReceivers.entries() gives an iterator of [key, value] pairs from the Map.*/}
            {Array.from(connectedReceivers.entries()).map(
              ([receiverId, receiverName]) => (
                <div
                  key={receiverId}
                  className="flex items-center gap-2 text-green-700 text-sm"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{receiverName}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiverInfo;
