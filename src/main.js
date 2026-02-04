import "./assets/main.css";
import "mdui";
import "mdui/mdui.css";
import { setColorScheme } from "mdui/functions/setColorScheme";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";

import App from "./App.vue";
import router from "./router";
import { useSharedStore } from "./stores/shared";

import zh_CN from "./locales/zh_CN.json";
import en_US from "./locales/en_US.json";

// 延迟加载 Google Sans Flex 字体
import { loadGoogleSansFont } from "./utils/font-loader";

// Object.defineProperty(window.navigator, "language", { value: "en", configurable: true });

if (!localStorage.getItem("reelsync-locale"))
  localStorage.setItem("reelsync-locale", navigator.language);

const app = createApp(App);
const pinia = createPinia();
const i18n = createI18n({
  locale: localStorage.getItem("reelsync-locale"),
  fallbackLocale: "en-US",
  messages: {
    "zh-CN": zh_CN,
    "en-US": en_US,
  },
});

app.use(i18n);
app.use(pinia);
app.use(router);
const sharedStore = useSharedStore(pinia);
sharedStore.setI18n(i18n.global);
app.mount("#app");

setColorScheme("#0061a4");

// 页面加载后延迟加载字体，不阻塞首屏渲染
loadGoogleSansFont();
