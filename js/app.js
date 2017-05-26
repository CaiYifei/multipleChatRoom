var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var path = require('path');
app.use(express.static(path.join(__dirname, "../")));
server.listen(8888);

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

var rooms = ['room1', 'room2', 'room3'];

io.sockets.on('connection', function (socket) {
    socket.on('adduser', function (username) {
        socket.username = username;
        socket.room = 'room1';
        socket.emit('room', 'room1');
        socket.join('room1');
        socket.emit('updatechat', 'System', 'you have connected to room1');
        socket.broadcast.to('room1').emit('updatechat', 'System', username + ' has connected to this room');
        socket.emit('updaterooms', rooms, 'room1');
    });

    socket.on('sendchat', function (data) {
        var msg = data.trim();
        var ind1 = msg.indexOf(" ");
        if (msg.substring(0, ind1) === "/join") {
            var newroom = msg.substring(ind1 + 1).trim();
            rooms.push(newroom);
            socket.emit('room', newroom);
            socket.leave(socket.room);
            socket.join(newroom);
            socket.emit('updatechat', 'joinRoom', 'you have connected to ' + newroom);
            socket.broadcast.to(socket.room).emit('updatechat', 'joinRoom', socket.username + ' has left this room');
            socket.room = newroom;
            socket.broadcast.to(newroom).emit('updatechat', 'joinRoom', socket.username + ' has joined this room');
            socket.broadcast.emit('updaterooms', rooms, newroom);
            socket.emit('updaterooms', rooms, newroom);

        } else if (msg.substring(0, ind1) === "/nick") {
            var newName = msg.substring(ind1 + 1).trim();
            var oldName = socket.username;
            socket.username = newName;

            socket.emit('updatechat', 'nickName', oldName + " has changed name into " + socket.username);
            socket.broadcast.to(socket.room).emit('updatechat', 'nickName', oldName + " has changed name into " + socket.username);
        } else {
            io.sockets.in(socket.room).emit('updatechat', socket.username, data);
        }
    });

    socket.on('switchRoom', function (newroom) {
        socket.emit('room', newroom);
        socket.leave(socket.room);
        socket.join(newroom);
        socket.emit('updatechat', 'System', 'you have connected to ' + newroom);
        socket.broadcast.to(socket.room).emit('updatechat', 'System', socket.username + ' has left this room');
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'System', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, newroom);
    });

    socket.on('disconnect', function () {
        socket.broadcast.emit('updatechat', 'System', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });
});
