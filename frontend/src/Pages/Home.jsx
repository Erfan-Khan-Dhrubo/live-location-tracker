import React from "react";
import { NavLink } from "react-router";
import Receive from "./Receive";

const Home = () => {
  return (
    <div
      className="hero min-h-screen"
      style={{
        backgroundImage:
          "url(https://tse2.mm.bing.net/th/id/OIP.jOSlxBTwOXZENwQq5lY-QQHaEJ?r=0&w=626&h=351&rs=1&pid=ImgDetMain&o=7&rm=3)",
      }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-content text-neutral-content text-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-cyan-100 mb-4">
            Welcome to LiveLink
          </h1>
          <p className="text-center max-w-lg mb-10 text-white">
            Easily connect and share in real-time.
            <br />
            <span className="font-semibold text-white">Send</span>: Start a
            connection and share your messages or location instantly.
            <br />
            <span className="font-semibold ">Receive</span>: Accept connections
            and get updates live.
          </p>
          <div className="flex gap-8 justify-center">
            <NavLink to={"/send"}>
              <button className=" border-2 border-white text-white font-semibold rounded-3xl backdrop-blur-sm bg-white/20 hover:bg-white/30 w-34 py-2">
                Send
              </button>
            </NavLink>
            <NavLink to={"/receive"}>
              <button className=" border-2 border-white text-white font-semibold rounded-3xl backdrop-blur-sm bg-white/20 hover:bg-white/30 w-34 py-2">
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
