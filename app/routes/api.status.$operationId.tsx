import { data, type LoaderFunctionArgs } from "react-router";
import { getOperationStatus } from "~/lib/marble-client";
import {
  updateWorldFromOperation,
  markWorldFailed,
} from "~/lib/worlds-store";

export async function loader({ params }: LoaderFunctionArgs) {
  const { operationId } = params;

  if (!operationId) {
    return data({ error: "Operation ID is required" }, { status: 400 });
  }

  try {
    const response = await getOperationStatus(operationId);

    if (response.done) {
      if (response.error) {
        await markWorldFailed(
          operationId,
          response.error.message || "Unknown error"
        );

        return data({
          operationId,
          done: true,
          success: false,
          error: response.error.message || "Generation failed",
        });
      }

      if (response.response) {
        const updatedWorld = await updateWorldFromOperation(
          operationId,
          response.response
        );

        return data({
          operationId,
          done: true,
          success: true,
          world: updatedWorld,
          splatUrl: response.response.assets?.splats?.spz_urls?.full_res,
          panoUrl: response.response.assets?.imagery?.pano_url,
          caption: response.response.assets?.caption,
        });
      }
    }

    const progress =
      typeof response.metadata?.progress === "number"
        ? response.metadata.progress
        : undefined;

    const status =
      typeof response.metadata?.status === "string"
        ? response.metadata.status
        : "PENDING";

    return data({
      operationId,
      done: false,
      progress,
      status,
    });
  } catch (error) {
    console.error("Get operation status error:", error);
    return data(
      {
        error:
          error instanceof Error ? error.message : "Failed to get operation status",
      },
      { status: 500 }
    );
  }
}
