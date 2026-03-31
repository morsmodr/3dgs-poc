import { Link } from "react-router";

interface WorldCardProps {
  id: string;
  title: string;
  thumbnail?: string;
  prompt?: string;
  model?: "Marble 0.1-mini" | "Marble 0.1-plus";
  createdAt?: string;
  linkTo: string;
  isSample?: boolean;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getModelBadge(model: "Marble 0.1-mini" | "Marble 0.1-plus") {
  if (model === "Marble 0.1-mini") {
    return {
      label: "Draft",
      className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    };
  }
  return {
    label: "Plus",
    className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };
}

export default function WorldCard({
  id,
  title,
  thumbnail,
  prompt,
  model,
  createdAt,
  linkTo,
  isSample = false,
}: WorldCardProps) {
  const badge = model ? getModelBadge(model) : null;

  return (
    <Link
      to={linkTo}
      className="group relative block aspect-[16/10] rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10"
    >
      {/* Background: thumbnail or gradient placeholder */}
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          className={`absolute inset-0 ${
            isSample
              ? "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900"
              : "bg-gradient-to-br from-indigo-900/50 via-gray-800 to-gray-900"
          }`}
        >
          {/* Decorative pattern for sample scenes */}
          {isSample && (
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-24 h-24 border border-gray-500 rounded-full" />
              <div className="absolute bottom-8 left-6 w-16 h-16 border border-gray-500 rounded-lg rotate-12" />
            </div>
          )}
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

      {/* Sample badge */}
      {isSample && (
        <div className="absolute top-3 left-3 px-2 py-0.5 text-xs font-medium bg-gray-700/80 text-gray-300 rounded border border-gray-600/50 backdrop-blur-sm">
          Sample
        </div>
      )}

      {/* Model badge for generated worlds */}
      {badge && (
        <div
          className={`absolute top-3 right-3 px-2 py-0.5 text-xs font-medium rounded border backdrop-blur-sm ${badge.className}`}
        >
          {badge.label}
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors line-clamp-1">
          {title}
        </h3>

        {prompt && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">{prompt}</p>
        )}

        <div className="flex items-center justify-between">
          {createdAt && (
            <span className="text-xs text-gray-500">
              {formatRelativeTime(createdAt)}
            </span>
          )}
          <span className="text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-x-0 group-hover:translate-x-1 transition-transform">
            View &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
