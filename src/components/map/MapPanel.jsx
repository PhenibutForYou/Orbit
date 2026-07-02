import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useObjects } from "../../state/ObjectsContext.jsx";
import {
  formatCoordinatesPair,
  formatMapCoordinate,
  mapSurfacePositionToCoordinates,
} from "../../utils/coordinates.js";
import { MapMarker } from "./MapMarker.jsx";

export function MapPanel() {
  const { objects, activeObjectId, markerPulse, setActiveObject } = useObjects();
  const viewportRef = useRef(null);
  const surfaceRef = useRef(null);
  const coordinatesValueRef = useRef(null);
  const dragState = useRef({
    activePointerId: null,
    dragStartX: 0,
    dragStartY: 0,
    originOffsetX: 0,
    originOffsetY: 0,
  });
  const boundsRef = useRef({ minX: 0, minY: 0 });
  const initializedRef = useRef(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const objectsById = useMemo(() => new Map(objects.map((object) => [object.id, object])), [objects]);

  const setCoordinatesLabel = (value) => {
    if (coordinatesValueRef.current && coordinatesValueRef.current.textContent !== value) {
      coordinatesValueRef.current.textContent = value;
    }
  };

  const clampOffset = (nextOffset, nextBounds = boundsRef.current) => ({
    x: Math.min(Math.max(nextOffset.x, nextBounds.minX), 0),
    y: Math.min(Math.max(nextOffset.y, nextBounds.minY), 0),
  });

  useEffect(() => {
    const syncBounds = () => {
      const viewport = viewportRef.current;
      const surface = surfaceRef.current;

      if (!viewport || !surface) {
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const surfaceRect = surface.getBoundingClientRect();
      const nextBounds = {
        minX: Math.min(0, viewportRect.width - surfaceRect.width),
        minY: Math.min(0, viewportRect.height - surfaceRect.height),
      };

      boundsRef.current = nextBounds;
      setOffset((currentOffset) => {
        if (!initializedRef.current) {
          initializedRef.current = true;
          return clampOffset({
            x: Math.round((viewportRect.width - surfaceRect.width) / 2),
            y: Math.round((viewportRect.height - surfaceRect.height) / 2),
          }, nextBounds);
        }

        return clampOffset(currentOffset, nextBounds);
      });
    };

    syncBounds();
    window.addEventListener("resize", syncBounds);
    return () => window.removeEventListener("resize", syncBounds);
  }, []);

  const updatePointerCoordinates = (clientX, clientY) => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const marker = document.elementFromPoint(clientX, clientY)?.closest?.(".map-marker");

    if (marker instanceof HTMLElement) {
      const object = objectsById.get(marker.getAttribute("data-object-id"));

      if (object) {
        setCoordinatesLabel(formatCoordinatesPair(object.coordinates));
        return;
      }
    }

    const viewportRect = viewport.getBoundingClientRect();
    const surfaceLeft = clientX - viewportRect.left - offset.x;
    const surfaceTop = clientY - viewportRect.top - offset.y;
    const { x, y } = mapSurfacePositionToCoordinates(surfaceLeft, surfaceTop);
    setCoordinatesLabel(`${formatMapCoordinate(x)}, ${formatMapCoordinate(y)}`);
  };

  const selectObject = useCallback((id) => {
    setActiveObject(id, { pulse: true });
  }, [setActiveObject]);

  return (
    <section className="panel map-panel" aria-label="Карта мониторинга">
      <div
        className={`map-viewport ${dragging ? "is-dragging" : ""}`}
        ref={viewportRef}
        onPointerDown={(event) => {
          if (event.button !== 0 || event.target.closest(".map-marker")) {
            return;
          }

          dragState.current = {
            activePointerId: event.pointerId,
            dragStartX: event.clientX,
            dragStartY: event.clientY,
            originOffsetX: offset.x,
            originOffsetY: offset.y,
          };
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          updatePointerCoordinates(event.clientX, event.clientY);

          if (!dragging || event.pointerId !== dragState.current.activePointerId) {
            return;
          }

          const deltaX = event.clientX - dragState.current.dragStartX;
          const deltaY = event.clientY - dragState.current.dragStartY;
          setOffset(clampOffset({
            x: dragState.current.originOffsetX + deltaX,
            y: dragState.current.originOffsetY + deltaY,
          }));
        }}
        onPointerUp={(event) => {
          if (event.pointerId === dragState.current.activePointerId) {
            setDragging(false);
            dragState.current.activePointerId = null;
          }
        }}
        onPointerCancel={() => {
          setDragging(false);
          dragState.current.activePointerId = null;
        }}
        onPointerLeave={() => setCoordinatesLabel("--, --")}
        onLostPointerCapture={() => {
          setDragging(false);
          dragState.current.activePointerId = null;
        }}
      >
        <div
          className="map-surface"
          ref={surfaceRef}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        >
          <img
            className="map-surface__image"
            src="/images/map-background.png"
            alt="Карта территории"
            draggable="false"
          />
          <div className="map-surface__markers">
            {objects.map((object) => (
              <MapMarker
                key={object.id}
                object={object}
                active={object.id === activeObjectId}
                pulseToken={markerPulse.objectId === object.id ? markerPulse.token : 0}
                onSelect={selectObject}
              />
            ))}
          </div>
        </div>
        <div className="map-coordinates">
          <strong className="map-coordinates__value" ref={coordinatesValueRef}>--, --</strong>
        </div>
      </div>
    </section>
  );
}
