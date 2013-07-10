define(['ko', 'config', 'viewmodels/player', 'viewmodels/table'], function (ko, config, playerViewModel, tableViewModel) {

    var self = this;

    var player = new playerViewModel();
    var table = new tableViewModel();
    var players = ko.observableArray([]);
    var isConnected = ko.observable(false);
    var isGameRunning = ko.observable(false);
    var averageVote = ko.observable();
    var canVote = ko.observable(false);
    var room = ko.observable('');
    var message = ko.observable('');
    var messages = ko.observableArray([]);
    var canPlay = ko.computed(function () {
        return isGameRunning() && !player.isObserver();
    });
    var socket = null;

    var setName = function (sender, args) {
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
        socket.emit('set-observer', { isObserver: player.isObserver() });
    };
    var sendMessage = function () {
        var m = message().trim();
        if (m) { socket.emit('new-message', { message: m }); }
        message('');
    };
    var startGame = function () {
        socket.emit('new-game', null);
    };
    var cancelGame = function () {
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
        cancelGame: cancelGame,
        setVote: setVote,
    }

    // private funtions
    function connect() {
        socket = io.connect();
        bindSocketEvents();
    }

    function bindSocketEvents() {
        // all socket events are handled in here
        socket.on('connect', function () {
            onConnected();
        });
        socket.on('disconnect', function () {
            onDisconnect();
        });
        socket.on('set-ready', function (data) {
            onReady(data);
        });
        socket.on('new-message', function (data) {
            onMessageReceived(data);
        });
        socket.on('new-game', function (data) {
            onGameCreated(data);
        });
        socket.on('list-clients', function (data) {
            onClientsListed(data);
        });
        socket.on('set-observer', function (data) {
            var client = getClient(data.clientId);
            client.isObserver(data.isObserver);
        });
        socket.on('set-presence', function (data) {
            onPresenceSet(data);
        });
        socket.on('set-vote', function (data) {
            onVoteSet(data);
        });
        socket.on('end-game', function (data) {
            onEndGame(data);
        });
        socket.on('cancel-game', function (data) {
            onCancelGame(data);
        });
    }
    function onConnected() {
        // the client has connected and informs the server
        socket.emit('connect', { nickname: player.name() });
    }
    function onDisconnected() {
        // the client has disconnected from the server
        isConnected(false);
        insertMessage(config.SERVER_DISPLAY_NAME, 'Server offline', true, false, true);
    }
    function onReady(data) {
        // the application is ready
        isConnected(true);
        player.id(data.clientId);
    }
    function onClientsListed(data) {
        // the server is providing a list of all clients
        
        // add all clients to a list
        players.removeAll();
        for (var i = 0, len = data.clients.length; i < len; i++) {
            addClient(data.clients[i]);
        }

        // welcome message
        insertMessage(config.SERVER_DISPLAY_NAME, 'Welcome to the table', true, false, true);
    }
    function onMessageReceived(data) {
        // a new message is received from the server
        var from = data.client.nickname;
        var message = data.message;
        insertMessage(from, message, true, false, false);
    }

    function onGameCreated(data) {
        // a new game has started

        // reset all player votes
        player.vote('');
        ko.utils.arrayForEach(players(), function (player) {
            player.vote('');
            player.hasVoted(false);
        });

        // create a new table
        table.createDeck();

        // inform the user/update UI
        isGameRunning(true);
        insertMessage(config.SERVER_DISPLAY_NAME, data.player + ' has started a new game. ' + data.playercount + ' players.', true, false, true);
    }
    function onPresenceSet(data) {
        // another player has joined or left the room
        if (data.state == 'online') {
            addClient(data.client, true);
        }
        else if (data.state == 'offline') {
            removeClient(data.client, true);
        }
    }
    function onVoteSet(data) {
        // a player has submitted a vote
        var client = getClient(data.clientId);
        client.hasVoted(data.hasVoted);
    }
    function onEndGame(data) {
        // performs all end game logic
        // 1. reset the table
        // 2. calculate the average (if possible)
        // 3. notify all clients that the game has finished
        reset();

        var voteTotal = 0;
        var isIndeterminate = false;

        for (var i = 0; i < data.results.length; i++) {
            var player = getClient(data.results[i].clientId);

            var vote = data.results[i].vote;
            player.vote(vote);

            var voteValue = parseInt(vote);
            if (!isNaN(voteValue)) {
                voteTotal += voteValue;
            } else {
                isIndeterminate = true;
            }
        }
        var average = isIndeterminate ? 'indeterminate' : parseInt(voteTotal / data.results.length);

        insertMessage('Game', 'Game complete, the average estimate was ' + average, true, false, true);

        // order the players by vote
        players.sort(function (left, right) {
            return parseInt(left.vote()) > parseInt(right.vote());
        });
    }
    function onCancelGame(data) {
        // the current game has been cancelled
        reset();
        insertMessage('Game', data.player + ' cancelled the game.', true, false, true);
    }

    function addClient(client) {
        var p = new playerViewModel();
        p.id(client.id);
        p.name(client.nickname);
        p.isObserver(client.isObserver);

        players.push(p);

        insertMessage(config.SERVER_DISPLAY_NAME, p.name() + ' has joined the room', true, false, true);
    }
    function removeClient(client) {
        players.remove(function (item) { return item.id() == client.id; });
        insertMessage(config.SERVER_DISPLAY_NAME, client.nickname + ' has left the room', true, false, true);
    }
    function insertMessage(sender, message, showTime, isMe, isServer) {
        var m = new chatMessage();
        m.isMe = isMe;
        m.isServer = isServer;
        m.sender = sender;
        m.text = message;
        m.time = showTime ? getTime() : '';

        messages.push(m);
    }
    function getClient(clientId) {
        var client = ko.utils.arrayFirst(players(), function (item) {
            return item.id() === clientId;
        });
        return client;
    }
    function reset() {
        isGameRunning(false);
        player.vote('');
        player.hasVoted(false);
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
    function chatMessage() {
        this.sender = 'Test';
        this.text = '';
        this.time = null;
        this.isMe = false;
        this.isServer = false;
    };
});