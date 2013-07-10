// load modules and globals
var express = require('express'),
    http = require('http'),
    sio = require('socket.io'),
    dict = require('dict');

var Client = require("./lib/client.js"),
    Game = require("./lib/game.js");

var app = express(),
    server = http.createServer(app),
    clients = dict(),
    port = process.env.PORT || 5000,
    game = null;

// start listening
var io = sio.listen(server);
server.listen(port);

// define paths to static files
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/app', express.static(__dirname + '/public/app'));
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/lib', express.static(__dirname + '/public/lib'));

// define path to main client application
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/app/views/shell.html');
});

// set the log level of socket.io 
// (level 2 means we won't see heartbeats)
io.set('log level', 2);

// io.configure(function(){
//     io.set("transports", ["xhr-polling"]);
//     io.set("polling duration", 10);
// });

// set the transports order
io.set('transports', ['websocket', 'xhr-polling']);

// socket.io events - each connection goes through here
// and each event is emitted from the client
io.sockets.on('connection', function (socket) {

    socket.on('connect', function (data) {
        connect(socket, data);
    });

    socket.on('new-message', function (data) {
        message(socket, data);
    });

    socket.on('subscribe', function (data) {
        subscribe(socket, data);
    });

    socket.on('unsubscribe', function (data) {
        unsubscribe(socket, data);
    });

    socket.on('disconnect', function () {
        disconnect(socket);
    });

    socket.on('set-observer', function (data) {
        setObserver(socket, data);
    });

    socket.on('new-game', function () {
        newGame(socket);
    });

    socket.on('submit-vote', function (data) {
        submitVote(socket, data);
    });

    socket.on('cancel-game', function() {
        cancelGame(socket);
    });

});

// create a client for the socket
function connect(socket, data) {
    // create a new client/user
    var client = new Client(generateId(), socket.id);
    client.nickname = data.nickname;

    // save the client info to the dictionary object for quick access
    clients.set(socket.id, client);

    console.log('Client connected: \'%s\'', client.nickname);
    console.log('  Client Id: \t%s', client.id);
    console.log('  Socket Id: \t%s', socket.id);

    // let the player know that its ready
    socket.emit('set-ready', {
        clientId: client.id
    });

    subscribe(socket, {
        room: 'lobby'
    });
}

// when a client disconnects, unsubscribe to all rooms
function disconnect(socket) {
    // get a list of rooms for the client
    var rooms = io.sockets.manager.roomClients[socket.id];

    // unsubscribe
    for (var room in rooms) {
        if (room && rooms[room]) {
            unsubscribe(socket, {
                room: room.replace('/', '')
            });
        }
    }
    delete clients.delete(socket.id);
}

// receive chat message from a client and send it to the relevant room
function message(socket, data) {
    var client = clients.get(socket.id);

    // socket.broadcast sends to all other clients except the sender
    io.sockets.emit(client.room).emit('new-message', {
        client: client,
        message: data.message,
        room: client.room
    });
}

// subscribe a client to a room
function subscribe(socket, data) {
    var rooms = getRooms();
    var client = clients.get(socket.id);

    // check if room exists
    if (rooms.indexOf('/' + data.room) < 0) {
        socket.broadcast.emit('addroom', {
            room: data.room
        });
    }
    client.room = data.room;

    // subscribe client to the room
    socket.join(data.room);

    // update all other clients about the online presense
    updatePresence(data.room, socket, 'online');

    // send to the client, a list of all subscribed clients in this room
    socket.emit('list-clients', {
        room: data.room,
        clients: getClientsInRoom(socket.id, data.room)
    });
}

function unsubscribe(socket, data) {
    // update all clients about offline presence
    updatePresence(data.room, socket, 'offline');

    // remove the client from the room
    socket.leave(data.room);

    // if last client, then remove the room
    if (!countClientsInRoom(data.room)) {
        // update all clients about room removal
        // io.sockets.emit('removeroom', { room: data.room });
    }
}

function getRooms() {
    return Object.keys(io.sockets.manager.rooms);
}

function getClientsInRoom(socketId, room) {
    var socketIds = io.sockets.manager.rooms['/' + room];
    var roomClients = [];

    if (socketIds && socketIds.length > 0) {
        for (var i = 0, len = socketIds.length; i < len; i++) {
            roomClients.push(clients.get(socketIds[i]));
        }
    }
    return roomClients;
}

function countClientsInRoom(room) {
    if (io.sockets.manager.rooms['/' + room]) {
        return io.sockets.manager.rooms['/' + room].length;
    }
    return 0;
}

function updatePresence(room, socket, state) {
    // socket.io may add a trailing '/' to the room name
    room = room.replace('/', '');

    socket.broadcast.to(room).emit('set-presence', {
        client: clients.get(socket.id),
        state: state,
        room: room
    });
}

function setObserver(socket, data) {
    var client = clients.get(socket.id);
    client.isObserver = data.isObserver;

    io.sockets.emit(client.room).emit('set-observer', {
        clientId: client.id,
        isObserver: client.isObserver
    });
}

function newGame(socket) {
    var client = clients.get(socket.id);

    // get players
    game = new Game();

    clients.forEach(function (value, key) {
        if (!value.isObserver) {
            game.addPlayer(value.id);
        }
    });

    io.sockets.emit(client.room).emit('new-game', {
        player: client.nickname,
        playercount: game.numPlayers()
    });
}

function submitVote(socket, data) {
    if (game) {
        var client = clients.get(socket.id);
        console.log(client.nickname + ' voted ' + data.vote);

        // broadcast vote status
        var hasVoted = false;
        if (data.vote) hasVoted = true;

        io.sockets.emit(client.room).emit('set-vote', {
            clientId: client.id,
            hasVoted: hasVoted
        });

        // check for game end
        game.setVote(client.id, data.vote);
        if (!game.needsVotes()) {

            io.sockets.emit(client.room).emit('end-game', {
                average: game.getAverage(),
                results: game.getResults()
            });
        }
    }
}

function cancelGame(socket) {
    var client = clients.get(socket.id);
    console.log(client.nickname + ' cancelled the game');
    
    io.sockets.emit(client.room).emit('cancel-game', {
        player: client.nickname,
    });
}

function generateId() {
    var s4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };

    return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
}

console.log('Chat server is running and listening to port %d...', port);