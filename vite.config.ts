import { reactRouter } from "@react-router/dev/vite";
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
    reactRouter(),
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
