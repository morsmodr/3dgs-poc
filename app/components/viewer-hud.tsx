import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import type { CameraPath, CameraPathStatus } from "~/lib/camera-path";
import { formatCameraPathDuration } from "~/lib/camera-path";
import type { MarbleModel } from "~/lib/marble-client";

interface ViewerHUDProps {
  title: string;
  prompt?: string;
  model?: MarbleModel;
  createdAt?: string;
  isSample?: boolean;
  cameraPath?: CameraPath | null;
  cameraPathStatus?: CameraPathStatus;
  onStartCameraPathRecording?: () => void;
  onStopCameraPathRecording?: () => void;
  onPlayCameraPath?: () => void;
  onStopCameraPathPlayback?: () => void;
  onClearCameraPath?: () => void;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getModelBadge(model: MarbleModel) {
  if (model === "marble-1.1") {
    return {
      label: "Marble 1.1",
      className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    };
  }
  return {
    label: "Marble 1.1 Plus",
    className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };
}

export default function ViewerHUD({
  title,
  prompt,
  model,
  createdAt,
  isSample = false,
  cameraPath,
  cameraPathStatus,
  onStartCameraPathRecording,
  onStopCameraPathRecording,
  onPlayCameraPath,
  onStopCameraPathPlayback,
  onClearCameraPath,
}: ViewerHUDProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const pathStatus = cameraPathStatus ?? {
    isRecording: false,
    isPlaying: false,
    keyframeCount: 0,
    durationMs: 0,
    error: null,
  };
  const hasCameraPath = Boolean(cameraPath && cameraPath.keyframes.length > 1);

  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleCopyCameraPath = useCallback(async () => {
    if (!cameraPath) {
      return;
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(cameraPath, null, 2));
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }, [cameraPath]);

  const handleDownloadCameraPath = useCallback(() => {
    if (!cameraPath) {
      return;
    }

    const blob = new Blob([JSON.stringify(cameraPath, null, 2)], {
      type: "application/json",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-camera-path.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }, [cameraPath, title]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleBack();
      }
      if (e.key === "h" || e.key === "H") {
        setVisible((v) => !v);
      }
      if (e.key.toLowerCase() === "r" && e.shiftKey) {
        if (pathStatus.isRecording) {
          onStopCameraPathRecording?.();
        } else {
          onStartCameraPathRecording?.();
        }
      }
      if (e.key === "p" || e.key === "P") {
        if (pathStatus.isPlaying) {
          onStopCameraPathPlayback?.();
        } else if (hasCameraPath) {
          onPlayCameraPath?.();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleBack,
    hasCameraPath,
    onPlayCameraPath,
    onStartCameraPathRecording,
    onStopCameraPathPlayback,
    onStopCameraPathRecording,
    pathStatus.isPlaying,
    pathStatus.isRecording,
  ]);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setCopyState("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const badge = model ? getModelBadge(model) : null;

  return (
    <>
      {/* Back button - always visible */}
      <button
        onClick={handleBack}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-gray-900/80 hover:bg-gray-800 backdrop-blur-sm rounded-lg border border-gray-700/50 text-white text-sm font-medium transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back
      </button>

      {/* Toggle HUD button */}
      <button
        onClick={() => setVisible((v) => !v)}
        className="fixed top-4 right-4 z-50 p-2 bg-gray-900/80 hover:bg-gray-800 backdrop-blur-sm rounded-lg border border-gray-700/50 text-white transition-colors"
        title={visible ? "Hide info (H)" : "Show info (H)"}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {visible ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          )}
        </svg>
      </button>

      {/* Info panel - pointer-events-none on gradient so it doesn't block camera controls */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 pointer-events-none ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }`}
      >
        <div className="bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent pt-16 pb-6 px-6">
          {/* Re-enable pointer events only for the content area */}
          <div className="max-w-3xl pointer-events-auto">
            {/* Badges row */}
            <div className="flex items-center gap-2 mb-2">
              {isSample && (
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-700/80 text-gray-300 rounded border border-gray-600/50">
                  Sample Scene
                </span>
              )}
              {badge && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded border ${badge.className}`}
                >
                  {badge.label}
                </span>
              )}
              {createdAt && (
                <ClientOnly fallback={<span className="text-xs text-gray-500">--</span>}>
                  {() => (
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(createdAt)}
                    </span>
                  )}
                </ClientOnly>
              )}
            </div>

            {/* Title - collapsible with 3-line clamp, smaller font */}
            <div className="mb-2">
              <p
                className={`text-sm text-white ${
                  expanded ? "" : "line-clamp-3"
                }`}
              >
                {title}
              </p>
              {title.length > 150 && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>

            {/* Prompt */}
            {prompt && (
              <p className="text-gray-400 text-xs line-clamp-2 max-w-2xl">
                {prompt}
              </p>
            )}

            <div className="mt-4 max-w-3xl rounded-xl border border-gray-700/60 bg-gray-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">Camera path authoring</p>
                  <p className="text-xs text-gray-400">
                    Record an orbit, play it back, then export the path JSON.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pathStatus.isRecording ? (
                    <button
                      onClick={onStopCameraPathRecording}
                      className="rounded-lg bg-red-500/20 px-3 py-2 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/30"
                    >
                      Stop recording
                    </button>
                  ) : (
                    <button
                      onClick={onStartCameraPathRecording}
                      className="rounded-lg bg-blue-500/20 px-3 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-blue-500/30"
                    >
                      Record path
                    </button>
                  )}

                  {pathStatus.isPlaying ? (
                    <button
                      onClick={onStopCameraPathPlayback}
                      className="rounded-lg bg-gray-700 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-600"
                    >
                      Stop playback
                    </button>
                  ) : (
                    <button
                      onClick={onPlayCameraPath}
                      disabled={!hasCameraPath}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        hasCameraPath
                          ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                          : "cursor-not-allowed bg-gray-800 text-gray-500"
                      }`}
                    >
                      Play path
                    </button>
                  )}

                  <button
                    onClick={handleCopyCameraPath}
                    disabled={!hasCameraPath}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      hasCameraPath
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "cursor-not-allowed bg-gray-800 text-gray-500"
                    }`}
                  >
                    {copyState === "copied"
                      ? "Copied JSON"
                      : copyState === "error"
                        ? "Copy failed"
                        : "Copy JSON"}
                  </button>

                  <button
                    onClick={handleDownloadCameraPath}
                    disabled={!hasCameraPath}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      hasCameraPath
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "cursor-not-allowed bg-gray-800 text-gray-500"
                    }`}
                  >
                    Download JSON
                  </button>

                  <button
                    onClick={onClearCameraPath}
                    disabled={!hasCameraPath && !pathStatus.isRecording}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      hasCameraPath || pathStatus.isRecording
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "cursor-not-allowed bg-gray-800 text-gray-500"
                    }`}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                <span>{pathStatus.keyframeCount} keyframes</span>
                <span>{formatCameraPathDuration(pathStatus.durationMs)}</span>
                <span>
                  {pathStatus.isRecording
                    ? "Recording live"
                    : hasCameraPath
                      ? "Ready for playback"
                      : "Record a path to export it"}
                </span>
              </div>

              {pathStatus.error && (
                <p className="mt-2 text-xs text-red-300">{pathStatus.error}</p>
              )}
            </div>

            {/* Keyboard hints */}
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">
                  H
                </kbd>{" "}
                Toggle info
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">
                  Esc
                </kbd>{" "}
                Back to gallery
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">
                  Shift+R
                </kbd>{" "}
                Record camera path
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">
                  P
                </kbd>{" "}
                Play camera path
              </span>
              <span>Drag to orbit</span>
              <span>Scroll to zoom</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
