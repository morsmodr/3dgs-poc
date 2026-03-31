import type { MetaFunction } from "react-router";
import { Link, useNavigate } from "react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import type { MarbleModel } from "~/lib/marble-client";

export const meta: MetaFunction = () => {
  return [
    { title: "Create a World - Worlds Explorer" },
    {
      name: "description",
      content: "Generate AI-powered 3D worlds from text or image prompts",
    },
  ];
};

type PageState = "idle" | "generating" | "completed" | "error";
type PromptTab = "text" | "image";

const PLACEHOLDER_PROMPTS = [
  "A mystical forest with glowing mushrooms and fireflies",
  "A cozy Japanese tea house overlooking a mountain lake",
  "A futuristic space station orbiting a gas giant",
  "An ancient library with floating books and golden light",
  "A coral reef teeming with bioluminescent sea creatures",
];

export default function CreatePage() {
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>("idle");
  const [activeTab, setActiveTab] = useState<PromptTab>("text");
  const [textPrompt, setTextPrompt] = useState("");
  const [model, setModel] = useState<MarbleModel>("Marble 0.1-mini");
  const [imageData, setImageData] = useState<{
    base64: string;
    extension: string;
    preview: string;
    name: string;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("PENDING");
  const [errorMessage, setErrorMessage] = useState("");
  const [operationId, setOperationId] = useState<string | null>(null);
  const [worldId, setWorldId] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDER_PROMPTS[0]);

  useEffect(() => {
    setPlaceholder(
      PLACEHOLDER_PROMPTS[Math.floor(Math.random() * PLACEHOLDER_PROMPTS.length)]
    );
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

  function handleFileRead(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(",")[1];
      setImageData({
        base64,
        extension,
        preview: result,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileRead(file);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  }

  function startPolling(opId: string, wId: string) {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${opId}`);
        const data = await res.json();

        if (data.error && !data.done) {
          stopPolling();
          setErrorMessage(data.error);
          setPageState("error");
          return;
        }

        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.status) {
          setStatusText(data.status);
        }

        if (data.done) {
          stopPolling();
          if (data.success) {
            setProgress(100);
            setStatusText("SUCCEEDED");
            setPageState("completed");
            setTimeout(() => navigate("/"), 800);
          } else {
            setErrorMessage(data.error || "Generation failed");
            setPageState("error");
          }
        }
      } catch {
        stopPolling();
        setErrorMessage("Lost connection while checking status");
        setPageState("error");
      }
    }, 2000);
  }

  async function handleSubmit() {
    const prompt = activeTab === "text" ? textPrompt.trim() : textPrompt.trim();
    if (activeTab === "text" && !prompt) return;
    if (activeTab === "image" && !imageData) return;

    setPageState("generating");
    setProgress(0);
    setStatusText("PENDING");
    setErrorMessage("");

    try {
      const body: Record<string, unknown> = {
        prompt: prompt || "",
        promptType: activeTab,
        model,
      };

      if (activeTab === "image" && imageData) {
        body.imageBase64 = imageData.base64;
        body.imageExtension = imageData.extension;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Failed to start generation");
        setPageState("error");
        return;
      }

      setOperationId(data.operationId);
      setWorldId(data.worldId);
      startPolling(data.operationId, data.worldId);
    } catch {
      setErrorMessage("Failed to connect to server");
      setPageState("error");
    }
  }

  function handleReset() {
    stopPolling();
    setPageState("idle");
    setProgress(0);
    setStatusText("PENDING");
    setErrorMessage("");
    setOperationId(null);
    setWorldId(null);
  }

  const canSubmit =
    activeTab === "text" ? textPrompt.trim().length > 0 : imageData !== null;

  if (pageState === "generating" || pageState === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="max-w-lg w-full mx-4">
          <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                {pageState === "completed" ? (
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-1">
                {pageState === "completed" ? "World created!" : "Generating your world..."}
              </h2>
              <p className="text-gray-400 text-sm">
                {pageState === "completed"
                  ? "Redirecting to gallery..."
                  : model === "Marble 0.1-plus"
                    ? "This may take up to 5 minutes"
                    : "This usually takes about 30 seconds"}
              </p>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1.5">
                <span>{statusText}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    pageState === "completed" ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="text-gray-500 text-sm italic">
              &ldquo;{textPrompt || "Image-based world"}&rdquo;
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="max-w-lg w-full mx-4">
          <div className="bg-gray-800/80 border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Generation failed</h2>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link
            to="/"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Gallery
          </Link>
          <span className="text-gray-500 text-sm font-medium">Worlds Explorer</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-8">Create a World</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-800/60 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("text")}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "text"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Text Prompt
          </button>
          <button
            onClick={() => setActiveTab("image")}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "image"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Image Upload
          </button>
        </div>

        {/* Text Prompt */}
        {activeTab === "text" && (
          <div className="mb-6">
            <textarea
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
            />
            <p className="text-gray-500 text-xs mt-2">
              Describe the 3D world you want to create. Be specific about the setting, mood, and details.
            </p>
          </div>
        )}

        {/* Image Upload */}
        {activeTab === "image" && (
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {imageData ? (
              <div className="relative bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <img
                  src={imageData.preview}
                  alt="Upload preview"
                  className="w-full max-h-64 object-contain rounded-lg"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-gray-400 text-sm truncate">{imageData.name}</span>
                  <button
                    onClick={() => setImageData(null)}
                    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-700 hover:border-gray-500 bg-gray-800/40"
                }`}
              >
                <svg className="w-10 h-10 mx-auto mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400 mb-1">
                  Drag and drop an image, or click to browse
                </p>
                <p className="text-gray-600 text-sm">JPG, PNG, or WebP</p>
              </div>
            )}

            <div className="mt-4">
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="Optional: add text guidance for the image..."
                rows={2}
                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors text-sm"
              />
            </div>
          </div>
        )}

        {/* Model Selector */}
        <div className="mb-8">
          <label className="text-sm font-medium text-gray-300 mb-3 block">Model</label>
          <div className="flex gap-4">
            <label
              className={`flex-1 flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                model === "Marble 0.1-mini"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="model"
                value="Marble 0.1-mini"
                checked={model === "Marble 0.1-mini"}
                onChange={() => setModel("Marble 0.1-mini")}
                className="mt-1 accent-blue-500"
              />
              <div>
                <div className="font-medium text-sm">Draft</div>
                <div className="text-gray-400 text-xs mt-0.5">~30 seconds, lower cost</div>
              </div>
            </label>
            <label
              className={`flex-1 flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                model === "Marble 0.1-plus"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="model"
                value="Marble 0.1-plus"
                checked={model === "Marble 0.1-plus"}
                onChange={() => setModel("Marble 0.1-plus")}
                className="mt-1 accent-blue-500"
              />
              <div>
                <div className="font-medium text-sm">Plus</div>
                <div className="text-gray-400 text-xs mt-0.5">~5 minutes, higher quality</div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
            canSubmit
              ? "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          Generate World
        </button>
      </div>
    </div>
  );
}
