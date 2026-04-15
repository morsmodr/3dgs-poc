import { Link } from "react-router";
import { useState } from "react";
import { ClientOnly } from "remix-utils/client-only";
import type { MarbleModel } from "~/lib/marble-client";

interface WorldCardProps {
  id: string;
  title: string;
  thumbnail?: string;
  prompt?: string;
  model?: MarbleModel;
  createdAt?: string;
  linkTo: string;
  isSample?: boolean;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
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

function getModelBadge(model: MarbleModel) {
  if (model === "marble-1.1") {
    return {
      label: "Marble 1.1",
      className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    };
  }
  return {
    label: "Marble 1.1 Plus",
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
  onDelete,
  isDeleting = false,
}: WorldCardProps) {
  const badge = model ? getModelBadge(model) : null;
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
    setShowConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div className="relative">
      <div
        className={`group relative block aspect-[16/10] rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 ${
          isDeleting ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <Link
          to={linkTo}
          className="absolute inset-0 z-0 rounded-xl outline-none ring-offset-2 ring-offset-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={`View world: ${title}`}
        />

        {/* Background: thumbnail or gradient placeholder (clicks pass through to Link) */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
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
              {isSample && (
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 w-24 h-24 border border-gray-500 rounded-full" />
                  <div className="absolute bottom-8 left-6 w-16 h-16 border border-gray-500 rounded-lg rotate-12" />
                </div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        </div>

        {isSample && (
          <div className="absolute top-3 left-3 z-[1] px-2 py-0.5 text-xs font-medium bg-gray-700/80 text-gray-300 rounded border border-gray-600/50 backdrop-blur-sm pointer-events-none">
            Sample
          </div>
        )}

        {badge && (
          <div
            className={`absolute top-3 right-3 z-[1] px-2 py-0.5 text-xs font-medium rounded border backdrop-blur-sm pointer-events-none ${badge.className}`}
          >
            {badge.label}
          </div>
        )}

        {!isSample && onDelete && !showConfirm && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="absolute top-3 left-3 z-[2] p-1.5 bg-red-600/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity backdrop-blur-sm"
            title="Delete world"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 z-[1] pointer-events-none">
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors line-clamp-1">
            {title}
          </h3>

          {prompt && (
            <p className="text-sm text-gray-400 line-clamp-2 mb-2">{prompt}</p>
          )}

          <div className="flex items-center justify-between">
            {createdAt && (
              <ClientOnly fallback={<span className="text-xs text-gray-500">--</span>}>
                {() => (
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(createdAt)}
                  </span>
                )}
              </ClientOnly>
            )}
            <span className="text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-x-0 group-hover:translate-x-1 transition-transform">
              View &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation dialog overlay */}
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 rounded-xl z-20 backdrop-blur-sm">
          <div className="text-center p-4">
            <p className="text-white text-sm mb-4">Delete this world?</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleCancelDelete}
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deleting spinner overlay */}
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl z-20">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
