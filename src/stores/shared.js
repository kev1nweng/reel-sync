import { defineStore } from "pinia";

export const useSharedStore = defineStore("shared", {
  state: () => ({
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
      i18n: null,
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
  }),
  actions: {
    setI18n(i18n) {
      this.app.i18n = i18n;
    },
    resetSharedState() {
      // 1. Stop all streams
      const streams = [
        this.app.screenStream,
        this.app.audioStream,
        this.peers.local.video,
        this.peers.local.audio,
      ];
      streams.forEach((stream) => {
        if (stream instanceof MediaStream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      });

      // 2. Clear threads
      if (this.app.syncThread) clearInterval(this.app.syncThread);
      if (this.app.pingThread) clearInterval(this.app.pingThread);

      // 3. Close peer connections
      const peers = [
        this.peers.local.data,
        this.peers.local.video,
        this.peers.local.audio,
        this.peers.remote.data,
        this.peers.remote.video,
        this.peers.remote.audio,
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
      this.app.mode = 0;
      this.app.method = 0;
      this.app.isConnectionRestricted = false;
      this.app.roomID = "";
      this.app.guestID = "";
      if (this.app.videoURL && this.app.videoURL.startsWith("blob:")) {
        URL.revokeObjectURL(this.app.videoURL);
      }
      this.app.videoURL = "";
      this.app.screenStream = null;
      this.app.syncThread = null;
      this.app.pingThread = null;
      this.app.isVoiceEnabled = false;
      this.app.audioStream = null;

      this.peers.local.data = null;
      this.peers.local.video = null;
      this.peers.local.audio = null;
      this.peers.remote.data = null;
      this.peers.remote.video = null;
      this.peers.remote.audio = null;
    },
  },
});
