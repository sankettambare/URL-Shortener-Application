const { readFile, writeFile, mkdir } = require('fs/promises');
const { createServer } = require('http');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const DATA_FILE = path.join("public", 'data', 'links.json');
const PORT = 3000;

// Ensure data file exists
const ensureDataFile = async () => {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    await writeFile(DATA_FILE, JSON.stringify({}));
  }
};

const servFile = async (res, filepath, contentType) => {
  try {
    const data = await readFile(filepath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end("404 page not found");
  }
};

const loadLinks = async () => {
  try {
    const data = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const saveLinks = async (links) => {
  await writeFile(DATA_FILE, JSON.stringify(links));
};

const server = createServer(async (req, res) => {
  console.log("Request:", req.method, req.url);

  if (req.method === "GET") {
    if (req.url === "/") {
      return servFile(res, path.join("public", "index.html"), "text/html");
    } else if (req.url === "/style.css") {
      return servFile(res, path.join("public", "style.css"), "text/css");
    } else if (req.url === "/script.js") {
      return servFile(res, path.join("public", "script.js"), "text/javascript");
    } else if (req.url === "/links") {
      const links = await loadLinks();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(links));
    }

    // Redirect for short code
    const links = await loadLinks();
    const shortCode = req.url.slice(1);
    if (links[shortCode]) {
      res.writeHead(302, { Location: links[shortCode] });
      return res.end();
    }
  }

  // POST /shorten
  if (req.method === "POST" && req.url === "/shorten") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      const { url, shortCode } = JSON.parse(body);
      if (!url) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("URL is required");
      }

      const links = await loadLinks();
      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

      if (links[finalShortCode]) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Short code already exists. Please choose another.");
      }

      links[finalShortCode] = url;
      await saveLinks(links);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, shortCode: finalShortCode }));
    });
  }
});

ensureDataFile().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
