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

// 延迟加载 Google Sans Flex 字体
import { loadGoogleSansFont } from "./utils/font-loader";

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

setColorScheme("#0061a4");

// 页面加载后延迟加载字体，不阻塞首屏渲染
loadGoogleSansFont();

export const shared = {
  app: {
    mode: 0,
    method: 0,
    isConnectionRestricted: false,
    roomID: "",
    guestID: "",
    videoURL: "",
    screenStream: null,
    syncThread: null,
    pingThread: null,
    i18n: i18n.global,
    // Voice call related state
    isVoiceEnabled: false,
    audioStream: null,
  },
  peers: {
    local: {
      data: null,
      video: null,
      audio: null,
    },
    remote: {
      data: null,
      video: null,
      audio: null,
    },
  },
  preferences: null,
};

export function resetSharedState() {
  // 1. Stop all streams
  const streams = [
    shared.app.screenStream,
    shared.app.audioStream,
    shared.peers.local.video,
    shared.peers.local.audio,
  ];
  streams.forEach((stream) => {
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  });

  // 2. Clear threads
  if (shared.app.syncThread) clearInterval(shared.app.syncThread);
  if (shared.app.pingThread) clearInterval(shared.app.pingThread);

  // 3. Close peer connections
  const peers = [
    shared.peers.local.data,
    shared.peers.local.video,
    shared.peers.local.audio,
    shared.peers.remote.data,
    shared.peers.remote.video,
    shared.peers.remote.audio,
  ];
  peers.forEach((peer) => {
    if (peer && typeof peer.destroy === "function") {
      try {
        peer.destroy();
      } catch (e) {
        console.error("Error destroying peer:", e);
      }
    } else if (peer && typeof peer.close === "function") {
      try {
        peer.close();
      } catch (e) {
        console.error("Error closing peer:", e);
      }
    }
  });

  // 4. Reset properties
  shared.app.mode = 0;
  shared.app.method = 0;
  shared.app.isConnectionRestricted = false;
  shared.app.roomID = "";
  shared.app.guestID = "";
  if (shared.app.videoURL && shared.app.videoURL.startsWith("blob:")) {
    URL.revokeObjectURL(shared.app.videoURL);
  }
  shared.app.videoURL = "";
  shared.app.screenStream = null;
  shared.app.syncThread = null;
  shared.app.pingThread = null;
  shared.app.isVoiceEnabled = false;
  shared.app.audioStream = null;

  shared.peers.local.data = null;
  shared.peers.local.video = null;
  shared.peers.local.audio = null;
  shared.peers.remote.data = null;
  shared.peers.remote.video = null;
  shared.peers.remote.audio = null;
}
