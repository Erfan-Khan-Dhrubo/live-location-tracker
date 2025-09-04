import React from "react";

const ReceiverInstructions = () => {
  return (
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
        <li>Use "Reset Map View" to return to the overview of all locations</li>
        <li>
          Status shows "📍 Sharing Location" when active and "❌ Not Sharing{" "}
          <br />
          Location" when stopped
        </li>
        <li>
          After accepting connections, use the chat to communicate with senders
        </li>
        <li>
          Multiple receivers can join the same group chat and communicate
          together
        </li>
        <li>All participants can see each other's messages in real-time</li>
      </ol>
    </div>
  );
};

export default ReceiverInstructions;
