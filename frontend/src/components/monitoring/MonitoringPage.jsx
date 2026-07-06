import { useObjects } from "../../state/ObjectsContext.jsx";
import { MapPanel } from "../map/MapPanel.jsx";
import { ObjectDetails } from "./ObjectDetails.jsx";
import { ObjectsPanel } from "./ObjectsPanel.jsx";
import { StatusMetricsGrid } from "./StatusMetricsGrid.jsx";

export function MonitoringPage() {
  const { objects, maxObjectsCount } = useObjects();

  return (
    <div className="monitoring-layout">
      <StatusMetricsGrid objects={objects} maxObjectsCount={maxObjectsCount} />
      <section className="dashboard-grid">
        <ObjectsPanel />
        <MapPanel />
        <ObjectDetails />
      </section>
    </div>
  );
}
