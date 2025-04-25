# reel-sync

**English / [简体中文](README.md)**

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

随时随地和另一个人同时观看一个视频 | Watch videos with someone in sync, anytime, anywhere.

## Roadmap

***School is quite busy, progress may be slow. Feel free to fork and contribute.***

- [ ] Browser Compatibility
  - [x] Mozilla Firefox
    - [x] Issue with receiving but not sending due to lack of `captureStream()` support *(Consider `mozCaptureStream()`)*
    - [x] Homepage style issue (`padding` not displaying correctly)
  - [ ] Safari (and all browsers using Apple Webkit)
    - [ ] Issue with receiving but not sending due to lack of `captureStream()` support *(Hard to fix... `MediaRecorder`?)*

- [x] Peer-to-peer mode
  - [x] WebRTC real-time video streaming
  - [ ] Screen sharing ←
  - [ ] Webcam streaming

- [ ] Same-origin mode
  - [x] WebRTC playback progress and behavior communication
  - [x] End-to-end playback progress synchronization
  - [x] Delay measurement
  - [x] Playback progress synchronization considering network delay
  - [ ] Slave node video operation requests

- [ ] Real-time chat
  - [ ] WebRTC text message transmission
  - [ ] WebRTC voice message transmission

- [ ] User settings
  - [ ] Custom settings UI
  - [ ] `localStorage API` configuration storage

- [ ] Cross-platform applications
  - [ ] Capacitor Android application
  - [ ] Capacitor iOS application

- [ ] i18n multilingual support ←
  - [x] StartView UI (CN/EN)
  - [x] StreamView UI (CN/EN)
  - [ ] ~~msg (CN/EN)~~
  - [x] Manual switch

- [ ] Other features
  - [ ] Direct share link
  - [ ] Background image customization

## License

This program is released under the **GPL-3.0 License**. For more information, please refer to the [LICENSE](LICENSE) file.

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kev1nweng/reel-sync&env=VITE_NODE_SERVER_URL&env=VITE_MAX_ACCEPTABLE_DELAY_SECONDS&project-name=reel-sync&repository-name=reel-sync)⠀←⠀Click this button to deploy on Vercel (recommended)

## Deployment Environment Variables

- `VITE_NODE_SERVER_URL` - Your `iceServer` server list address (Refer to Cloudflare Call for API documentation)
- `VITE_MAX_ACCEPTABLE_DELAY_SECONDS` - Maximum acceptable delay time (seconds)
- `VITE_SAME_ORIGIN_SYNC_INTERVAL_SECONDS` - Sync interval time for video progress in same-origin mode (seconds)

## Recommended Development Environment

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Development Environment Setup

```bash
git clone https://github.com/kev1nweng/reel-sync && cd reel-sync && npm i
```
