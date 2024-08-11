const socket = io();

const roomSelection = document.getElementById('roomSelection');
const roomInput = document.getElementById('room');
const joinRoomButton = document.getElementById('joinRoom');
const videos = document.getElementById('videos');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;
let room;

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

// Join a room
joinRoomButton.addEventListener('click', () => {
  room = roomInput.value;
  if (room === '') {
    alert('Please enter a room name');
    return;
  }
  socket.emit('join', room);
  roomSelection.style.display = 'none';
  videos.style.display = 'flex';

  // Get user media
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localVideo.srcObject = stream;
      localStream = stream;
      if (room) {
        startCall();
      }
    })
    .catch(error => console.error('Error accessing media devices.', error));
});

socket.on('offer', (offer) => {
  peerConnection = new RTCPeerConnection(iceServers);
  peerConnection.addStream(localStream);

  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  peerConnection.createAnswer()
    .then(answer => {
      peerConnection.setLocalDescription(answer);
      socket.emit('answer', { answer, room });
    });

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', { candidate: event.candidate, room });
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
      socket.emit('offer', { offer, room });
    });

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', { candidate: event.candidate, room });
    }
  };
}
