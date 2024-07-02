import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import * as THREE from "three";
import { useEffect } from "react";

export default function SplatViewer () {
    let viewer: any = null;
    useEffect(() => {
        viewer = new GaussianSplats3D.Viewer({
            // values copied from https://github.com/mkkellogg/GaussianSplats3D/blob/main/demo/bonsai.html
            'cameraUp': [0.01933, -0.75830, -0.65161],
            'initialCameraPosition': [1.54163, 2.68515, -6.37228],
            'initialCameraLookAt': [0.45622, 1.95338, 1.51278],
            'sphericalHarmonicsDegree': 2
            });
        viewer.addSplatScene("/garden_high.ksplat", {
            'progressiveLoad': false,
            'showLoadingUI': true,
        })
        .then(() => {
            viewer.start();
            });
    }, []);

    return null;
}