import type { MetaFunction } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import SplatViewer from "~/components/splatviewer";
import { scenes } from "~/scenes";

export const meta: MetaFunction = () => {
    return [
        { title: `${scenes.truck.title} - 3D Gaussian Splat` },
        { name: "description", content: `View the ${scenes.truck.title} 3D Gaussian Splat scene` },
    ];
};

export default function Truck() {
    return (
        <ClientOnly fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            {() => <SplatViewer scene={scenes.truck} />}
        </ClientOnly>
    );
}
