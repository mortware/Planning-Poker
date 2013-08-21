define(['ko', 'config', 'viewmodels/player', 'viewmodels/table'], function (ko, config, playerViewModel, tableViewModel) {

    var player = new playerViewModel(),
        table = new tableViewModel();

    var players = ko.observableArray([]),
        isBusy = ko.observable(false),          // application is busy
        canToggleObserver = ko.observable(true),
        canStartGame = ko.observable(true),
        canStopGame = ko.observable(false),
        isConnected = ko.observable(false),
        isGameRunning = ko.observable(false),
        averageVote = ko.observable(),
        canVote = ko.observable(false),
        room = ko.observable(''),
        message = ko.observable(''),
        messages = ko.observableArray([]);

    var canPlay = ko.computed(function () {
        return isGameRunning() && player.isPlaying() && !player.isObserver();
    });
    var socket = null;

    var setName = function (sender, args) {
        isBusy(true);

        var n = args || player.name().trim();
        if (n && n.length <= config.MAX_NICKNAME_LENGTH) {
            $('#menu').collapse();
            player.name(n);
            connect();
        } else {
            player.name('');
        }
    };
    var toggleObserver = function () {
        player.isObserver(!player.isObserver());
        canToggleObserver(false);
        socket.emit('set-observer', { isObserver: player.isObserver() });
    };
    var sendMessage = function () {
        var m = message().trim();
        if (m) {
            socket.emit('send-message', { message: m });
        }
        message('');
    };
    var startGame = function () {
        isGameRunning(true);
        canStartGame(false);
        canStopGame(true);
        canToggleObserver(false);

        if (!player.isObserver()) {
            player.isPlaying(true);
        }

        socket.emit('start-game', null);
    };
    var stopGame = function () {
        canStopGame(false);
        socket.emit('cancel-game');
    };
    var setVote = function (vote) {
        var v = vote == player.vote() ? null : vote;

        if (v) {
            player.vote(v);
            player.hasVoted(true);
            socket.emit('submit-vote', { vote: v });
        } else {
            player.vote('');
            player.hasVoted(false);
            socket.emit('submit-vote', { vote: '' });
        }
    };

    return {
        player: player,
        table: table,
        players: players,
        isBusy: isBusy,
        canToggleObserver: canToggleObserver,
        canStartGame: canStartGame,
        canStopGame: canStopGame,
        isConnected: isConnected,
        isGameRunning: isGameRunning,
        averageVote: averageVote,
        canVote: canVote,
        room: room,
        message: message,
        messages: messages,
        canPlay: canPlay,

        setName: setName,
        toggleObserver: toggleObserver,
        sendMessage: sendMessage,
        startGame: startGame,
        stopGame: stopGame,
        setVote: setVote
    }

    // private functions
    function connect() {
        socket = io.connect('',{
            reconnect: false
        });
        bindSocketEvents();
    }

    function bindSocketEvents() {
        // all socket events are handled in here
        socket.on('connect', function () {
            onConnect();
        });
        socket.on('disconnect', function () {
            onDisconnect();
        });

        socket.on('receive-message', function (data) {
            onReceiveMessage(data, data.isServer);
        });
        socket.on('set-room-players', function (data) {
            onUpdateClientList(data);
        });
        socket.on('set-player-ready', function (data) {
            onSetPlayerReady(data);
        });
        socket.on('set-player-observer', function (data) {
            onSetPlayerObserver(data);
        });
        socket.on('set-player-presence', function (data) {
            onSetPlayerPresence(data);
        });
        socket.on('set-player-vote-status', function (data) {
            onSetPlayerVote(data);
        });
        socket.on('set-game-started', function (data) {
            onGameStarted(data);
        });
        socket.on('set-game-ended', function (data) {
            onGameEnded(data);
        });
        socket.on('set-game-cancelled', function (data) {
            onGameCancelled(data);
        });
    }

    function onConnect() {
        // the client has connected and informs the server
        socket.emit('register-player', { name: player.name() });
    }

    function onDisconnect() {
        // the client has disconnected from the server
        isConnected(false);
        insertMessage(config.SERVER_DISPLAY_NAME, 'Disconnected from server', false, true);
    }

    function onSetPlayerReady(data) {
        // the application is ready
        isConnected(true);
        player.id(data.playerId);
        isBusy(false);
    }

    function onUpdateClientList(data) {
        // the server is providing a list of all players

        // add all players to a list
        players.removeAll();
        for (var i = 0, len = data.clients.length; i < len; i++) {
            addPlayer(data.clients[i]);
        }

        // welcome message
        insertMessage(config.SERVER_DISPLAY_NAME, 'Welcome to the table', false, true);
    }

    function onReceiveMessage(data, isServer) {
        insertMessage(data.playerName, data.message, false, isServer);
    }

    function onSetPlayerObserver(data) {
        var client = getPlayer(data.clientId);
        client.isObserver(data.isObserver);

        // if client is me, then allow me to change 
        // to the observer status
        if (data.playerId === player.id()) {
            canToggleObserver(true);
        }
    }

    function onGameStarted(data) {
        // a new game has started

        // reset everything
        reset();

        // create a new table
        table.createDeck();

        // inform the user/update UI
        if (!player.isObserver()) {
            player.isPlaying(true);
        }

        isGameRunning(true);
        canStartGame(false);
        canStopGame(true);
        canToggleObserver(false);
        insertMessage(config.SERVER_DISPLAY_NAME, data.player + ' has started a new game. ' + data.playercount + ' players.', false, true);
    }

    function onSetPlayerPresence(data) {
        // another player has joined or left the room
        if (data.state == 'online') {
            addPlayer(data.player);
        }
        else if (data.state == 'offline') {
            removePlayer(data.player);
        }
    }

    function onSetPlayerVote(data) {
        // a player has submitted a vote
        var client = getPlayer(data.clientId);
        client.hasVoted(data.hasVoted);
    }

    function onGameEnded(data) {
        // performs all end game logic
        // 1. reset the table
        // 2. calculate the average (if possible)
        // 3. notify all players that the game has finished
        reset();

        for (var i = 0; i < data.results.length; i++) {
            var player = getPlayer(data.results[i].playerId);
            player.vote(data.results[i].vote);
        }

        if (isNaN(data.average)){
            insertMessage('Game', 'Game complete, the average estimate was not determined', false, true);
        } else {
            insertMessage('Game', 'Game complete, the average estimate was ' + data.average, false, true);
            averageVote(data.average);
        }

        // order the players by vote
        players.sort(function (left, right) {
            return parseInt(left.vote()) > parseInt(right.vote());
        });
    }

    function onGameCancelled(data) {
        // the current game has been cancelled
        reset();
        insertMessage('Game', data.player + ' cancelled the game.', false, true);
    }

    function addPlayer(player) {
        var p = new playerViewModel();
        p.id(player.id);
        p.name(player.name);
        p.isObserver(player.isObserver);

        players.push(p);

        insertMessage(config.SERVER_DISPLAY_NAME, p.name() + ' has joined the room', false, true);
    }

    function removePlayer(player) {
        players.remove(function (p) {
            return p.id() == player.id;
        });
        insertMessage(config.SERVER_DISPLAY_NAME, player.name + ' has left the room', false, true);
    }

    function insertMessage(sender, message, isMe, isServer) {
        var m = new ChatMessage();
        m.isMe = isMe;
        m.isServer = isServer;
        m.sender = sender;
        m.text = message;
        m.time = getTime();

        messages.push(m);
    }

    function getPlayer(playerId) {
        var player = ko.utils.arrayFirst(players(), function (item) {
            return item.id() === playerId;
        });
        return player;
    }

    function reset() {
        isGameRunning(false);
        canStartGame(true);
        canStopGame(false);
        canToggleObserver(true);

        player.reset();
        ko.utils.arrayForEach(players(), function (p) {
            p.reset();
        });

        averageVote('');

        ko.utils.arrayForEach(players(), function (player) {
            player.vote('');
            player.hasVoted(false);
        });
    }

    function getTime() {
        var date = new Date();
        return (date.getHours() < 10 ? '0' + date.getHours().toString() : date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes().toString() : date.getMinutes());
    }

    function ChatMessage() {
        this.sender = 'Test';
        this.text = '';
        this.time = null;
        this.isMe = false;
        this.isServer = false;
    };
});