import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const siteUrl = env.SITE_URL ? new URL(env.SITE_URL).href : "";

  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [
      {
        name: "deployment-metadata",
        transformIndexHtml(html) {
          if (siteUrl) return html.replaceAll("__SITE_URL__", siteUrl);
          // Local previews should not advertise a different deployment's URL.
          return html
            .replace(/<meta\b[^>]*property="og:url"[^>]*>\s*/g, "")
            .replace(/<link\b[^>]*rel="canonical"[^>]*>\s*/g, "")
            .replace(/^\s*"url": "__SITE_URL__",\s*\n/gm, "");
        },
      },
    ],
  };
});
