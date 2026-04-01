function getProxiedHosts(): string[] {
  const hosts = process.env.PROXY_ALLOWED_HOSTS || "";
  return hosts
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
}

export function proxyUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (getProxiedHosts().includes(parsed.hostname)) {
      return `/api/proxy?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // If URL parsing fails, return as-is
  }

  return url;
}
