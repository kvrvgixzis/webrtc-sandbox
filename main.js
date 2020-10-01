const videoNodes = document.querySelectorAll(".video");
const setNoiseBtns = document.querySelectorAll(".set-noise");
const setMsBtns = document.querySelectorAll(".set-ms");
const getMsBtns = document.querySelectorAll(".get-ms");
const logNode = document.querySelector('.console');

const pc1 = new RTCPeerConnection();
const pc2 = new RTCPeerConnection();

const isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

let msclones = null;

const log = (...str) => logNode.innerHTML += `<div> >>> ${str.join(' ')}</div>`;

log(`isSafari: ${isSafari}`);
log(`iOS: ${iOS}`);

pc1.ontrack = (e) => {
  videoNodes[0].srcObject = e.streams[0];
};

pc2.ontrack = (e) => {
  videoNodes[1].srcObject = e.streams[0];
};

pc1.onnegotiationneeded = async () => {
  log("1 onnegotiationneeded");
};

pc2.onnegotiationneeded = async () => {
  log("2 onnegotiationneeded");
};

pc1.onsignalingstatechange = () => {
  log("1", pc1.signalingState);
};

pc2.onsignalingstatechange = () => {
  log("2", pc2.signalingState);
};

pc1.onicecandidate = (e) => {
  log("1 onicecandidate");
  e.candidate && pc2.addIceCandidate(e.candidate);
};

pc2.onicecandidate = (e) => {
  log("2 onicecandidate");
  e.candidate && pc1.addIceCandidate(e.candidate);
};

const removeTracks = (pc) => {
  pc.getSenders().forEach((s) => pc.removeTrack(s));
};

const addTracks = (pc, stream) => {
  stream.getTracks().forEach((t) => pc.addTrack(t, stream));
};

const replaceTracks = (pc, stream) => {
  pc.getSenders().forEach((s, i) => s.replaceTrack(stream.getTracks()[i]));
};

const whiteNoise = () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const p = ctx.getImageData(0, 0, canvas.width, canvas.height);
  requestAnimationFrame(() => draw(p, ctx));

  return canvas.captureStream();
};

const draw = (p, ctx) => {
  for (var i = 0; i < p.data.length; i++)
    p.data[i++] = p.data[i++] = p.data[i++] = Math.random() * 255;

  ctx.putImageData(p, 0, 0);
  requestAnimationFrame(() => draw(p, ctx));
};

setNoiseBtns[0].addEventListener("click", () =>
  replaceTracks(pc1, whiteNoise())
);
setNoiseBtns[1].addEventListener("click", () =>
  replaceTracks(pc2, whiteNoise())
);

setMsBtns[0].addEventListener("click", () => replaceTracks(pc1, msclones[0]));
setMsBtns[1].addEventListener("click", () => replaceTracks(pc2, msclones[1]));

getMsBtns[0].addEventListener("click", async () => {
  msclones[0] = await navigator.mediaDevices.getUserMedia({ video: true });
  // crash on ios safari
});

getMsBtns[1].addEventListener("click", async () => {
  msclones[1] = await navigator.mediaDevices.getUserMedia({ video: true });
  // crash on ios safari
});

const main = async () => {
  const ms = await navigator.mediaDevices.getUserMedia({ video: true });
  msclones = [ms.clone(), ms.clone()];

  videoNodes[2].srcObject = msclones[0];
  videoNodes[3].srcObject = msclones[1];

  addTracks(pc1, msclones[0]);
  const offer = await pc1.createOffer();
  await pc1.setLocalDescription(offer);
  // >>> emit offer
  // [signaling]
  // <<< handle offer
  await pc2.setRemoteDescription(pc1.localDescription);
  addTracks(pc2, msclones[1]);
  const answer = await pc2.createAnswer();
  await pc2.setLocalDescription(answer);
  // >>> emit answer
  // [signaling]
  // <<< handle answer
  await pc1.setRemoteDescription(pc2.localDescription);
};

main();
