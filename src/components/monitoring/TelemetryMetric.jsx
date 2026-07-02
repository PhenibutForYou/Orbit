import { memo, useEffect, useRef, useState } from "react";
import { getTelemetryTone } from "../../utils/status.js";

function TelemetryMetricComponent({ item }) {
  const [changed, setChanged] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const updateSignature = `${item.updatedToken ?? ""}|${item.value ?? ""}|${item.progress ?? ""}`;
  const previousSignatureRef = useRef(updateSignature);
  const previousProgressRef = useRef(item.progress);
  const mountedRef = useRef(false);
  const tone = getTelemetryTone(item.status ?? item.progress);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setAnimated(true);
      setDisplayedProgress(item.progress);
      mountedRef.current = true;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      return undefined;
    }

    if (previousSignatureRef.current === updateSignature) {
      return undefined;
    }

    const nextProgress = item.progress;
    const previousProgress = previousProgressRef.current;
    previousSignatureRef.current = updateSignature;
    previousProgressRef.current = nextProgress;

    setChanged(true);
    setAnimated(false);
    setDisplayedProgress(previousProgress);

    let secondFrameId = 0;
    const firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        setAnimated(true);
        setDisplayedProgress(nextProgress);
      });
    });

    const timeoutId = window.setTimeout(() => setChanged(false), 1050);

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [item.progress, updateSignature]);

  return (
    <div className={[
      "object-details__metric",
      "object-details__metric--live",
      changed ? `object-details__metric--changed object-details__metric--changed-${tone}` : "",
    ].filter(Boolean).join(" ")}>
      <div className="object-details__metric-copy">
        <span>{item.label}</span>
        <strong>{item.value}</strong>
      </div>
      <span className="object-details__metric-bar">
        <span
          className={[
            "object-details__metric-fill",
            `object-details__metric-fill--${tone}`,
            animated ? "object-details__metric-fill--animated" : "",
            changed ? "object-details__metric-fill--changed" : "",
          ].filter(Boolean).join(" ")}
          style={{ width: `${displayedProgress}%` }}
        />
      </span>
    </div>
  );
}

export const TelemetryMetric = memo(TelemetryMetricComponent);
