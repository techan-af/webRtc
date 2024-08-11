const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on('ready', (room) => {
    socket.to(room).emit('ready', socket.id);
  });

  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', { offer: data.offer, socketId: socket.id });
  });

  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', { answer: data.answer, socketId: socket.id });
  });

  socket.on('candidate', (data) => {
    socket.to(data.room).emit('candidate', { candidate: data.candidate, socketId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
