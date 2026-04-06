# Architecture Decisions

This project is intentionally small, but a few decisions carry most of the engineering story.

## 1. Mock-First World Generation

The Marble API is credit-based, so the app is designed to support a complete product flow in `MOCK_API=true` mode.

- The create flow, polling flow, gallery, and viewer can all be exercised without spending credits.
- Mock responses use real-world timing and sample splat assets so the UX can be tuned before real API usage.
- This keeps iteration cheap while still validating the async product surface end to end.

Relevant code:

- `app/lib/marble-client.ts`
- `app/routes/api.generate.tsx`
- `app/routes/api.status.$operationId.tsx`

## 2. SSR App With Client-Only 3D Runtime

The app uses React Router with SSR for page structure, routing, and metadata, but keeps the Spark viewer client-only.

- SSR keeps the app fast to navigate and improves link previews and sharing.
- Spark and the WebGL-heavy viewer stay on the client to avoid SSR/runtime issues around browser-only APIs.
- This split keeps the product shell simple while isolating the expensive 3D runtime.

Relevant code:

- `app/routes/world.$id.tsx`
- `app/components/spark-canvas.tsx`

## 3. COOP/COEP For SharedArrayBuffer

Spark depends on browser features that require cross-origin isolation.

- The Express server and Vite dev server both set `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy`.
- Keeping the same headers in development and production reduces environment-specific surprises.

Relevant code:

- `server.js`
- `vite.config.ts`

## 4. Thin Backend-For-Frontend Layer

The server-side routes act as a lightweight BFF instead of exposing the World Labs API directly to the browser.

- Keeps API key handling on the server.
- Makes it easier to normalize request and response shapes for the UI.
- Provides a natural place to add validation, retries, logging, persistence, and rate limits later.

Relevant code:

- `app/routes/api.generate.tsx`
- `app/routes/api.status.$operationId.tsx`
- `app/routes/api.proxy.ts`

## 5. Simple Local Persistence

Generated worlds are stored in a local JSON file rather than a hosted database.

- This is a deliberate portfolio tradeoff to keep the project runnable with minimal setup.
- It keeps the product loop visible while avoiding infrastructure that would distract from the 3D and product-engineering story.
- If this were productionized, the natural next step would be a real backing store plus auth and multi-user ownership.

Relevant code:

- `app/lib/worlds-store.ts`

## 6. Why This Project Matters

This repo is less about building a generic 3D demo and more about showing how product engineering, AI workflows, and modern web graphics can fit together in a usable application:

- async generation with progress and failure states
- viewer ergonomics and shareable routes
- browser/runtime constraints around modern 3D tooling
- practical tradeoffs for iteration speed
