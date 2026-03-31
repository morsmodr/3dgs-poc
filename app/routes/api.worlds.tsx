import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getAllWorlds, getWorldById, deleteWorld } from "~/lib/worlds-store";
import type { ActionFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const status = url.searchParams.get("status");

  try {
    if (id) {
      const world = await getWorldById(id);
      if (!world) {
        return json({ error: "World not found" }, { status: 404 });
      }
      return json({ world });
    }

    let worlds = await getAllWorlds();

    if (status) {
      worlds = worlds.filter((w) => w.status === status);
    }

    return json({ worlds });
  } catch (error) {
    console.error("Get worlds error:", error);
    return json(
      {
        error: error instanceof Error ? error.message : "Failed to get worlds",
      },
      { status: 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return json({ error: "World ID is required" }, { status: 400 });
    }

    const deleted = await deleteWorld(id);

    if (!deleted) {
      return json({ error: "World not found" }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    console.error("Delete world error:", error);
    return json(
      {
        error: error instanceof Error ? error.message : "Failed to delete world",
      },
      { status: 500 }
    );
  }
}
