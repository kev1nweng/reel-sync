<template>
  <div class="loading">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
</template>

<script>
export default {
  name: "LoadingRing", // this is not a ring tho
};
</script>

<style scoped>
.loading,
.loading > div {
  position: relative;
  box-sizing: border-box;
}

.loading {
  display: block;
  font-size: 0;
  color: currentColor;
}

.loading > div {
  display: inline-block;
  float: none;
  background-color: currentColor;
  border: 0 solid currentColor;
}

.loading {
  width: 36px;
  height: 36px;
}

.loading > div {
  width: 8px;
  height: 8px;
  margin: 2px;
  border-radius: 100%;
  animation-name: ball-grid-pulse;
  animation-iteration-count: infinite;
}

.loading > div:nth-child(1) {
  animation-duration: 0.65s;
  animation-delay: 0.03s;
}

.loading > div:nth-child(2) {
  animation-duration: 1.02s;
  animation-delay: 0.09s;
}

.loading > div:nth-child(3) {
  animation-duration: 1.06s;
  animation-delay: -0.69s;
}

.loading > div:nth-child(4) {
  animation-duration: 1.5s;
  animation-delay: -0.41s;
}

.loading > div:nth-child(5) {
  animation-duration: 1.6s;
  animation-delay: 0.04s;
}

.loading > div:nth-child(6) {
  animation-duration: 0.84s;
  animation-delay: 0.07s;
}

.loading > div:nth-child(7) {
  animation-duration: 0.68s;
  animation-delay: -0.66s;
}

.loading > div:nth-child(8) {
  animation-duration: 0.93s;
  animation-delay: -0.76s;
}

.loading > div:nth-child(9) {
  animation-duration: 1.24s;
  animation-delay: -0.76s;
}

.loading.la-sm {
  width: 18px;
  height: 18px;
}

.loading.la-sm > div {
  width: 4px;
  height: 4px;
  margin: 1px;
}

.loading.la-2x {
  width: 72px;
  height: 72px;
}

.loading.la-2x > div {
  width: 16px;
  height: 16px;
  margin: 4px;
}

.loading.la-3x {
  width: 108px;
  height: 108px;
}

.loading.la-3x > div {
  width: 24px;
  height: 24px;
  margin: 6px;
}

@keyframes ball-grid-pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.35;
    transform: scale(0.45);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
