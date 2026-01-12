import { fileURLToPath, URL } from "node:url";
import { execSync } from "node:child_process";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

import { version } from "./package.json";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  let commitHash = "";
  try {
    commitHash = execSync("git rev-parse --short HEAD").toString().trim();
  } catch (e) {
    console.warn("Failed to get git commit hash", e);
  }

  const appVersion = mode === "development" ? "devel" : commitHash || version;
  const commitUrl = commitHash
    ? `https://github.com/kev1nweng/reel-sync/commit/${commitHash}`
    : "";

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith("mdui-"),
          },
        },
      }),
      {
        name: "html-transform",
        transformIndexHtml(html) {
          const adsenseId = env.VITE_ADSENSE_ACCOUNT;
          if (adsenseId) {
            return html.replace(
              "<head>",
              `<head>\n    <meta name="google-adsense-account" content="${adsenseId}">`,
            );
          }
          return html;
        },
      },
    ],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __COMMIT_URL__: JSON.stringify(commitUrl),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
