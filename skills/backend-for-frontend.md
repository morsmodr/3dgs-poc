# Backend-for-Frontend (BFF) Coding Standards

Guidelines for handling cross-origin resources and React hydration in this project.

## Cross-Origin Resource Policy (COEP/COOP)

This app uses `Cross-Origin-Embedder-Policy: require-corp` for SharedArrayBuffer support (required by Spark/WebGL).

### Never weaken COEP security

```typescript
// NEVER do this
res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");

// NEVER add crossorigin="anonymous" to bypass COEP
<img crossOrigin="anonymous" src={externalUrl} />
```

### Always use proxy APIs for external resources

When loading external resources (images, data) that don't have CORP headers:

```typescript
// BAD - blocked by COEP
<img src="https://cdn.marble.worldlabs.ai/image.webp" />

// GOOD - proxy through same-origin API
<img src={`/api/proxy?url=${encodeURIComponent(externalUrl)}`} />
```

Create server-side proxy routes with allowlists:

```typescript
// app/routes/api.proxy.ts
const ALLOWED_HOSTS = ["cdn.marble.worldlabs.ai"];

export async function loader({ request }: LoaderFunctionArgs) {
  const targetUrl = new URL(request.url).searchParams.get("url");
  const target = new URL(targetUrl);
  
  if (!ALLOWED_HOSTS.includes(target.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }
  
  return fetch(targetUrl);
}
```

---

## React Hydration

### Never suppress hydration warnings

```tsx
// NEVER do this
<span suppressHydrationWarning>{dynamicContent}</span>
```

### Always use ClientOnly for client-dependent content

For any content that differs between server and client (time, locale, browser APIs):

```tsx
import { ClientOnly } from "remix-utils/client-only";

// BAD - causes hydration mismatch
<span>{formatRelativeTime(date)}</span>

// GOOD - renders only on client
<ClientOnly fallback={<span>--</span>}>
  {() => <span>{formatRelativeTime(date)}</span>}
</ClientOnly>
```

### Common hydration mismatch sources

- `new Date()` / `Date.now()` - server and client times differ
- `toLocaleString()` / `toLocaleDateString()` - locale may differ
- `Math.random()` - different values each render
- `typeof window` checks that change markup
- Browser-only APIs (`localStorage`, `navigator`)

---

## Summary

| Scenario | Wrong Approach | Correct Approach |
|----------|----------------|------------------|
| External images blocked by COEP | `credentialless` / `crossorigin` | Proxy API route |
| Time-based content hydration | `suppressHydrationWarning` | `ClientOnly` wrapper |
| Browser-only APIs | Conditional rendering | `ClientOnly` wrapper |
