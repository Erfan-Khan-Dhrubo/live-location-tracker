import React from "react";

const SenderMessageDisplay = ({ messages }) => {
  return (
    <div>
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
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <div className="font-medium text-xs mb-1">
                    {msg.isFromMe ? "You (Farah)" : msg.senderName}
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
    </div>
  );
};

export default SenderMessageDisplay;
