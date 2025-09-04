import React from "react";

const ReceiverMsgInput = ({
  newMessage,
  setNewMessage,
  connectedSenders,
  sendMessage,
}) => {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
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
  );
};

export default ReceiverMsgInput;
