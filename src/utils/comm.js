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
    ping(t1) {
      return `ping|t1=${t1}`;
    },
    pong(t1, t2) {
      return `pong|t1=${t1}&t2=${t2}`;
    },
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
    pong(t1, t2) {
      return `pong|t1=${t1}&t2=${t2}`;
    },
    ping(t1) {
      return `ping|t1=${t1}`;
    },
  };
}
