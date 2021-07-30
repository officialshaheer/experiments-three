const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static(__dirname + '/dist/experiments-three'));
app.get('/*', function(req,res) {
  res.sendFile(path.join(__dirname+
    '/dist/experiments-three/index.html'));});

const tracks = [];

io.on('connection', function (socket) {
    console.log('A user connected');

    socket.on('sendOrientationData',(data) => {
      console.log(data);
      io.emit('sendOrientationDataToAll', data);
    })

    socket.on('disconnect', () => {
		io.emit('disconnectionstatus','User disconnected!');
	});

});

server.listen(process.env.PORT || 3000, () => {
    console.log("Server listening on port 3000")
});