import { data, type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { getAllWorlds, getWorldById, deleteWorld } from "~/lib/worlds-store";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const status = url.searchParams.get("status");

  try {
    if (id) {
      const world = await getWorldById(id);
      if (!world) {
        return data({ error: "World not found" }, { status: 404 });
      }
      return data({ world });
    }

    let worlds = await getAllWorlds();

    if (status) {
      worlds = worlds.filter((w) => w.status === status);
    }

    return data({ worlds });
  } catch (error) {
    console.error("Get worlds error:", error);
    return data(
      {
        error: error instanceof Error ? error.message : "Failed to get worlds",
      },
      { status: 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return data({ error: "World ID is required" }, { status: 400 });
    }

    const deleted = await deleteWorld(id);

    if (!deleted) {
      return data({ error: "World not found" }, { status: 404 });
    }

    return data({ success: true });
  } catch (error) {
    console.error("Delete world error:", error);
    return data(
      {
        error: error instanceof Error ? error.message : "Failed to delete world",
      },
      { status: 500 }
    );
  }
}
