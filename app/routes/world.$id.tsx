import { useEffect, useState } from "react";
import {
  data,
  useLoaderData,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import SparkCanvas from "~/components/spark-canvas";
import ViewerHUD from "~/components/viewer-hud";
import type {
  CameraPath,
  CameraPathAction,
  CameraPathStatus,
} from "~/lib/camera-path";
import { createEmptyCameraPathStatus } from "~/lib/camera-path";
import type { MarbleModel } from "~/lib/marble-client";
import { getWorldById } from "~/lib/worlds-store";
import { scenes } from "~/scenes";

interface WorldData {
  id: string;
  title: string;
  prompt?: string;
  model?: MarbleModel;
  splatUrl: string;
  panoUrl?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  isSample: boolean;
  cameraPosition?: [number, number, number];
  cameraUp?: [number, number, number];
  cameraLookAt?: [number, number, number];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    throw data({ error: "World ID is required" }, { status: 400 });
  }

  // Check if it's a sample scene
  if (id in scenes) {
    const scene = scenes[id as keyof typeof scenes];
    return data<WorldData>({
      id,
      title: scene.title,
      splatUrl: scene.url,
      isSample: true,
      cameraPosition: scene.initialCameraPosition,
      cameraUp: scene.cameraUp,
      cameraLookAt: scene.initialCameraLookAt,
    });
  }

  // Check if it's a generated world
  const world = await getWorldById(id);

  if (!world) {
    throw data({ error: "World not found" }, { status: 404 });
  }

  if (world.status !== "completed" || !world.splatUrl) {
    throw data({ error: "World is not ready for viewing" }, { status: 400 });
  }

  return data<WorldData>({
    id: world.id,
    title: world.caption || world.prompt.slice(0, 60),
    prompt: world.prompt,
    model: world.model,
    splatUrl: world.splatUrl,
    panoUrl: world.panoUrl,
    thumbnailUrl: world.thumbnailUrl,
    createdAt: world.createdAt,
    isSample: false,
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [
      { title: "World Not Found - Worlds Explorer" },
      { name: "description", content: "The requested world could not be found" },
    ];
  }

  const title = `${data.title} - Worlds Explorer`;
  const description = data.prompt || `View the ${data.title} 3D world`;
  const image = data.panoUrl || data.thumbnailUrl;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    ...(image ? [{ property: "og:image", content: image }] : []),
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    ...(image ? [{ name: "twitter:image", content: image }] : []),
  ];
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-white text-sm">Loading viewer...</span>
      </div>
    </div>
  );
}

export default function WorldViewer() {
  const world = useLoaderData<typeof loader>();
  const [cameraPath, setCameraPath] = useState<CameraPath | null>(null);
  const [cameraPathStatus, setCameraPathStatus] = useState<CameraPathStatus>(
    createEmptyCameraPathStatus()
  );
  const [cameraPathAction, setCameraPathAction] = useState<CameraPathAction | null>(null);

  useEffect(() => {
    setCameraPath(null);
    setCameraPathStatus(createEmptyCameraPathStatus());
    setCameraPathAction(null);
  }, [world.id]);

  function dispatchCameraPathAction(actionType: CameraPathAction["type"]) {
    setCameraPathAction({
      id: Date.now(),
      type: actionType,
    });
  }

  return (
    <div className="relative w-full h-screen bg-gray-900">
      <ClientOnly fallback={<LoadingFallback />}>
        {() => (
          <>
            {world.isSample && world.cameraPosition && world.cameraUp && world.cameraLookAt ? (
              <SparkCanvas
                url={world.splatUrl}
                cameraPosition={world.cameraPosition}
                cameraUp={world.cameraUp}
                cameraLookAt={world.cameraLookAt}
                className="w-full h-full"
                cameraPathAction={cameraPathAction}
                onCameraPathChange={setCameraPath}
                onCameraPathStatusChange={setCameraPathStatus}
              />
            ) : (
              <SparkCanvas
                url={world.splatUrl}
                className="w-full h-full"
                cameraPathAction={cameraPathAction}
                onCameraPathChange={setCameraPath}
                onCameraPathStatusChange={setCameraPathStatus}
              />
            )}
            <ViewerHUD
              title={world.title}
              prompt={world.prompt}
              model={world.model}
              createdAt={world.createdAt}
              isSample={world.isSample}
              cameraPath={cameraPath}
              cameraPathStatus={cameraPathStatus}
              onStartCameraPathRecording={() => dispatchCameraPathAction("start-recording")}
              onStopCameraPathRecording={() => dispatchCameraPathAction("stop-recording")}
              onPlayCameraPath={() => dispatchCameraPathAction("play")}
              onStopCameraPathPlayback={() => dispatchCameraPathAction("stop-playback")}
              onClearCameraPath={() => dispatchCameraPathAction("clear")}
            />
          </>
        )}
      </ClientOnly>
    </div>
  );
}
