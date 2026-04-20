import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { PrimeReactProvider } from "primereact/api";
import Sidebar from "./layout/Sidebar/Sidebar";
import Topbar from "./layout/Topbar";
import pt from "./styles/portal-passthrough";

export default function App() {
  const mobileQuery = "(max-width: 991.98px)";
  const getDefaultSidebarOpen = () => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia(mobileQuery).matches;
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(getDefaultSidebarOpen);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(mobileQuery);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsSidebarOpen(!event.matches);
    };

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else {
      media.addListener(handleChange);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, []);

  return (
    <PrimeReactProvider value={{ unstyled: true, pt }}>
      <div className={`portal-theme app-layout${isSidebarOpen ? "" : " sidebar-collapsed"}`}>
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((prev) => !prev)} />
        <Topbar />
        <div className="content-wrapper">
          <div className="content-container">
            <Outlet />
          </div>
        </div>
      </div>
    </PrimeReactProvider>
  );
}
