import { createBrowserRouter } from "react-router";
import Root from "../Root/Root";
import Home from "../Pages/Home";
import Send from "../Pages/Send";
import Receive from "../Pages/Receive";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        path: "/",
        Component: Home,
      },
      {
        path: "/send",
        Component: Send,
      },
      {
        path: "/receive",
        Component: Receive,
      },
    ],
  },
]);
