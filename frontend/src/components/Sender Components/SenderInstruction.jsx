import React from "react";

const SenderInstruction = () => {
  return (
    <div className=" p-4 border border-blue-200 rounded-lg">
      <h4 className="font-semibold text-gray-800 mb-2">How it works:</h4>
      <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
        <li>Click "Connect to Receivers" to send connection requests</li>
        <li>
          Receivers will see your request and can accept/reject independently
        </li>
        <li>
          If one receiver rejects, others can still accept your connection
        </li>
        <li>Only accepted receivers will receive your location updates</li>
        <li>You can see exactly which receivers are connected</li>
        <li>
          The disconnect button stays active until you manually disconnect
        </li>
        <li>
          Click "Disconnect from Receivers" to end all connections and reset
        </li>
        <li>
          Disconnecting will stop location sharing and reset to initial state
        </li>
        <li>After connecting, use the chat to communicate with receivers</li>
        <li>
          Multiple receivers can join the group chat and communicate together
        </li>
        <li>All participants can see each other's messages in real-time</li>
      </ol>
    </div>
  );
};

export default SenderInstruction;
