/**
 * Video quality presets and utilities for WebRTC streaming optimization.
 *
 * Controls: resolution constraints, frame rate, max bitrate, and codec preference.
 * Used by both local file capture (captureStream) and screen sharing (getDisplayMedia).
 */

/**
 * Quality preset definitions.
 * - `video`: constraints applied to getDisplayMedia / track.applyConstraints
 * - `maxBitrate`: target max bitrate in bps for RTCRtpSender.setParameters
 * - `sdpBandwidthKbps`: fallback b=AS value injected into SDP (kbps)
 */
export const QualityPresets = Object.freeze({
  low: {
    label: "low",
    video: {
      width: { ideal: 854 },
      height: { ideal: 480 },
      frameRate: { ideal: 24, max: 30 },
    },
    maxBitrate: 800_000, // 800 kbps
    sdpBandwidthKbps: 900,
  },
  medium: {
    label: "medium",
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
    },
    maxBitrate: 2_500_000, // 2.5 Mbps
    sdpBandwidthKbps: 2800,
  },
  high: {
    label: "high",
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30, max: 60 },
    },
    maxBitrate: 6_000_000, // 6 Mbps
    sdpBandwidthKbps: 6500,
  },
  ultra: {
    label: "ultra",
    video: {
      width: { ideal: 2560 },
      height: { ideal: 1440 },
      frameRate: { ideal: 60, max: 60 },
    },
    maxBitrate: 12_000_000, // 12 Mbps
    sdpBandwidthKbps: 13000,
  },
  unlimited: {
    label: "unlimited",
    video: {},
    maxBitrate: 0, // 0 = no limit
    sdpBandwidthKbps: 0,
  },
});

export const DEFAULT_QUALITY = "unlimited";

/**
 * Build getDisplayMedia constraints with quality preset applied.
 */
export function buildDisplayMediaConstraints(preset) {
  const q = QualityPresets[preset] ?? QualityPresets[DEFAULT_QUALITY];
  return {
    video: {
      ...q.video,
      cursor: "always",
    },
    audio: true,
  };
}

/**
 * Create an sdpTransform function for PeerJS peer.call() that injects
 * a bandwidth limit (b=AS:…) into the SDP m=video section.
 *
 * Skipped when sdpBandwidthKbps is 0 (unlimited).
 */
export function createSdpTransform(preset) {
  const q = QualityPresets[preset] ?? QualityPresets[DEFAULT_QUALITY];
  if (!q.sdpBandwidthKbps) return undefined; // no transform needed

  return (sdp) => {
    // Remove any existing b=AS line in video section
    const lines = sdp.split("\r\n");
    const result = [];
    let inVideo = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("m=video")) {
        inVideo = true;
        result.push(line);
        continue;
      }
      if (line.startsWith("m=") && !line.startsWith("m=video")) {
        inVideo = false;
      }

      // Skip existing bandwidth lines in video section
      if (inVideo && line.startsWith("b=AS:")) {
        continue;
      }

      result.push(line);

      // Insert b=AS after c= line in video section
      if (inVideo && line.startsWith("c=")) {
        result.push(`b=AS:${q.sdpBandwidthKbps}`);
      }
    }

    return result.join("\r\n");
  };
}

/**
 * Apply bitrate limits to an active RTCPeerConnection's video sender
 * via RTCRtpSender.setParameters().
 *
 * Call this after the media connection stream event fires.
 *
 * @param {RTCPeerConnection} pc - The underlying RTCPeerConnection
 * @param {string} preset - Quality preset key
 * @returns {Promise<boolean>} - true if parameters were applied
 */
export async function applyBitrateLimit(pc, preset) {
  const q = QualityPresets[preset] ?? QualityPresets[DEFAULT_QUALITY];
  if (!q.maxBitrate || !pc) return false;

  const senders = pc.getSenders();
  const videoSender = senders.find((s) => s.track?.kind === "video");
  if (!videoSender) return false;

  try {
    const params = videoSender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }
    params.encodings[0].maxBitrate = q.maxBitrate;

    // Also set preferred framerate if defined
    if (q.video.frameRate?.ideal) {
      params.encodings[0].maxFramerate = q.video.frameRate.ideal;
    }

    await videoSender.setParameters(params);
    return true;
  } catch (e) {
    console.warn("[video-quality] Failed to apply bitrate limit:", e);
    return false;
  }
}

/**
 * Apply resolution / frameRate constraints to an existing video track.
 * Useful for streams obtained via captureStream() which don't take
 * initial constraints.
 *
 * @param {MediaStreamTrack} videoTrack
 * @param {string} preset
 * @returns {Promise<boolean>}
 */
export async function applyTrackConstraints(videoTrack, preset) {
  const q = QualityPresets[preset] ?? QualityPresets[DEFAULT_QUALITY];
  if (!videoTrack || videoTrack.kind !== "video") return false;
  if (!q.video || Object.keys(q.video).length === 0) return false;

  try {
    await videoTrack.applyConstraints(q.video);
    return true;
  } catch (e) {
    console.warn("[video-quality] Failed to apply track constraints:", e);
    return false;
  }
}
