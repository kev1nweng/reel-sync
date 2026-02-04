<template>
  <input ref="input" type="file" accept="video/*" style="display: none" @change="onChange" />
</template>

<script>
export default {
  name: "VideoInput",
  emits: ["change"],
  methods: {
    click() {
      this.$refs.input?.click();
    },
    onChange(event) {
      this.$emit("change", event);
    },
  },
  computed: {
    value: {
      get() {
        return this.$refs.input?.value ?? "";
      },
      set(nextValue) {
        if (this.$refs.input) this.$refs.input.value = nextValue ?? "";
      },
    },
  },
};
</script>
