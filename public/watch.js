let peerConnection;
const config = {
  iceServers: [{ urls: ["stun:bn-turn1.xirsys.com"] }, { username: "vNsk4j9DOUWCHjiFmo9Uy-HnfZacVlWf0o3CPAf7O-cAxBXi_YjDlJ_O38L6IOONAAAAAGFRisxpbXpheW45Mw==", credential: "ed13ae76-1f72-11ec-8f16-0242ac140004", urls: ["turn:bn-turn1.xirsys.com:80?transport=udp", "turn:bn-turn1.xirsys.com:3478?transport=udp", "turn:bn-turn1.xirsys.com:80?transport=tcp", "turn:bn-turn1.xirsys.com:3478?transport=tcp", "turns:bn-turn1.xirsys.com:443?transport=tcp", "turns:bn-turn1.xirsys.com:5349?transport=tcp"] }]
};

console.log(liveUserName)
console.log(liveUserId)
const socket = io.connect("https://3.108.60.176.nip.io");
const video = document.querySelector("video");
const enableAudioButton = document.querySelector("#enable-audio");

enableAudioButton.addEventListener("click", enableAudio)

socket.on("offer", (id, description) => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
  peerConnection.ontrack = event => {
    video.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});


socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.emit('viewer', liveUserName, liveUserId)

// socket.on("connect", (da) => {
//   console.log(da)
//   socket.emit("watcher", liveUserId);
// });

socket.on(liveUserName, (id) => {
  console.log("hello" + id)
  socket.emit("watcher", id);
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
  peerConnection.close();
};

function enableAudio() {
  console.log("Enabling audio")
  video.muted = false;
}