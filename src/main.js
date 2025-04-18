import "./assets/main.css";
import "mdui";
import "mdui/mdui.css";
import { setColorScheme } from "mdui/functions/setColorScheme";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";

import App from "./App.vue";
import router from "./router";

import zh_CN from "./locales/zh_CN.json";
import en_US from "./locales/en_US.json";

// Object.defineProperty(window.navigator, "language", { value: "en", configurable: true });

if (!localStorage.getItem("reelsync-locale"))
  localStorage.setItem("reelsync-locale", navigator.language);

const app = createApp(App);
const i18n = createI18n({
  locale: localStorage.getItem("reelsync-locale"),
  fallbackLocale: "en-US",
  messages: {
    "zh-CN": zh_CN,
    "en-US": en_US,
  },
});

app.use(i18n);
app.use(router);
app.mount("#app");

setColorScheme("#666666");

export const shared = {
  app: {
    mode: 0,
    method: 0,
    roomID: "",
    guestID: "",
    videoURL: "",
    syncThread: null,
    pingThread: null,
    i18n: i18n.global,
  },
  peers: {
    local: {
      data: null,
      video: null,
    },
    remote: {
      data: null,
      video: null,
    },
  },
};
