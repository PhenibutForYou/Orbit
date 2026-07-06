import { createRandomCoordinates, parseCartesianCoordinates } from "../utils/coordinates.js";

const EVENT_INTERVAL_MS = 1000;
const MIN_OBJECTS_COUNT = 4;
const MOCK_MAX_OBJECTS = 4;

const objectTemplates = [
  {
    type: "fuel-station",
    icon: "/images/azs_icon.svg",
    namePrefix: "АЗС",
    description: "Заправочная точка логистического маршрута",
    static: [
      { label: "Категория", value: "Топливная инфраструктура" },
      { label: "Тип топлива", value: "ДТ / АИ-95" },
      { label: "Ответственный", value: "Служба снабжения" },
    ],
    telemetry: [
      { key: "fuelLevel", label: "Запас топлива", unit: "%", min: 0, max: 100, value: 72 },
      { key: "pumpLoad", label: "Нагрузка насосов", unit: "%", min: 0, max: 100, value: 38 },
      { key: "queue", label: "Очередь", unit: "ед.", min: 0, max: 12, value: 2 },
      { key: "power", label: "Питание", unit: "%", min: 0, max: 100, value: 96 },
    ],
  },
  {
    type: "car",
    icon: "/images/car_icon.svg",
    namePrefix: "Грузовик",
    description: "Транспортная единица грузового маршрута",
    static: [
      { label: "Категория", value: "Грузовой транспорт" },
      { label: "Маршрут", value: "Склад — терминал" },
      { label: "Ответственный", value: "Логистика" },
    ],
    telemetry: [
      { key: "fuel", label: "Топливо", unit: "%", min: 0, max: 100, value: 64 },
      { key: "speed", label: "Скорость", unit: "км/ч", min: 0, max: 120, value: 48 },
      { key: "engineTemp", label: "Температура двигателя", unit: "°C", min: 40, max: 130, value: 86 },
      { key: "cargoLoad", label: "Загрузка кузова", unit: "%", min: 0, max: 100, value: 78 },
    ],
  },
  {
    type: "drone",
    icon: "/images/drone_icon.svg",
    namePrefix: "Дрон",
    description: "Воздушный контроль маршрута и склада",
    static: [
      { label: "Категория", value: "БПЛА" },
      { label: "Режим", value: "Патрулирование" },
      { label: "Ответственный", value: "Оператор мониторинга" },
    ],
    telemetry: [
      { key: "battery", label: "Батарея", unit: "%", min: 0, max: 100, value: 82 },
      { key: "altitude", label: "Высота", unit: "м", min: 0, max: 300, value: 120 },
      { key: "signal", label: "Сигнал", unit: "%", min: 0, max: 100, value: 91 },
      { key: "speed", label: "Скорость", unit: "км/ч", min: 0, max: 90, value: 36 },
    ],
  },
  {
    type: "warehouse",
    icon: "/images/warehouse_icon.svg",
    namePrefix: "Склад",
    description: "Складской узел грузовой инфраструктуры",
    static: [
      { label: "Категория", value: "Складская инфраструктура" },
      { label: "Зона", value: "Северный терминал" },
      { label: "Ответственный", value: "Складская служба" },
    ],
    telemetry: [
      { key: "occupancy", label: "Заполненность", unit: "%", min: 0, max: 100, value: 57 },
      { key: "temperature", label: "Температура", unit: "°C", min: -10, max: 40, value: 18 },
      { key: "humidity", label: "Влажность", unit: "%", min: 0, max: 100, value: 44 },
      { key: "gates", label: "Свободные ворота", unit: "ед.", min: 0, max: 8, value: 5 },
    ],
  },
];

const randomInt = (min, max) => Math.round(min + Math.random() * (max - min));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const formatValue = (item, value) => `${Math.round(value)}${item.unit}`;

const toProgress = (item, value) => {
  const range = item.max - item.min;
  return range <= 0 ? 0 : Math.round(((value - item.min) / range) * 100);
};

const getTelemetryStatus = (item, value) => {
  const progress = toProgress(item, value);

  if (["fuel", "fuelLevel", "battery", "signal", "power", "gates"].includes(item.key)) {
    if (progress < 20) return "alert";
    if (progress < 45) return "warning";
    return "normal";
  }

  if (["engineTemp", "temperature", "pumpLoad", "occupancy", "humidity", "queue"].includes(item.key)) {
    if (progress > 85) return "alert";
    if (progress > 65) return "warning";
    return "normal";
  }

  return "normal";
};

const getObjectStatus = (telemetry) => {
  if (telemetry.some((item) => item.status === "alert")) {
    return "alert";
  }

  if (telemetry.some((item) => item.status === "warning")) {
    return "warning";
  }

  return "normal";
};

const normalizeTelemetryItem = (item) => ({
  key: item.key,
  label: item.label,
  unit: item.unit,
  value: formatValue(item, item.value),
  rawValue: item.value,
  progress: toProgress(item, item.value),
  status: getTelemetryStatus(item, item.value),
  updatedAt: new Date().toISOString(),
  updatedToken: `${Date.now()}-${item.key}`,
});

const createObject = (index) => {
  const template = objectTemplates[index % objectTemplates.length];
  const telemetry = template.telemetry.map((item) => {
    const initialValue = clamp(
      item.value + randomInt(-8, 8),
      item.min,
      item.max,
    );

    return normalizeTelemetryItem({ ...item, value: initialValue });
  });

  return {
    id: `mock-${Date.now()}-${index}-${randomInt(100, 999)}`,
    templateId: template.type,
    type: template.type,
    name: `${template.namePrefix}-${String(index + 1).padStart(2, "0")}`,
    description: template.description,
    status: getObjectStatus(telemetry),
    icon: template.icon,
    coordinates: createRandomCoordinates(),
    telemetry,
    static: template.static,
    updatedAt: new Date().toISOString(),
  };
};

const moveCoordinates = (coordinates, type) => {
  if (!["car", "drone"].includes(type)) {
    return coordinates;
  }

  const parsed = parseCartesianCoordinates(coordinates);

  if (!parsed) {
    return createRandomCoordinates();
  }

  const x = clamp(parsed.x + randomInt(-4, 4), -80, 80).toFixed(5);
  const y = clamp(parsed.y + randomInt(-4, 4), -80, 80).toFixed(5);

  return `${x}, ${y}`;
};

const mutateTelemetry = (object) => {
  const template = objectTemplates.find((item) => item.type === object.type);

  if (!template) {
    return object.telemetry;
  }

  return object.telemetry.map((currentItem) => {
    const templateItem = template.telemetry.find((item) => item.key === currentItem.key);

    if (!templateItem) {
      return currentItem;
    }

    const rawValue = Number.isFinite(currentItem.rawValue)
      ? currentItem.rawValue
      : templateItem.value;
    const nextValue = clamp(
      rawValue + randomInt(-10, 10),
      templateItem.min,
      templateItem.max,
    );

    return normalizeTelemetryItem({ ...templateItem, value: nextValue });
  });
};

class DevMonitoringBackend {
  constructor() {
    this.objects = Array.from({ length: MIN_OBJECTS_COUNT }, (_, index) => createObject(index));
    this.listeners = new Set();
    this.intervalId = null;
    this.tick = 0;
    this.nextIndex = this.objects.length;
  }

  async getSnapshot() {
    return {
      objects: this.objects.map((object) => ({ ...object })),
      maxObjects: MOCK_MAX_OBJECTS,
    };
  }

  subscribe(callback) {
    this.listeners.add(callback);
    this.start();

    return () => {
      this.listeners.delete(callback);

      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  start() {
    if (this.intervalId) {
      return;
    }

    this.intervalId = window.setInterval(() => {
      this.emitNextEvent();
    }, EVENT_INTERVAL_MS);
  }

  stop() {
    if (!this.intervalId) {
      return;
    }

    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }

  emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  emitNextEvent() {
    this.tick += 1;

    if (this.tick % 9 === 0 && this.objects.length < MOCK_MAX_OBJECTS) {
      const object = createObject(this.nextIndex);
      this.nextIndex += 1;
      this.objects = [...this.objects, object];
      this.emit({ type: "created", object });
      return;
    }

    if (this.tick % 14 === 0 && this.objects.length > MIN_OBJECTS_COUNT) {
      const index = randomInt(0, this.objects.length - 1);
      const object = this.objects[index];
      this.objects = this.objects.filter((item) => item.id !== object.id);
      this.emit({
        type: "deleted",
        objectId: object.id,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    if (this.objects.length === 0) {
      return;
    }

    const index = randomInt(0, this.objects.length - 1);
    const object = this.objects[index];
    const updatedAt = new Date().toISOString();
    const telemetry = mutateTelemetry(object);
    const patch = {
      coordinates: moveCoordinates(object.coordinates, object.type),
      telemetry,
      status: getObjectStatus(telemetry),
      updatedAt,
    };

    this.objects = this.objects.map((item) => (
      item.id === object.id ? { ...item, ...patch } : item
    ));

    this.emit({
      type: "updated",
      objectId: object.id,
      patch,
    });
  }
}

export const devMonitoringBackend = new DevMonitoringBackend();
