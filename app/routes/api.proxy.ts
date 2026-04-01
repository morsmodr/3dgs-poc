import type { LoaderFunctionArgs } from "react-router";

function getAllowedHosts(): string[] {
  const hosts = process.env.PROXY_ALLOWED_HOSTS || "";
  return hosts
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(targetUrl);
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  if (!getAllowedHosts().includes(target.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  try {
    const response = await fetch(targetUrl);

    if (!response.ok) {
      return new Response("Upstream request failed", { status: response.status });
    }

    const headers = new Headers();
    const contentType = response.headers.get("Content-Type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(response.body, { headers });
  } catch (error) {
    console.error("Proxy fetch error:", error);
    return new Response("Failed to fetch resource", { status: 502 });
  }
}
