import { getStatusLabel } from "../utils/status.js";

export class InfrastructureObject {
  constructor(payload) {
    this.id = payload.id;
    this.templateId = payload.templateId ?? payload.type ?? payload.id;
    this.type = payload.type;
    this.name = payload.name;
    this.description = payload.description ?? "";
    this.status = payload.status ?? "nodata";
    this.icon = payload.icon;
    this.updatedAt = payload.updatedAt ?? payload.lastUpdated ?? new Date().toISOString();
    this.coordinates = payload.coordinates;
    this.telemetry = payload.telemetry ?? [];
    this.static = payload.static ?? [];
  }

  updateCoordinates(coordinates) {
    this.coordinates = coordinates;
    return this;
  }

  updateTelemetry(telemetry) {
    this.telemetry = telemetry;
    return this;
  }

  updateStatus(status) {
    this.status = status;
    return this;
  }

  updateTelemetryItems(updates) {
    const updatesByKey = new Map(updates.map((item) => [item.key, item]));
    this.telemetry = this.telemetry.map((item) => {
      const update = updatesByKey.get(item.key);

      if (!update) {
        return item;
      }

      return {
        ...item,
        ...update,
        updatedAt: update.updatedAt ?? this.updatedAt,
        updatedToken: update.updatedToken ?? `${Date.now()}-${item.key}`,
      };
    });

    return this;
  }

  update(patch) {
    if (patch.coordinates) {
      this.updateCoordinates(patch.coordinates);
    }

    if (patch.telemetry) {
      this.updateTelemetry(patch.telemetry);
    }

    if (patch.telemetryUpdates) {
      this.updateTelemetryItems(patch.telemetryUpdates);
    }

    if (patch.status) {
      this.updateStatus(patch.status);
    }

    for (const [key, value] of Object.entries(patch)) {
      if (["coordinates", "telemetry", "telemetryUpdates", "status"].includes(key)) {
        continue;
      }

      this[key] = value;
    }

    return this;
  }

  clone() {
    return new InfrastructureObject(this.toDTO());
  }

  toDTO() {
    const updatedDate = new Date(this.updatedAt);
    const time = updatedDate.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const lastUpdate = `${updatedDate.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}, ${time}`;
    const statusText = getStatusLabel(this.status);

    return {
      id: this.id,
      templateId: this.templateId,
      type: this.type,
      name: this.name,
      description: this.description,
      status: this.status,
      statusText,
      statusClass: this.status,
      icon: this.icon,
      time,
      ago: "только что",
      coordinates: this.coordinates,
      updatedAt: this.updatedAt,
      lastUpdated: this.updatedAt,
      lastUpdate,
      telemetry: this.telemetry.map((item) => ({ ...item })),
      static: this.static.map((item) => ({ ...item })),
    };
  }
}
