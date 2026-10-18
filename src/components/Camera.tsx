/**
 * Camera helpers for the prototype.
 *
 * CameraScanner — continuous barcode scanning through the browser Shape
 * Detection API (window.BarcodeDetector, Chromium). Where the API is missing
 * the preview still opens and the page falls back to manual entry; the
 * prototype never claims detection it cannot perform.
 *
 * CameraCapture — one-shot photo capture for Register Food step 2. The
 * captured frame goes through the same simulated freshness check as an
 * uploaded file (no model is involved, §14.2).
 *
 * getUserMedia requires a secure context (https or localhost).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { IconBarcode, IconCamera, IconX } from "./icons";

interface DetectedCode {
  rawValue: string;
}
interface DetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedCode[]>;
}
type DetectorCtor = new (options?: { formats?: string[] }) => DetectorLike;

function detectorCtor(): DetectorCtor | null {
  return (window as unknown as { BarcodeDetector?: DetectorCtor })
    .BarcodeDetector ?? null;
}

async function openStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("unsupported");
  }
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: false,
  });
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

/* --------------------------- Barcode scanner --------------------------- */

export function CameraScanner({
  onDetect,
}: {
  onDetect: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const [state, setState] = useState<"idle" | "starting" | "live" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  // null = camera not started yet; then whether auto-decode is available.
  const [auto, setAuto] = useState<boolean | null>(null);

  const halt = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopStream(streamRef.current);
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, []);

  // Unmount always releases the camera.
  useEffect(() => halt, [halt]);

  const stop = () => {
    halt();
    setState("idle");
  };

  const start = async () => {
    setState("starting");
    setMessage(null);
    let stream: MediaStream;
    try {
      stream = await openStream();
    } catch {
      setState("error");
      setMessage(
        "Camera is unavailable — permission was denied, no camera is attached, or the page is not on https/localhost. Type the barcode below instead.",
      );
      return;
    }
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) {
      halt();
      setState("error");
      setMessage("The preview could not start. Type the barcode below instead.");
      return;
    }
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      // Autoplay policies can reject play(); the preview usually still runs.
    }
    setState("live");

    const Ctor = detectorCtor();
    if (!Ctor) {
      setAuto(false);
      return;
    }
    let detector: DetectorLike | null = null;
    try {
      detector = new Ctor({
        formats: [
          "qr_code",
          "code_128",
          "code_39",
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
        ],
      });
    } catch {
      try {
        detector = new Ctor();
      } catch {
        setAuto(false);
        return;
      }
    }
    setAuto(true);
    timerRef.current = window.setInterval(() => {
      const v = videoRef.current;
      if (!v || !v.videoWidth) return;
      detector
        ?.detect(v)
        .then((codes) => {
          const hit = codes.find((c) => c.rawValue?.trim());
          if (!hit) return;
          const value = hit.rawValue.trim();
          halt();
          setState("idle");
          onDetect(value);
        })
        .catch(() => {
          // Transient per-frame errors are ignored; the loop keeps running.
        });
    }, 400);
  };

  return (
    <div className="stack stack--sm">
      <div className={`camera-frame${state === "live" ? " camera-frame--live" : ""}`}>
        <video
          ref={videoRef}
          className="camera-video"
          playsInline
          muted
          aria-label="Camera preview for barcode scanning"
        />
        {state !== "live" && (
          <div className="camera-placeholder">
            <IconBarcode />
            <span>
              {state === "starting"
                ? "Starting camera…"
                : "Camera is off. Start it to scan a barcode."}
            </span>
          </div>
        )}
      </div>

      <div className="button-row">
        {state !== "live" ? (
          <button
            type="button"
            className="button button--primary"
            onClick={start}
            disabled={state === "starting"}
          >
            <IconCamera />
            {state === "starting" ? "Starting camera…" : "Start camera"}
          </button>
        ) : (
          <button type="button" className="button button--secondary" onClick={stop}>
            <IconX />
            Stop camera
          </button>
        )}
        <span className="tiny">
          {state === "live" && auto
            ? "Scanning… hold the camera steady about 15–30 cm from the code."
            : "Point the camera at the label on the food package."}
        </span>
      </div>

      {message && (
        <div className="scan-error" role="alert">
          {message}
        </div>
      )}

      {state === "live" && auto === false && (
        <div className="notice">
          This browser cannot decode barcodes from the video automatically.
          The preview is live — type or paste the code printed on the label
          into the field below.
        </div>
      )}
    </div>
  );
}

/* --------------------------- Photo capture ----------------------------- */

export function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"starting" | "live" | "error">("starting");
  const [message, setMessage] = useState<string | null>(null);

  const shutdown = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await openStream();
        if (cancelled) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) throw new Error("no video element");
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // Autoplay policies can reject play(); the preview usually still runs.
        }
        if (!cancelled) setState("live");
      } catch {
        if (!cancelled) {
          setState("error");
          setMessage(
            "Camera is unavailable — permission was denied, no camera is attached, or the page is not on https/localhost. Use Upload photo instead.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      shutdown();
    };
  }, [shutdown]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setMessage("The frame could not be captured. Try again.");
          return;
        }
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        shutdown();
        onCapture(file);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="stack stack--sm camera-capture">
      <div className={`camera-frame${state === "live" ? " camera-frame--live" : ""}`}>
        <video
          ref={videoRef}
          className="camera-video"
          playsInline
          muted
          aria-label="Camera preview for the food photo"
        />
        {state !== "live" && (
          <div className="camera-placeholder">
            <IconCamera />
            <span>{state === "starting" ? "Starting camera…" : "Camera unavailable."}</span>
          </div>
        )}
      </div>

      {message && (
        <div className="scan-error" role="alert">
          {message}
        </div>
      )}

      <div className="button-row">
        <button
          type="button"
          className="button button--primary"
          onClick={capture}
          disabled={state !== "live"}
        >
          <IconCamera />
          Capture photo
        </button>
        <button type="button" className="button button--ghost" onClick={onClose}>
          <IconX />
          Cancel
        </button>
        <span className="tiny">
          The captured frame runs the same freshness check as an upload.
        </span>
      </div>
    </div>
  );
}
