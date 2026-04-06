export type CameraVector = [number, number, number];

export interface CameraPathKeyframe {
  timeMs: number;
  position: CameraVector;
  target: CameraVector;
}

export interface CameraPath {
  version: 1;
  createdAt: string;
  durationMs: number;
  keyframes: CameraPathKeyframe[];
}

export interface CameraPathStatus {
  isRecording: boolean;
  isPlaying: boolean;
  keyframeCount: number;
  durationMs: number;
  error: string | null;
}

export interface CameraPathAction {
  id: number;
  type: "start-recording" | "stop-recording" | "play" | "stop-playback" | "clear";
}

export function createEmptyCameraPathStatus(): CameraPathStatus {
  return {
    isRecording: false,
    isPlaying: false,
    keyframeCount: 0,
    durationMs: 0,
    error: null,
  };
}

export function formatCameraPathDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${Math.max(durationMs, 0)}ms`;
  }

  return `${(durationMs / 1000).toFixed(1)}s`;
}

function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

function lerpVector(start: CameraVector, end: CameraVector, alpha: number): CameraVector {
  return [
    lerp(start[0], end[0], alpha),
    lerp(start[1], end[1], alpha),
    lerp(start[2], end[2], alpha),
  ];
}

export function sampleCameraPath(
  path: CameraPath,
  elapsedMs: number
): Pick<CameraPathKeyframe, "position" | "target"> {
  const first = path.keyframes[0];
  const last = path.keyframes[path.keyframes.length - 1];

  if (!first || !last) {
    throw new Error("Camera path must contain at least one keyframe");
  }

  if (elapsedMs <= 0 || path.keyframes.length === 1) {
    return {
      position: first.position,
      target: first.target,
    };
  }

  if (elapsedMs >= path.durationMs) {
    return {
      position: last.position,
      target: last.target,
    };
  }

  for (let index = 1; index < path.keyframes.length; index += 1) {
    const current = path.keyframes[index];
    const previous = path.keyframes[index - 1];

    if (elapsedMs <= current.timeMs) {
      const span = current.timeMs - previous.timeMs || 1;
      const alpha = (elapsedMs - previous.timeMs) / span;

      return {
        position: lerpVector(previous.position, current.position, alpha),
        target: lerpVector(previous.target, current.target, alpha),
      };
    }
  }

  return {
    position: last.position,
    target: last.target,
  };
}
