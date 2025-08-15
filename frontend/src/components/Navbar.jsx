import React from "react";
import { NavLink } from "react-router";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between bg-[#5B696C] px-8 py-4 shadow-md ">
      {/* Left side - Logo/Title */}
      <NavLink to={"/"}>
        <h1 className="text-blue-900 text-2xl font-bold tracking-wide">
          Navbar
        </h1>
      </NavLink>

      {/* Right side - Buttons */}
      <div className="flex space-x-4">
        <NavLink
          to={"/send"}
          className="text-white w-26 border btn bg-[#5B696C] border-white rounded-3xl hover:bg-[#3A4D57]"
        >
          Send
        </NavLink>
        <NavLink
          to={"/receive"}
          className="text-white w-26 border btn bg-[#5B696C] border-white rounded-3xl hover:bg-[#3A4D57]"
        >
          Receive
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
