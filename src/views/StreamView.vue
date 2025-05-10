<script setup>
import { shared } from "@/main";
import { msg } from "@/utils/msg";
// import { transformSdp } from "@/utils/sdp";

import LoadingRing from "@/components/LoadingRing.vue";
import VideoPlayer from "@/components/VideoPlayer.vue";
import BlankPadding from "@/components/BlankPadding.vue";
</script>

<template>
  <div class="container-c">
    <h1>{{ $t("StreamView.title") }}</h1>
    <span class="monospace" id="room-id-indicator">{{
      $t("StreamView.messages.roomID", { roleDescription, roomID })
    }}</span>
    <span class="monospace" v-if="!isSlave" id="share-link-indicator"
      >{{ locationOrigin }}/?join={{ roomID }}</span
    >
    <span v-if="!isReady">{{ hint }}</span
    ><reelsync-padding></reelsync-padding>
    <div v-if="!isReady">
      <reelsync-padding></reelsync-padding>
      <reelsync-loading-ring id="loading"></reelsync-loading-ring><br />
      <h3>{{ loadingDescription }}</h3>
      <h4 style="color: crimson" v-if="isConnectionRestricted">
        {{ $t("StreamView.messages.connectionRestricted") }}
      </h4>
    </div>
    <br />
    <reelsync-video-player
      id="video-player-stream"
      :style="{ display: isReady ? 'block' : 'none' }"
    ></reelsync-video-player
    ><reelsync-padding></reelsync-padding>
    <span id="status"
      ><s :style="{ color: isReady ? 'green' : 'red' }">⬤</s>
      {{
        isReady ? $t("StreamView.messages.connected") : $t("StreamView.messages.disconnected")
      }}：{{
        !isSlave
          ? $t("StreamView.messages.pushing", {
              m:
                method == 1
                  ? $t("StreamView.messages.sameOriginLiteral")
                  : $t("StreamView.messages.p2pLiteral"),
            })
          : $t("StreamView.messages.watching")
      }}
      <div v-if="((!isSlave && method == 1) || isSlave || (!isSlave && method == 0)) && isReady">
        &nbsp;({{
          method == 1 ? $t("StreamView.messages.delta") : $t("StreamView.messages.latency")
        }}:
        {{
          playbackDelta
            ? Math.round(playbackDelta * 1e3)
            : $t("StreamView.messages.measuringLiteral")
        }}{{ playbackDelta ? "ms" : "" }})
      </div></span
    >
  </div>
</template>

<script>
export default {
  name: "StreamView",
  data() {
    return {
      connectionAttempts: 0,
      maxAttempts: 3,
      isReady: false,
      playbackDelta: null,
      locationOrigin: location.origin,
      get method() {
        return shared.app.method;
      },
      get roleDescription() {
        return this.isSlave
          ? shared.app.i18n.t("StreamView.roleDescription.slave")
          : shared.app.i18n.t("StreamView.roleDescription.master");
      },
      get hint() {
        return this.isSlave
          ? shared.app.i18n.t("StreamView.hint.slave")
          : shared.app.i18n.t("StreamView.hint.master");
      },
      get loadingDescription() {
        return shared.app.mode == 1
          ? shared.app.i18n.t("StreamView.messages.joining")
          : shared.app.i18n.t("StreamView.messages.waiting");
      },
      get roomID() {
        return this.isSlave && shared.app.guestID ? shared.app.guestID : shared.app.roomID;
      },
      get isSlave() {
        return shared.app.mode == 1;
      },
      get isConnectionRestricted() {
        return shared.app.isConnectionRestricted;
      },
    };
  },
  methods: {
    connectToPeer() {
      const remotePeerId = `${shared.app.roomID}-data`;
      const dataPeer = shared.peers.local.data;

      // 确保peer已经就绪
      if (dataPeer.disconnected) {
        dataPeer.reconnect();
      }

      msg.i(`尝试连接到 ${remotePeerId} (第 ${this.connectionAttempts + 1} 次)`);

      // 建立数据通道连接
      const conn = dataPeer.connect(remotePeerId, {
        reliable: true,
      });

      // 连接成功回调
      conn.on("open", () => {
        conn.send(`connected@${shared.app.guestID}`);
        msg.i(`和 ${shared.app.roomID} 的连接已建立`);
        shared.peers.local.video.on("call", (call) => {
          call.answer();
          call.on("stream", (stream) => {
            msg.i("收到视频流");
            const video = document.getElementById("video-player-stream");
            video.srcObject = stream;
            video.load();
            video.play();
          });
        });
        this.isReady = true;
        shared.peers.remote.data = conn;
      });

      // 数据接收处理
      conn.on("data", (data) => {
        const video = document.getElementById("video-player-stream");
        if (data.toString().startsWith("origin")) {
          shared.app.method = 1;
          const origin = data.toString().split("@")[1];
          video.src = origin;
          shared.app.syncThread = setInterval(
            () => {
              msg.i(`发送当前视频进度: ${video.currentTime}`);
              conn.send(`video@sync:${video.currentTime}&timestamp=${Date.now()}`);
            },
            import.meta.env.VITE_SAME_ORIGIN_SYNC_INTERVAL_SECONDS * 1e3,
          );
        } else if (data.toString().startsWith("video")) {
          const command = data.toString().split("@")[1];
          if (command === "play") {
            video.play();
          } else if (command === "pause") {
            video.pause();
          } else if (command.startsWith("seek")) {
            const time = data.toString().split("@")[1].split(":")[1];
            video.currentTime = time;
          }
        } else if (data.toString().startsWith("latency")) {
          const latency = parseFloat(data.toString().split("@")[1]);
          this.playbackDelta = latency;
        } else if (data.toString().startsWith("timestamp")) {
          const timestamp = parseFloat(data.toString().split("@")[1]);
          const latency = (Date.now() - timestamp) / 1000;
          this.playbackDelta = latency;
          conn.send(`latency@${latency}`);
        }
      });

      // 错误处理和重试
      conn.on("error", (err) => {
        msg.e(`和 ${shared.app.roomID} 的连接建立失败: ${err.message}`);
        console.error(err);
        this.connectionAttempts++;
        // 延迟重试
        setTimeout(() => this.connectToPeer(), 1000);
      });

      // 连接关闭处理
      conn.on("close", () => {
        msg.w("连接已关闭");
        shared.peers.remote.data = null;
        this.isReady = false;
        const video = document.getElementById("video-player-stream");
        video.pause();
      });
    },
  },
  mounted() {
    // 初始化检查
    if (this.roomID === "") {
      this.$router.replace("/");
      return;
    }

    const that = this;

    if (this.isSlave) {
      // 从属端逻辑
      const dataPeer = shared.peers.local.data;

      // 确保peer已经就绪后再连接
      if (dataPeer.open) {
        this.connectToPeer();
      } else {
        dataPeer.on("open", () => {
          this.connectToPeer();
        });
      }
    } else {
      navigator.clipboard.writeText(this.roomID);

      // 处理连接请求
      shared.peers.local.data.on("connection", (conn) => {
        conn.on("open", function () {
          msg.i(`已收到来自 ${conn.peer} 的连接`);
          shared.peers.remote.data = conn;
        });

        // 数据接收处理
        conn.on("data", function (data) {
          const status = data.toString().split("@")[0];
          const peerID = data.toString().split("@")[1];
          if (status === "connected") {
            msg.i(`和 ${conn.peer} 的连接已建立`);
            that.isReady = true;
            if (shared.app.method == 0) {
              const videoPlayer = document.querySelector("#video-player-stream");
              let stream;
              try {
                stream = videoPlayer.captureStream();
              } catch (e) {
                stream = videoPlayer.mozCaptureStream();
                msg.w(`由于错误: ${e} 尝试使用 mozCaptureStream()...`);
              }
              // eslint-disable-next-line no-unused-vars
              const call = shared.peers.local.video.call(`${peerID}-video`, stream);
              shared.app.pingThread = setInterval(
                () => {
                  conn.send(`timestamp@${Date.now()}`);
                },
                import.meta.env.VITE_SAME_ORIGIN_SYNC_INTERVAL_SECONDS * 1e3,
              );
            } else {
              const video = document.getElementById("video-player-stream");
              conn.send(`origin@${shared.app.videoURL}`);
              video.addEventListener("play", () => {
                conn.send("video@play");
              });
              video.addEventListener("pause", () => {
                conn.send("video@pause");
              });
              video.addEventListener("seeking", () => {
                conn.send(`video@seek:${video.currentTime}`);
              });
            }
          } else if (status == "video") {
            const video = document.getElementById("video-player-stream");
            const message = data.toString().split("@")[1];
            if (message.startsWith("sync")) {
              // this is really garbage code but i dont have time for a cleaner implementaion
              const time = message.split(":")[1].split("&")[0];
              const offset = (Date.now() - message.split(":")[1].split("&")[1].split("=")[1]) / 1e3;
              const delta = time - video.currentTime - offset;
              if (Math.abs(delta) > (import.meta.env.VITE_MAX_ACCEPTABLE_DELAY_SECONDS ?? 3)) {
                msg.w(`时间差过大，尝试同步。时间差：${delta}`);
                that.playbackDelta = delta;
                conn.send(`video@seek:${video.currentTime}`);
              } else {
                msg.i(`收到从节点报告的播放进度。时间差：${delta}`);
                that.playbackDelta = delta;
              }
              conn.send(`latency@${delta}`);
            }
          } else if (status == "latency") {
            const latency = data.toString().split("@")[1];
            that.playbackDelta = latency;
          } else {
            msg.e(`收到无效消息：${data}`);
          }
        });

        // 连接关闭处理
        conn.on("close", () => {
          msg.w("连接已关闭");
          shared.peers.remote.data = null;
          this.isReady = false;
          const video = document.getElementById("video-player-stream");
          video.pause();
        });
      });
      ((el) => {
        el.src = shared.app.videoURL;
        el.load();
      })(document.querySelector("#video-player-stream"));
    }
  },
  beforeUnmount() {
    if (shared.app.syncThread) clearInterval(shared.app.syncThread);
    if (shared.app.pingThread) clearInterval(shared.app.pingThread);
  },
  components: {
    "reelsync-loading-ring": LoadingRing,
    "reelsync-video-player": VideoPlayer,
    "reelsync-padding": BlankPadding,
  },
};
</script>

<style scoped>
#video-player-stream {
  margin: 0 auto;
  width: 100%;
  max-width: 1000px;
}

#room-id-indicator {
  color: gray;
}

#share-link-indicator {
  color: slategray;
}

#loading {
  margin: 0 auto;
}

#status {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 6px;
}

#status > s {
  font-size: 0.65em;
}
</style>
