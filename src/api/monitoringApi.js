import { InfrastructureObject } from "../domain/InfrastructureObject.js";
import { API_CONFIG } from "../utils/constants.js";
import { buildApiUrl, requestJson } from "./httpClient.js";

const markerIconsByType = {
  car: "/images/car_marker.svg",
  warehouse: "/images/warehouse_marker.svg",
  "fuel-station": "/images/fuel_station_marker.svg",
  drone: "/images/drone_marker.svg",
};

function normalizeObject(payload = {}) {
  return new InfrastructureObject({
    ...payload,
    icon: payload.icon ?? markerIconsByType[payload.type] ?? "/images/warehouse_marker.svg",
    static: payload.static ?? [],
    telemetry: payload.telemetry ?? [],
  }).toDTO();
}

function normalizeEvent(payload = {}) {
  const event = payload.event && typeof payload.event === "object" ? payload.event : payload;

  if (event.object) {
    return {
      ...event,
      object: normalizeObject(event.object),
    };
  }

  return event;
}

function subscribeSse(callback) {
  const source = new EventSource(buildApiUrl(API_CONFIG.eventsEndpoint));
  const handleMessage = (event) => {
    if (event.data) {
      callback(normalizeEvent(JSON.parse(event.data)));
    }
  };

  source.addEventListener("message", handleMessage);
  source.addEventListener("created", handleMessage);
  source.addEventListener("updated", handleMessage);
  source.addEventListener("deleted", handleMessage);

  return () => {
    source.removeEventListener("message", handleMessage);
    source.removeEventListener("created", handleMessage);
    source.removeEventListener("updated", handleMessage);
    source.removeEventListener("deleted", handleMessage);
    source.close();
  };
}

function subscribeWebSocket(callback) {
  const url = new URL(buildApiUrl(API_CONFIG.eventsEndpoint));
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

  const socket = new WebSocket(url.toString());
  socket.addEventListener("message", (event) => {
    callback(normalizeEvent(JSON.parse(event.data)));
  });

  return () => socket.close();
}

export const monitoringApi = {
  async getSnapshot() {
    const payload = await requestJson(API_CONFIG.objectsEndpoint);

    return {
      objects: Array.isArray(payload.objects) ? payload.objects.map(normalizeObject) : [],
      maxObjects: payload.maxObjects,
    };
  },

  subscribe(callback) {
    if (API_CONFIG.realtimeTransport === "off") {
      return () => {};
    }

    return API_CONFIG.realtimeTransport === "ws"
      ? subscribeWebSocket(callback)
      : subscribeSse(callback);
  },

  addObject(payload) {
    return requestJson(API_CONFIG.objectsEndpoint, {
      method: "POST",
      body: payload,
    });
  },

  updateObject(id, patch) {
    return requestJson(`${API_CONFIG.objectsEndpoint}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: patch,
    });
  },

  removeObject(id) {
    return requestJson(`${API_CONFIG.objectsEndpoint}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
