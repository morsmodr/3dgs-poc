import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { useEffect, useRef } from "react";
import type { SceneConfig } from "~/scenes";

interface SplatViewerProps {
    scene: SceneConfig;
}

export default function SplatViewer({ scene }: SplatViewerProps) {
    const viewerRef = useRef<any>(null);

    useEffect(() => {
        viewerRef.current = new GaussianSplats3D.Viewer({
            cameraUp: scene.cameraUp,
            initialCameraPosition: scene.initialCameraPosition,
            initialCameraLookAt: scene.initialCameraLookAt,
            sphericalHarmonicsDegree: scene.sphericalHarmonicsDegree ?? 2,
        });

        viewerRef.current
            .addSplatScene(scene.url, {
                progressiveLoad: true,
                showLoadingUI: true,
            })
            .then(() => {
                viewerRef.current.start();
            });

        return () => {
            if (viewerRef.current) {
                viewerRef.current.dispose();
            }
        };
    }, [scene]);

    return null;
}
