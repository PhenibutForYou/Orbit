export const MAP_SURFACE_WIDTH = 2400;
export const MAP_SURFACE_HEIGHT = 1600;
export const MAP_COORDINATE_LIMIT = 80;

export function createRandomCoordinates() {
  const toPreciseCoordinate = () => (
    ((Math.random() * (MAP_COORDINATE_LIMIT * 2)) - MAP_COORDINATE_LIMIT).toFixed(5)
  );

  return `${toPreciseCoordinate()}, ${toPreciseCoordinate()}`;
}

export function parseCartesianCoordinates(value) {
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
}

export function mapCoordinatesToSurfacePosition(coordinates) {
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
}

export function mapSurfacePositionToCoordinates(left, top) {
  const normalizedX = Math.max(0, Math.min(1, left / MAP_SURFACE_WIDTH));
  const normalizedY = Math.max(0, Math.min(1, top / MAP_SURFACE_HEIGHT));

  return {
    x: (normalizedX * (MAP_COORDINATE_LIMIT * 2)) - MAP_COORDINATE_LIMIT,
    y: MAP_COORDINATE_LIMIT - (normalizedY * (MAP_COORDINATE_LIMIT * 2)),
  };
}

export function formatMapCoordinate(value) {
  return Number(value).toFixed(5);
}

export function formatCoordinatesPair(coordinates) {
  const parsed = parseCartesianCoordinates(coordinates);

  if (!parsed) {
    return "--, --";
  }

  return `${formatMapCoordinate(parsed.x)}, ${formatMapCoordinate(parsed.y)}`;
}
