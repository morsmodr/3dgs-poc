import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type {
  CameraPath,
  CameraPathAction,
  CameraPathKeyframe,
  CameraPathStatus,
} from "~/lib/camera-path";
import {
  createEmptyCameraPathStatus,
  sampleCameraPath,
} from "~/lib/camera-path";
import type { SceneConfig } from "~/scenes";
import { useWebGLContext } from "~/hooks/use-webgl-context";
import { WebGLContextLost } from "~/components/webgl-context-lost";

interface SparkSceneProps {
  url: string;
  cameraPosition?: [number, number, number];
  cameraLookAt?: [number, number, number];
  cameraUp?: [number, number, number];
  cameraPathAction?: CameraPathAction | null;
  onCameraPathChange?: (path: CameraPath | null) => void;
  onCameraPathStatusChange?: (status: CameraPathStatus) => void;
}

const CAMERA_PATH_SAMPLE_INTERVAL_MS = 250;

function SparkScene({
  url,
  cameraPosition,
  cameraLookAt,
  cameraUp,
  cameraPathAction,
  onCameraPathChange,
  onCameraPathStatusChange,
}: SparkSceneProps) {
  const { camera, gl, scene } = useThree();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const playbackFrameRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const recordingFramesRef = useRef<CameraPathKeyframe[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const currentPathRef = useRef<CameraPath | null>(null);
  const cameraPathStatusRef = useRef<CameraPathStatus>(createEmptyCameraPathStatus());
  const [, setCameraPathStatus] = useState<CameraPathStatus>(
    createEmptyCameraPathStatus()
  );

  const publishCameraPathStatus = useCallback(
    (nextStatus: CameraPathStatus) => {
      cameraPathStatusRef.current = nextStatus;
      setCameraPathStatus(nextStatus);
      onCameraPathStatusChange?.(nextStatus);
    },
    [onCameraPathStatusChange]
  );

  const updateCameraPathStatus = useCallback(
    (patch: Partial<CameraPathStatus>) => {
      const nextStatus = {
        ...cameraPathStatusRef.current,
        ...patch,
      };
      publishCameraPathStatus(nextStatus);
    },
    [publishCameraPathStatus]
  );

  const captureFrame = useCallback(
    (timeMs: number): CameraPathKeyframe => {
      const target = controlsRef.current?.target ?? new THREE.Vector3(...(cameraLookAt ?? [0, 0, 0]));

      return {
        timeMs,
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [target.x, target.y, target.z],
      };
    },
    [camera, cameraLookAt]
  );

  const stopPlayback = useCallback(() => {
    if (playbackFrameRef.current !== null) {
      cancelAnimationFrame(playbackFrameRef.current);
      playbackFrameRef.current = null;
    }

    if (controlsRef.current) {
      controlsRef.current.enabled = true;
      controlsRef.current.update();
    }

    updateCameraPathStatus({ isPlaying: false });
  }, [updateCameraPathStatus]);

  const resetCameraPath = useCallback(() => {
    stopPlayback();

    if (recordingIntervalRef.current !== null) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    recordingFramesRef.current = [];
    recordingStartedAtRef.current = null;
    currentPathRef.current = null;
    onCameraPathChange?.(null);
    publishCameraPathStatus(createEmptyCameraPathStatus());
  }, [onCameraPathChange, publishCameraPathStatus, stopPlayback]);

  const stopRecording = useCallback(() => {
    if (recordingIntervalRef.current !== null) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    const startedAt = recordingStartedAtRef.current;
    const frames = recordingFramesRef.current;

    recordingStartedAtRef.current = null;

    if (startedAt === null || frames.length < 2) {
      updateCameraPathStatus({
        isRecording: false,
        keyframeCount: 0,
        durationMs: 0,
        error: "Record at least two moments to create a camera path.",
      });
      return;
    }

    const durationMs = frames[frames.length - 1].timeMs;
    const nextPath: CameraPath = {
      version: 1,
      createdAt: new Date().toISOString(),
      durationMs,
      keyframes: [...frames],
    };

    currentPathRef.current = nextPath;
    onCameraPathChange?.(nextPath);
    updateCameraPathStatus({
      isRecording: false,
      keyframeCount: nextPath.keyframes.length,
      durationMs: nextPath.durationMs,
      error: null,
    });
  }, [onCameraPathChange, updateCameraPathStatus]);

  const startRecording = useCallback(() => {
    stopPlayback();

    if (recordingIntervalRef.current !== null) {
      window.clearInterval(recordingIntervalRef.current);
    }

    const startedAt = performance.now();
    recordingStartedAtRef.current = startedAt;
    currentPathRef.current = null;
    onCameraPathChange?.(null);
    recordingFramesRef.current = [captureFrame(0)];

    updateCameraPathStatus({
      isRecording: true,
      isPlaying: false,
      keyframeCount: 1,
      durationMs: 0,
      error: null,
    });

    recordingIntervalRef.current = window.setInterval(() => {
      const nextStartedAt = recordingStartedAtRef.current;
      if (nextStartedAt === null) {
        return;
      }

      const elapsedMs = Math.round(performance.now() - nextStartedAt);
      recordingFramesRef.current.push(captureFrame(elapsedMs));
      updateCameraPathStatus({
        isRecording: true,
        keyframeCount: recordingFramesRef.current.length,
        durationMs: elapsedMs,
      });
    }, CAMERA_PATH_SAMPLE_INTERVAL_MS);
  }, [captureFrame, onCameraPathChange, stopPlayback, updateCameraPathStatus]);

  const playCurrentPath = useCallback(() => {
    const path = currentPathRef.current;

    if (!path) {
      updateCameraPathStatus({
        error: "Record a camera path before playback.",
      });
      return;
    }

    stopPlayback();

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    const startedAt = performance.now();
    updateCameraPathStatus({
      isPlaying: true,
      error: null,
    });

    const tick = () => {
      const elapsedMs = Math.round(performance.now() - startedAt);
      const sample = sampleCameraPath(path, elapsedMs);

      camera.position.set(...sample.position);
      camera.lookAt(new THREE.Vector3(...sample.target));

      if (controlsRef.current) {
        controlsRef.current.target.set(...sample.target);
        controlsRef.current.update();
      }

      if (elapsedMs >= path.durationMs) {
        stopPlayback();
        return;
      }

      playbackFrameRef.current = requestAnimationFrame(tick);
    };

    playbackFrameRef.current = requestAnimationFrame(tick);
  }, [camera, stopPlayback, updateCameraPathStatus]);

  useEffect(() => {
    if (cameraPosition) {
      camera.position.set(...cameraPosition);
    }
    if (cameraLookAt) {
      camera.lookAt(new THREE.Vector3(...cameraLookAt));
      if (controlsRef.current) {
        controlsRef.current.target.set(...cameraLookAt);
        controlsRef.current.update();
      }
    }
    if (cameraUp) {
      camera.up.set(...cameraUp);
    }
    camera.updateProjectionMatrix();
  }, [camera, cameraPosition, cameraLookAt, cameraUp]);

  useEffect(() => {
    publishCameraPathStatus(createEmptyCameraPathStatus());
  }, [publishCameraPathStatus]);

  useEffect(() => {
    resetCameraPath();
  }, [resetCameraPath, url]);

  useEffect(() => {
    if (!cameraPathAction) {
      return;
    }

    switch (cameraPathAction.type) {
      case "start-recording":
        startRecording();
        break;
      case "stop-recording":
        if (recordingStartedAtRef.current !== null) {
          recordingFramesRef.current.push(
            captureFrame(Math.round(performance.now() - recordingStartedAtRef.current))
          );
        }
        stopRecording();
        break;
      case "play":
        playCurrentPath();
        break;
      case "stop-playback":
        stopPlayback();
        break;
      case "clear":
        resetCameraPath();
        break;
    }
  }, [
    cameraPathAction,
    captureFrame,
    playCurrentPath,
    resetCameraPath,
    startRecording,
    stopPlayback,
    stopRecording,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadSpark = async () => {
      try {
        const spark = await import("@sparkjsdev/spark");

        if (!mounted) return;

        const sparkRenderer = new spark.SparkRenderer({
          renderer: gl,
        });
        scene.add(sparkRenderer);

        const loader = new spark.SplatLoader();
        const splats = await loader.loadAsync(url, (event: ProgressEvent) => {
          if (mounted && event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        if (!mounted) return;

        const splatMesh = new spark.SplatMesh({
          splats,
          lod: true,
          onLoad: () => {
            if (mounted) {
              setLoading(false);
            }
          },
        });
        scene.add(splatMesh);

        cleanupRef.current = () => {
          scene.remove(splatMesh);
          splatMesh.dispose();
          scene.remove(sparkRenderer);
        };
      } catch (err) {
        console.error("Failed to load Spark:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setLoading(false);
        }
      }
    };

    loadSpark();

    return () => {
      mounted = false;
      stopPlayback();
      if (recordingIntervalRef.current !== null) {
        window.clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [gl, scene, stopPlayback, url]);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={0.5}
        maxDistance={100}
      />
      {loading && (
        <Html center>
          <div className="flex flex-col items-center gap-3">
            <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-white text-sm font-medium">
              {progress > 0 ? `Loading... ${progress}%` : "Initializing..."}
            </span>
          </div>
        </Html>
      )}
      {error && (
        <Html center>
          <div className="text-red-400 text-center">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </Html>
      )}
    </>
  );
}

// Default camera for Marble-generated worlds: splats are centered at origin in OpenCV coords (+y down, +z forward)
// Position camera slightly back from origin, looking forward into the scene
const DEFAULT_CAMERA_POSITION: [number, number, number] = [0, 0, -0.5];
const DEFAULT_CAMERA_UP: [number, number, number] = [0, -1, 0];
const DEFAULT_CAMERA_LOOK_AT: [number, number, number] = [0, 0, 0];

interface SparkCanvasProps {
  className?: string;
  scene?: SceneConfig;
  url?: string;
  cameraPosition?: [number, number, number];
  cameraUp?: [number, number, number];
  cameraLookAt?: [number, number, number];
  cameraPathAction?: CameraPathAction | null;
  onCameraPathChange?: (path: CameraPath | null) => void;
  onCameraPathStatusChange?: (status: CameraPathStatus) => void;
}

export default function SparkCanvas(props: SparkCanvasProps) {
  const { className, scene, cameraPathAction, onCameraPathChange, onCameraPathStatusChange } = props;
  const { contextLost, handleCreated } = useWebGLContext();

  const url = scene?.url ?? props.url;
  if (!url) {
    throw new Error("SparkCanvas requires either a scene or url prop");
  }

  const cameraPosition =
    scene?.initialCameraPosition ?? props.cameraPosition ?? DEFAULT_CAMERA_POSITION;
  const cameraUp = scene?.cameraUp ?? props.cameraUp ?? DEFAULT_CAMERA_UP;
  const cameraLookAt = scene?.initialCameraLookAt ?? props.cameraLookAt ?? DEFAULT_CAMERA_LOOK_AT;

  if (contextLost) {
    return <WebGLContextLost className={className} />;
  }

  return (
    <div className={className ?? "w-full h-screen"}>
      <Canvas
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{
          fov: 75,
          near: 0.1,
          far: 1000,
          position: cameraPosition,
          up: new THREE.Vector3(...cameraUp),
        }}
        onCreated={handleCreated}
      >
        {/* eslint-disable-next-line react/no-unknown-property */}
        <color attach="background" args={["#1a1a2e"]} />
        <SparkScene
          url={url}
          cameraPosition={cameraPosition}
          cameraLookAt={cameraLookAt}
          cameraUp={cameraUp}
          cameraPathAction={cameraPathAction}
          onCameraPathChange={onCameraPathChange}
          onCameraPathStatusChange={onCameraPathStatusChange}
        />
      </Canvas>
    </div>
  );
}
