import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import 'bootswatch/dist/lumen/bootstrap.min.css';
import "primereact/resources/themes/lara-light-indigo/theme.css"; // PrimeReact theme
import "primereact/resources/primereact.min.css";               // core PrimeReact css
import "primeicons/primeicons.css";                             // icons
import "./theme.css";                                           // custom overrides

import router from "./routes"; // your react-router config
import React from "react";

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);