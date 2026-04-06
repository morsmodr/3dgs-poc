/**
 * Worlds Store
 *
 * Simple JSON file-based storage for generated world metadata.
 * Stores world data locally so we don't need to re-fetch from the API.
 */

import { promises as fs } from "fs";
import path from "path";
import type { World, MarbleModel } from "./marble-client";

const DATA_DIR = path.join(process.cwd(), "data");
const WORLDS_FILE = path.join(DATA_DIR, "worlds.json");

export interface StoredWorld {
  id: string;
  operationId: string;
  prompt: string;
  promptType: "text" | "image";
  model: MarbleModel;
  status: "pending" | "generating" | "completed" | "failed";
  splatUrl?: string;
  panoUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  worldMarbleUrl?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readWorldsFile(): Promise<StoredWorld[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(WORLDS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeWorldsFile(worlds: StoredWorld[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(WORLDS_FILE, JSON.stringify(worlds, null, 2), "utf-8");
}

export async function createWorld(params: {
  operationId: string;
  prompt: string;
  promptType: "text" | "image";
  model: MarbleModel;
}): Promise<StoredWorld> {
  const worlds = await readWorldsFile();

  const newWorld: StoredWorld = {
    id: `world-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    operationId: params.operationId,
    prompt: params.prompt,
    promptType: params.promptType,
    model: params.model,
    status: "generating",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  worlds.unshift(newWorld);
  await writeWorldsFile(worlds);

  return newWorld;
}

export async function updateWorldFromOperation(
  operationId: string,
  world: World
): Promise<StoredWorld | null> {
  const worlds = await readWorldsFile();
  const index = worlds.findIndex((w) => w.operationId === operationId);

  if (index === -1) {
    return null;
  }

  const existing = worlds[index];
  const updated: StoredWorld = {
    ...existing,
    status: "completed",
    splatUrl: world.assets?.splats?.spz_urls?.full_res || undefined,
    panoUrl: world.assets?.imagery?.pano_url || undefined,
    thumbnailUrl: world.assets?.thumbnail_url || undefined,
    caption: world.assets?.caption || undefined,
    worldMarbleUrl: world.world_marble_url,
    updatedAt: new Date().toISOString(),
  };

  worlds[index] = updated;
  await writeWorldsFile(worlds);

  return updated;
}

export async function markWorldFailed(
  operationId: string,
  error: string
): Promise<StoredWorld | null> {
  const worlds = await readWorldsFile();
  const index = worlds.findIndex((w) => w.operationId === operationId);

  if (index === -1) {
    return null;
  }

  const updated: StoredWorld = {
    ...worlds[index],
    status: "failed",
    error,
    updatedAt: new Date().toISOString(),
  };

  worlds[index] = updated;
  await writeWorldsFile(worlds);

  return updated;
}

export async function getWorldById(id: string): Promise<StoredWorld | null> {
  const worlds = await readWorldsFile();
  return worlds.find((w) => w.id === id) || null;
}

export async function getWorldByOperationId(
  operationId: string
): Promise<StoredWorld | null> {
  const worlds = await readWorldsFile();
  return worlds.find((w) => w.operationId === operationId) || null;
}

export async function getAllWorlds(): Promise<StoredWorld[]> {
  return readWorldsFile();
}

export async function getCompletedWorlds(): Promise<StoredWorld[]> {
  const worlds = await readWorldsFile();
  return worlds.filter((w) => w.status === "completed");
}

export async function deleteWorld(id: string): Promise<boolean> {
  const worlds = await readWorldsFile();
  const index = worlds.findIndex((w) => w.id === id);

  if (index === -1) {
    return false;
  }

  worlds.splice(index, 1);
  await writeWorldsFile(worlds);

  return true;
}
