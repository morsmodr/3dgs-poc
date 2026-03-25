export interface SceneConfig {
    title: string;
    url: string;
    cameraUp: [number, number, number];
    initialCameraPosition: [number, number, number];
    initialCameraLookAt: [number, number, number];
    sphericalHarmonicsDegree?: number;
}

export const scenes: Record<string, SceneConfig> = {
    bonsai: {
        title: "Bonsai",
        url: "https://huggingface.co/datasets/nerfbaselines/nerfbaselines-supplementary/resolve/main/gaussian-splatting/mipnerf360/bonsai_demo/scene.ksplat",
        cameraUp: [0.01933, -0.75830, -0.65161],
        initialCameraPosition: [1.54163, 2.68515, -6.37228],
        initialCameraLookAt: [0.45622, 1.95338, 1.51278],
        sphericalHarmonicsDegree: 2,
    },
    palace: {
        title: "Palace",
        url: "https://huggingface.co/datasets/nerfbaselines/nerfbaselines-supplementary/resolve/main/gaussian-splatting/tanksandtemples/palace_demo/scene.ksplat",
        cameraUp: [0, -1, 0],
        initialCameraPosition: [0, 2, 5],
        initialCameraLookAt: [0, 0, 0],
        sphericalHarmonicsDegree: 2,
    },
    garden: {
        title: "Garden",
        url: "https://antimatter15.com/splat/garden.splat",
        cameraUp: [0, -1, -0.54],
        initialCameraPosition: [-3.15634, -0.16946, -0.51552],
        initialCameraLookAt: [1.52976, 2.27776, 1.65898],
        sphericalHarmonicsDegree: 2,
    },
    truck: {
        title: "Truck",
        url: "https://antimatter15.com/splat/truck.splat",
        cameraUp: [0, -1, -0.17],
        initialCameraPosition: [-5, -1, -1],
        initialCameraLookAt: [-1.72477, 0.05395, -0.00147],
        sphericalHarmonicsDegree: 2,
    },
    plush: {
        title: "Plush",
        url: "https://antimatter15.com/splat/plush.splat",
        cameraUp: [0, -1, 0],
        initialCameraPosition: [0, 2, 5],
        initialCameraLookAt: [0, 0, 0],
        sphericalHarmonicsDegree: 2,
    },
};
