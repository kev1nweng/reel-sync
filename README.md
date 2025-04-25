# ReelSync

**简体中文 / [English](README.en.md)**

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

随时随地和另一个人同时观看一个视频 | Watch videos with someone in sync, anytime, anywhere.

## 路线图

***上学比较忙，进度可能推进缓慢。欢迎 Fork 并贡献。***

- [ ] 浏览器适配
  - [x] Mozilla Firefox
    - [x] 因不支持 `captureStream()` 可接收不可发送的问题 *（考虑 `mozCaptureStream()`）*
    - [x] 主页样式错误问题（`padding` 未被正确显示）
  - [ ] Safari (以及所有利用 Apple Webkit 的浏览器)
    - [ ] 因不支持 `captureStream()` 可接收不可发送的问题 *（难以修复...`MediaRecorder`？）*

- [x] 点对点模式
  - [x] WebRTC 实时视频流传输
  - [ ] 屏幕共享（桌面视频流传输）←
  - [ ] 用户摄像头视频流传输

- [ ] 同源模式
  - [x] WebRTC 播放进度和行为通讯
  - [x] 端到端播放进度同步
  - [x] 延迟测量
  - [x] 考虑网络延迟的播放进度同步
  - [ ] 从节点视频操作请求

- [ ] 实时聊天
  - [ ] WebRTC 文字消息传输
  - [ ] WebRTC 语音消息传输

- [ ] 用户设置
  - [ ] 自定义设置 UI
  - [ ] `localStorage API` 配置存储

- [ ] 跨平台应用
  - [ ] 原生 WebView 安卓应用
  - [ ] ~~Capacitor iOS 应用~~

- [ ] i18n 多语言支持 ←
  - [x] StartView UI (CN/EN)
  - [x] StreamView UI (CN/EN)
  - [ ] ~~msg (CN/EN)~~
  - [x] 手动切换

- [ ] 其他功能
  - [ ] 分享直链
  - [ ] 自定义背景图

## 许可证

该程序在 **GPL-3.0 许可证** 下发布。有关更多信息，请参阅 [LICENSE](LICENSE) 文件。

## 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kev1nweng/reel-sync&env=VITE_NODE_SERVER_URL&env=VITE_MAX_ACCEPTABLE_DELAY_SECONDS&project-name=reel-sync&repository-name=reel-sync)⠀←⠀点击这个按钮部署到 Vercel（推荐）

## 部署环境变量

- `VITE_NODE_SERVER_URL` - 你的 `iceServer` 服务器列表地址（API 格式参考 Cloudflare Call）
- `VITE_MAX_ACCEPTABLE_DELAY_SECONDS` - 最大可接受延迟时间（秒）
- `VITE_SAME_ORIGIN_SYNC_INTERVAL_SECONDS` - 同源模式下视频进度同步间隔时间（秒）

## 推荐的开发环境

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (禁用 Vetur).

## 开发环境设置

```bash
git clone https://github.com/kev1nweng/reel-sync && cd reel-sync && npm i
```
