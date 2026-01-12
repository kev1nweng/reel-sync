<script setup>
import { RouterView } from "vue-router";
import { confirm as mduiConfirm } from "mdui/functions/confirm";
import { prompt as mduiPrompt } from "mdui/functions/prompt";
import { alert as mduiAlert } from "mdui/functions/alert";
import { shared } from "./main";
import { msg } from "./utils/msg";
</script>

<template>
  <div class="topbar">
    <div class="topbar-left">
      <img src="./assets/logo.png" alt="ReelSync Logo" id="logo" />
      <div id="title">ReelSync</div>
    </div>
    <div class="topbar-right">
      <mdui-chip
        end-icon="language--rounded"
        elevated
        @click="showLanguageSwitchConfirmation"
        >{{ $t("App.languageSwitch.indicatorButton") }}</mdui-chip
      >
      <mdui-chip
        end-icon="settings--rounded"
        elevated
        @click="showSettingsDialog"
        >{{ $t("App.settingsButton") }}</mdui-chip
      >
    </div>
  </div>
  <RouterView />
  <footer>
    <div class="footer-left">
      <div class="version-info">
        <b style="font-weight: bold">{{ $t("App.versionLiteral") }} {{ REELSYNC_PACKAGE_VERSION }}</b>
      </div>
      <div class="author-info">
        {{ $t("App.footer.author") }}
      </div>
      <div class="github-links">
        <mdui-chip
          href="https://github.com/kev1nweng"
          target="_blank"
          variant="filled"
          icon="person--rounded"
        >GitHub</mdui-chip>
        <mdui-chip
          href="https://github.com/kev1nweng/reel-sync"
          target="_blank"
          variant="filled"
          icon="code--rounded"
        >{{ $t("App.sourceCode") }}</mdui-chip>
      </div>
    </div>
    <div class="footer-right">
      <span>{{ $t("App.footer.techs") }}</span>
    </div>
  </footer>
</template>

<script>
export default {
  name: "App",
  mounted() {
    document.addEventListener("DOMContentLoaded", () => {
      // delay a bit so that shared is initialized
      this.updatePreferences(localStorage.getItem("reelsync-settings") ?? "{}");
      msg.i("User preferences loaded");
    });
  },
  methods: {
    updatePreferences(value) {
      try {
        shared.preferences = JSON.parse(value);
      } catch (e) {
        mduiAlert({
          headline: this.$t("App.settingsDialog.error.headline"),
          description: `${this.$t("App.settingsDialog.error.description")}${e.message}`,
        });
      }
    },
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
          this.updatePreferences(value);
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
  font-size: 1.2em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--topbar-height);
  padding: 0 1.5rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1000;
  border-bottom: 1px solid rgba(var(--mdui-color-outline), 0.1);
  background-color: rgba(var(--mdui-color-surface), 0.8);
  color: rgb(var(--mdui-color-on-surface));
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

#title {
  font-weight: bold;
}

footer {
  padding: 0.75rem 1.5rem; /* 减小上下内边距 */
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85em;
  color: rgb(var(--mdui-color-on-surface-variant));
  z-index: 100;
  background-color: rgba(var(--mdui-color-surface), 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(var(--mdui-color-outline), 0.1);
}

.footer-left {
  display: flex;
  align-items: center;
  column-gap: 1.5rem;
  row-gap: 0.5rem; /* 减小换行后的行间距 */
  flex-wrap: wrap;
  pointer-events: auto;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: right;
  pointer-events: none;
}

.author-info,
.version-info {
  white-space: nowrap;
}

.github-links {
  display: flex;
  gap: 8px;
}

.github-links mdui-chip {
  height: 28px;
  font-size: 0.85em;
}

/* 响应式布局：针对手机和窄屏设备 */
@media (max-width: 768px) {
  footer {
    position: relative; /* 窄屏下不再固定遮挡内容 */
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
    padding: 2rem 1.5rem;
    background-color: rgb(var(--mdui-color-surface));
  }

  .footer-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .footer-right {
    text-align: left;
    align-items: flex-start;
  }

  .github-links {
    margin-top: 0.25rem;
  }
}

#logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

@media (prefers-color-scheme: dark) {
  #logo {
    filter: invert(1) sepia(1) saturate(0) hue-rotate(180deg) brightness(0.8) contrast(0.85);
  }
}
</style>
