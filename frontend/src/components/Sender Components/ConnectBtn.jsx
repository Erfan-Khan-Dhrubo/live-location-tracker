const ConnectBtn = ({
  requestConnect,
  disconnectFromReceivers,
  hasInitiatedConnection,
}) => {
  return (
    <button
      onClick={
        hasInitiatedConnection ? disconnectFromReceivers : requestConnect
      }
      className={`btn ${
        hasInitiatedConnection
          ? "bg-red-500 hover:bg-red-600"
          : "bg-blue-500 hover:bg-blue-600"
      } text-white`}
    >
      {hasInitiatedConnection
        ? "Disconnect from Receivers"
        : "Connect to Receivers"}
    </button>
  );
};

export default ConnectBtn;
