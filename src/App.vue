<script setup>
import { RouterView } from "vue-router";
import { confirm as mduiConfirm } from "mdui/functions/confirm";
import { prompt as mduiPrompt } from "mdui/functions/prompt";
</script>

<template>
  <div class="topbar">
    <mdui-chip
      icon="language--rounded"
      class="topbar-lbtn"
      elevated
      @click="showLanguageSwitchConfirmation"
      >{{ $t("App.languageSwitch.indicatorButton") }}</mdui-chip
    >
    <img src="./assets/logo.png" alt="ReelSync Logo" id="logo" />
    <mdui-chip
      end-icon="settings--rounded"
      class="topbar-rbtn"
      elevated
      @click="showSettingsDialog"
      >{{ $t("App.settingsButton") }}</mdui-chip
    >
    <div id="title">ReelSync</div>
  </div>
  <RouterView />
  <footer>
    <b style="font-weight: bold">{{ $t("App.versionLiteral") }} {{ REELSYNC_PACKAGE_VERSION }}</b>
    {{ $t("App.footer.techs") }}<br />
    {{ $t("App.footer.author") }}
  </footer>
</template>

<script>
export default {
  name: "App",
  methods: {
    showLanguageSwitchConfirmation() {
      mduiConfirm({
        headline: this.$t("App.languageSwitch.headline"),
        description: this.$t("App.languageSwitch.description"),
        confirmText: this.$t("App.languageSwitch.confirmText"),
        cancelText: this.$t("App.languageSwitch.cancelText"),
        onConfirm: () => {
          const targetLocale = this.$i18n.locale === "zh-CN" ? "en-US" : "zh-CN";
          this.$i18n.locale = targetLocale;
          localStorage.setItem("reelsync-locale", targetLocale);
        },
        onCancel: () => null,
      });
    },
    showSettingsDialog() {
      mduiPrompt({
        headline: this.$t("App.settingsDialog.title"),
        description: this.$t("App.settingsDialog.description"),
        confirmText: this.$t("App.settingsDialog.confirmText"),
        cancelText: this.$t("App.settingsDialog.cancelText"),
        closeOnEsc: true,
        onConfirm: (value) => {
          localStorage.setItem("reelsync-settings", value);
        },
        onCancel: () => null,
        textFieldOptions: {
          label: "JSON",
          value: localStorage.getItem("reelsync-settings") ?? "",
          type: "text",
          variant: "outlined",
          required: true,
          helper: this.$t("App.settingsDialog.helper"),
          clearable: true,
        },
      });
    },
  },
  data() {
    return {
      // eslint-disable-next-line no-undef
      REELSYNC_PACKAGE_VERSION: __APP_VERSION__,
    };
  },
};
</script>

<style scoped>
.topbar {
  font-size: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--topbar-height);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  mask-image: linear-gradient(180deg, white 85%, transparent 100%);
}

.topbar-lbtn {
  position: absolute;
  left: 0;
  top: 0;
  margin-left: calc(var(--topbar-height) / 2 - 16px);
  margin-top: calc(var(--topbar-height) / 2 - 16px);
}

.topbar-rbtn {
  position: absolute;
  right: 0;
  top: 0;
  margin-right: calc(var(--topbar-height) / 2 - 16px);
  margin-top: calc(var(--topbar-height) / 2 - 16px);
}

#title {
  font-weight: bold;
  /* text-shadow: 0 0 36px; */
}

footer {
  padding: 12px;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  color: #888;
  pointer-events: none;
}

.topbar > img {
  padding: 6px;
}

.topbar > div {
  padding: 6px;
}

#logo {
  width: auto;
  height: 70%;
}

@media (prefers-color-scheme: dark) {
  #logo {
    filter: invert(1) sepia(1) saturate(0) hue-rotate(180deg) brightness(0.8) contrast(0.85);
  }
}
</style>
