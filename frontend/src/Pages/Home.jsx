import React from "react";
import { NavLink } from "react-router";
import Receive from "./Receive";

const Home = () => {
  return (
    <div className="flex justify-center items-center flex-1 bg-blue-50">
      <div className="text-neutral-content text-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold  mb-4 text-blue-900">
            Welcome to LiveLink
          </h1>
          <p className="text-center max-w-lg mb-10 text-blue-700">
            Easily connect and share in real-time.
            <br />
            <span className="font-bold ">Send</span>: Start a connection and
            share your messages or location instantly.
            <br />
            <span className="font-bold ">Receive</span>: Accept connections and
            get updates live.
          </p>
          <div className="flex gap-8 justify-center">
            <NavLink to={"/send"}>
              <button className=" border-2 border-blue-700 text-blue-700  font-semibold rounded-3xl backdrop-blur-sm bg-white/20 hover:bg-white/30 w-34 py-2">
                Send
              </button>
            </NavLink>
            <NavLink to={"/receive"}>
              <button className=" border-2 border-blue-700 text-blue-700 font-semibold rounded-3xl backdrop-blur-sm bg-white/20 hover:bg-white/30 w-34 py-2">
                Receive
              </button>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
