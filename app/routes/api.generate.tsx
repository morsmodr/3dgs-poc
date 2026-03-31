import { data, type ActionFunctionArgs } from "react-router";
import {
  generateWorld,
  type GenerateWorldRequest,
  type MarbleModel,
} from "~/lib/marble-client";
import { createWorld } from "~/lib/worlds-store";

interface GenerateRequestBody {
  prompt: string;
  promptType: "text" | "image";
  imageBase64?: string;
  imageExtension?: string;
  model?: MarbleModel;
  displayName?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body: GenerateRequestBody = await request.json();

    if (!body.prompt && body.promptType !== "image") {
      return data({ error: "Prompt is required" }, { status: 400 });
    }

    if (body.promptType === "image" && !body.imageBase64) {
      return data(
        { error: "Image data is required for image prompts" },
        { status: 400 }
      );
    }

    const model: MarbleModel = body.model || "Marble 0.1-mini";

    let apiRequest: GenerateWorldRequest;

    if (body.promptType === "image" && body.imageBase64) {
      apiRequest = {
        world_prompt: {
          type: "image",
          image_prompt: {
            source: "data_base64",
            data_base64: body.imageBase64,
            extension: body.imageExtension || "jpg",
          },
          text_prompt: body.prompt || undefined,
          is_pano: false,
        },
        model,
        display_name: body.displayName || body.prompt?.substring(0, 50) || "Image World",
        permission: { public: false },
      };
    } else {
      apiRequest = {
        world_prompt: {
          type: "text",
          text_prompt: body.prompt,
        },
        model,
        display_name: body.displayName || body.prompt.substring(0, 50),
        permission: { public: false },
      };
    }

    const response = await generateWorld(apiRequest);

    const storedWorld = await createWorld({
      operationId: response.operation_id,
      prompt: body.prompt || "Image-based world",
      promptType: body.promptType,
      model,
    });

    return data({
      success: true,
      operationId: response.operation_id,
      worldId: storedWorld.id,
      done: response.done,
    });
  } catch (error) {
    console.error("Generate world error:", error);
    return data(
      {
        error: error instanceof Error ? error.message : "Failed to generate world",
      },
      { status: 500 }
    );
  }
}
