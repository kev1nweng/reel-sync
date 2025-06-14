export class Comm {
  resolve(msg) {
    return {
      command: msg.split("|")[0],
      data: msg.split("|")[1]
        ? msg
            .split("|")[1]
            .split("&")
            .reduce((acc, curr) => {
              const [key, value] = curr.split("=");
              acc[key] = value;
              return acc;
            }, {})
        : null,
    };
  }
  master = {
    timestamp() {
      return `timestamp|atu=${Date.now()}`;
    },
    origin(oriURL) {
      return `origin|ori=${oriURL}`;
    },
    play() {
      return "play";
    },
    pause() {
      return "pause";
    },
    seek(time) {
      return `seek|time=${time}`;
    },
    latency(latency) {
      return `latency|lat=${latency}`;
    },
    rtts(timestamp) {
      return `rtts|ts=${timestamp}`; // RTT Sync Request
    },
    rttc(timestamp, receivedAt) {
      return `rttc|ts=${timestamp}&ra=${receivedAt}`; // RTT Sync Complete
    }
  };
  slave = {
    greet(guestID) {
      return `connected|gid=${guestID}`;
    },
    progress(currentTime, timeStamp) {
      return `progress|cur=${currentTime}&atu=${timeStamp}`; // atu: AbsoluteTimeUnix
    },
    latency(latency) {
      return `latency|lat=${latency}`;
    },
    rttm(timestamp, receivedAt) {
      return `rttm|ts=${timestamp}&ra=${receivedAt}`; // RTT Sync Middle
    }
  };
}
