const videoNodes = document.querySelectorAll('.video');

let ms = null;
let ms1 = null;
let ms2 = null;
let noise = null;

const pc1 = new RTCPeerConnection();
const pc2 = new RTCPeerConnection();

pc1.ontrack = (e) => {
  videoNodes[0].srcObject = e.streams[0];
};

pc2.ontrack = (e) => {
  videoNodes[1].srcObject = e.streams[0];
};

pc1.onnegotiationneeded = async () => {
  console.log("1 onnegotiationneeded");
};

pc2.onnegotiationneeded = async () => {
  console.log("2 onnegotiationneeded");
};

pc1.onsignalingstatechange = () => {
  console.log("1", pc1.signalingState);
};

pc2.onsignalingstatechange = () => {
  console.log("2", pc2.signalingState);
};

pc1.onicecandidate = (e) => {
  console.log("1 onicecandidate");
  if (e.candidate) pc2.addIceCandidate(e.candidate);
};

pc2.onicecandidate = (e) => {
  console.log("2 onicecandidate");
  if (e.candidate) pc1.addIceCandidate(e.candidate);
};

const removeTracks = (pc) => pc.getSenders().forEach((s) => pc.removeTrack(s));

const whiteNoise = () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const p = ctx.getImageData(0, 0, canvas.width, canvas.height);
  requestAnimationFrame(() => draw(p, ctx));
  
  return canvas.captureStream();
}

const draw = (p, ctx) => {
  for (var i = 0; i < p.data.length; i++) {
    p.data[i++] = p.data[i++] = p.data[i++] = Math.random() * 255;
  }
  ctx.putImageData(p, 0, 0);
  requestAnimationFrame(() => draw(p, ctx));
}

const main = async () => {
  ms = await navigator.mediaDevices.getUserMedia({ video: true });
  noise = await whiteNoise();
  console.log(noise, noise.getTracks().length);

  ms1 = ms.clone();
  ms2 = ms.clone();

  videoNodes[2].srcObject = ms1;
  videoNodes[3].srcObject = ms2;

  // add tracks
  ms1.getTracks().forEach((t) => pc1.addTrack(t, ms1));
  const offer = await pc1.createOffer();
  console.log(offer)
  await pc1.setLocalDescription(offer);
  // emit offer

  // on video offer
  console.log(pc1.localDescription)
  await pc2.setRemoteDescription(pc1.localDescription);
  ms2.getTracks().forEach((t) => pc2.addTrack(t, ms2));
  const answer = await pc2.createAnswer();
  await pc2.setLocalDescription(answer);
  // emit video answer

  // on video answer
  await pc1.setRemoteDescription(pc2.localDescription);

  setTimeout(() => {
    pc1.getSenders().forEach((s, i) => {
      s.replaceTrack(noise.getTracks()[i]);
    });
  }, 2000);
};

main();
