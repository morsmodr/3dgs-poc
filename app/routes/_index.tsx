import { useState, useEffect, useCallback } from "react";
import { data, useLoaderData, type MetaFunction } from "react-router";
import { Link } from "react-router";
import type { MarbleModel } from "~/lib/marble-client";
import { scenes } from "~/scenes";
import { proxyUrl } from "~/lib/proxy-url.server";
import WorldCard from "~/components/world-card";

interface SampleScene {
  key: string;
  title: string;
  thumbnail?: string;
}

export async function loader() {
  const sampleScenes: SampleScene[] = Object.entries(scenes).map(
    ([key, scene]) => ({
      key,
      title: scene.title,
      thumbnail: proxyUrl(scene.thumbnail),
    })
  );
  return data({ sampleScenes });
}

interface StoredWorld {
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
  createdAt: string;
}

export const meta: MetaFunction = () => {
  return [
    { title: "Worlds Explorer" },
    {
      name: "description",
      content:
        "Generate, explore, and share AI-generated 3D worlds powered by World Labs",
    },
  ];
};

function SkeletonCard() {
  return (
    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-gray-800 animate-pulse">
      <div className="h-full w-full flex flex-col justify-end p-4">
        <div className="h-5 w-2/3 bg-gray-700 rounded mb-2" />
        <div className="h-4 w-full bg-gray-700 rounded mb-1" />
        <div className="h-4 w-3/4 bg-gray-700 rounded" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 mb-6 rounded-full bg-gray-800 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">
        No worlds yet
      </h3>
      <p className="text-gray-500 text-center mb-6 max-w-sm">
        Create your first AI-generated 3D world using a text prompt or image
      </p>
      <Link
        to="/create"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create Your First World
      </Link>
    </div>
  );
}

export default function Index() {
  const { sampleScenes } = useLoaderData<typeof loader>();
  const [worlds, setWorlds] = useState<StoredWorld[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWorlds = useCallback(async () => {
    try {
      const res = await fetch("/api/worlds?status=completed");
      if (!res.ok) {
        throw new Error("Failed to fetch worlds");
      }
      const data = await res.json();
      setWorlds(data.worlds || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load worlds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorlds();
  }, [fetchWorlds]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/worlds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete world");
      }
      setWorlds((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete world");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-2">
              Worlds Explorer
            </h1>
            <p className="text-lg text-gray-400">
              Generate and explore AI-powered 3D worlds
            </p>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create World
          </Link>
        </header>

        {/* Your Worlds Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Your Worlds
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : worlds.length === 0 ? (
              <EmptyState />
            ) : (
              worlds.map((world) => (
                <WorldCard
                  key={world.id}
                  id={world.id}
                  title={world.prompt.slice(0, 60)}
                  thumbnail={world.panoUrl || world.thumbnailUrl}
                  prompt={world.caption}
                  model={world.model}
                  createdAt={world.createdAt}
                  linkTo={`/world/${world.id}`}
                  onDelete={handleDelete}
                  isDeleting={deletingId === world.id}
                />
              ))
            )}
          </div>
        </section>

        {/* Sample Scenes Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <span className="w-2 h-2 bg-gray-500 rounded-full" />
            Sample Scenes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleScenes.map((scene) => (
              <WorldCard
                key={scene.key}
                id={scene.key}
                title={scene.title}
                thumbnail={scene.thumbnail}
                linkTo={`/world/${scene.key}`}
                isSample
              />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-gray-800 text-gray-500 text-sm">
          <p>
            Powered by{" "}
            <a
              href="https://sparkjs.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Spark
            </a>
            {" "}by World Labs
          </p>
        </footer>
      </div>
    </div>
  );
}
