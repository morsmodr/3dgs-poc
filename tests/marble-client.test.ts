import { afterEach, describe, expect, it, vi } from "vitest";
import { generateWorld, getOperationStatus } from "~/lib/marble-client";

describe("marble-client mock mode", () => {
  afterEach(() => {
    delete process.env.MOCK_API;
    vi.restoreAllMocks();
  });

  it("simulates progress before returning a completed mock world", async () => {
    process.env.MOCK_API = "true";

    let now = 1_710_000_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    const generation = await generateWorld({
      world_prompt: {
        type: "text",
        text_prompt: "A cinematic mountain observatory at sunrise",
      },
      model: "Marble 0.1-mini",
    });

    expect(generation.done).toBe(false);
    expect(generation.operation_id).toMatch(/^mock-op-/);

    const pending = await getOperationStatus(generation.operation_id);
    expect(pending.done).toBe(false);
    expect(pending.metadata).toMatchObject({
      progress: 10,
      status: "PENDING",
    });

    now += 3_500;

    const completed = await getOperationStatus(generation.operation_id);
    expect(completed.done).toBe(true);
    expect(completed.metadata).toMatchObject({
      progress: 100,
      status: "SUCCEEDED",
    });
    expect(completed.response?.model).toBe("Marble 0.1-mini");
    expect(completed.response?.assets?.splats?.spz_urls?.full_res).toBeTruthy();
    expect(completed.response?.world_prompt).toMatchObject({
      type: "text",
      text_prompt: "A cinematic mountain observatory at sunrise",
    });
  });
});
