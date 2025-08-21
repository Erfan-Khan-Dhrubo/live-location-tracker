import React from "react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router";

const Root = () => {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <Navbar></Navbar>
      <div className="flex-1 flex">
        <Outlet></Outlet>
      </div>
    </div>
  );
};

export default Root;
