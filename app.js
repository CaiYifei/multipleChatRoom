var express = require('express')
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var path = require('path');
app.use(express.static(path.join(__dirname)));
server.listen(8888);


// routing
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat


// rooms which are currently available in chat
var rooms = ['room1', 'room2', 'room3'];

io.sockets.on('connection', function (socket) {

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function (username) {
        // store the username in the socket session for this client
        socket.username = username;
        // store the room name in the socket session for this client
        socket.room = 'room1';
        socket.emit('room', 'room1');

        // send client to room 1
        socket.join('room1');
        // echo to client they've connected
        socket.emit('updatechat', 'System', 'you have connected to room1');
        // echo to room 1 that a person has connected to their room
        socket.broadcast.to('room1').emit('updatechat', 'System', username + ' has connected to this room');
        socket.emit('updaterooms', rooms, 'room1');
    });

    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
        var msg = data.trim();
        var ind1 = msg.indexOf(" ");

        if (msg.substring(0, ind1) === "/join") {

            var newroom = msg.substring(ind1 + 1);
            rooms.push(newroom);

            socket.emit('room', newroom);
            socket.leave(socket.room);
            socket.join(newroom);
            socket.emit('updatechat', 'System', 'you have connected to ' + newroom);
            // sent message to OLD room
            socket.broadcast.to(socket.room).emit('updatechat', 'System', socket.username + ' has left this room');
            // update socket session room title
            socket.room = newroom;
            socket.broadcast.to(newroom).emit('updatechat', 'System', socket.username + ' has joined this room');
            socket.broadcast.emit('updaterooms', rooms, newroom);
            socket.emit('updaterooms', rooms, newroom);

        } else {
            // we tell the client to execute 'updatechat' with 2 parameters
            io.sockets.in(socket.room).emit('updatechat', socket.username, data);
        }
    });

    socket.on('switchRoom', function (newroom) {
        socket.emit('room', newroom);
        socket.leave(socket.room);
        socket.join(newroom);
        socket.emit('updatechat', 'System', 'you have connected to ' + newroom);
        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('updatechat', 'System', socket.username + ' has left this room');
        // update socket session room title
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'System', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, newroom);
    });


    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        // echo globally that this client has left
        socket.broadcast.emit('updatechat', 'System', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });
});
