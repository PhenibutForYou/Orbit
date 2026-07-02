import { useEffect, useState } from "react";
import { ObjectsProvider } from "./state/ObjectsContext.jsx";
import { TopBar } from "./components/layout/TopBar.jsx";
import { AppLoader } from "./components/layout/AppLoader.jsx";
import { MonitoringPage } from "./components/monitoring/MonitoringPage.jsx";
import { ArchivePageLive } from "./components/archive/ArchivePageLive.jsx";

export function App() {
  const [activePage, setActivePage] = useState("monitoring");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsLoaded(true), 450);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <ObjectsProvider>
      <AppLoader hidden={isLoaded} />
      <TopBar activePage={activePage} onPageChange={setActivePage} />
      <main className="page-content">
        <section
          className={`page-frame ${activePage === "monitoring" ? "page-frame--active" : ""}`}
          aria-hidden={activePage !== "monitoring"}
        >
          <MonitoringPage />
        </section>
        <section
          className={`page-frame ${activePage === "archive" ? "page-frame--active" : ""}`}
          aria-hidden={activePage !== "archive"}
        >
          <ArchivePageLive />
        </section>
      </main>
    </ObjectsProvider>
  );
}
