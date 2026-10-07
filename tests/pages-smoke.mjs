import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const output = await mkdtemp(path.join(tmpdir(), "preobrazhenie-pages-"));
const base = "/preobrazhenie/";
const siteUrl = "https://noviiich.github.io/preobrazhenie/";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
let server;
let browser;

try {
  const build = spawnSync(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "build", "--outDir", output],
    {
      env: { ...process.env, VITE_BASE_PATH: base, SITE_URL: siteUrl },
      encoding: "utf8",
    },
  );
  assert.equal(build.status, 0, build.stdout + build.stderr);
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (!pathname.startsWith(base)) {
      response.writeHead(404).end();
      return;
    }
    const relativePath =
      decodeURIComponent(pathname.slice(base.length)) || "index.html";
    const file = path.resolve(output, relativePath);
    if (!file.startsWith(output + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const content = await readFile(file);
      response.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
      });
      response.end(content);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch();

  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) failures.push(response.url());
    });
    await page.goto(`http://127.0.0.1:${server.address().port}${base}`);
    await page.evaluate(async () => {
      document.querySelectorAll("img").forEach((image) => {
        image.loading = "eager";
      });
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode()));
    });
    assert.equal(
      await page.locator('link[rel="canonical"]').getAttribute("href"),
      siteUrl,
    );
    assert.equal(
      await page.locator('meta[property="og:url"]').getAttribute("content"),
      siteUrl,
    );
    const schema = JSON.parse(
      await page.locator('script[type="application/ld+json"]').textContent(),
    );
    assert.equal(schema.url, siteUrl);
    assert.equal(
      await page.evaluate(
        () =>
          document.fonts.check('400 16px "Cormorant"') &&
          document.fonts.check('400 16px "Manrope"'),
      ),
      true,
    );
    await page.locator('[data-look="Каре с характером"]').click();
    const image = page.locator("#look-dialog-image");
    await image.evaluate((element) => element.decode());
    assert.match(
      await image.getAttribute("src"),
      /^\/preobrazhenie\/images\/bob-640\.webp$/,
    );
    await page.getByRole("button", { name: "Хочу такой образ" }).click();
    assert.match(
      await page.locator("#booking-message").inputValue(),
      /каре с характером/,
    );
    assert.deepEqual(failures, []);
    await page.close();
    console.log(`GitHub Pages production check passed: ${width}px`);
  }
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await rm(output, { recursive: true, force: true });
}
