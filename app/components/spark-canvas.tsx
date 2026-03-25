import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { SceneConfig } from "~/scenes";

interface SparkSceneProps {
    url: string;
    cameraPosition?: [number, number, number];
    cameraLookAt?: [number, number, number];
    cameraUp?: [number, number, number];
}

function SparkScene({ url, cameraPosition, cameraLookAt, cameraUp }: SparkSceneProps) {
    const { camera, gl, scene } = useThree();
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (cameraPosition) {
            camera.position.set(...cameraPosition);
        }
        if (cameraLookAt) {
            camera.lookAt(new THREE.Vector3(...cameraLookAt));
        }
        if (cameraUp) {
            camera.up.set(...cameraUp);
        }
        camera.updateProjectionMatrix();
    }, [camera, cameraPosition, cameraLookAt, cameraUp]);

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

                // Use SplatLoader for progress tracking
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
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, [url, gl, scene]);

    return (
        <>
            <OrbitControls
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

interface SparkCanvasProps {
    scene: SceneConfig;
    className?: string;
}

export default function SparkCanvas({ scene, className }: SparkCanvasProps) {
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
                    position: scene.initialCameraPosition,
                    up: new THREE.Vector3(...scene.cameraUp),
                }}
            >
                <color attach="background" args={["#1a1a2e"]} />
                <SparkScene
                    url={scene.url}
                    cameraPosition={scene.initialCameraPosition}
                    cameraLookAt={scene.initialCameraLookAt}
                    cameraUp={scene.cameraUp}
                />
            </Canvas>
        </div>
    );
}
