<script setup>
import { PeerID } from "@/utils/peer-id";
import { shared } from "@/main";
import { msg } from "@/utils/msg";

import Peer from "peerjs";
import VideoInput from "@/components/VideoInput.vue";
import VideoPlayer from "@/components/VideoPlayer.vue";
import BlankPadding from "@/components/BlankPadding.vue";
import LoadingRing from "@/components/LoadingRing.vue";

import { alert as mduiAlert } from "mdui/functions/alert";
import { snackbar as mduiSnackbar } from "mdui/functions/snackbar";
</script>

<template>
  <div class="container-c" v-if="!isShareIncoming">
    <h1>{{ $t("StartView.title") }}</h1>
    <span>{{ $t("StartView.description") }}<br />{{ modeDescription }}</span>
    <reelsync-padding></reelsync-padding>
    <div id="options">
      <div>
        <mdui-switch
          id="mode-switch"
          style="margin: 0 auto"
          @change="changeMode"
          checked-icon="share--rounded"
          unchecked-icon="link--rounded"
          checked
        ></mdui-switch>
        <label id="mode-indicator">{{ modeName }}</label>
      </div>
      <div v-if="true">
        <mdui-switch
          id="method-switch"
          style="margin: 0 auto"
          @change="changeMethod"
          :disabled="!isMaster"
          checked-icon="east--rounded"
          unchecked-icon="commit--rounded"
          checked
        ></mdui-switch>
        <label id="method-indicator">{{
          isMaster ? methodName : $t("StartView.messages.toggleUnavailable")
        }}</label>
      </div>
    </div>
    <reelsync-padding></reelsync-padding>
    <div v-if="isMaster">
      <reelsync-video-input id="video-input" @change="onVideoUpload"></reelsync-video-input>
      <div id="fab-container">
        <mdui-fab
          extended
          id="video-upload-button"
          v-if="isP2P && !isScreenStreamReady"
          size="normal"
          variant="surface"
          icon="upload--rounded"
          @click="uploadVideo"
        >
          {{ $t("StartView.buttons.uploadVideo") }}
        </mdui-fab>
        <h4 v-if="isP2P && !isScreenStreamReady">{{ $t("StartView.messages.or") }}</h4>
        <mdui-fab
          extended
          id="screen-sharing-button"
          v-if="isP2P"
          size="normal"
          variant="surface"
          icon="laptop--rounded"
          @click="requestScreenShare"
        >
          {{ $t("StartView.buttons.requestScreenShare") }}
        </mdui-fab>
        <mdui-text-field
          v-else
          id="origin-url-input"
          class="monospace"
          v-model="originURL"
          :label="$t('StartView.labels.sourceURL')"
          variant="outlined"
          clearable
          counter
        ></mdui-text-field>
      </div>
      <reelsync-video-player style="display: none" id="video-player"></reelsync-video-player>
      <reelsync-padding></reelsync-padding>
      <mdui-button
        @click="onCreateRequest"
        id="create-room-button"
        :disabled="(!isVideoReady && !isOriginReady) || isLoading"
        :loading="isLoading"
        >{{ $t("StartView.buttons.createRoom") }}</mdui-button
      >
    </div>
    <div v-else>
      <mdui-text-field
        id="room-id-input"
        class="monospace"
        v-model="roomID"
        :label="$t('StartView.labels.roomID')"
        variant="outlined"
        maxlength="16"
        clearable
        counter
      ></mdui-text-field
      ><br />
      <mdui-button
        @click="onJoinRequest"
        id="join-room-button"
        :disabled="!isRoomReady"
        :loading="isLoading"
        >{{ $t("StartView.buttons.joinRoom") }}</mdui-button
      >
    </div>
  </div>
  <div class="container-c" v-else>
    <reelsync-loading-ring style="margin: 0 auto"></reelsync-loading-ring>
    <reelsync-padding></reelsync-padding>
    <h3>{{ $t("StartView.messages.connectingToTURN") }}</h3>
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
          ? shared.app.i18n.t("StartView.modes.name.master")
          : shared.app.i18n.t("StartView.modes.name.slave");
      },
      get modeDescription() {
        return this.mode === 0
          ? shared.app.i18n.t("StartView.modes.description.master")
          : shared.app.i18n.t("StartView.modes.description.slave");
      },
      get isMaster() {
        return this.mode === 0;
      },
      get isP2P() {
        return this.method === 0;
      },
      get isScreenStreamReady() {
        return shared.app.screenStream
      },
    };
  },
  methods: {
    // 切换主从控制模式
    changeMode() {
      this.mode = document.getElementById("mode-switch").checked ? 0 : 1;
      // 0: master, 1: slave
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

    // 创建新房间(主控端)
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
      this.$router.push("/stream");
    },

    // 加入已有房间(从属端)
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
        if (this.isMaster) {
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
  },
  unmounted() {
    window.removeEventListener("keypress", this.handleKeyPress);
  },
  watch: {
    mode(value) {
      shared.app.mode = value;
      msg.i(`Role changed: ${shared.app.mode === 0 ? "master" : "slave"}`);
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
    "reelsync-padding": BlankPadding,
    "reelsync-loading-ring": LoadingRing,
  },
};
</script>

<style scoped>
mdui-text-field {
  width: calc(80vw);
  max-width: 360px;
}

#options {
  width: auto;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 2rem;
}

#options > div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

#fab-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
</style>
