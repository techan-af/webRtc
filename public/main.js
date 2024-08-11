const socket = io();

const roomSelection = document.getElementById('roomSelection');
const roomInput = document.getElementById('room');
const joinRoomButton = document.getElementById('joinRoom');
const videos = document.getElementById('videos');
const localVideo = document.getElementById('localVideo');

let localStream;
let peerConnections = {};  // Store peer connections by socket ID
let room;

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

joinRoomButton.addEventListener('click', () => {
  room = roomInput.value;
  if (room === '') {
    alert('Please enter a room name');
    return;
  }
  socket.emit('join', room);
  roomSelection.style.display = 'none';
  videos.style.display = 'flex';

  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localVideo.srcObject = stream;
      localStream = stream;
      socket.emit('ready', room);
    })
    .catch(error => console.error('Error accessing media devices.', error));
});

socket.on('ready', (socketId) => {
  if (!peerConnections[socketId]) {
    const peerConnection = new RTCPeerConnection(iceServers);
    peerConnections[socketId] = peerConnection;

    peerConnection.addStream(localStream);

    peerConnection.ontrack = (event) => {
      let remoteVideo = document.getElementById(socketId);
      if (!remoteVideo) {
        remoteVideo = document.createElement('video');
        remoteVideo.id = socketId;
        remoteVideo.autoplay = true;
        remoteVideo.style.border = '2px solid #007BFF';
        remoteVideo.style.borderRadius = '10px';
        remoteVideo.style.marginBottom = '10px';
        remoteVideo.style.width = '60%';
        remoteVideo.style.maxWidth = '400px';
        videos.appendChild(remoteVideo);
      }
      remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', { candidate: event.candidate, room, socketId });
      }
    };

    peerConnection.createOffer()
      .then(offer => {
        peerConnection.setLocalDescription(offer);
        socket.emit('offer', { offer, room, socketId });
      });
  }
});

socket.on('offer', (data) => {
  const peerConnection = new RTCPeerConnection(iceServers);
  peerConnections[data.socketId] = peerConnection;

  peerConnection.addStream(localStream);

  peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

  peerConnection.createAnswer()
    .then(answer => {
      peerConnection.setLocalDescription(answer);
      socket.emit('answer', { answer, room, socketId: data.socketId });
    });

  peerConnection.ontrack = (event) => {
    let remoteVideo = document.getElementById(data.socketId);
    if (!remoteVideo) {
      remoteVideo = document.createElement('video');
      remoteVideo.id = data.socketId;
      remoteVideo.autoplay = true;
      remoteVideo.style.border = '2px solid #007BFF';
      remoteVideo.style.borderRadius = '10px';
      remoteVideo.style.marginBottom = '10px';
      remoteVideo.style.width = '60%';
      remoteVideo.style.maxWidth = '400px';
      videos.appendChild(remoteVideo);
    }
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', { candidate: event.candidate, room, socketId: data.socketId });
    }
  };
});

socket.on('answer', (data) => {
  const peerConnection = peerConnections[data.socketId];
  peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on('candidate', (data) => {
  const peerConnection = peerConnections[data.socketId];
  if (peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});
