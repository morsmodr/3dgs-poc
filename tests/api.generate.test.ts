import { beforeEach, describe, expect, it, vi } from "vitest";

const generateWorldMock = vi.fn();
const createWorldMock = vi.fn();

vi.mock("~/lib/marble-client", () => ({
  generateWorld: generateWorldMock,
}));

vi.mock("~/lib/worlds-store", () => ({
  createWorld: createWorldMock,
}));

describe("api.generate action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing text prompts", async () => {
    const { action } = await import("~/routes/api.generate");

    const response = (await action({
      request: new Request("http://localhost/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "",
          promptType: "text",
        }),
      }),
    } as never)) as {
      data: { error: string };
      init?: { status?: number };
    };

    expect(response.init?.status).toBe(400);
    expect(response.data).toEqual({
      error: "Prompt is required",
    });
    expect(generateWorldMock).not.toHaveBeenCalled();
    expect(createWorldMock).not.toHaveBeenCalled();
  });

  it("creates a stored world for image prompts", async () => {
    generateWorldMock.mockResolvedValue({
      operation_id: "mock-op-123",
      done: false,
    });
    createWorldMock.mockResolvedValue({
      id: "world-123",
    });

    const { action } = await import("~/routes/api.generate");

    const response = (await action({
      request: new Request("http://localhost/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "Foggy cliffs over a moonlit sea",
          promptType: "image",
          imageBase64: "ZmFrZS1pbWFnZS1ieXRlcw==",
          imageExtension: "png",
          model: "marble-1.1-plus",
          displayName: "Moonlit cliffs",
        }),
      }),
    } as never)) as {
      data: {
        success: boolean;
        operationId: string;
        worldId: string;
        done: boolean;
      };
    };

    expect(generateWorldMock).toHaveBeenCalledWith({
      world_prompt: {
        type: "image",
        image_prompt: {
          source: "data_base64",
          data_base64: "ZmFrZS1pbWFnZS1ieXRlcw==",
          extension: "png",
        },
        text_prompt: "Foggy cliffs over a moonlit sea",
        is_pano: false,
      },
      model: "marble-1.1-plus",
      display_name: "Moonlit cliffs",
      permission: { public: false },
    });

    expect(createWorldMock).toHaveBeenCalledWith({
      operationId: "mock-op-123",
      prompt: "Foggy cliffs over a moonlit sea",
      promptType: "image",
      model: "marble-1.1-plus",
    });

    expect(response.data).toEqual({
      success: true,
      operationId: "mock-op-123",
      worldId: "world-123",
      done: false,
    });
  });
});
