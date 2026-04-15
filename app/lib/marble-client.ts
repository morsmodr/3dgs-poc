/**
 * Marble API Client
 *
 * Typed client for World Labs' Marble API with mock mode support.
 * When MOCK_API=true, simulates API responses for development without spending credits.
 */

import { scenes } from "~/scenes";

const MARBLE_API_BASE = "https://api.worldlabs.ai";

export type MarbleModel = "marble-1.1" | "marble-1.1-plus";

export type OperationStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export interface TextPrompt {
  type: "text";
  text_prompt: string;
  disable_recaption?: boolean;
}

export interface ImagePrompt {
  type: "image";
  image_prompt: {
    source: "data_base64";
    data_base64: string;
    extension?: string;
  };
  text_prompt?: string;
  is_pano?: boolean;
  disable_recaption?: boolean;
}

export type WorldPrompt = TextPrompt | ImagePrompt;

export interface GenerateWorldRequest {
  world_prompt: WorldPrompt;
  display_name?: string;
  model?: MarbleModel;
  tags?: string[];
  seed?: number;
  permission?: {
    public?: boolean;
  };
}

export interface GenerateWorldResponse {
  operation_id: string;
  done: boolean;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
  error?: OperationError | null;
  metadata?: Record<string, unknown> | null;
  response?: World | null;
}

export interface OperationError {
  code?: number | null;
  message?: string | null;
}

export interface SplatAssets {
  spz_urls?: Record<string, string> | null;
}

export interface ImageryAssets {
  pano_url?: string | null;
}

export interface MeshAssets {
  collider_mesh_url?: string | null;
}

export interface WorldAssets {
  splats?: SplatAssets | null;
  imagery?: ImageryAssets | null;
  mesh?: MeshAssets | null;
  thumbnail_url?: string | null;
  caption?: string | null;
}

export interface World {
  world_id: string;
  display_name: string;
  world_marble_url: string;
  model?: string | null;
  tags?: string[] | null;
  assets?: WorldAssets | null;
  world_prompt?: WorldPrompt | null;
  permission?: { public?: boolean } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GetOperationResponse {
  operation_id: string;
  done: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  expires_at?: string | null;
  error?: OperationError | null;
  metadata?: Record<string, unknown> | null;
  response?: World | null;
}

const mockOperations = new Map<
  string,
  { startTime: number; prompt: string; model: MarbleModel }
>();

function isMockMode(): boolean {
  return process.env.MOCK_API === "true";
}

function getApiKey(): string {
  const key = process.env.WLT_API_KEY;
  if (!key && !isMockMode()) {
    throw new Error("WLT_API_KEY environment variable is required when MOCK_API is not true");
  }
  return key || "";
}

function generateMockOperationId(): string {
  return `mock-op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateMockWorldId(): string {
  return `mock-world-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getRandomSampleScene(): { url: string; title: string } {
  const sceneKeys = Object.keys(scenes);
  const randomKey = sceneKeys[Math.floor(Math.random() * sceneKeys.length)];
  const scene = scenes[randomKey];
  return { url: scene.url, title: scene.title };
}

export async function generateWorld(
  request: GenerateWorldRequest
): Promise<GenerateWorldResponse> {
  if (isMockMode()) {
    const operationId = generateMockOperationId();
    const prompt =
      request.world_prompt.type === "text"
        ? request.world_prompt.text_prompt
        : request.world_prompt.text_prompt || "Image-based world";

    mockOperations.set(operationId, {
      startTime: Date.now(),
      prompt,
      model: request.model || "marble-1.1",
    });

    const now = new Date().toISOString();
    return {
      operation_id: operationId,
      done: false,
      created_at: now,
      updated_at: now,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: { progress: 0 },
    };
  }

  const response = await fetch(`${MARBLE_API_BASE}/marble/v1/worlds:generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "WLT-Api-Key": getApiKey(),
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Marble API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function getOperationStatus(
  operationId: string
): Promise<GetOperationResponse> {
  if (isMockMode()) {
    const mockOp = mockOperations.get(operationId);

    if (!mockOp) {
      throw new Error(`Operation ${operationId} not found`);
    }

    const elapsed = Date.now() - mockOp.startTime;
    const mockDuration = 3000; // 3 seconds for mock

    const now = new Date().toISOString();
    const baseResponse = {
      operation_id: operationId,
      created_at: new Date(mockOp.startTime).toISOString(),
      updated_at: now,
      expires_at: new Date(mockOp.startTime + 24 * 60 * 60 * 1000).toISOString(),
    };

    if (elapsed < mockDuration * 0.3) {
      return {
        ...baseResponse,
        done: false,
        metadata: { progress: 10, status: "PENDING" },
      };
    }

    if (elapsed < mockDuration * 0.7) {
      return {
        ...baseResponse,
        done: false,
        metadata: { progress: 50, status: "RUNNING" },
      };
    }

    if (elapsed < mockDuration) {
      return {
        ...baseResponse,
        done: false,
        metadata: { progress: 90, status: "RUNNING" },
      };
    }

    const sampleScene = getRandomSampleScene();
    const worldId = generateMockWorldId();

    mockOperations.delete(operationId);

    return {
      ...baseResponse,
      done: true,
      metadata: { progress: 100, status: "SUCCEEDED", world_id: worldId },
      response: {
        world_id: worldId,
        display_name: mockOp.prompt.substring(0, 50),
        world_marble_url: `https://worldlabs.ai/worlds/${worldId}`,
        model: mockOp.model,
        tags: ["generated", "mock"],
        assets: {
          splats: {
            spz_urls: {
              full_res: sampleScene.url,
            },
          },
          imagery: {
            pano_url: null,
          },
          thumbnail_url: null,
          caption: `AI-generated world: ${mockOp.prompt}`,
        },
        world_prompt: {
          type: "text",
          text_prompt: mockOp.prompt,
        },
        permission: { public: false },
        created_at: new Date(mockOp.startTime).toISOString(),
        updated_at: now,
      },
    };
  }

  const response = await fetch(
    `${MARBLE_API_BASE}/marble/v1/operations/${operationId}`,
    {
      method: "GET",
      headers: {
        "WLT-Api-Key": getApiKey(),
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Marble API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function getWorld(worldId: string): Promise<World> {
  if (isMockMode()) {
    throw new Error("getWorld is not available in mock mode - use stored world data");
  }

  const response = await fetch(
    `${MARBLE_API_BASE}/marble/v1/worlds/${worldId}`,
    {
      method: "GET",
      headers: {
        "WLT-Api-Key": getApiKey(),
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Marble API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
