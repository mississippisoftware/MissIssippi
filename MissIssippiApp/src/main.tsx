import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "primeicons/primeicons.css";
import "./styles/portal-theme.css";                             // portal design tokens + component classes

import router from "./routes"; // your react-router config
import React from "react";

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
