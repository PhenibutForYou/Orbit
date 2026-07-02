const tabs = Array.from(document.querySelectorAll(".nav-tabs__item"));
const tabsContainer = document.querySelector(".nav-tabs");
const tabsHighlight = document.querySelector(".nav-tabs__highlight");
const pages = Array.from(document.querySelectorAll(".page-frame"));
const appLoader = document.querySelector(".app-loader");
const objectsList = document.querySelector("[data-objects-list]");
const addObjectButton = document.querySelector("[data-objects-add]");
const removeObjectButton = document.querySelector("[data-objects-remove]");
const objectsCount = document.querySelector(".objects-panel__header h2 span");
const objectDetailsPanel = document.querySelector("[data-object-details]");
const archiveFilterFields = Array.from(document.querySelectorAll(".archive-field"));
const archiveTableBody = document.querySelector("[data-archive-table-body]");
const archiveTableSummary = document.querySelector("[data-archive-table-summary]");
const archiveTablePagination = document.querySelector("[data-archive-table-pagination]");
const archiveTablePageSize = document.querySelector("[data-archive-table-page-size]");
const archiveSummaryCard = document.querySelector("[data-archive-summary-card]");
const archiveTablePanel = document.querySelector(".archive-table");
const archiveTableScroll = document.querySelector(".archive-table__scroll");
const archiveTableFooter = document.querySelector(".archive-table__footer");
const mapViewport = document.querySelector("[data-map-viewport]");
const mapSurface = document.querySelector("[data-map-surface]");
const mapMarkersLayer = document.querySelector("[data-map-markers]");
const mapCoordinatesValue = document.querySelector("[data-map-coordinates-value]");

let objectsMutationLocked = false;
const OBJECTS_VISIBLE_ROWS = 10;
const INITIAL_OBJECTS_COUNT = 0;
const MAP_SURFACE_WIDTH = 2400;
const MAP_SURFACE_HEIGHT = 1600;
const MAP_COORDINATE_LIMIT = 100;
const MAP_MARKER_REMOVE_MS = 220;
const MAP_MARKER_PULSE_MS = 820;
const objectTemplates = [];
const objectInstances = new Map();
const mapMarkers = new Map();
let objectInstanceSequence = 0;
let objectTemplateIndex = 0;

const loadObjectsData = async () => {
  try {
    const response = await fetch("objects-data.json");

    if (!response.ok) {
      throw new Error(`Failed to load objects-data.json: ${response.status}`);
    }

    const parsed = await response.json();
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to load objects-data.json, using JS fallback", error);
    const fallbackData = window.__OBJECTS_DATA__;
    return Array.isArray(fallbackData) ? fallbackData : [];
  }
};

const updateObjectsCount = () => {
  if (!objectsList || !objectsCount) {
    return;
  }

  objectsCount.textContent = `(${objectsList.children.length})`;
};

const syncObjectsScrollState = () => {
  if (!objectsList) {
    return;
  }

  const itemsCount = objectsList.children.length;
  const hasOverflow = itemsCount > OBJECTS_VISIBLE_ROWS;
  objectsList.classList.toggle("objects-panel__list--scrollable", hasOverflow);
};

const getObjectById = (objectId) => objectTemplates.find((item) => item.id === objectId) ?? null;
const getObjectInstanceById = (instanceId) => objectInstances.get(instanceId) ?? null;

const createObjectInstanceId = () => {
  objectInstanceSequence += 1;
  return `object-instance-${objectInstanceSequence}`;
};

const createRandomCoordinates = () => {
  const toPreciseCoordinate = () => (
    ((Math.random() * (MAP_COORDINATE_LIMIT * 2)) - MAP_COORDINATE_LIMIT).toFixed(5)
  );

  return `${toPreciseCoordinate()}, ${toPreciseCoordinate()}`;
};

const createObjectInstanceData = (template, { randomizeCoordinates = false } = {}) => ({
  ...template,
  templateId: template.id,
  coordinates: randomizeCoordinates ? createRandomCoordinates() : template.coordinates,
});

const parseCartesianCoordinates = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const [xRaw, yRaw] = value.split(",").map((part) => part.trim());
  const x = Number.parseFloat(xRaw);
  const y = Number.parseFloat(yRaw);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return {
    x: Math.max(-MAP_COORDINATE_LIMIT, Math.min(MAP_COORDINATE_LIMIT, x)),
    y: Math.max(-MAP_COORDINATE_LIMIT, Math.min(MAP_COORDINATE_LIMIT, y)),
  };
};

const mapCoordinatesToSurfacePosition = (coordinates) => {
  const parsed = parseCartesianCoordinates(coordinates);

  if (!parsed) {
    return {
      left: MAP_SURFACE_WIDTH / 2,
      top: MAP_SURFACE_HEIGHT / 2,
    };
  }

  return {
    left: ((parsed.x + MAP_COORDINATE_LIMIT) / (MAP_COORDINATE_LIMIT * 2)) * MAP_SURFACE_WIDTH,
    top: ((MAP_COORDINATE_LIMIT - parsed.y) / (MAP_COORDINATE_LIMIT * 2)) * MAP_SURFACE_HEIGHT,
  };
};

const mapSurfacePositionToCoordinates = (left, top) => {
  const normalizedX = Math.max(0, Math.min(1, left / MAP_SURFACE_WIDTH));
  const normalizedY = Math.max(0, Math.min(1, top / MAP_SURFACE_HEIGHT));

  return {
    x: (normalizedX * (MAP_COORDINATE_LIMIT * 2)) - MAP_COORDINATE_LIMIT,
    y: MAP_COORDINATE_LIMIT - (normalizedY * (MAP_COORDINATE_LIMIT * 2)),
  };
};

const formatMapCoordinate = (value) => Number(value).toFixed(5);

const setMapCoordinatesDisplay = (value) => {
  if (!mapCoordinatesValue) {
    return;
  }

  mapCoordinatesValue.textContent = value;
};

const formatCoordinatesPair = (coordinates) => {
  const parsed = parseCartesianCoordinates(coordinates);

  if (!parsed) {
    return "--, --";
  }

  return `${formatMapCoordinate(parsed.x)}, ${formatMapCoordinate(parsed.y)}`;
};

const getVisibleObjectItems = () => (
  objectsList
    ? Array.from(objectsList.querySelectorAll(".object-item"))
    : []
);

const getVisibleObjectInstances = () => (
  getVisibleObjectItems()
    .map((item) => {
      const instanceId = item.dataset.objectInstanceId ?? "";

      if (!instanceId) {
        return null;
      }

      return { instanceId };
    })
    .filter(Boolean)
);

const applyObjectItemContent = (item, objectData) => {
  if (!(item instanceof HTMLElement) || !objectData) {
    return;
  }

  item.innerHTML = `
    <img class="object-item__icon" src="${objectData.icon}" alt="" />
    <div class="object-item__main">
      <strong>${objectData.name}</strong>
      <span class="object-item__status object-item__status--${objectData.statusClass}">${objectData.status}</span>
    </div>
    <div class="object-item__meta">
      <strong>${objectData.time}</strong>
      <span>${objectData.ago}</span>
    </div>
  `;
};

const setMarkerPosition = (marker, coordinates) => {
  if (!(marker instanceof HTMLElement)) {
    return;
  }

  const { left, top } = mapCoordinatesToSurfacePosition(coordinates);
  marker.style.left = `${left}px`;
  marker.style.top = `${top}px`;
};

const updateMarkerStatusClass = (marker, statusClass) => {
  if (!(marker instanceof HTMLElement)) {
    return;
  }

  marker.classList.remove("map-marker--alert", "map-marker--warning", "map-marker--online", "map-marker--muted");
  marker.classList.add(`map-marker--${statusClass}`);
};

const setMarkerActiveState = () => {
  const activeInstanceId = objectsList?.querySelector(".object-item--active")?.dataset.objectInstanceId ?? null;

  for (const [instanceId, marker] of mapMarkers.entries()) {
    marker.classList.toggle("map-marker--active", instanceId === activeInstanceId);
  }
};

const triggerMarkerPulse = (instanceId) => {
  const marker = mapMarkers.get(instanceId);

  if (!(marker instanceof HTMLElement)) {
    return;
  }

  marker.classList.remove("map-marker--pulse");
  void marker.offsetWidth;
  marker.classList.add("map-marker--pulse");

  window.setTimeout(() => {
    marker.classList.remove("map-marker--pulse");
  }, MAP_MARKER_PULSE_MS);
};

const createMapMarker = (instanceId, objectData) => {
  if (!(mapMarkersLayer instanceof HTMLElement)) {
    return null;
  }

  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = `map-marker map-marker--${objectData.statusClass} map-marker--enter`;
  marker.dataset.objectInstanceId = instanceId;
  marker.setAttribute("aria-label", `${objectData.name}: ${objectData.status}`);
  marker.innerHTML = `
    <svg class="map-marker__pin" viewBox="0 0 64 80" aria-hidden="true">
      <path
        class="map-marker__body"
        d="M32 4 C17 4 6 16 6 31 C6 50 32 76 32 76 C32 76 58 50 58 31 C58 16 47 4 32 4Z"
      />
    </svg>
    <span class="map-marker__icon-shell">
      <img class="map-marker__icon" src="${objectData.icon}" alt="" />
    </span>
  `;

  setMarkerPosition(marker, objectData.coordinates);
  mapMarkersLayer.append(marker);
  mapMarkers.set(instanceId, marker);

  requestAnimationFrame(() => {
    marker.classList.add("map-marker--enter-active");
    marker.classList.remove("map-marker--enter");
  });

  return marker;
};

const updateMapMarker = (instanceId, objectData) => {
  const marker = mapMarkers.get(instanceId) ?? createMapMarker(instanceId, objectData);

  if (!(marker instanceof HTMLElement)) {
    return;
  }

  updateMarkerStatusClass(marker, objectData.statusClass);
  marker.setAttribute("aria-label", `${objectData.name}: ${objectData.status}`);

  const icon = marker.querySelector(".map-marker__icon");

  if (icon instanceof HTMLImageElement) {
    icon.src = objectData.icon;
  }

  setMarkerPosition(marker, objectData.coordinates);
};

const removeMapMarker = (instanceId) => {
  const marker = mapMarkers.get(instanceId);

  if (!(marker instanceof HTMLElement)) {
    return;
  }

  marker.classList.remove("map-marker--enter", "map-marker--enter-active", "map-marker--active");
  marker.classList.add("map-marker--removing");
  mapMarkers.delete(instanceId);

  window.setTimeout(() => {
    marker.remove();
  }, MAP_MARKER_REMOVE_MS);
};

const syncMapMarkersToVisibleObjects = () => {
  const nextVisibleInstances = getVisibleObjectInstances();
  const nextVisibleInstanceIds = new Set(nextVisibleInstances.map((instance) => instance.instanceId));

  for (const instance of nextVisibleInstances) {
    const objectData = getObjectInstanceById(instance.instanceId);

    if (!objectData) {
      continue;
    }

    updateMapMarker(instance.instanceId, objectData);
  }

  for (const instanceId of mapMarkers.keys()) {
    if (!nextVisibleInstanceIds.has(instanceId)) {
      removeMapMarker(instanceId);
    }
  }

  setMarkerActiveState();
};

const refreshRenderedObjectData = (templateId) => {
  for (const item of getVisibleObjectItems()) {
    const objectData = getObjectInstanceById(item.dataset.objectInstanceId ?? "");

    if (!objectData || objectData.templateId !== templateId) {
      continue;
    }

    applyObjectItemContent(item, objectData);
  }

  const activeItem = objectsList?.querySelector(".object-item--active");
  const activeObjectData = getObjectInstanceById(activeItem?.dataset.objectInstanceId ?? "");

  if (activeObjectData?.templateId === templateId) {
    renderObjectDetails(activeObjectData);
  }

  syncMapMarkersToVisibleObjects();
};

const updateObjectState = (objectId, patch) => {
  const objectData = getObjectById(objectId);

  if (!objectData || !patch || typeof patch !== "object") {
    return false;
  }

  Object.assign(objectData, patch);
  for (const objectInstance of objectInstances.values()) {
    if (objectInstance.templateId !== objectId) {
      continue;
    }

    Object.assign(objectInstance, patch);
  }

  refreshRenderedObjectData(objectId);
  return true;
};

const initializeMapViewport = () => {
  if (!(mapViewport instanceof HTMLElement) || !(mapSurface instanceof HTMLElement)) {
    return;
  }

  let offsetX = 0;
  let offsetY = 0;
  let minOffsetX = 0;
  let minOffsetY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let originOffsetX = 0;
  let originOffsetY = 0;
  let isDragging = false;
  let activePointerId = null;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const applyOffset = () => {
    mapSurface.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  };

  const syncPointerCoordinates = (clientX, clientY) => {
    const marker = document.elementFromPoint(clientX, clientY)?.closest?.(".map-marker");

    if (marker instanceof HTMLElement) {
      const objectData = getObjectInstanceById(marker.dataset.objectInstanceId ?? "");

      if (objectData) {
        setMapCoordinatesDisplay(formatCoordinatesPair(objectData.coordinates));
        return;
      }
    }

    const viewportRect = mapViewport.getBoundingClientRect();
    const surfaceLeft = clientX - viewportRect.left - offsetX;
    const surfaceTop = clientY - viewportRect.top - offsetY;
    const { x, y } = mapSurfacePositionToCoordinates(surfaceLeft, surfaceTop);
    setMapCoordinatesDisplay(`${formatMapCoordinate(x)}, ${formatMapCoordinate(y)}`);
  };

  const syncBounds = () => {
    const viewportRect = mapViewport.getBoundingClientRect();
    const surfaceRect = mapSurface.getBoundingClientRect();
    const surfaceWidth = surfaceRect.width;
    const surfaceHeight = surfaceRect.height;

    minOffsetX = Math.min(0, viewportRect.width - surfaceWidth);
    minOffsetY = Math.min(0, viewportRect.height - surfaceHeight);

    if (!mapViewport.dataset.mapInitialized) {
      offsetX = Math.round((viewportRect.width - surfaceWidth) / 2);
      offsetY = Math.round((viewportRect.height - surfaceHeight) / 2);
      mapViewport.dataset.mapInitialized = "true";
    }

    offsetX = clamp(offsetX, minOffsetX, 0);
    offsetY = clamp(offsetY, minOffsetY, 0);
    applyOffset();
  };

  mapViewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target instanceof Element && event.target.closest(".map-marker")) {
      return;
    }

    isDragging = true;
    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    originOffsetX = offsetX;
    originOffsetY = offsetY;
    mapViewport.classList.add("is-dragging");
    mapViewport.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  mapViewport.addEventListener("pointermove", (event) => {
    syncPointerCoordinates(event.clientX, event.clientY);

    if (!isDragging || event.pointerId !== activePointerId) {
      return;
    }

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    offsetX = clamp(originOffsetX + deltaX, minOffsetX, 0);
    offsetY = clamp(originOffsetY + deltaY, minOffsetY, 0);
    applyOffset();
  });

  const stopDragging = (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    isDragging = false;
    activePointerId = null;
    mapViewport.classList.remove("is-dragging");
  };

  mapViewport.addEventListener("pointerup", stopDragging);
  mapViewport.addEventListener("pointercancel", stopDragging);
  mapViewport.addEventListener("pointerleave", () => {
    setMapCoordinatesDisplay("--, --");
  });
  mapViewport.addEventListener("lostpointercapture", () => {
    isDragging = false;
    activePointerId = null;
    mapViewport.classList.remove("is-dragging");
  });

  syncBounds();
  setMapCoordinatesDisplay("--, --");
  window.addEventListener("resize", syncBounds);

  mapMarkersLayer?.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest(".map-marker")) {
      event.stopPropagation();
    }
  });

  mapMarkersLayer?.addEventListener("click", (event) => {
    const marker = event.target instanceof Element ? event.target.closest(".map-marker") : null;

    if (!(marker instanceof HTMLElement) || !objectsList) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const nextActiveItem = objectsList.querySelector(`[data-object-instance-id="${marker.dataset.objectInstanceId}"]`);

    if (nextActiveItem instanceof HTMLElement) {
      setActiveObjectItem(nextActiveItem, { pulse: true });
    }
  });
};

const closeArchivePopovers = () => {
  for (const field of archiveFilterFields) {
    const trigger = field.querySelector("[data-archive-trigger]");
    const popover = field.querySelector("[data-archive-popover]");

    if (trigger instanceof HTMLElement) {
      trigger.classList.remove("is-open");
    }

    if (popover instanceof HTMLElement) {
      popover.hidden = true;
    }
  }
};

const initializeArchiveFilters = () => {
  if (archiveFilterFields.length === 0) {
    return;
  }

  const archiveMonthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const archiveWeekdayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const formatArchiveDateValue = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}.${month}.${year}`;
  };

  const parseArchiveDateValue = (value) => {
    const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

    if (!match) {
      return null;
    }

    const parsedDate = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const normalizeArchiveTimeValue = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);

    if (digits.length === 0) {
      return "";
    }

    if (digits.length <= 2) {
      return digits;
    }

    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };

  const getValidArchiveTimeValue = (value) => {
    const match = value.match(/^(\d{2}):(\d{2})$/);

    if (!match) {
      return "";
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) {
      return "";
    }

    return `${match[1]}:${match[2]}`;
  };

  const renderArchiveCalendar = (calendar, monthLabel, state) => {
    if (!(calendar instanceof HTMLElement) || !(monthLabel instanceof HTMLElement)) {
      return;
    }

    monthLabel.textContent = `${archiveMonthNames[state.viewDate.getMonth()]} ${state.viewDate.getFullYear()}`;
    calendar.replaceChildren();

    for (const weekday of archiveWeekdayNames) {
      const weekdayElement = document.createElement("span");
      weekdayElement.className = "archive-calendar__weekday";
      weekdayElement.textContent = weekday;
      calendar.append(weekdayElement);
    }

    const year = state.viewDate.getFullYear();
    const month = state.viewDate.getMonth();
    const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const selectedValue = formatArchiveDateValue(state.selectedDate);

    for (let index = 0; index < firstDayOffset; index += 1) {
      const emptyCell = document.createElement("span");
      emptyCell.className = "archive-calendar__empty";
      calendar.append(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const buttonDate = new Date(year, month, day);
      const buttonValue = formatArchiveDateValue(buttonDate);
      const button = document.createElement("button");

      button.type = "button";
      button.dataset.dateValue = buttonValue;
      button.textContent = String(day);
      button.classList.toggle("is-active", buttonValue === selectedValue);
      calendar.append(button);
    }
  };

  for (const field of archiveFilterFields) {
    const trigger = field.querySelector("[data-archive-trigger]");
    const popover = field.querySelector("[data-archive-popover]");

    if (!(trigger instanceof HTMLElement) || !(popover instanceof HTMLElement)) {
      continue;
    }

    popover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const shouldOpen = popover.hidden;
      closeArchivePopovers();
      popover.hidden = !shouldOpen;
      trigger.classList.toggle("is-open", shouldOpen);
    });

    const optionButtons = Array.from(popover.querySelectorAll("[data-archive-option]"));
    for (const button of optionButtons) {
      button.addEventListener("click", () => {
        trigger.textContent = button.textContent ?? "";
        closeArchivePopovers();
      });
    }

    const calendar = popover.querySelector("[data-archive-calendar]");
    const monthLabel = popover.querySelector("[data-archive-month-label]");
    const monthShiftButtons = Array.from(popover.querySelectorAll("[data-archive-month-shift]"));
    const timeButtons = Array.from(popover.querySelectorAll("[data-time-value]"));
    const customTimeInput = popover.querySelector("[data-time-custom]");
    const applyButton = popover.querySelector("[data-archive-apply]");
    const initialDateText = trigger.textContent?.trim().split(" ")[0] ?? "";
    const initialDate = parseArchiveDateValue(initialDateText) ?? new Date(2025, 4, 23);
    const calendarState = {
      selectedDate: new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()),
      viewDate: new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
    };

    renderArchiveCalendar(calendar, monthLabel, calendarState);

    if (calendar instanceof HTMLElement) {
      calendar.addEventListener("click", (event) => {
        const button = event.target instanceof HTMLElement ? event.target.closest("[data-date-value]") : null;

        if (!(button instanceof HTMLButtonElement)) {
          return;
        }

        const nextDate = parseArchiveDateValue(button.dataset.dateValue ?? "");

        if (!nextDate) {
          return;
        }

        calendarState.selectedDate = nextDate;
        calendarState.viewDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
        renderArchiveCalendar(calendar, monthLabel, calendarState);
      });
    }

    for (const button of monthShiftButtons) {
      button.addEventListener("click", () => {
        const shift = Number(button.dataset.archiveMonthShift ?? "0");

        if (!shift) {
          return;
        }

        calendarState.viewDate = new Date(calendarState.viewDate.getFullYear(), calendarState.viewDate.getMonth() + shift, 1);
        renderArchiveCalendar(calendar, monthLabel, calendarState);
      });
    }

    for (const button of timeButtons) {
      button.addEventListener("click", () => {
        for (const item of timeButtons) {
          item.classList.remove("is-active");
        }
        button.classList.add("is-active");

        if (customTimeInput instanceof HTMLInputElement) {
          customTimeInput.value = button.dataset.timeValue ?? "";
        }
      });
    }

    if (customTimeInput instanceof HTMLInputElement) {
      customTimeInput.addEventListener("input", () => {
        const normalizedValue = normalizeArchiveTimeValue(customTimeInput.value);

        if (customTimeInput.value !== normalizedValue) {
          customTimeInput.value = normalizedValue;
        }

        const exactPreset = timeButtons.find((button) => button.dataset.timeValue === normalizedValue);

        for (const item of timeButtons) {
          item.classList.toggle("is-active", item === exactPreset);
        }
      });

      customTimeInput.addEventListener("blur", () => {
        const validValue = getValidArchiveTimeValue(customTimeInput.value);

        if (validValue) {
          customTimeInput.value = validValue;
        }
      });
    }

    if (applyButton instanceof HTMLButtonElement) {
      applyButton.addEventListener("click", () => {
        const activeTime = popover.querySelector("[data-time-value].is-active");
        const dateValue = formatArchiveDateValue(calendarState.selectedDate);
        const presetTimeValue = activeTime instanceof HTMLElement ? activeTime.dataset.timeValue : "";
        const customTimeValue = customTimeInput instanceof HTMLInputElement ? getValidArchiveTimeValue(customTimeInput.value) : "";
        const timeValue = customTimeValue || presetTimeValue;

        trigger.textContent = [dateValue, timeValue].filter(Boolean).join(" ");
        closeArchivePopovers();
      });
    }
  }

  document.addEventListener("click", (event) => {
    const insideArchiveField = event.target instanceof Element ? event.target.closest(".archive-field") : null;

    if (!insideArchiveField) {
      closeArchivePopovers();
    }
  });
};

const archiveTableBaseRows = [
  {
    time: "23.05.2025 12:45:18",
    icon: "./images/warehouse_icon.svg",
    object: "Генератор-01",
    objectStatus: "Норма",
    statusClass: "online",
    coordinates: "55.755826, 37.617300",
    parameter: "Температура двигателя",
    value: "96 °C",
    badge: "Норма",
  },
  {
    time: "23.05.2025 12:44:52",
    icon: "./images/azs_icon.svg",
    object: "Насосная-02",
    objectStatus: "Предупреждение",
    statusClass: "warning",
    coordinates: "55.742158, 37.603911",
    parameter: "Уровень топлива",
    value: "8 %",
    badge: "Предупреждение",
  },
  {
    time: "23.05.2025 12:44:31",
    icon: "./images/azs_icon.svg",
    object: "Трансформатор-01",
    objectStatus: "Нет данных",
    statusClass: "muted",
    coordinates: "55.761221, 37.621004",
    parameter: "Напряжение",
    value: "—",
    badge: "Нет данных",
  },
  {
    time: "23.05.2025 12:44:05",
    icon: "./images/car_icon.svg",
    object: "Машина-01",
    objectStatus: "Норма",
    statusClass: "online",
    coordinates: "55.749331, 37.610221",
    parameter: "Частота",
    value: "49.8 Гц",
    badge: "Норма",
  },
  {
    time: "23.05.2025 12:43:47",
    icon: "./images/warehouse_icon.svg",
    object: "Компрессор-01",
    objectStatus: "Авария",
    statusClass: "alert",
    coordinates: "55.734902, 37.598442",
    parameter: "Давление масла",
    value: "2.1 Бар",
    badge: "Авария",
  },
  {
    time: "23.05.2025 12:43:21",
    icon: "./images/warehouse_icon.svg",
    object: "Резервуар-01",
    objectStatus: "Норма",
    statusClass: "online",
    badgeClass: "warning",
    coordinates: "55.745118, 37.604771",
    parameter: "Вибрация",
    value: "7.2 мм/с",
    badge: "Предупреждение",
  },
  {
    time: "23.05.2025 12:42:58",
    icon: "./images/drone_icon.svg",
    object: "Вентиляция-01",
    objectStatus: "Норма",
    statusClass: "online",
    coordinates: "55.760001, 37.620331",
    parameter: "Напряжение АКБ",
    value: "25.1 В",
    badge: "Норма",
  },
  {
    time: "23.05.2025 12:42:33",
    icon: "./images/warehouse_icon.svg",
    object: "Котельная-01",
    objectStatus: "Норма",
    statusClass: "online",
    coordinates: "55.747602, 37.608122",
    parameter: "Температура",
    value: "78 °C",
    badge: "Норма",
  },
  {
    time: "23.05.2025 12:42:05",
    icon: "./images/warehouse_icon.svg",
    object: "ДГУ-01",
    objectStatus: "Авария",
    statusClass: "alert",
    coordinates: "55.739188, 37.600993",
    parameter: "Уровень топлива",
    value: "2 %",
    badge: "Авария",
  },
  {
    time: "23.05.2025 12:41:39",
    icon: "./images/azs_icon.svg",
    object: "Насосная-03",
    objectStatus: "Нет данных",
    statusClass: "muted",
    coordinates: "55.741991, 37.603010",
    parameter: "Расход",
    value: "—",
    badge: "Нет данных",
  },
];

const ARCHIVE_TOTAL_ROWS = 128456;
let archiveCurrentPage = 1;
let archiveRowsPerPage = 10;
let archivePageSizeMenuOpen = false;
const archiveSummaryStats = [
  { label: "Норма", value: 96432, tone: "online", color: "#1fda72" },
  { label: "Предупреждения", value: 21784, tone: "warning", color: "#ffc72a" },
  { label: "Аварии", value: 8742, tone: "alert", color: "#ff554d" },
  { label: "Нет данных", value: 1498, tone: "muted", color: "#95a3b8" },
];

const archiveTableRows = Array.from({ length: 60 }, (_, index) => {
  const template = archiveTableBaseRows[index % archiveTableBaseRows.length];
  const minutesShift = Math.floor(index / archiveTableBaseRows.length);
  const [datePart, timePart] = template.time.split(" ");
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  const shiftedDate = new Date(2025, 4, 23, hours, minutes - minutesShift, seconds);
  const formattedTime = `${String(shiftedDate.getDate()).padStart(2, "0")}.${String(shiftedDate.getMonth() + 1).padStart(2, "0")}.${shiftedDate.getFullYear()} ${String(shiftedDate.getHours()).padStart(2, "0")}:${String(shiftedDate.getMinutes()).padStart(2, "0")}:${String(shiftedDate.getSeconds()).padStart(2, "0")}`;

  return {
    ...template,
    time: formattedTime,
    object: `${template.object}${index >= archiveTableBaseRows.length ? `-${Math.floor(index / archiveTableBaseRows.length) + 1}` : ""}`,
  };
});

const getArchivePageCount = () => Math.max(1, Math.ceil(archiveTableRows.length / archiveRowsPerPage));

const syncArchiveTableViewport = () => {
  if (!archiveTablePanel || !archiveTableScroll || !archiveTableFooter) {
    return;
  }

  const headerRow = archiveTableScroll.querySelector("thead tr");
  const firstBodyRow = archiveTableBody?.querySelector("tr");

  if (!(headerRow instanceof HTMLElement) || !(firstBodyRow instanceof HTMLElement)) {
    archiveTableScroll.style.height = "";
    return;
  }

  const panelStyles = window.getComputedStyle(archiveTablePanel);
  const panelGap = Number.parseFloat(panelStyles.rowGap || panelStyles.gap || "0");
  const availableHeight = archiveTablePanel.clientHeight - archiveTableFooter.offsetHeight - panelGap;
  const headerHeight = headerRow.getBoundingClientRect().height;
  const rowHeight = firstBodyRow.getBoundingClientRect().height;

  if (availableHeight <= 0 || rowHeight <= 0) {
    archiveTableScroll.style.height = "";
    return;
  }

  const visibleRows = Math.max(1, Math.floor((availableHeight - headerHeight) / rowHeight));
  archiveTableScroll.style.height = `${headerHeight + (visibleRows * rowHeight)}px`;
};

const renderArchiveSummary = () => {
  if (!archiveSummaryCard) {
    return;
  }

  const total = archiveSummaryStats.reduce((sum, item) => sum + item.value, 0);
  let progressOffset = 0;
  const gradientStops = archiveSummaryStats
    .map((item) => {
      const ratio = item.value / total;
      const start = progressOffset * 100;
      progressOffset += ratio;
      const end = progressOffset * 100;

      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ");

  const legendMarkup = archiveSummaryStats
    .map((item) => {
      const percent = Math.round((item.value / total) * 100);

      return `
        <div class="archive-summary__item">
          <span class="archive-summary__dot archive-summary__dot--${item.tone}"></span>
          <span>${item.label}</span>
          <strong class="archive-summary__value">${item.value.toLocaleString("ru-RU")} (${percent}%)</strong>
        </div>
      `;
    })
    .join("");

  archiveSummaryCard.innerHTML = `
    <div class="archive-summary">
      <span>Сводка за период</span>
      <div class="archive-summary__layout">
        <div class="archive-summary__chart" style="background: conic-gradient(${gradientStops});">
          <div class="archive-summary__center">
            <div>
              <strong>${total.toLocaleString("ru-RU")}</strong>
              <span>всего</span>
            </div>
          </div>
        </div>
        <div class="archive-summary__legend">${legendMarkup}</div>
      </div>
    </div>
  `;
};

const buildArchivePaginationItems = (page, totalPages) => {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, "ellipsis", totalPages];
  }

  if (page >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
};

const renderArchiveTable = () => {
  if (!archiveTableBody || !archiveTableSummary || !archiveTablePagination || !archiveTablePageSize) {
    return;
  }

  const totalPages = getArchivePageCount();
  archiveCurrentPage = Math.min(Math.max(archiveCurrentPage, 1), totalPages);

  const pageStartIndex = (archiveCurrentPage - 1) * archiveRowsPerPage;
  const pageRows = archiveTableRows.slice(pageStartIndex, pageStartIndex + archiveRowsPerPage);
  const visibleFrom = pageStartIndex + 1;
  const visibleTo = pageStartIndex + pageRows.length;

  archiveTableBody.innerHTML = pageRows
    .map(
      (row) => `
        <tr>
          <td>${row.time}</td>
          <td><img class="archive-table__object-icon" src="${row.icon}" alt="" /></td>
          <td>
            <div class="archive-table__object-meta">
              <strong>${row.object}</strong>
              <span class="archive-table__object-status archive-table__object-status--${row.statusClass}">${row.objectStatus}</span>
            </div>
          </td>
          <td>${row.coordinates}</td>
          <td>${row.parameter}</td>
          <td><strong class="archive-table__value">${row.value}</strong></td>
          <td><span class="archive-table__badge archive-table__badge--${row.badgeClass ?? row.statusClass}">${row.badge}</span></td>
        </tr>
      `,
    )
    .join("");

  archiveTableSummary.textContent = `Показано ${visibleFrom}-${visibleTo} из ${ARCHIVE_TOTAL_ROWS.toLocaleString("ru-RU")} записей`;

  const paginationItems = buildArchivePaginationItems(archiveCurrentPage, totalPages);
  archiveTablePagination.innerHTML = `
    <div class="archive-table__pager">
      <button type="button" data-archive-page-nav="prev" ${archiveCurrentPage === 1 ? "disabled" : ""}>‹</button>
      ${paginationItems
        .map((item) => {
          if (item === "ellipsis") {
            return "<span>…</span>";
          }

          return `<button class="${item === archiveCurrentPage ? "is-active" : ""}" type="button" data-archive-page="${item}">${item}</button>`;
        })
        .join("")}
      <label class="archive-table__page-input">
        <span>Стр.</span>
        <input type="text" inputmode="numeric" value="${archiveCurrentPage}" data-archive-page-input />
      </label>
      <button type="button" data-archive-page-nav="next" ${archiveCurrentPage === totalPages ? "disabled" : ""}>›</button>
    </div>
  `;

  archiveTablePageSize.innerHTML = `
    <div class="archive-table__page-size ${archivePageSizeMenuOpen ? "is-open" : ""}">
      <span>Строк на странице</span>
      <button class="archive-table__page-size-trigger" type="button" data-archive-page-size-trigger>
        <span>${archiveRowsPerPage}</span>
      </button>
      <div class="archive-table__page-size-menu" ${archivePageSizeMenuOpen ? "" : "hidden"}>
        <button type="button" data-archive-page-size="10">10</button>
        <button type="button" data-archive-page-size="25">25</button>
        <button type="button" data-archive-page-size="50">50</button>
      </div>
    </div>
  `;

  requestAnimationFrame(syncArchiveTableViewport);
};
const getTelemetryTone = (progress) => {
  if (progress < 20) {
    return "alert";
  }

  if (progress < 45) {
    return "warning";
  }

  return "ok";
};

const telemetryValuePattern = /^(-?\d+(?:[.,]\d+)?)(.*)$/;

const easeOutCubic = (value) => 1 - ((1 - value) ** 3);

const parseTelemetryValue = (rawValue) => {
  const normalizedValue = String(rawValue).trim();
  const match = normalizedValue.match(telemetryValuePattern);

  if (!match) {
    return null;
  }

  const numericPart = match[1].replace(",", ".");
  const parsedNumber = Number.parseFloat(numericPart);

  if (!Number.isFinite(parsedNumber)) {
    return null;
  }

  const decimals = (match[1].split(/[.,]/)[1] ?? "").length;

  return {
    number: parsedNumber,
    decimals,
    suffix: match[2] ?? "",
  };
};

const formatTelemetryValue = ({ number, decimals, suffix }) => {
  const formattedNumber = decimals > 0 ? number.toFixed(decimals) : String(Math.round(number));
  return `${formattedNumber}${suffix}`;
};

const animateTelemetryMetrics = () => {
  if (!objectDetailsPanel) {
    return;
  }

  const metrics = Array.from(objectDetailsPanel.querySelectorAll(".object-details__metric"));

  for (const metric of metrics) {
    const valueElement = metric.querySelector("[data-telemetry-value]");
    const fillElement = metric.querySelector("[data-telemetry-fill]");

    if (!(valueElement instanceof HTMLElement) || !(fillElement instanceof HTMLElement)) {
      continue;
    }

    const targetProgress = Number.parseFloat(fillElement.dataset.targetWidth ?? "0");
    const parsedValue = parseTelemetryValue(valueElement.dataset.targetValue ?? "");

    fillElement.style.width = "0%";

    if (parsedValue) {
      valueElement.textContent = formatTelemetryValue({
        number: 0,
        decimals: parsedValue.decimals,
        suffix: parsedValue.suffix,
      });
    }

    requestAnimationFrame(() => {
      fillElement.style.width = `${targetProgress}%`;
      metric.classList.add("object-details__metric--live");
    });

    if (!parsedValue) {
      continue;
    }

    const animationDuration = 780;
    const animationStart = performance.now();

    const animateValue = (timestamp) => {
      const elapsed = timestamp - animationStart;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = easeOutCubic(progress);
      const nextValue = parsedValue.number * easedProgress;

      valueElement.textContent = formatTelemetryValue({
        number: nextValue,
        decimals: parsedValue.decimals,
        suffix: parsedValue.suffix,
      });

      if (progress < 1) {
        requestAnimationFrame(animateValue);
        return;
      }

      valueElement.textContent = valueElement.dataset.targetValue ?? "";
    };

    requestAnimationFrame(animateValue);
  }
};

const renderObjectDetails = (objectData) => {
  if (!objectDetailsPanel) {
    return;
  }

  if (!objectData) {
    objectDetailsPanel.innerHTML = `
      <div class="object-details">
        <div class="object-details__empty">
          <h2>Параметры объекта</h2>
          <p>Выберите объект слева, чтобы увидеть координаты, телеметрию и дополнительные данные.</p>
        </div>
      </div>
    `;
    return;
  }

  const telemetryMarkup = objectData.telemetry
    .map(
      (item) => {
        const tone = getTelemetryTone(item.progress);

        return `
        <div class="object-details__metric">
          <div class="object-details__metric-copy">
            <span>${item.label}</span>
            <strong data-telemetry-value data-target-value="${item.value}">${item.value}</strong>
          </div>
          <span class="object-details__metric-bar">
            <span
              class="object-details__metric-fill object-details__metric-fill--${tone}"
              data-telemetry-fill
              data-target-width="${item.progress}"
              style="width: 0%;"
            ></span>
          </span>
        </div>
      `;
      },
    )
    .join("");

  const dataMarkup = objectData.data
    .map(
      (item) => `
        <div class="object-details__pair">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </div>
      `,
    )
    .join("");

  objectDetailsPanel.innerHTML = `
    <div class="object-details">
      <div class="object-details__top">
        <div class="object-details__heading">
          <div>
            <span class="object-details__eyebrow">Параметры объекта</span>
            <h2>${objectData.name}</h2>
            <p>${objectData.label}</p>
          </div>
          <span class="object-details__badge object-details__badge--${objectData.statusClass}">${objectData.status}</span>
        </div>

        <div class="object-details__coordinates">
          <div>
            <span>Координаты</span>
            <strong>${objectData.coordinates}</strong>
          </div>
          <button
            class="object-details__copy-button"
            type="button"
            aria-label="Скопировать координаты"
            data-copy-coordinates="${objectData.coordinates}"
          ></button>
        </div>
      </div>

      <div class="object-details__scroll">
        <section class="object-details__section">
          <div class="object-details__section-title">Телеметрия</div>
          <div class="object-details__metrics">${telemetryMarkup}</div>
        </section>

        <section class="object-details__section">
          <div class="object-details__section-title">Данные</div>
          <div class="object-details__pairs">${dataMarkup}</div>
        </section>
      </div>

      <div class="object-details__footer">
        <span>Последнее обновление</span>
        <strong>${objectData.lastUpdate}</strong>
        <span class="object-details__footer-dot object-details__footer-dot--${objectData.statusClass}" aria-hidden="true"></span>
      </div>
    </div>
  `;

  animateTelemetryMetrics();
};

const setActiveObjectItem = (nextActiveItem, { pulse = false } = {}) => {
  if (!objectsList) {
    return;
  }

  const currentActiveItem = objectsList.querySelector(".object-item--active");

  if (currentActiveItem === nextActiveItem && nextActiveItem) {
    return;
  }

  const items = objectsList.querySelectorAll(".object-item");

  for (const item of items) {
    item.classList.toggle("object-item--active", item === nextActiveItem);
  }

  const activeObjectData = getObjectInstanceById(nextActiveItem?.dataset.objectInstanceId ?? "");
  renderObjectDetails(activeObjectData);
  setMarkerActiveState();

  if (pulse && nextActiveItem?.dataset.objectInstanceId) {
    triggerMarkerPulse(nextActiveItem.dataset.objectInstanceId);
  }
};

const createObjectItem = (template, options) => {
  const item = document.createElement("div");
  const instanceId = createObjectInstanceId();
  const objectData = createObjectInstanceData(template, options);
  item.className = "object-item object-item--enter";
  item.setAttribute("role", "listitem");
  item.dataset.objectInstanceId = instanceId;
  objectInstances.set(instanceId, objectData);
  applyObjectItemContent(item, objectData);
  return item;
};

const seedObjectsList = () => {
  if (!objectsList) {
    return;
  }

  objectInstances.clear();
  objectsList.innerHTML = "";
  const initialObjects = objectTemplates.slice(0, INITIAL_OBJECTS_COUNT);

  for (const objectTemplate of initialObjects) {
    const item = createObjectItem(objectTemplate);
    item.classList.remove("object-item--enter");
    objectsList.append(item);
  }

  setActiveObjectItem(objectsList.querySelector(".object-item"));
  syncMapMarkersToVisibleObjects();
};

const initializeObjectsData = async () => {
  const loadedObjects = await loadObjectsData();
  objectTemplates.splice(0, objectTemplates.length, ...loadedObjects);
  objectTemplateIndex = Math.min(INITIAL_OBJECTS_COUNT, objectTemplates.length);
  seedObjectsList();
  updateObjectsCount();
  syncObjectsScrollState();

  if (objectTemplates.length === 0) {
    renderObjectDetails(null);
  }

  window.updateObjectState = updateObjectState;
  window.setObjectMarkerStatus = (objectId, status, statusClass) => updateObjectState(objectId, { status, statusClass });
  window.moveObjectMarker = (objectId, coordinates) => updateObjectState(objectId, { coordinates });
};

objectsList?.addEventListener("click", (event) => {
  const item = event.target instanceof Element ? event.target.closest(".object-item") : null;

  if (!item) {
    return;
  }

  setActiveObjectItem(item, { pulse: true });
});

objectDetailsPanel?.addEventListener("click", async (event) => {
  const button = event.target instanceof Element ? event.target.closest("[data-copy-coordinates]") : null;

  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const coordinates = button.dataset.copyCoordinates ?? "";

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(coordinates);
    } else {
      const tempInput = document.createElement("textarea");
      tempInput.value = coordinates;
      tempInput.setAttribute("readonly", "");
      tempInput.style.position = "absolute";
      tempInput.style.left = "-9999px";
      document.body.append(tempInput);
      tempInput.select();
      document.execCommand("copy");
      tempInput.remove();
    }

    button.classList.add("object-details__copy-button--copied");
    window.setTimeout(() => {
      button.classList.remove("object-details__copy-button--copied");
    }, 1200);
  } catch (error) {
    console.error("Failed to copy coordinates", error);
  }
});

const moveHighlight = (activeTab) => {
  if (!tabsContainer || !tabsHighlight || !activeTab) {
    return;
  }

  const shellPadding = parseFloat(getComputedStyle(tabsContainer).paddingLeft) || 0;
  const offsetLeft = activeTab.offsetLeft - shellPadding;

  tabsHighlight.style.width = `${activeTab.offsetWidth}px`;
  tabsHighlight.style.transform = `translateX(${offsetLeft}px)`;
};

const syncPages = (activeTab) => {
  const nextPage = pages.find((page) => page.dataset.page === activeTab.dataset.tab);
  const currentPage = pages.find((page) => page.classList.contains("page-frame--active"));

  if (!nextPage || nextPage === currentPage) {
    return;
  }

  const nextIndex = tabs.indexOf(activeTab);
  const currentIndex = currentPage ? tabs.findIndex((tab) => tab.dataset.tab === currentPage.dataset.page) : 0;
  const goesForward = nextIndex > currentIndex;

  nextPage.classList.remove("page-frame--to-left", "page-frame--to-right");
  nextPage.classList.add(goesForward ? "page-frame--from-right" : "page-frame--from-left");
  nextPage.removeAttribute("aria-hidden");

  requestAnimationFrame(() => {
    if (currentPage) {
      currentPage.classList.remove("page-frame--active");
      currentPage.classList.add(goesForward ? "page-frame--to-left" : "page-frame--to-right");
      currentPage.setAttribute("aria-hidden", "true");
    }

    nextPage.classList.add("page-frame--active");
    nextPage.classList.remove("page-frame--from-right", "page-frame--from-left");
  });
};

const syncTabState = (activeTab) => {
  for (const tab of tabs) {
    const icon = tab.querySelector(".nav-tabs__icon-image");
    const isActive = tab === activeTab;

    tab.classList.toggle("nav-tabs__item--active", isActive);

    if (isActive) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }

    if (icon) {
      icon.src = isActive ? tab.dataset.iconActive : tab.dataset.iconInactive;
    }
  }

  moveHighlight(activeTab);
  syncPages(activeTab);
};

for (const tab of tabs) {
  tab.addEventListener("click", (event) => {
    event.preventDefault();
    syncTabState(tab);
  });
}

const initialActiveTab = tabs.find((tab) => tab.classList.contains("nav-tabs__item--active")) ?? tabs[0];

if (initialActiveTab) {
  syncTabState(initialActiveTab);
}

window.addEventListener("resize", () => {
  const activeTab = tabs.find((tab) => tab.classList.contains("nav-tabs__item--active"));
  moveHighlight(activeTab);
});

addObjectButton?.addEventListener("click", () => {
  if (!objectsList || objectsMutationLocked || objectTemplates.length === 0) {
    return;
  }

  objectsMutationLocked = true;
  const previousScrollTop = objectsList.scrollTop;
  const shouldActivateNewItem = objectsList.children.length === 0;

  const template = objectTemplates[objectTemplateIndex % objectTemplates.length];
  objectTemplateIndex += 1;
  const item = createObjectItem(template, { randomizeCoordinates: true });
  objectsList.append(item);

  if (shouldActivateNewItem) {
    setActiveObjectItem(item);
  }

  updateObjectsCount();
  syncMapMarkersToVisibleObjects();

  requestAnimationFrame(() => {
    item.classList.add("object-item--enter-active");
    item.classList.remove("object-item--enter");
  });

  window.setTimeout(() => {
    item.classList.remove("object-item--enter-active");
    syncObjectsScrollState();
    objectsList.scrollTop = previousScrollTop;
  }, 180);

  window.setTimeout(() => {
    objectsMutationLocked = false;
  }, 160);
});

removeObjectButton?.addEventListener("click", () => {
  if (!objectsList || objectsMutationLocked) {
    return;
  }

  objectsMutationLocked = true;
  const previousScrollTop = objectsList.scrollTop;

  const items = Array.from(objectsList.querySelectorAll(".object-item"));
  const lastItem = items.at(-1);

  if (!lastItem) {
    renderObjectDetails(null);
    objectsMutationLocked = false;
    return;
  }

  const isActiveItem = lastItem.classList.contains("object-item--active");

  lastItem.classList.add("object-item--removing");

  window.setTimeout(() => {
    if (isActiveItem) {
      const fallbackActiveItem = lastItem.previousElementSibling instanceof HTMLElement
        ? lastItem.previousElementSibling
        : null;
      setActiveObjectItem(fallbackActiveItem);
    }

    removeMapMarker(lastItem.dataset.objectInstanceId ?? "");
    objectInstances.delete(lastItem.dataset.objectInstanceId ?? "");
    lastItem.remove();
    updateObjectsCount();
    requestAnimationFrame(() => {
      syncObjectsScrollState();
      objectsList.scrollTop = Math.max(0, Math.min(previousScrollTop, objectsList.scrollHeight - objectsList.clientHeight));

      if (objectsList.children.length === 0) {
        renderObjectDetails(null);
      }

      syncMapMarkersToVisibleObjects();
    });
    objectsMutationLocked = false;
  }, 160);
});

archiveTablePagination?.addEventListener("click", (event) => {
  event.stopPropagation();

  const target = event.target instanceof HTMLElement ? event.target.closest("button") : null;

  if (!(target instanceof HTMLButtonElement) || target.disabled) {
    return;
  }

  const pageSizeTrigger = target.dataset.archivePageSizeTrigger;
  const pageSize = target.dataset.archivePageSize;
  const pageValue = target.dataset.archivePage;
  const navAction = target.dataset.archivePageNav;

  if (pageSizeTrigger !== undefined) {
    archivePageSizeMenuOpen = !archivePageSizeMenuOpen;
    renderArchiveTable();
    return;
  }

  if (pageSize) {
    archiveRowsPerPage = Number(pageSize);
    archiveCurrentPage = 1;
    archivePageSizeMenuOpen = false;
    renderArchiveTable();
    return;
  }

  if (pageValue) {
    archiveCurrentPage = Number(pageValue);
    archivePageSizeMenuOpen = false;
    renderArchiveTable();
    return;
  }

  if (navAction === "prev") {
    archiveCurrentPage -= 1;
    archivePageSizeMenuOpen = false;
    renderArchiveTable();
    return;
  }

  if (navAction === "next") {
    archiveCurrentPage += 1;
    archivePageSizeMenuOpen = false;
    renderArchiveTable();
  }
});

archiveTablePageSize?.addEventListener("click", (event) => {
  event.stopPropagation();

  const target = event.target instanceof HTMLElement ? event.target.closest("button") : null;

  if (!(target instanceof HTMLButtonElement) || target.disabled) {
    return;
  }

  const pageSizeTrigger = target.dataset.archivePageSizeTrigger;
  const pageSize = target.dataset.archivePageSize;

  if (pageSizeTrigger !== undefined) {
    archivePageSizeMenuOpen = !archivePageSizeMenuOpen;
    renderArchiveTable();
    return;
  }

  if (pageSize) {
    archiveRowsPerPage = Number(pageSize);
    archiveCurrentPage = 1;
    archivePageSizeMenuOpen = false;
    renderArchiveTable();
  }
});

archiveTablePagination?.addEventListener("change", (event) => {
  event.stopPropagation();

  const input = event.target instanceof HTMLElement ? event.target.closest("[data-archive-page-input]") : null;

  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const parsedPage = Number.parseInt(input.value.replace(/\D/g, ""), 10);

  if (!Number.isFinite(parsedPage)) {
    input.value = String(archiveCurrentPage);
    return;
  }

  archiveCurrentPage = parsedPage;
  archivePageSizeMenuOpen = false;
  renderArchiveTable();
});

document.addEventListener("click", (event) => {
  if (!archiveTablePagination || !archiveTablePageSize) {
    return;
  }

  const insidePagination = event.target instanceof Element ? event.target.closest("[data-archive-table-pagination], [data-archive-table-page-size]") : null;

  if (!insidePagination && archivePageSizeMenuOpen) {
    archivePageSizeMenuOpen = false;
    renderArchiveTable();
  }
});

initializeObjectsData();
initializeArchiveFilters();
renderArchiveTable();
renderArchiveSummary();
initializeMapViewport();

window.addEventListener("resize", syncObjectsScrollState);
window.addEventListener("resize", syncArchiveTableViewport);

window.addEventListener("load", () => {
  window.setTimeout(() => {
    appLoader?.classList.add("app-loader--hidden");
  }, 450);
});
