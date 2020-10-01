const videoNode1 = document.getElementById("video1");
const videoNode2 = document.getElementById("video2");
const videoNode3 = document.getElementById("video3");
const videoNode4 = document.getElementById("video4");

let ms = null;
let ms1 = null;
let ms2 = null;
let noise = null;

const pc1 = new RTCPeerConnection();
const pc2 = new RTCPeerConnection();

pc1.ontrack = (e) => {
  videoNode1.srcObject = e.streams[0];
};

pc2.ontrack = (e) => {
  videoNode2.srcObject = e.streams[0];
};

pc1.onnegotiationneeded = async () => {
  console.log("1 onnegotiationneeded");
};

pc2.onnegotiationneeded = async () => {
  console.log("2 onnegotiationneeded");
};

pc1.onsignalingstatechange = () => console.log("1", pc1.signalingState);
pc2.onsignalingstatechange = () => console.log("2", pc2.signalingState);

pc1.onicecandidate = (e) => {
  console.log("1candidate");
  if (e.candidate) pc2.addIceCandidate(e.candidate);
};

pc2.onicecandidate = (e) => {
  console.log("2candidate");
  if (e.candidate) pc1.addIceCandidate(e.candidate);
};

const removeTracks = (pc) => pc.getSenders().forEach((s) => pc.removeTrack(s));

function whiteNoise() {
  const canvas = Object.assign(document.createElement("canvas"), {
    width: 160,
    height: 120,
  });
  const ctx = canvas.getContext("2d");
  ctx.fillRect(0, 0, 160, 120);
  const p = ctx.getImageData(0, 0, 160, 120);
  requestAnimationFrame(function draw() {
    for (var i = 0; i < p.data.length; i++) {
      p.data[i++] = p.data[i++] = p.data[i++] = Math.random() * 255;
    }
    ctx.putImageData(p, 0, 0);
    requestAnimationFrame(draw);
  });
  return canvas.captureStream();
}

const main = async () => {
  ms = await navigator.mediaDevices.getUserMedia({ video: true });
  noise = await whiteNoise();
  console.log(noise, noise.getTracks().length);

  ms1 = ms.clone();
  ms2 = ms.clone();

  videoNode3.srcObject = ms1;
  videoNode4.srcObject = ms2;

  // add tracks
  ms1.getTracks().forEach((t) => pc1.addTrack(t, ms1));
  const offer = await pc1.createOffer();
  pc1.setLocalDescription(offer);
  // emit offer

  // on video offer
  const remoteDescription2 = new RTCSessionDescription(pc1.localDescription);
  await pc2.setRemoteDescription(remoteDescription2);
  ms2.getTracks().forEach((t) => pc2.addTrack(t, ms2));
  const answer = await pc2.createAnswer();
  await pc2.setLocalDescription(answer);
  // emit video answer

  // on video answer
  const remoteDescription1 = new RTCSessionDescription(pc2.localDescription);
  await pc1.setRemoteDescription(remoteDescription1);

  setTimeout(() => {
    pc1.getSenders().forEach((s, i) => {
      s.replaceTrack(noise.getTracks()[i]);
    });
  }, 2000);
};

main();
