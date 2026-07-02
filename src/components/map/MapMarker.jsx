import { memo, useEffect, useRef, useState } from "react";
import { mapCoordinatesToSurfacePosition } from "../../utils/coordinates.js";

function MapMarkerComponent({ object, active, pulseToken, onSelect }) {
  const [entered, setEntered] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const pulseTimeoutRef = useRef(null);
  const { left, top } = mapCoordinatesToSurfacePosition(object.coordinates);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => () => {
    if (pulseTimeoutRef.current) {
      window.clearTimeout(pulseTimeoutRef.current);
    }
  }, []);

  const triggerPulse = () => {
    if (pulseTimeoutRef.current) {
      window.clearTimeout(pulseTimeoutRef.current);
    }

    setPulseKey((currentKey) => currentKey + 1);
    pulseTimeoutRef.current = window.setTimeout(() => {
      setPulseKey(0);
      pulseTimeoutRef.current = null;
    }, 680);
  };

  useEffect(() => {
    if (pulseToken > 0) {
      triggerPulse();
    }
  }, [pulseToken]);

  return (
    <button
      type="button"
      className={[
        "map-marker",
        `map-marker--${object.statusClass}`,
        active ? "map-marker--active" : "",
        entered ? "map-marker--enter-active" : "map-marker--enter",
        object.uiState === "removing" ? "map-marker--removing" : "",
        pulseKey > 0 ? "map-marker--pulse" : "",
      ].filter(Boolean).join(" ")}
      style={{ left: `${left}px`, top: `${top}px` }}
      data-object-id={object.id}
      aria-label={`${object.name}: ${object.status}`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (object.uiState === "removing") {
          return;
        }
        if (active) {
          return;
        }
        onSelect(object.id);
      }}
    >
      {pulseKey > 0 ? <span className="map-marker__pulse-ring" key={pulseKey} aria-hidden="true" /> : null}
      <svg className="map-marker__pin" viewBox="0 0 64 80" aria-hidden="true">
        <path
          className="map-marker__body"
          d="M32 4 C17 4 6 16 6 31 C6 50 32 76 32 76 C32 76 58 50 58 31 C58 16 47 4 32 4Z"
        />
      </svg>
      <span className="map-marker__icon-shell">
        <img className="map-marker__icon" src={object.icon} alt="" />
      </span>
    </button>
  );
}

export const MapMarker = memo(MapMarkerComponent);
