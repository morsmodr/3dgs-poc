import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
  assetsInclude: ["**/*.wasm"],
  plugins: [
    devtoolsJson(),
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
    reactRouter(),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: ["three", "detect-gpu", "@react-three/drei", "@react-three/fiber"],
    exclude: ["@sparkjsdev/spark"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  ssr: {
    external: ["@sparkjsdev/spark"],
    // Bundle zustand so SSR output does not emit a default import from "zustand"
    // (zustand v5 ESM has no default export; Node would throw at runtime).
    noExternal: ["three", "@react-three/fiber", "@react-three/drei", "detect-gpu", "zustand"],
  },
  build: {
    target: "esnext",
  },
  worker: {
    format: "es",
  },
});
