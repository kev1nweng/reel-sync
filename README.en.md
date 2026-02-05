# reel-sync

**English / [简体中文](README.md)**

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

随时随地与他人同步观看视频或共享屏幕 | Watch videos in sync or share your screen with others anytime, anywhere.

![ReelSync Screenshot](docs/screenshot.en.png)

As mentioned in the introduction, this is a real-time video streaming tool **based on modern Web technologies (e.g. WebRTC)**.

- With TURN/STUN servers configured, it allows users to **share local videos (or online video streams) with any other user on the Internet**, without worrying about cross-platform, cross-device, or cross-network issues.
- Due to its working principle, users do not need to register or log in, and video stream data will not be stored on the server because it is a **peer-to-peer** application.
- In the future, more features will be added, such as **screen sharing, real-time chat**, etc.

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kev1nweng/reel-sync&env=VITE_NODE_SERVER_URL&env=VITE_MAX_ACCEPTABLE_DELAY_SECONDS&project-name=reel-sync&repository-name=reel-sync)⠀←⠀Click this button to deploy on Vercel (recommended), **or:**

```bash
git clone https://github.com/kev1nweng/reel-sync && cd reel-sync && npm run build && npm run preview
```

## Environment Variables

> [!Warning]
> In same-origin mode, video playback synchronization has high network requirements; high network latency may cause frequent forced synchronization.
> If a stable network environment cannot be guaranteed, please increase the maximum acceptable latency (at least 1 second).

- `VITE_NODE_SERVER_URL` - Your `iceServer` server list address (Refer to Cloudflare Call for API documentation)
- `VITE_MAX_ACCEPTABLE_DELAY_SECONDS` - Maximum acceptable delay time (in seconds)
- `VITE_LATENCY_MEASUREMENT_INTERVAL_SECONDS` - RTT latency measurement interval (in seconds)
- `VITE_SAME_ORIGIN_SYNC_INTERVAL_SECONDS` - Sync interval time for video progress in same-origin mode (in seconds)

## Roadmap

- [ ] Browser Compatibility
  - [x] Mozilla Firefox
    - [x] Issue with receiving but not sending due to lack of `captureStream()` support
    - [x] Homepage style issue (`padding` not displaying correctly)
  - [ ] ~~Safari (and all browsers using Apple Webkit)~~
    - [ ] ~~Issue with receiving but not sending due to lack of `captureStream()` support~~

- [x] Peer-to-peer mode
  - [x] WebRTC real-time video streaming
  - [x] Screen sharing
  - [ ] Webcam streaming

- [x] Same-origin mode
  - [x] WebRTC playback progress and behavior communication
  - [x] End-to-end playback progress synchronization
  - [x] Delay measurement
  - [x] Playback progress synchronization considering network delay
  - [ ] ~~Client node video operation requests~~

- [ ] Real-time chat
  - [ ] WebRTC text message transmission
  - [ ] WebRTC voice message transmission

- [ ] User settings
  - [ ] Custom settings UI
  - [x] `localStorage API` configuration storage

- [ ] Cross-platform applications
  - [ ] Native WebView Android application
  - [ ] ~~Capacitor iOS application~~

- [x] i18n multilingual support
  - [x] StartView UI (CN/EN)
  - [x] StreamView UI (CN/EN)
  - [x] ~~msg (CN/EN)~~
  - [x] Manual switch

- [ ] Other features  
  - [x] Direct share link
  - [x] Background image customization
  - [x] Advanced synchronization based on RTT (Round-Trip Time)

## License

The source code of this project is released under the **GPL-3.0 License**.

> The GNU General Public License version 3 (GPL-3.0), released by the Free Software Foundation (FSF) in 2007, is a copyleft license designed to safeguard users' freedoms to run, study, share, and modify software.
> It mandates that derivative works incorporating GPL 3.0-licensed code must adopt the same license, ensuring source code availability and preventing proprietary restrictions.
> The license also addresses technical neutrality in digital rights management (DRM) and enhances compatibility with other open-source licenses.

For more information, please refer to the [LICENSE](LICENSE) file.

## Start Developing In One Line

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) are recommended.

```bash
git clone https://github.com/kev1nweng/reel-sync && cd reel-sync && npm i
```

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=kev1nweng/reel-sync&type=date&legend=top-left)](https://www.star-history.com/#kev1nweng/reel-sync&type=date&legend=top-left)
