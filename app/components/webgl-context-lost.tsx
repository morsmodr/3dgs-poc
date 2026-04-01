interface WebGLContextLostProps {
  className?: string;
}

export function WebGLContextLost({ className }: WebGLContextLostProps) {
  return (
    <div className={className ?? "w-full h-screen"}>
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center text-white">
          <p className="text-xl font-semibold mb-2">WebGL Context Lost</p>
          <p className="text-gray-400 text-sm mb-4">
            The graphics context was interrupted
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
