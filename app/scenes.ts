export interface SceneConfig {
    title: string;
    url: string;
    thumbnail?: string;
    cameraUp: [number, number, number];
    initialCameraPosition: [number, number, number];
    initialCameraLookAt: [number, number, number];
    sphericalHarmonicsDegree?: number;
}

export const scenes: Record<string, SceneConfig> = {
    "tea-house": {
        title: "Tea House",
        url: "https://cdn.marble.worldlabs.ai/ae489370-896d-4abb-8f8e-77cb91fa4556/a3cd63ef-4ec2-4ab3-8992-fff02c44bd68_ceramic.spz",
        thumbnail: "https://cdn.marble.worldlabs.ai/ae489370-896d-4abb-8f8e-77cb91fa4556/c73f3466-d1ec-4f27-93cd-5955b8e1837b_panos/rgb_0.png",
        cameraUp: [0, -1, 0],
        initialCameraPosition: [0, 0, -0.5],
        initialCameraLookAt: [0, 0, 0],
    },
    temple: {
        title: "Temple Ruins",
        url: "https://cdn.marble.worldlabs.ai/fa8267dd-aee1-4828-bcf3-87864fdd4c8a/e3c1fa55-a24b-4462-ae53-39cd0eee1dea_ceramic.spz",
        thumbnail: "https://cdn.marble.worldlabs.ai/fa8267dd-aee1-4828-bcf3-87864fdd4c8a/8f322ae5-a04b-4683-b1db-16fa3b995e69_panos/rgb_0.png",
        cameraUp: [0, -1, 0],
        initialCameraPosition: [0, 0, -0.5],
        initialCameraLookAt: [0, 0, 0],
    },
    cyberpunk: {
        title: "Cyberpunk Alley",
        url: "https://cdn.marble.worldlabs.ai/4e350772-83a0-425c-b92c-8972299f57e6/f7483312-b5db-4559-a1e6-4b6850340192_ceramic.spz",
        thumbnail: "https://cdn.marble.worldlabs.ai/4e350772-83a0-425c-b92c-8972299f57e6/3f33d497-57eb-468d-bb15-f886733b255e_panos/rgb_0.png",
        cameraUp: [0, -1, 0],
        initialCameraPosition: [0, 0, -0.5],
        initialCameraLookAt: [0, 0, 0],
    },
};
