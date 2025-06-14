<script setup>
import { shared } from "@/main";
import { msg } from "@/utils/msg";
import { Comm } from "@/utils/comm";

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
      const comm = new Comm();

      // 确保peer已经就绪
      if (dataPeer.disconnected) {
        dataPeer.reconnect();
      }

      msg.i(`Connecting to ${remotePeerId} (Attempt ${this.connectionAttempts + 1})`);

      // 建立数据通道连接
      const conn = dataPeer.connect(remotePeerId, {
        reliable: true,
      });

      // 连接成功回调
      conn.on("open", () => {
        conn.send(comm.slave.greet(shared.app.guestID));
        msg.i(`Connection established with ${shared.app.roomID}.`);
        shared.peers.local.video.on("call", (call) => {
          call.answer();
          call.on("stream", (stream) => {
            msg.i("Received video stream");
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
        const commMsg = comm.resolve(data.toString());
        const video = document.getElementById("video-player-stream");
        switch (commMsg.command) {
          case "origin":
            shared.app.method = 1;
            video.src = commMsg.data.ori;
            shared.app.syncThread = setInterval(
              () => {
                msg.i(`Sending playback progress: ${video.currentTime}`);
                conn.send(comm.slave.progress(video.currentTime, Date.now()));
              },
              import.meta.env.VITE_SAME_ORIGIN_SYNC_INTERVAL_SECONDS * 1e3,
            );
            break;
          case "play":
            video.play();
            break;
          case "pause":
            video.pause();
            break;
          case "seek":
            video.currentTime = commMsg.data.time;
            break;
          case "latency":
            this.playbackDelta = parseFloat(commMsg.data.lat);
            break;
          case "timestamp": {
            const timestamp = parseFloat(commMsg.data.atu);
            const latency = (Date.now() - timestamp) / 1000;
            this.playbackDelta = latency;
            conn.send(comm.slave.latency(latency));
            break;
          }
          default:
            msg.w(`Invalid message: ${data}`);
            break;
        }
      });

      // 错误处理和重试
      conn.on("error", (err) => {
        msg.e(`Failed to establish connection with ${shared.app.roomID}: ${err.message}`);
        this.connectionAttempts++;
        // 延迟重试
        setTimeout(() => this.connectToPeer(), 1000);
      });

      // 连接关闭处理
      conn.on("close", () => {
        msg.w("Connection closed");
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
      const comm = new Comm();

      // 处理连接请求
      shared.peers.local.data.on("connection", (conn) => {
        conn.on("open", function () {
          msg.i(`Received connection from ${conn.peer}`);
          shared.peers.remote.data = conn;
        });

        // 数据接收处理
        conn.on("data", function (data) {
          const commMsg = comm.resolve(data.toString());
          const status = commMsg.command;
          const peerID = commMsg.data ? commMsg.data.gid : undefined;
          switch (status) {
            case "connected": {
              msg.i(`Connection established with ${conn.peer}`);
              that.isReady = true;
              if (shared.app.method == 0) {
                const videoPlayer = document.querySelector("#video-player-stream");
                let stream;
                try {
                  stream = videoPlayer.captureStream();
                } catch (e) {
                  stream = videoPlayer.mozCaptureStream();
                  msg.w(`Error: ${e} Attempting mozCaptureStream()...`);
                }
                // eslint-disable-next-line no-unused-vars
                const call = shared.peers.local.video.call(`${peerID}-video`, stream);
                shared.app.pingThread = setInterval(
                  () => {
                    conn.send(comm.master.timestamp());
                  },
                  import.meta.env.VITE_SAME_ORIGIN_SYNC_INTERVAL_SECONDS * 1e3,
                );
              } else {
                const video = document.getElementById("video-player-stream");
                conn.send(comm.master.origin(shared.app.videoURL));
                video.addEventListener("play", () => {
                  conn.send(comm.master.play());
                });
                video.addEventListener("pause", () => {
                  conn.send(comm.master.pause());
                });
                video.addEventListener("seeking", () => {
                  conn.send(comm.master.seek(video.currentTime));
                });
              }
              break;
            }
            case "progress": {
              const video = document.getElementById("video-player-stream");
              const time = parseFloat(commMsg.data.cur);
              const atu = parseFloat(commMsg.data.atu);
              const offset = (Date.now() - atu) / 1e3;
              const delta = video.currentTime - (time + offset);
              if (Math.abs(delta) > (import.meta.env.VITE_MAX_ACCEPTABLE_DELAY_SECONDS ?? 3)) {
                msg.w(`Attempting to force sync due to too much latency: ${delta}`);
                that.playbackDelta = delta;
                conn.send(comm.master.seek(video.currentTime + offset));
              } else {
                msg.i(`Received status report from the peer. Delta: ${delta}`);
                that.playbackDelta = delta;
              }
              conn.send(comm.master.latency(delta));
              break;
            }
            case "latency": {
              that.playbackDelta = commMsg.data.lat;
              break;
            }
            default: {
              msg.e(`Invalid message: ${data}`);
            }
          }
        });

        // 连接关闭处理
        conn.on("close", () => {
          msg.w("Connection closed");
          shared.peers.remote.data = null;
          this.isReady = false;
          const video = document.getElementById("video-player-stream");
          video.pause();
        });
      });

      ((el) => {
        if (shared.app.screenStream) {
          el.srcObject = shared.app.screenStream;
        } else el.src = shared.app.videoURL;
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
