/**
 * Camera helpers for the prototype.
 *
 * CameraScanner — continuous barcode scanning with a hybrid decoder:
 *  1. Native Shape Detection API (window.BarcodeDetector) when available.
 *  2. JavaScript fallback (ZXing, lazy-loaded chunk) when the native API is
 *     missing or produces no hit for ~15 s — some Android browsers expose the
 *     API but fail to decode screen-lit codes.
 *  3. Manual entry stays available on the page; a "Scan this frame" button
 *     also decodes a still capture, which helps with displays/refresh bands.
 * The prototype never claims detection it cannot perform.
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
  detect(source: CanvasImageSource): Promise<DetectedCode[]>;
}
type DetectorCtor = new (options?: { formats?: string[] }) => DetectorLike;

interface ZxResultLike {
  getText(): string;
}
interface ZxingReader {
  reset(): void;
  decodeFromVideoElementContinuously(
    source: HTMLVideoElement,
    callbackFn: (result: ZxResultLike, error?: unknown) => unknown,
  ): Promise<void>;
  decodeFromImageUrl(url: string): Promise<ZxResultLike>;
}

function detectorCtor(): DetectorCtor | null {
  return (window as unknown as { BarcodeDetector?: DetectorCtor })
    .BarcodeDetector ?? null;
}

async function openStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("unsupported");
  }
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function frameToCanvas(video: HTMLVideoElement): HTMLCanvasElement | null {
  if (!video.videoWidth) return null;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d")?.drawImage(video, 0, 0);
  return canvas;
}

/* --------------------------- Barcode scanner --------------------------- */

type DecoderMode = "idle" | "native" | "zxing-loading" | "zxing" | "unavailable";

const DECODER_LABEL: Record<DecoderMode, string> = {
  idle: "ready",
  native: "native (BarcodeDetector)",
  "zxing-loading": "JavaScript fallback (loading…)",
  zxing: "JavaScript fallback",
  unavailable: "unavailable — use manual entry",
};

export function CameraScanner({
  onDetect,
}: {
  onDetect: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const missTimerRef = useRef<number | null>(null);
  const slowHintRef = useRef<number | null>(null);
  const nativeRef = useRef<DetectorLike | null>(null);
  const zxingRef = useRef<ZxingReader | null>(null);
  const liveRef = useRef(false);
  const hitRef = useRef(false);
  const onDetectRef = useRef(onDetect);
  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  const [state, setState] = useState<"idle" | "starting" | "live" | "error">(
    "idle",
  );
  const [decoder, setDecoder] = useState<DecoderMode>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [slowHint, setSlowHint] = useState(false);

  const clearTimers = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (missTimerRef.current !== null) {
      window.clearTimeout(missTimerRef.current);
      missTimerRef.current = null;
    }
    if (slowHintRef.current !== null) {
      window.clearTimeout(slowHintRef.current);
      slowHintRef.current = null;
    }
  };

  const halt = useCallback(() => {
    clearTimers();
    liveRef.current = false;
    stopStream(streamRef.current);
    streamRef.current = null;
    try {
      zxingRef.current?.reset();
    } catch {
      // Reader may already be stopped.
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, []);

  // Unmount always releases the camera.
  useEffect(() => halt, [halt]);

  const handleHit = (value: string) => {
    if (hitRef.current) return;
    hitRef.current = true;
    halt();
    setState("idle");
    setDecoder("idle");
    onDetectRef.current(value);
  };

  const loadZxing = async (): Promise<ZxingReader> => {
    if (zxingRef.current) return zxingRef.current;
    const mod = await import("@zxing/library");
    const reader = new mod.BrowserMultiFormatReader(undefined, 350) as unknown as ZxingReader;
    zxingRef.current = reader;
    return reader;
  };

  const startZxing = async (why: string) => {
    setDecoder("zxing-loading");
    try {
      const reader = await loadZxing();
      if (!liveRef.current) return;
      const video = videoRef.current;
      if (!video || !video.videoWidth) throw new Error("no video");
      setDecoder("zxing");
      setMessage(
        why === "no-native"
          ? null
          : "Native decoding found nothing — switched to the JavaScript decoder.",
      );
      await reader.decodeFromVideoElementContinuously(video, (result) => {
        const text = result?.getText?.();
        if (!text || !liveRef.current || hitRef.current) return;
        handleHit(text.trim());
      });
    } catch {
      if (!liveRef.current) return;
      setDecoder("unavailable");
      setMessage(
        "Barcode decoding could not start in this browser. Use the manual field below.",
      );
    }
  };

  const stopNative = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = async () => {
    setState("starting");
    setMessage(null);
    setSlowHint(false);
    hitRef.current = false;
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
    liveRef.current = true;
    setState("live");

    // Nudge after 10 s of silence so the user knows scanning is active.
    slowHintRef.current = window.setTimeout(() => {
      if (liveRef.current && !hitRef.current) setSlowHint(true);
    }, 10_000);

    // --- native detector ---
    nativeRef.current = null;
    const Ctor = detectorCtor();
    if (Ctor) {
      try {
        nativeRef.current = new Ctor({
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
          nativeRef.current = new Ctor();
        } catch {
          nativeRef.current = null;
        }
      }
    }

    if (nativeRef.current) {
      setDecoder("native");
      timerRef.current = window.setInterval(() => {
        const v = videoRef.current;
        if (!v || !v.videoWidth || hitRef.current) return;
        nativeRef.current
          ?.detect(v)
          .then((codes) => {
            const hit = codes.find((c) => c.rawValue?.trim());
            if (hit) handleHit(hit.rawValue.trim());
          })
          .catch(() => {
            // Transient per-frame errors are ignored; the loop keeps running.
          });
      }, 350);
      // If the native API stays silent on real codes, fall back to ZXing.
      missTimerRef.current = window.setTimeout(() => {
        if (liveRef.current && !hitRef.current && timerRef.current !== null) {
          stopNative();
          void startZxing("native-miss");
        }
      }, 15_000);
    } else {
      await startZxing("no-native");
    }
  };

  const stop = () => {
    halt();
    setState("idle");
    setDecoder("idle");
    setMessage(null);
    setSlowHint(false);
  };

  /** One-shot decode of the current frame — helps with screens and glare. */
  const scanFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = frameToCanvas(video);
    if (!canvas) return;
    try {
      const codes = await nativeRef.current?.detect(canvas);
      const hit = codes?.find((c) => c.rawValue?.trim());
      if (hit) {
        handleHit(hit.rawValue.trim());
        return;
      }
    } catch {
      // Fall through to the JS decoder.
    }
    try {
      const reader = await loadZxing();
      const res = await reader.decodeFromImageUrl(
        canvas.toDataURL("image/jpeg", 0.9),
      );
      const text = res?.getText?.();
      if (text?.trim()) {
        handleHit(text.trim());
        return;
      }
    } catch {
      // No code in this frame.
    }
    setMessage(
      "Could not read this frame. Move closer (15–30 cm), keep the code flat and steady, then try again.",
    );
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

      <div className="tiny camera-status" role="status">
        Decoder: {DECODER_LABEL[decoder]}
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
          <>
            <button type="button" className="button button--secondary" onClick={stop}>
              <IconX />
              Stop camera
            </button>
            <button type="button" className="button button--ghost" onClick={scanFrame}>
              <IconBarcode />
              Scan this frame
            </button>
          </>
        )}
        <span className="tiny">
          {state === "live"
            ? slowHint
              ? "No code detected yet — move closer (15–30 cm) and hold steady."
              : "Hold the camera steady over the barcode."
            : "Point the camera at the label on the food package."}
        </span>
      </div>

      {message && (
        <div className="scan-error" role="alert">
          {message}
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
