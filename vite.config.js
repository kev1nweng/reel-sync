import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

import { version } from "./package.json";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
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
      __APP_VERSION__: JSON.stringify(version),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
