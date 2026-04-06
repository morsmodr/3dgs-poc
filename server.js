/* eslint-env node */
import { createRequestHandler } from "@react-router/express";
import express from "express";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const app = express();

// COOP/COEP headers for SharedArrayBuffer support (needed for Spark/WebGL)
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

app.use(
    viteDevServer
      ? viteDevServer.middlewares
      : express.static("build/client")
  );

  const build = viteDevServer
  ? () =>
      viteDevServer.ssrLoadModule(
        "virtual:react-router/server-build"
      )
  : await import("./build/server/index.js");
  
// and your app is "just a request handler"
app.all("*", createRequestHandler({ build }));

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`App listening on http://localhost:${port}`);
});
