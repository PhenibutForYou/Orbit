import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { monitoringApi } from "../api/monitoringApi.js";
import { InfrastructureObject } from "../domain/InfrastructureObject.js";
import { MAX_OBJECTS_COUNT } from "../utils/constants.js";

const ObjectsContext = createContext(null);
export { MAX_OBJECTS_COUNT };

const UI_ENTER_DELAY_MS = 40;
const UI_REMOVE_DURATION_MS = 260;

const initialState = {
  objects: [],
  activeObjectId: null,
  loading: true,
  error: null,
  maxObjectsCount: MAX_OBJECTS_COUNT,
  lastEventAt: null,
  markerPulse: {
    objectId: null,
    token: 0,
  },
};

function normalizeObjectState(object, options = {}) {
  const normalizedObject = new InfrastructureObject(object).toDTO();

  return {
    ...normalizedObject,
    uiState: options.uiState ?? object.uiState ?? null,
  };
}

function limitObjectsByCapacity(objects, maxObjectsCount) {
  if (!Number.isFinite(maxObjectsCount) || maxObjectsCount <= 0) {
    return objects;
  }

  return objects.slice(0, maxObjectsCount);
}

function mergeTelemetry(currentTelemetry = [], updates = []) {
  if (updates.length === 0) {
    return currentTelemetry;
  }

  const updatesByKey = new Map(updates.map((item) => [item.key, item]));

  return currentTelemetry.map((item) => {
    const update = updatesByKey.get(item.key);

    if (!update) {
      return item;
    }

    return {
      ...item,
      ...update,
    };
  });
}

function applyObjectPatch(object, patch = {}) {
  return {
    ...object,
    ...patch,
    telemetry: patch.telemetry
      ?? mergeTelemetry(object.telemetry, patch.telemetryUpdates ?? []),
    static: patch.static ?? object.static,
    updatedAt: patch.updatedAt ?? object.updatedAt,
  };
}

function getEventUpdatedAt(event) {
  return event.patch?.updatedAt
    ?? event.object?.updatedAt
    ?? event.updatedAt
    ?? null;
}

function reducer(state, action) {
  switch (action.type) {
    case "objectsLoaded": {
      const nextMaxObjectsCount = action.maxObjectsCount ?? state.maxObjectsCount;
      const limitedObjects = limitObjectsByCapacity(action.objects, nextMaxObjectsCount);
      const activeStillExists = action.objects.some(
        (item) => item.id === state.activeObjectId,
      );

      const objects = limitedObjects.map((item) => normalizeObjectState(item, {
        uiState: action.animate ? "entering" : item.uiState,
      }));

      return {
        ...state,
        objects,
        activeObjectId: activeStillExists ? state.activeObjectId : null,
        loading: false,
        error: null,
        maxObjectsCount: nextMaxObjectsCount,
      };
    }

    case "objectsLoadFailed":
      return {
        ...state,
        loading: false,
        error: action.error,
      };

    case "setActiveObject":
      if (state.activeObjectId === action.id) {
        return state;
      }

      return {
        ...state,
        activeObjectId: action.id,
        markerPulse: action.pulse
          ? {
              objectId: action.id,
              token: state.markerPulse.token + 1,
            }
          : state.markerPulse,
      };

    case "eventReceived": {
      const event = action.event;

      if (event.type === "created") {
        const alreadyExists = state.objects.some(
          (item) => item.id === event.object.id,
        );

        return {
          ...state,
          objects:
            alreadyExists || state.objects.length >= state.maxObjectsCount
              ? state.objects
              : [...state.objects, normalizeObjectState(event.object, { uiState: "entering" })],
          lastEventAt: getEventUpdatedAt(event) ?? state.lastEventAt,
        };
      }

      if (event.type === "updated") {
        return {
          ...state,
          objects: state.objects.map((item) => {
            if (item.id !== event.objectId) {
              return item;
            }

            return normalizeObjectState(
              event.object ?? applyObjectPatch(item, event.patch),
              { uiState: item.uiState },
            );
          }),
          lastEventAt: getEventUpdatedAt(event) ?? state.lastEventAt,
        };
      }

      if (event.type === "deleted") {
        const objectExists = state.objects.some(
          (item) => item.id === event.objectId,
        );

        if (!objectExists) {
          return state;
        }

        return {
          ...state,
          objects: state.objects.map((item) => (
            item.id === event.objectId
              ? { ...item, uiState: "removing" }
              : item
          )),
          activeObjectId:
            state.activeObjectId === event.objectId
              ? null
              : state.activeObjectId,
          lastEventAt: getEventUpdatedAt(event) ?? state.lastEventAt,
        };
      }

      return state;
    }

    case "clearUiState":
      return {
        ...state,
        objects: state.objects.map((item) => (
          item.id === action.id && item.uiState === action.uiState
            ? { ...item, uiState: null }
            : item
        )),
      };

    case "removeObjectCompleted":
      return {
        ...state,
        objects: state.objects.filter((item) => item.id !== action.id),
      };

    default:
      return state;
  }
}

export function ObjectsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const animationTimersRef = useRef(new Set());

  const scheduleAction = useCallback((action, delay) => {
    const timeoutId = window.setTimeout(() => {
      animationTimersRef.current.delete(timeoutId);
      dispatch(action);
    }, delay);

    animationTimersRef.current.add(timeoutId);
  }, []);

  useEffect(() => {
    let mounted = true;

    monitoringApi
      .getSnapshot()
      .then((snapshot) => {
        if (!mounted) {
          return;
        }

        dispatch({
          type: "objectsLoaded",
          objects: snapshot.objects,
          maxObjectsCount: snapshot.maxObjects,
          animate: true,
        });

        for (const object of snapshot.objects) {
          scheduleAction(
            {
              type: "clearUiState",
              id: object.id,
              uiState: "entering",
            },
            UI_ENTER_DELAY_MS,
          );
        }
      })
      .catch((error) => {
        if (!mounted) {
          return;
        }

        dispatch({
          type: "objectsLoadFailed",
          error: error.message ?? "Failed to load objects",
        });
      });

    let unsubscribe = () => {};

    try {
      unsubscribe = monitoringApi.subscribe((event) => {
        dispatch({ type: "eventReceived", event });

        if (event.type === "created") {
          scheduleAction(
            {
              type: "clearUiState",
              id: event.object.id,
              uiState: "entering",
            },
            UI_ENTER_DELAY_MS,
          );
        }

        if (event.type === "deleted") {
          scheduleAction(
            {
              type: "removeObjectCompleted",
              id: event.objectId,
            },
            UI_REMOVE_DURATION_MS,
          );
        }
      });
    } catch (error) {
      dispatch({
        type: "objectsLoadFailed",
        error: error.message ?? "Failed to subscribe to events",
      });
    }

    return () => {
      mounted = false;
      unsubscribe();

      for (const timeoutId of animationTimersRef.current) {
        window.clearTimeout(timeoutId);
      }

      animationTimersRef.current.clear();
    };
  }, [scheduleAction]);

  const activeObject = useMemo(
    () => state.objects.find((item) => item.id === state.activeObjectId) ?? null,
    [state.activeObjectId, state.objects],
  );

  const setActiveObject = useCallback((id, options = {}) => {
    dispatch({
      type: "setActiveObject",
      id,
      pulse: Boolean(options.pulse),
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      activeObject,
      setActiveObject,
    }),
    [activeObject, setActiveObject, state],
  );

  return (
    <ObjectsContext.Provider value={value}>
      {children}
    </ObjectsContext.Provider>
  );
}

export function useObjects() {
  const context = useContext(ObjectsContext);

  if (!context) {
    throw new Error("useObjects must be used inside ObjectsProvider");
  }

  return context;
}
