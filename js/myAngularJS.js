var app = angular.module("myApp", []);

app.filter('renderHTMLCorrectly', function ($sce) {
    return function (stringToParse) {
        return $sce.trustAsHtml(stringToParse);
    }
});

app.controller("myCtrl", function ($scope, $timeout, $window) {
    var socket = io.connect('http://localhost:8888');
    socket.on('connect', function () {
        $scope.nickName=$window.prompt("What's your name?", "visitor");
        socket.emit('adduser', $scope.nickName);
    });

    socket.on('room', function (room) {
        $timeout(function () {
            $scope.room=room;
        },100);
    });

    socket.on('updatechat', function (username, data) {
        var conversation = angular.element('#conversation');
        if (username == "joinRoom" || username == "System") {
            conversation.append('<div class="sysMsg msg"><b>System:</b> ' + data + '</div>');
        } else if (username == "nickName") {
            conversation.append('<div class="sysMsg msg"><b>System:</b> ' + data + '</div>');
        } else {
            conversation.append('<div class="userMsg msg"><b>' + username + ':</b> ' + data + '</div>');
        }
        conversation.scrollTop(conversation.prop("scrollHeight"));

    });

    socket.on('updaterooms', function (rooms, currentRoom) {
        var roomsArray = angular.element('#rooms');
        roomsArray.empty();
        var i = 0;
        for (i = 0; i < rooms.length; i++) {
            if (rooms[i] == currentRoom) {
                roomsArray.append('<div class="roomID">' + currentRoom + '</div>');
            } else {
                roomsArray.append('<div><a href="#" class="roomID">' + rooms[i] + '</a></div>');
            }
        }
        var roomNodes = angular.element(".roomID");
        var roomValue = [];
        for (i = 0; i < roomNodes.length; i++) {
            (function (i) {
                roomNodes[i].addEventListener("click", function () {
                    socket.emit('switchRoom', rooms[i]);
                });
            })(i);
        }
    });

    $scope.sendMessage = function () {
        var messageIn = $scope.messageInput;
        $scope.messageInput = "";
        socket.emit('sendchat', messageIn);
    };
});