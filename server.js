const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "deploy-static");
const startPort = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function resolveFile(urlPath) {
  const safePath = decodeURIComponent(urlPath.split("?")[0]);

  if (safePath === "/" || safePath === "") {
    return path.join(rootDir, "index.html");
  }

  const normalized = path.normalize(safePath).replace(/^(\.\.[/\\])+/, "");
  const target = path.join(rootDir, normalized);

  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    return path.join(target, "index.html");
  }

  return target;
}

function createServer(port) {
  const server = http.createServer((req, res) => {
    const filePath = resolveFile(req.url || "/");

    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
      });
      res.end(data);
    });
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.log(`Port ${port} is in use, switching to http://localhost:${nextPort}`);
      createServer(nextPort);
      return;
    }

    console.error(error);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`Static demo is running at http://localhost:${port}`);
    console.log(`Serving folder: ${rootDir}`);
  });
}

createServer(startPort);
