import React from "react";
import { NavLink } from "react-router";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between bg-blue-200 px-8 py-6 shadow-md ">
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
          className="text-blue-900 w-26 border btn bg-blue-200 border-blue-900 shadow-neutral-100 rounded-3xl hover:bg-blue-500 hover:text-white"
        >
          Send
        </NavLink>
        <NavLink
          to={"/receive"}
          className="text-blue-900 w-26 border btn bg-blue-200 border-blue-900 shadow-neutral-100 rounded-3xl hover:bg-blue-500 hover:text-white"
        >
          Receive
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
