import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  assetsInclude: ["**/*.wasm"],
  plugins: [
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      },
    },
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: ["@sparkjsdev/spark", "three", "detect-gpu", "@react-three/drei", "@react-three/fiber"],
    exclude: [],
    esbuildOptions: {
      target: "esnext",
    },
  },
  ssr: {
    external: ["@sparkjsdev/spark"],
    noExternal: ["three", "@react-three/fiber", "@react-three/drei", "detect-gpu"],
  },
  build: {
    target: "esnext",
  },
  worker: {
    format: "es",
  },
});
