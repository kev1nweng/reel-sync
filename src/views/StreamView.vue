<script setup>
import { shared } from "@/main";
import { msg } from "@/utils/msg";
import { Comm } from "@/utils/comm";

import LoadingRing from "@/components/LoadingRing.vue";
import VideoPlayer from "@/components/VideoPlayer.vue";
</script>

<template>
  <div class="stream-container">
    <div class="header-section">
      <div class="title-group">
        <h1 style="font-weight: bold;">{{ $t("StreamView.title") }}</h1>
        <div id="status">
          <span class="status-dot" :style="{ color: isReady ? '#4caf50' : '#f44336' }">⬤</span>
          {{ isReady ? $t("StreamView.messages.connected") : $t("StreamView.messages.disconnected") }}
        </div>
      </div>

      <!-- Voice Toggle -->
      <div v-if="isReady" class="voice-controls">
        <mdui-switch
          id="voice-switch"
          @change="toggleVoice"
          :checked="isVoiceEnabled"
          checked-icon="mic--rounded"
          unchecked-icon="mic_off--rounded"
        ></mdui-switch>
        <label>{{ $t("StreamView.labels.voiceToggle") }}</label>
      </div>
    </div>

    <mdui-card variant="outlined" class="video-card">
      <reelsync-video-player
        id="video-player-stream"
        v-show="isReady"
      ></reelsync-video-player>

      <div v-if="!isReady" class="loading-overlay">
        <reelsync-loading-ring id="loading"></reelsync-loading-ring>
        <h3>{{ loadingDescription }}</h3>
        <p v-if="isConnectionRestricted" class="error-text">
          {{ $t("StreamView.messages.connectionRestricted") }}
        </p>
        <p class="hint-text">{{ hint }}</p>
      </div>
    </mdui-card>

    <div class="info-section">
      <div class="info-group">
        <span class="label">{{ $t("StreamView.messages.roomID", { roleDescription, roomID: "" }) }}</span>
        <span class="value monospace">{{ roomID }}</span>
      </div>

      <div v-if="!isClient" class="info-group">
        <span class="label">{{ $t("StreamView.messages.shareLink") }}</span>
        <span class="value monospace">{{ locationOrigin }}/?join={{ roomID }}</span>
      </div>

      <div v-if="isReady" class="info-group">
        <span class="label">{{ $t("StreamView.messages.networkInfo") }}</span>
        <span class="value">
          {{
            !isClient
              ? $t("StreamView.messages.pushing", {
                  m: method == 1 ? $t("StreamView.messages.sameOriginLiteral") : $t("StreamView.messages.p2pLiteral"),
                })
              : $t("StreamView.messages.watching")
          }}<span v-if="playbackDelta !== null || rtt !== null" class="latency">
            ({{ method == 1 ? $t("StreamView.messages.delta") : $t("StreamView.messages.latency") }}:
            {{
              method == 1
                ? playbackDelta !== null
                  ? Math.round(playbackDelta * 1e3) + "ms"
                  : $t("StreamView.messages.measuringLiteral")
                : rtt !== null
                  ? Math.round(rtt * 1e3) + "ms"
                  : $t("StreamView.messages.measuringLiteral")
            }})
          </span>
        </span>
      </div>
    </div>
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
      playbackDelta: null, // 同源模式下为同步偏差，点对点下为null
      rtt: null, // 点对点模式下为RTT，单位秒
      locationOrigin: location.origin,
      audioCallListenerRegistered: false, // 防止重复注册音频来电监听器
      remoteVoiceEnabled: false, // 追踪对方是否启用了语音
      reconnectTimer: null,
      get method() {
        return shared.app.method;
      },
      get roleDescription() {
        return this.isClient
          ? shared.app.i18n.t("StreamView.roleDescription.client")
          : shared.app.i18n.t("StreamView.roleDescription.host");
      },
      get hint() {
        return this.isClient
          ? shared.app.i18n.t("StreamView.hint.client")
          : shared.app.i18n.t("StreamView.hint.host");
      },
      get loadingDescription() {
        return shared.app.mode == 1
          ? shared.app.i18n.t("StreamView.messages.joining")
          : shared.app.i18n.t("StreamView.messages.waiting");
      },
      get roomID() {
        return this.isClient && shared.app.guestID ? shared.app.guestID : shared.app.roomID;
      },
      get isClient() {
        return shared.app.mode == 1;
      },
      get isConnectionRestricted() {
        return shared.app.isConnectionRestricted;
      },
      get isVoiceEnabled() {
        return shared.app.isVoiceEnabled;
      },
    };
  },
  methods: {
    async toggleVoice() {
      shared.app.isVoiceEnabled = document.getElementById("voice-switch").checked;
      const comm = new Comm();

      if (shared.app.isVoiceEnabled) {
        try {
          // Check for getUserMedia support with fallback for older browsers
          const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices)
            || ((constraints) => new Promise((resolve, reject) => {
              const legacyGetUserMedia = navigator.getUserMedia
                || navigator.webkitGetUserMedia
                || navigator.mozGetUserMedia
                || navigator.msGetUserMedia;
              if (!legacyGetUserMedia) {
                reject(new Error("getUserMedia is not supported in this browser"));
                return;
              }
              legacyGetUserMedia.call(navigator, constraints, resolve, reject);
            }));

          // Request microphone access with compatibility options
          shared.app.audioStream = await getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });

          msg.i("Microphone access granted, starting voice call");

          // Setup audio call listener before notifying peer
          this.setupAudioCallListener();

          // Notify the remote peer about voice enablement
          if (shared.peers.remote.data) {
            if (this.isClient) {
              shared.peers.remote.data.send(comm.client.voiceEnabled());
            } else {
              shared.peers.remote.data.send(comm.host.voiceEnabled());
            }
          }

          // Start audio call if remote peer has also enabled voice
          if (this.remoteVoiceEnabled) {
            this.startAudioCall();
          }
        } catch (error) {
          msg.e("Failed to access microphone:", error);
          shared.app.isVoiceEnabled = false;
          document.getElementById("voice-switch").checked = false;
        }
      } else {
        // Disable voice call
        this.stopAudioCall();

        // Notify the remote peer about voice disablement
        if (shared.peers.remote.data) {
          if (this.isClient) {
            shared.peers.remote.data.send(comm.client.voiceDisabled());
          } else {
            shared.peers.remote.data.send(comm.host.voiceDisabled());
          }
        }

        msg.i("Voice call disabled");
      }
    },

    setupAudioCallListener() {
      // Prevent duplicate registration
      if (this.audioCallListenerRegistered || !shared.peers.local.audio) return;
      this.audioCallListenerRegistered = true;

      shared.peers.local.audio.on("call", (call) => {
        msg.i("Incoming audio call");

        // Answer with local audio stream if available, otherwise answer without stream
        if (shared.app.audioStream) {
          call.answer(shared.app.audioStream);
        } else {
          // If no local stream, just answer to receive remote audio
          call.answer();
        }

        call.on("stream", (remoteAudioStream) => {
          msg.i("Received remote audio stream from incoming call");
          this.playRemoteAudio(remoteAudioStream);
        });

        call.on("error", (err) => {
          msg.e("Audio call error:", err);
        });

        call.on("close", () => {
          msg.i("Audio call closed");
        });

        shared.peers.remote.audio = call;
      });
    },

    playRemoteAudio(remoteAudioStream) {
      // Create or reuse audio element to play remote audio
      let audioElement = document.getElementById("remote-audio");
      if (!audioElement) {
        audioElement = document.createElement("audio");
        audioElement.id = "remote-audio";
        audioElement.autoplay = true;
        audioElement.playsInline = true; // iOS compatibility
        document.body.appendChild(audioElement);
      }

      // For some browsers, we need to handle autoplay restrictions
      audioElement.srcObject = remoteAudioStream;
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          msg.w("Audio autoplay was prevented:", error);
          // Audio will play when user interacts with the page
        });
      }
    },

    startAudioCall() {
      if (!shared.app.audioStream || !shared.peers.remote.data) {
        msg.w("Cannot start audio call: missing audio stream or data connection");
        return;
      }

      if (!shared.peers.local.audio) {
        msg.e("Audio peer not initialized");
        return;
      }

      const peerID = this.isClient ? shared.app.roomID : shared.app.guestID;

      if (!peerID) {
        msg.e("Cannot start audio call: peer ID not available");
        return;
      }

      // Close existing audio call if any
      if (shared.peers.remote.audio) {
        shared.peers.remote.audio.close();
      }

      try {
        // Make an audio call to the remote peer
        const audioCall = shared.peers.local.audio.call(`${peerID}-audio`, shared.app.audioStream);

        if (!audioCall) {
          msg.e("Failed to initiate audio call");
          return;
        }

        audioCall.on("stream", (remoteAudioStream) => {
          msg.i("Received remote audio stream from outgoing call");
          this.playRemoteAudio(remoteAudioStream);
        });

        audioCall.on("error", (err) => {
          msg.e("Audio call error:", err);
        });

        audioCall.on("close", () => {
          msg.i("Outgoing audio call closed");
        });

        shared.peers.remote.audio = audioCall;
        msg.i(`Audio call initiated to ${peerID}-audio`);
      } catch (error) {
        msg.e("Failed to start audio call:", error);
      }
    },

    stopAudioCall() {
      // Stop local audio stream
      if (shared.app.audioStream) {
        shared.app.audioStream.getTracks().forEach((track) => track.stop());
        shared.app.audioStream = null;
      }

      // Close remote audio call
      if (shared.peers.remote.audio) {
        shared.peers.remote.audio.close();
        shared.peers.remote.audio = null;
      }

      // Remove remote audio element
      const audioElement = document.getElementById("remote-audio");
      if (audioElement) {
        audioElement.remove();
      }
    },
    connectToPeer() {
      const remotePeerId = `${shared.app.roomID}-data`;
      const dataPeer = shared.peers.local.data;

      if (!dataPeer) {
        msg.w("Connection aborted: dataPeer is null (possibly returning to home)");
        return;
      }

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
        conn.send(comm.client.greet(shared.app.guestID));
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

        // Setup audio call listener (will be used when voice is enabled)
        this.setupAudioCallListener();
        this.isReady = true;
        shared.peers.remote.data = conn;
        // 启动RTT定时测量（点对点模式）
        if (shared.app.method == 0) {
          if (this.rttTimer) clearInterval(this.rttTimer);
          const rttInterval =
            (import.meta.env.VITE_LATENCY_MEASUREMENT_INTERVAL_SECONDS
              ? parseFloat(import.meta.env.VITE_LATENCY_MEASUREMENT_INTERVAL_SECONDS)
              : 2) * 1e3;
          this.rttTimer = setInterval(() => {
            conn.send(comm.client.rttPing(Date.now()));
            this._rttPingSent = Date.now();
          }, rttInterval);
        }
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
                conn.send(comm.client.progress(video.currentTime, Date.now()));
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
            conn.send(comm.client.latency(latency));
            break;
          }
          case "rtt-ping":
            // 对方发起RTT measurement，立即回复pong
            conn.send(comm.client.rttPong(commMsg.data.ts));
            break;
          case "rtt-pong":
            // 收到pong，计算RTT
            if (commMsg.data.ts && commMsg.data.ts2) {
              const sent = parseInt(commMsg.data.ts);
              const now = Date.now();
              // RTT = (now - sent) - (ts2 - sent)
              this.rtt = (now - sent) / 1000;
            }
            break;
          case "voice-enabled":
            msg.i("Remote peer enabled voice call");
            this.remoteVoiceEnabled = true;
            // Setup listener to receive incoming audio calls
            this.setupAudioCallListener();
            // If we also have voice enabled, initiate the call
            if (shared.app.isVoiceEnabled && shared.app.audioStream) {
              this.startAudioCall();
            }
            break;
          case "voice-disabled":
            msg.i("Remote peer disabled voice call");
            this.remoteVoiceEnabled = false;
            break;
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
        if (this.connectionAttempts < this.maxAttempts) {
          this.reconnectTimer = setTimeout(() => this.connectToPeer(), 1000);
        } else {
          msg.e("Max connection attempts reached. Please check the room ID and your connection.");
        }
      });

      // 连接关闭处理
      conn.on("close", () => {
        msg.w("Connection closed");
        shared.peers.remote.data = null;
        this.isReady = false;
        this.remoteVoiceEnabled = false;
        const video = document.getElementById("video-player-stream");
        video.pause();
        if (this.rttTimer) clearInterval(this.rttTimer);
        this.rtt = null;
        // Clean up voice call on disconnect
        this.stopAudioCall();
      });
    },
  },
  unmounted() {
    if (this.rttTimer) clearInterval(this.rttTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    // Consider adding resetSharedState() here as well if we want auto-cleanup
  },
  mounted() {
    // 初始化检查
    if (this.roomID === "" || !this.roomID) {
      this.$router.replace("/");
      return;
    }

    const that = this;

    if (this.isClient) {
      // 接收者端逻辑
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
          // 启动RTT定时测量（点对点模式）
          if (shared.app.method == 0) {
            if (that.rttTimer) clearInterval(that.rttTimer);
            const rttInterval =
              (import.meta.env.VITE_LATENCY_MEASUREMENT_INTERVAL_SECONDS
                ? parseFloat(import.meta.env.VITE_LATENCY_MEASUREMENT_INTERVAL_SECONDS)
                : 2) * 1e3;
            that.rttTimer = setInterval(() => {
              conn.send(comm.host.rttPing(Date.now()));
              that._rttPingSent = Date.now();
            }, rttInterval);
          }
          // Setup audio call listener (will be used when voice is enabled)
          that.setupAudioCallListener();
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
              const video = document.getElementById("video-player-stream");

              if (shared.app.method == 0) {
                // P2P 模式：捕获视频流并发送
                let videoEnded = false;

                const captureAndCall = () => {
                  let stream;
                  try {
                    stream = video.captureStream();
                  } catch (e) {
                    stream = video.mozCaptureStream();
                    msg.w(`Error: ${e} Attempting mozCaptureStream()...`);
                  }
                  const call = shared.peers.local.video.call(`${peerID}-video`, stream);
                  shared.peers.remote.videoCall = call;
                  msg.i("Video stream call initiated");
                };

                // 初始捕获并发送流
                captureAndCall();

                // 监听视频结束事件
                video.addEventListener("ended", () => {
                  videoEnded = true;
                  msg.i("Host video ended, stream tracks may have ended");
                });

                // 当视频从结束状态恢复播放时，重新捕获流
                video.addEventListener("playing", () => {
                  if (videoEnded) {
                    msg.i("Host video resumed from ended state, re-capturing stream");
                    videoEnded = false;
                    // 关闭旧的 call
                    if (shared.peers.remote.videoCall) {
                      shared.peers.remote.videoCall.close();
                    }
                    // 重新捕获并发起新的 call
                    captureAndCall();
                  }
                });

                shared.app.pingThread = setInterval(
                  () => {
                    conn.send(comm.host.timestamp());
                  },
                  import.meta.env.VITE_SAME_ORIGIN_SYNC_INTERVAL_SECONDS * 1e3,
                );
              } else {
                // 同源模式：发送视频 URL 并同步播放控制
                conn.send(comm.host.origin(shared.app.videoURL));
                video.addEventListener("play", () => {
                  conn.send(comm.host.play());
                });
                video.addEventListener("pause", () => {
                  conn.send(comm.host.pause());
                });
                video.addEventListener("seeking", () => {
                  conn.send(comm.host.seek(video.currentTime));
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
                conn.send(comm.host.seek(video.currentTime + offset));
              } else {
                msg.i(`Received status report from the peer. Delta: ${delta}`);
                that.playbackDelta = delta;
              }
              conn.send(comm.host.latency(delta));
              break;
            }
            case "latency": {
              that.playbackDelta = commMsg.data.lat;
              break;
            }
            case "rtt-ping":
              // 对方发起RTT测量，立即回复pong
              conn.send(comm.host.rttPong(commMsg.data.ts));
              break;
            case "rtt-pong":
              // 收到pong，计算RTT
              if (commMsg.data.ts && commMsg.data.ts2) {
                const sent = parseInt(commMsg.data.ts);
                const now = Date.now();
                // RTT = (now - sent) - (ts2 - sent)
                that.rtt = (now - sent) / 1000;
              }
              break;
            case "voice-enabled":
              msg.i("Remote peer enabled voice call");
              that.remoteVoiceEnabled = true;
              // Setup listener to receive incoming audio calls
              that.setupAudioCallListener();
              // If we also have voice enabled, initiate the call
              if (shared.app.isVoiceEnabled && shared.app.audioStream) {
                that.startAudioCall();
              }
              break;
            case "voice-disabled":
              msg.i("Remote peer disabled voice call");
              that.remoteVoiceEnabled = false;
              break;
            default: {
              msg.e(`Invalid message: ${data}`);
            }
          }
        });

        // 连接关闭处理
        conn.on("close", () => {
          msg.w("Connection closed");
          shared.peers.remote.data = null;
          that.isReady = false;
          that.remoteVoiceEnabled = false;
          const video = document.getElementById("video-player-stream");
          video.pause();
          if (that.rttTimer) clearInterval(that.rttTimer);
          that.rtt = null;
          // Clean up voice call on disconnect
          that.stopAudioCall();
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
    if (this.rttTimer) clearInterval(this.rttTimer);

    // Clean up voice call resources
    this.stopAudioCall();

    // Reset audio call listener state
    this.audioCallListenerRegistered = false;
    this.remoteVoiceEnabled = false;
  },
  components: {
    "reelsync-loading-ring": LoadingRing,
    "reelsync-video-player": VideoPlayer,
  },
};
</script>

<style scoped>
.stream-container {
  display: flex;
  flex-direction: column;
  padding: 2rem 2rem 80px 2rem; /* 增加底部内边距 */
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  gap: 2rem;
  flex: 1;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-group h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 500;
}

#status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: rgb(var(--mdui-color-on-surface-variant));
  margin-top: 0.25rem;
}

.status-dot {
  font-size: 0.5rem;
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.voice-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgb(var(--mdui-color-surface-container-low));
  border-radius: 12px;
}

.video-card {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

#video-player-stream {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  gap: 1rem;
}

.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  background: rgb(var(--mdui-color-surface-container-low));
  border: 1px solid rgb(var(--mdui-color-outline-variant));
  border-radius: 16px;
}

.label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(var(--mdui-color-on-surface-variant));
  font-weight: 600;
}

.value {
  font-size: 1rem;
  color: rgb(var(--mdui-color-on-surface));
  word-break: break-all;
}

.latency {
  display: block;
  color: rgb(var(--mdui-color-on-surface-variant));
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.error-text {
  color: rgb(var(--mdui-color-error));
  margin: 0;
}

.hint-text {
  color: rgb(var(--mdui-color-on-surface-variant));
  font-size: 0.9rem;
  margin: 0;
}

@media (max-width: 600px) {
  .stream-container {
    padding: 0;
    gap: 0;
  }

  .header-section {
    padding: 1.5rem 1rem;
  }

  .video-card {
    border-radius: 0;
    border: none;
  }

  .info-section {
    padding: 1rem;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .info-group {
    border-radius: 12px;
  }
}
</style>
