import CryptoJS from "crypto-js";

export class PeerID {
  constructor() {
    const seq = this.generate();
    this.id.raw = seq;
    this.id.data = `${seq}-data`;
    this.id.video = `${seq}-video`;
  }
  id = {
    raw: "",
    data: "",
    video: "",
  };
  generate() {
    return `${CryptoJS.HmacSHA1(Math.random().toString(), "tungtungtungtungsahur")}`.substring(
      0,
      16,
    );
  }
}
