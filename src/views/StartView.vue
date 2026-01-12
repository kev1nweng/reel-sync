<script setup>
import { PeerID } from "@/utils/peer-id";
import { shared } from "@/main";
import { msg } from "@/utils/msg";

import Peer from "peerjs";
import VideoInput from "@/components/VideoInput.vue";
import VideoPlayer from "@/components/VideoPlayer.vue";
import LoadingRing from "@/components/LoadingRing.vue";

import { alert as mduiAlert } from "mdui/functions/alert";
import { snackbar as mduiSnackbar } from "mdui/functions/snackbar";
import Bowser from "bowser";
</script>

<template>
  <div class="page-container" v-if="!isShareIncoming">
    <mdui-card variant="elevated" class="login-card">
      <div class="card-content">
        <!-- Left Section: Branding and Title -->
        <div class="brand-section">
          <div class="logo">
            <mdui-icon name="rocket_launch--rounded" style="font-size: 48px; color: var(--mdui-color-primary)"></mdui-icon>
          </div>
          <h1>{{ $t("StartView.title") }}</h1>
          <p class="description">
            {{ $t("StartView.description") }}<br />
            {{ modeDescription }}
          </p>

          <div class="env-info">
            <div class="env-item">
              <mdui-icon name="devices--rounded"></mdui-icon>
              <span>{{ deviceInfo }}</span>
            </div>
            <div class="env-item">
              <mdui-icon name="public--rounded"></mdui-icon>
              <span>{{ browserInfo }}</span>
              <mdui-icon
                :name="isWebRTCSupported ? 'check--rounded' : 'close--rounded'"
                :style="{ color: isWebRTCSupported ? '#4caf50' : '#f44336', fontSize: '1.1rem', marginLeft: '4px', fontWeight: 'bold' }"
              ></mdui-icon>
            </div>
          </div>
        </div>

        <!-- Right Section: Forms and Actions -->
        <div class="form-section">
          <!-- Options Section -->
          <div id="options">
            <div class="option-item">
              <mdui-switch
                id="mode-switch"
                @change="changeMode"
                checked-icon="share--rounded"
                unchecked-icon="link--rounded"
                checked
              ></mdui-switch>
              <label>{{ modeName }}</label>
            </div>
            <div class="option-item">
              <mdui-switch
                id="method-switch"
                @change="changeMethod"
                :disabled="!isHost"
                checked-icon="east--rounded"
                unchecked-icon="commit--rounded"
                checked
              ></mdui-switch>
              <label>{{ isHost ? methodName : $t("StartView.messages.toggleUnavailable") }}</label>
            </div>
          </div>

          <mdui-divider class="section-divider"></mdui-divider>

          <!-- Host Mode Inputs -->
          <div v-if="isHost" class="input-group">
            <reelsync-video-input id="video-input" @change="onVideoUpload"></reelsync-video-input>

            <div v-if="isP2P" class="source-selector">
              <label class="section-subtitle">{{ $t("StartView.labels.selectSource") }}</label>
              <mdui-list class="source-list">
                <mdui-list-item
                  icon="upload_file--rounded"
                  @click="uploadVideo"
                  v-if="!isScreenStreamReady"
                  :description="$t('StartView.buttons.uploadVideoDescription')"
                >
                  {{ $t("StartView.buttons.uploadVideo") }}
                </mdui-list-item>

                <mdui-list-item
                  icon="screenshot_monitor--rounded"
                  @click="requestScreenShare"
                  :active="isScreenStreamReady"
                  :description="$t('StartView.buttons.requestScreenShareDescription')"
                >
                  {{ $t("StartView.buttons.requestScreenShare") }}
                </mdui-list-item>
              </mdui-list>
            </div>
            <div v-else class="input-group">
              <mdui-text-field
                id="origin-url-input"
                class="monospace"
                v-model="originURL"
                :label="$t('StartView.labels.sourceURL')"
                variant="outlined"
                clearable
                style="width: 100%"
              ></mdui-text-field>
            </div>

            <reelsync-video-player style="display: none" id="video-player"></reelsync-video-player>

            <div class="action-bar">
              <mdui-button
                @click="onCreateRequest"
                id="create-room-button"
                :disabled="(!isVideoReady && !isOriginReady) || isLoading"
                :loading="isLoading"
              >{{ $t("StartView.buttons.createRoom") }}</mdui-button>
            </div>
          </div>

          <!-- Client Mode Inputs -->
          <div v-else class="input-group">
            <mdui-text-field
              id="room-id-input"
              class="monospace"
              v-model="roomID"
              :label="$t('StartView.labels.roomID')"
              variant="outlined"
              maxlength="16"
              clearable
              style="width: 100%"
            ></mdui-text-field>

            <div class="action-bar">
              <mdui-button
                @click="onJoinRequest"
                id="join-room-button"
                :disabled="!isRoomReady"
                :loading="isLoading"
              >{{ $t("StartView.buttons.joinRoom") }}</mdui-button>
            </div>
          </div>
        </div>
      </div>
    </mdui-card>
  </div>
  <div class="page-container" v-else>
    <mdui-card variant="elevated" class="loading-card">
      <reelsync-loading-ring style="margin: 0 auto"></reelsync-loading-ring>
      <h3 style="text-align: center; margin-top: 1.5rem">{{ $t("StartView.messages.connectingToTURN") }}</h3>
    </mdui-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      mode: 0,
      method: 0,
      roomID: "",
      originURL: "",
      isVideoReady: false,
      isOriginReady: false,
      isLoading: false,
      isRoomReady: false,
      isShareIncoming: false,
      get methodName() {
        return this.method === 0
          ? shared.app.i18n.t("StartView.methods.name.p2p")
          : shared.app.i18n.t("StartView.methods.name.sameOrigin");
      },
      get modeName() {
        return this.mode === 0
          ? shared.app.i18n.t("StartView.modes.name.host")
          : shared.app.i18n.t("StartView.modes.name.client");
      },
      get modeDescription() {
        return this.mode === 0
          ? shared.app.i18n.t("StartView.modes.description.host")
          : shared.app.i18n.t("StartView.modes.description.client");
      },
      get isHost() {
        return this.mode === 0;
      },
      get isP2P() {
        return this.method === 0;
      },
      get isScreenStreamReady() {
        return shared.app.screenStream;
      },
      get deviceInfo() {
        const browser = Bowser.getParser(window.navigator.userAgent);
        return `${browser.getOSName()} ${browser.getOSVersion() || ""}`;
      },
      get browserInfo() {
        const browser = Bowser.getParser(window.navigator.userAgent);
        return `${browser.getBrowserName()} ${browser.getBrowserVersion()}`;
      },
      get isWebRTCSupported() {
        return !!(
          window.RTCPeerConnection ||
          window.mozRTCPeerConnection ||
          window.webkitRTCPeerConnection
        );
      },
    };
  },
  methods: {
    // 切换发送接收控制模式
    changeMode() {
      this.mode = document.getElementById("mode-switch").checked ? 0 : 1;
      // 0: host, 1: client
    },

    // 切换传输方式
    changeMethod() {
      this.method = document.getElementById("method-switch").checked ? 0 : 1;
      // 0: p2p, 1: same-origin
      document.getElementById("create-room-button").disabled = true;
    },

    // 触发文件选择对话框
    uploadVideo() {
      document.querySelector("#video-input").click();
    },

    async requestScreenShare() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        msg.e("Screen sharing is not supported in this browser.");
        mduiSnackbar({
          message: this.$t("StartView.messages.screenShareNotSupported"),
          closeOnOutsideClick: true,
        });
        return;
      }
      try {
        shared.app.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        this.onScreenShareRequested();
      } catch (error) {
        msg.e("Failed to request screen share:", error);
        mduiSnackbar({
          message: this.$t("StartView.messages.screenShareError"),
          closeOnOutsideClick: true,
        });
      }
    },

    // 检查选择的视频文件是否有效
    checkVideoValidity() {
      const videoInput = document.querySelector("#video-input");
      msg.i(`Acquired video file: ${videoInput.value}`);
      if (videoInput.value) {
        return true;
      } else {
        return false;
      }
    },

    // 获取TURN服务器配置
    async getTurnNode() {
      const url = import.meta.env.VITE_NODE_SERVER_URL;
      const data = {
        ttl: 86400, // 请求体数据
      };
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          msg.e("Failed to request TURN / STUN node:", response.statusText);
          return false;
        }
        const result = await response.json();
        const cfg = {
          iceServers: result.iceServers.urls.map((url) => {
            if (url.startsWith("turn") || url.startsWith("turns")) {
              return {
                urls: url,
                username: result.iceServers.username,
                credential: result.iceServers.credential,
              };
            }
            return { url };
          }),
        };
        return cfg;
      } catch (error) {
        msg.e("Failed to request TURN / STUN node:", error);
        return false;
      }
    },

    // 创建新房间(发送者端)
    async createRoom() {
      const cfg = (await this.getTurnNode()) ?? null;
      const id = new PeerID().id;

      if (!cfg) {
        mduiSnackbar({
          message: this.$t("StartView.messages.turnNodeError"),
          closeOnOutsideClick: true,
        });
        shared.app.isConnectionRestricted = true;
      }

      shared.app.roomID = id.raw;
      shared.peers.local.data = new Peer(id.data, cfg ? { config: cfg } : null);
      shared.peers.local.video = new Peer(id.video, cfg ? { config: cfg } : null);
      shared.peers.local.audio = new Peer(id.audio, cfg ? { config: cfg } : null);
      this.$router.push("/stream");
    },

    // 加入已有房间(接收者端)
    async joinRoom() {
      const cfg = (await this.getTurnNode()) ?? null;
      const id = new PeerID().id;

      if (!cfg) {
        mduiSnackbar({
          message: this.$t("StartView.messages.turnNodeError"),
          closeOnOutsideClick: true,
        });
        shared.app.isConnectionRestricted = true;
      }

      shared.app.guestID = id.raw;
      shared.peers.local.data = new Peer(id.data, cfg ? { config: cfg } : null);
      shared.peers.local.video = new Peer(id.video, cfg ? { config: cfg } : null);
      shared.peers.local.audio = new Peer(id.audio, cfg ? { config: cfg } : null);
      this.$router.push("/stream");
    },

    // 创建房间的点击处理
    async onCreateRequest() {
      this.isLoading = true;
      await this.createRoom();
      this.isLoading = false;
    },

    // 加入房间的点击处理
    async onJoinRequest() {
      this.isLoading = true;
      document.getElementById("join-room-button").setAttribute("disabled", true);
      await this.joinRoom();
      this.isLoading = false;
      document.getElementById("join-room-button").removeAttribute("disabled");
    },

    // 处理选择的视频文件
    handleFileChange(event) {
      const file = event.target.files[0];
      const videoURL = URL.createObjectURL(file);
      shared.app.videoURL = videoURL;
    },

    // 视频上传完成的回调
    onVideoUpload(event) {
      const createRoomButton = document.getElementById("create-room-button");
      if (this.checkVideoValidity()) {
        this.handleFileChange(event);
        createRoomButton.removeAttribute("disabled");
        this.isVideoReady = true;
      } else this.isVideoReady = false;
    },

    onScreenShareRequested() {
      const createRoomButton = document.getElementById("create-room-button");
      if (shared.app.screenStream) {
        this.isVideoReady = true;
        createRoomButton.removeAttribute("disabled");
      } else {
        createRoomButton.setAttribute("disabled", true);
        this.isVideoReady = false;
      }
    },

    // 处理回车键快捷操作
    handleKeyPress(event) {
      if (event.key === "Enter") {
        if (this.isHost) {
          if (!document.getElementById("create-room-button").disabled) {
            this.onCreateRequest();
            event.preventDefault();
          }
        } else {
          if (!document.getElementById("join-room-button").disabled) {
            this.onJoinRequest();
            event.preventDefault();
          }
        }
      }
    },
  },
  mounted() {
    window.addEventListener("keypress", this.handleKeyPress);
    const urlParams = new URLSearchParams(window.location.search);
    const joinParam = urlParams.get("join");
    if (joinParam) {
      if (joinParam.length === 16) {
        this.isShareIncoming = true;
        this.isLoading = true;
        shared.app.roomID = joinParam;
        shared.app.mode = 1;
        this.isRoomReady = true;
        this.joinRoom();
        this.isLoading = false;
      } else {
        (async () => {
          await mduiAlert({
            headline: this.$t("StartView.messages.invalidRoomIDParam.headline"),
            description: this.$t("StartView.messages.invalidRoomIDParam.description"),
          });
          location.replace(location.origin);
        })();
      }
    }
    const browser = Bowser.getParser(window.navigator.userAgent);
    if (browser.getBrowserName() === "Safari") {
      mduiAlert({
        description: this.$t("StartView.messages.safariWarning"),
        onClose: () => {
          msg.w("Safari detected, some features may not work as expected.");
        },
      });
    }
  },
  unmounted() {
    window.removeEventListener("keypress", this.handleKeyPress);
  },
  watch: {
    mode(value) {
      shared.app.mode = value;
      msg.i(`Role changed: ${shared.app.mode === 0 ? "host" : "client"}`);
    },
    method(value) {
      shared.app.method = value;
      msg.i(`Method changed: ${shared.app.method === 0 ? "p2p" : "same-origin"}`);
    },
    roomID(value) {
      const roomIDInput = document.getElementById("room-id-input");
      if (value.length === 16) {
        this.isRoomReady = true;
        roomIDInput.removeAttribute("helper");
        shared.app.roomID = value;
      } else if (value.length == 0) {
        this.isRoomReady = false;
        roomIDInput.setAttribute("helper", this.$t("StartView.roomIDInput.helper.empty"));
      } else {
        this.isRoomReady = false;
        roomIDInput.setAttribute("helper", this.$t("StartView.roomIDInput.helper.invalid"));
      }
    },
    originURL(value) {
      const originURLInput = document.getElementById("origin-url-input");
      if (
        value.length > 0 &&
        new String(value).match(
          /^(?:(http|https|ftp):\/\/)?((|[\w-]+\.)+[a-z0-9]+)(?:(\/[^/?#]+)*)?(\?[^#]+)?(#.+)?$/i,
        )
      ) {
        msg.i("Video is ready");
        this.isOriginReady = true;
        originURLInput.removeAttribute("helper");
        shared.app.videoURL = value;
      } else {
        this.isOriginReady = false;
      }
    },
  },
  components: {
    "reelsync-video-input": VideoInput,
    "reelsync-video-player": VideoPlayer,
    "reelsync-loading-ring": LoadingRing,
  },
};
</script>

<style scoped>
.page-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  background-color: rgb(var(--mdui-color-surface-container-low));
  padding: 2rem 1rem 80px 1rem;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 1000px;
  min-height: 480px;
  border-radius: 28px;
  overflow: hidden;
  background-color: rgb(var(--mdui-color-surface));
  color: rgb(var(--mdui-color-on-surface));
  border: 1px solid rgb(var(--mdui-color-outline-variant));
}

.card-content {
  display: flex;
  flex-direction: row;
  height: 100%;
  min-height: 480px;
}

.brand-section {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  background-color: rgba(var(--mdui-color-secondary-container), 0.3);
}

.logo {
  margin-bottom: 1.5rem;
}

.brand-section h1 {
  font-size: 2.5rem;
  font-weight: 400;
  margin: 0 0 1rem 0;
  color: rgb(var(--mdui-color-on-secondary-container));
}

.description {
  font-size: 1.125rem;
  color: rgb(var(--mdui-color-on-secondary-container));
  opacity: 0.8;
  line-height: 1.5;
  margin: 0;
}

.env-info {
  margin-top: auto;
  padding-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.env-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgb(var(--mdui-color-on-surface-variant));
  font-size: 0.875rem;
}

.env-item mdui-icon {
  font-size: 1.25rem;
  opacity: 0.8;
}

.form-section {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--mdui-color-surface));
}

#options {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.option-item label {
  font-size: 0.875rem;
  color: rgb(var(--mdui-color-on-surface));
  font-weight: 500;
}

.section-divider {
  margin-bottom: 2rem;
  opacity: 0.1;
}

.input-group {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-subtitle {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(var(--mdui-color-primary));
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: block;
}

.source-list {
  background-color: rgb(var(--mdui-color-surface-container));
  border-radius: 16px;
  padding: 4px;
}

.source-list mdui-list-item {
  margin: 4px 0;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 2rem;
}

.loading-card {
  padding: 3rem;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgb(var(--mdui-color-surface));
  color: rgb(var(--mdui-color-on-surface));
}

/* Responsive adjustments */
@media (max-width: 840px) {
  .page-container {
    padding: 0;
  }

  .card-content {
    flex-direction: column;
  }

  .brand-section {
    padding: 64px 24px;
  }

  .form-section {
    padding: 24px 24px 40px 24px;
  }

  .login-card {
    max-width: none;
    margin: 0;
    border-radius: 0;
    border: none;
    min-height: 100vh;
    box-shadow: none;
  }

  .loading-card {
    width: 100%;
    margin: 0;
    border-radius: 0;
    border: none;
    min-height: 100vh;
    box-shadow: none;
  }
}
</style>
