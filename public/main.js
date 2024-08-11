const socket = io();

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

// Get user media (webcam and microphone)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    localStream = stream;
  })
  .catch(error => console.error('Error accessing media devices.', error));

socket.on('offer', (offer) => {
  peerConnection = new RTCPeerConnection(iceServers);
  peerConnection.addStream(localStream);

  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  peerConnection.createAnswer()
    .then(answer => {
      peerConnection.setLocalDescription(answer);
      socket.emit('answer', answer);
    });

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', event.candidate);
    }
  };
});

socket.on('answer', (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

function startCall() {
  peerConnection = new RTCPeerConnection(iceServers);
  peerConnection.addStream(localStream);

  peerConnection.createOffer()
    .then(offer => {
      peerConnection.setLocalDescription(offer);
      socket.emit('offer', offer);
    });

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', event.candidate);
    }
  };
}

// Start the call when both peers are ready
localVideo.addEventListener('canplay', startCall);
