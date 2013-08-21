// load modules and globals
var express = require('express'),
    http = require('http'),
    sio = require('socket.io'),
    dict = require('dict');

var Player = require("./lib/player.js"),
    Game = require("./lib/game.js");

var app = express(),
    server = http.createServer(app),
    players = dict(),
    port = process.env.PORT || 5000,
    game = null;

// start listening
var io = sio.listen(server);
server.listen(port);

// define paths to static files
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/fonts', express.static(__dirname + '/public/css/fonts'));
app.use('/app', express.static(__dirname + '/public/app'));
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/lib', express.static(__dirname + '/public/lib'));

// define path to main client application
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/app/views/shell.html', null, null);
});

// set the log level of socket.io 
// (level 2 means we won't see heartbeats)
io.set('log level', 2);

io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});

// set the transports order
io.set('transports', ['websocket', 'xhr-polling']);

// socket.io events - each connection goes through here
// and each event is emitted from the client
io.sockets.on('connection', function (client) {
    client.on('register-player', function (data) {
        onRegisterPlayer(client, data);
    });
    client.on('send-message', function (data) {
        onSendMessage(client, data);
    });
    client.on('set-observer', function (data) {
        onSetObserver(client, data);
    });
    client.on('start-game', function () {
        onStartGame(client);
    });
    client.on('cancel-game', function () {
        onCancelGame(client);
    });
    client.on('submit-vote', function (data) {
        onSubmitVote(client, data);
    });
});

io.sockets.on('disconnect', function (client){
    onUnregisterPlayer(client);
});

function onRegisterPlayer(client, data) {
    // create a new client/user
    var player = new Player(client.id);
    player.name = data.name;
    player.room = 'game1';

    // save the client info to the dictionary object for quick access
    players.set(player.id, player);

    client.join(player.room);

    console.log('\'%s\' connected', player.name);

    // let the client/player know that its ready
    client.emit('set-player-ready', {
        playerId: player.id
    });

    updatePresence(client, 'online');

    // send list of players to all
    client.emit('set-room-players', {
        clients: getClientsInRoom(player.room)
    });
}
function onUnregisterPlayer(client) {
    // get a list of rooms for the client
    var rooms = io.sockets.manager.roomClients[client.id];

    // un-subscribe all players
    for (var room in rooms) {
        if (room && rooms[room]) {
            // update all players about offline presence
            updatePresence(room, client, 'offline');

            // remove the client from the room
            client.leave(room);
        }
    }
    delete players.delete(player.id);

    // send list of players to all
    client.emit('update-client-list', {
        clients: getClientsInRoom(player.room)
    });
}
function onSendMessage(client, data) {
    var player = players.get(client.id);
    io.sockets.emit(player.room).emit('receive-message', {
        playerName: player.name,
        message: data.message
    });
}
function onSetObserver(client, data) {
    var player = players.get(client.id);
    player.isObserver = data.isObserver;

    io.sockets.emit(player.room).emit('set-player-observer', {
        playerId: player.id,
        isObserver: player.isObserver
    });
}
function onSubmitVote(client, data) {
    if (game) {
        var player = players.get(client.id);

        // broadcast vote status
        var hasVoted = false;
        if (data.vote) hasVoted = true;

        io.sockets.emit(player.room).emit('set-player-vote-status', {
            clientId: player.id,
            hasVoted: hasVoted
        });

        // check for game end
        game.setVote(player.id, data.vote);
        if (!game.needsVotes()) {

            io.sockets.emit(player.room).emit('set-game-ended', {
                average: game.getAverage(),
                results: game.getResults()
            });
        }
    }
}
function onStartGame(client) {
    game = new Game();
    players.forEach(function (value) {
        if (!value.isObserver) {
            game.addPlayer(value.id);
        }
    });

    var player = players.get(client.id);
    io.sockets.emit(player.room).emit('set-game-started', {
        player: player.name,
        playerCount: game.numPlayers()
    });
}
function onCancelGame(client) {
    var player = players.get(client.id);
    io.sockets.emit(player.room).emit('set-game-cancelled', {
        player: player.name
    });
}

function getClientsInRoom(room) {
    var socketIds = io.sockets.manager.rooms['/' + room];
    var roomClients = [];

    if (socketIds && socketIds.length > 0) {
        for (var i = 0, len = socketIds.length; i < len; i++) {
            roomClients.push(players.get(socketIds[i]));
        }
    }
    return roomClients;
}
function updatePresence(client, state) {
    var player = players.get(client.id);
    io.sockets.emit(player.room).emit('set-player-presence', {
        player: player,
        state: state
    });
}
function generateId() {
    var s4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
}
console.log('Planning Poker is running and listening to port %d...', port);