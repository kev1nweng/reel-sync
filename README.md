# ReelSync

**简体中文 / [English](README.en.md)**

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

随时随地和另一个人同时观看一个视频 | Watch videos with someone in sync, anytime, anywhere.

![ReelSync 截图](docs/screenshot.png)

如简介所言，这是一个 **基于现代 Web 技术（如 WebRTC）的** 实时视频流共享工具。

- 在配置了 TURN / STUN 服务器的条件下，她允许用户 **向互联网上任意其他用户分享本地的视频（或在线视频流）**，而无需担心跨平台、跨设备、跨网络的问题。
- 出于她 **端到端** 的工作原理，用户不需要有任何形式的注册登录行为，视频流数据也不会被存储在服务器上。
- 在未来，更多特性将会被加入，如 **屏幕共享、实时聊天** 等。

## 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kev1nweng/reel-sync&env=VITE_NODE_SERVER_URL&env=VITE_MAX_ACCEPTABLE_DELAY_SECONDS&project-name=reel-sync&repository-name=reel-sync)⠀←⠀点击这个按钮部署到 Vercel（推荐），**或者：**

```bash
git clone https://github.com/kev1nweng/reel-sync && cd reel-sync && npm run build && npm run preview
```

## 环境变量

> [!Warning]
> 同源模式下，视频播放进度同步对网络的要求较高；较高的网络延迟可能导致频繁的强制同步。
> 若无法保证良好的网络环境，请将最大可接受延迟时间调高一些（至少 1 秒钟）。

- `VITE_NODE_SERVER_URL` - 你的 `iceServer` 服务器列表地址（API 格式参考 Cloudflare Call）
- `VITE_MAX_ACCEPTABLE_DELAY_SECONDS` - 最大可接受延迟时间（秒）
- `VITE_LATENCY_MEASUREMENT_INTERVAL_SECONDS` - RTT 延迟测量间隔时间（秒）
- `VITE_SAME_ORIGIN_SYNC_INTERVAL_SECONDS` - 同源模式下视频进度同步间隔时间（秒）

## 路线图

- [x] 浏览器适配
  - [x] Mozilla Firefox
    - [x] 因不支持 `captureStream()` 可接收不可发送的问题
    - [x] 主页样式错误问题（`padding` 未被正确显示）
  - [ ] ~~Safari (以及所有利用 Apple Webkit 的浏览器)~~
    - [ ] ~~因不支持 `captureStream()` 可接收不可发送的问题~~

- [x] 点对点模式
  - [x] WebRTC 实时视频流传输
  - [x] 屏幕共享（桌面视频流传输）
  - [ ] 用户摄像头视频流传输

- [x] 同源模式
  - [x] WebRTC 播放进度和行为通讯
  - [x] 端到端播放进度同步
  - [x] 延迟测量
  - [x] 考虑网络延迟的播放进度同步
  - [ ] ~~从节点视频操作请求~~

- [ ] 实时聊天
  - [ ] WebRTC 文字消息传输
  - [ ] WebRTC 语音消息传输

- [ ] 用户设置
  - [ ] 自定义设置 UI
  - [x] `localStorage API` 配置存储

- [ ] 跨平台应用
  - [ ] 原生 WebView 安卓应用
  - [ ] ~~Capacitor iOS 应用~~

- [x] i18n 多语言支持
  - [x] StartView UI (CN/EN)
  - [x] StreamView UI (CN/EN)
  - [x] ~~msg (CN/EN)~~
  - [x] 手动切换

- [ ] 其他功能
  - [x] 分享直链
  - [ ] 自定义背景图
  - [x] 基于 RTT（往返延迟）的增强同步

## 许可证

该项目在 **GPL-3.0 许可证** 下发布。

> GNU 通用公共许可证第三版（GPL-3.0）是由自由软件基金会（FSF）于2007年发布的自由软件许可证，旨在保障用户运行、研究、共享及修改软件的自由。
> 其核心条款基于 Copyleft 机制，要求任何使用或分发 GPL-3.0 授权代码的衍生作品必须采用相同许可证公开源码，以防止专有软件对自由软件的限制。
> 该协议还强化了对数字版权管理（DRM）的技术中立性约束，并提升了与其他开源许可证的兼容性。

有关更多信息，请参阅 [LICENSE](LICENSE) 文件。

## 一行命令开始开发

推荐使用 [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (禁用 Vetur).

```bash
git clone https://github.com/kev1nweng/reel-sync && cd reel-sync && npm i
```

## 星标历史记录

[![Star History Chart](https://api.star-history.com/svg?repos=kev1nweng/reel-sync&type=Date)](https://www.star-history.com/#kev1nweng/reel-sync&Date)
