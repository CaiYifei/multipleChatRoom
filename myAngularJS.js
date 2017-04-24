var app = angular.module("myApp", []);

app.filter('renderHTMLCorrectly', function ($sce) {
    return function (stringToParse) {
        return $sce.trustAsHtml(stringToParse);
    }
});

app.controller("myCtrl", function ($scope, $timeout, $window) {
    $scope.messageLog = "";
    $scope.rooms = "";
    $scope.usersInSameRoom=[];
    var socket = io.connect('http://localhost:8888');

    // on connection to server, ask for user's name with an anonymous callback
    socket.on('connect', function () {
        // call the server-side function 'adduser' and send one parameter (value of prompt)
        $scope.nickName=$window.prompt("What's your name?", "visitor");
        socket.emit('adduser', $scope.nickName);
    });

    socket.on('room', function (room) {
        $timeout(function () {
            $scope.room=room;
        },100);
    });

    // listener, whenever the server emits 'updatechat', this updates the chat body
    socket.on('updatechat', function (username, data) {
//            $timeout(function () {
//                $scope.messageLog+='<b>'+username + ':</b> ' + data + '<br>';
//            }, 100);
        if(username == "System"){
            $('#conversation').append('<div class="sysMsg msg"><b>' + username + ':</b> ' + data + '</div>');
        }else{
            $('#conversation').append('<div class="userMsg msg"><b>' + username + ':</b> ' + data + '</div>');
        }

    });

    // listener, whenever the server emits 'updaterooms', this updates the room the client is in
    socket.on('updaterooms', function (rooms, currentRoom) {
        //$scope.rooms = "";
        $('#rooms').empty();
        var i = 0;
        for (i = 0; i < rooms.length; i++) {
            if (rooms[i] == currentRoom) {
                //$scope.rooms+='<div class="roomID">' + currentRoom + '</div>';
                $('#rooms').append('<div class="roomID">' + currentRoom + '</div>');
            } else {
                //$scope.rooms+='<div><a href="#" class="roomID">' + rooms[i] + '</a></div>';
                $('#rooms').append('<div><a href="#" class="roomID">' + rooms[i] + '</a></div>');
            }
        }
        var roomNodes = $(".roomID");
        var roomValue = [];
        for (i = 0; i < roomNodes.length; i++) {
            (function (i) {
                roomNodes[i].addEventListener("click", function () {
                    socket.emit('switchRoom', rooms[i]);
                });
            })(i);
        }
    });


    // on load of page
    $scope.sendMessage = function () {
        var messageIn = $scope.messageInput;
        $scope.messageInput = "";
        socket.emit('sendchat', messageIn);
    };
});