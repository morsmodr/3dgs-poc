import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import { scenes } from "~/scenes";

export const meta: MetaFunction = () => {
    return [
        { title: "3D Gaussian Splat Viewer" },
        { name: "description", content: "Browse and view 3D Gaussian Splat scenes" },
    ];
};

export default function Index() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <div className="container mx-auto px-4 py-16">
                <header className="text-center mb-16">
                    <h1 className="text-5xl font-bold mb-4">3D Gaussian Splat Viewer</h1>
                    <p className="text-xl text-gray-400">
                        Explore photorealistic 3D scenes rendered with Gaussian Splatting
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {Object.entries(scenes).map(([key, scene]) => (
                        <Link
                            key={key}
                            to={`/${key}`}
                            className="group block p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 hover:bg-gray-750 transition-all duration-200"
                        >
                            <h2 className="text-2xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                                {scene.title}
                            </h2>
                            <p className="text-gray-400 text-sm truncate">{scene.url.split("/").pop()}</p>
                            <div className="mt-4 text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                View Scene &rarr;
                            </div>
                        </Link>
                    ))}
                </div>

                <footer className="text-center mt-16 text-gray-500 text-sm">
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
