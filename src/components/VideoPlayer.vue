
<template>
  <video ref="videoRef" controls></video>
</template>


<script>
export default {
  name: "VideoPlayer",
  props: {
    mediaStream: {
      type: [Object, null],
      default: null,
    },
  },
  mounted() {
    this.setStream(this.mediaStream);
  },
  watch: {
    mediaStream(newStream) {
      this.setStream(newStream);
    },
  },
  methods: {
    setStream(stream) {
      const video = this.$refs.videoRef;
      if (video) {
        if (stream) {
          video.srcObject = stream;
          video.play();
        } else {
          video.srcObject = null;
        }
      }
    },
  },
};
</script>
