import SparkCanvas from "./spark-canvas";
import type { SceneConfig } from "~/scenes";

interface SplatViewerProps {
    scene: SceneConfig;
}

export default function SplatViewer({ scene }: SplatViewerProps) {
    return <SparkCanvas scene={scene} className="w-full h-screen" />;
}
