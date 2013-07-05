var MAX_NICKNAME_LENGTH = 15,
    SERVER_DISPLAY_NAME = 'Server';

var ViewModel = function () {

    var player = new Player(),
        players = ko.observableArray([]),
        hasGame = ko.observable(false),
        canVote = ko.observable(false);

    room = ko.observable(''),
    message = ko.observable('');

    var table = new Table();

    var socket = null,
        templates = {
            room: ['<li data-roomId="{{room}}">', '<span class="icon"></span> {{room}}', '</li>'].join(""),
            client: '<li class="player" data-clientId="{{clientId}}"><i class="client-icon icon-user"></i> {{nickname}}<i class="status-icon"></i></li>',
            message: '<li><div class="pull-left" style="width: 100px;"><span class="badge sender">{{sender}}</span></div>{{text}}<span class="pull-right">{{time}}</span>'
        };

    var setName = function () {
        var name = player.name().trim();
        //var n = name().trim();
        if (name && name.length <= MAX_NICKNAME_LENGTH) {
            $('#welcome-panel').hide();
            player.name(name);
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

        if (m) {
            socket.emit('new-message', {
                message: m,
                room: currentRoom
            });
        }

        message('');
    };
    var startGame = function () {
        socket.emit('new-game', null);
    }
    var setVote = function () {
        var vote = parseInt(player.vote());

        if (vote) {
            player.hasVoted(true);
            socket.emit('submit-vote', { vote: vote });
        }
    }

    var vm = {
        player: player,
        players: players,
        message: message,
        setName: setName,
        toggleObserver: toggleObserver,
        sendMessage: sendMessage,
        startGame: startGame,
        setVote: setVote,
        hasGame: hasGame
    };

    return vm;

    function bindSocketEvents() {
        socket.on('connect', function () {
            socket.emit('connect', { nickname: player.name() });
        });

        socket.on('disconnect', function () {
            insertMessage(SERVER_DISPLAY_NAME, 'Server offline', true, false, true);
        });

        socket.on('set-ready', function (data) {
            $('#workspace-panel').show();
            $('#message-input').focus();
            player.id(data.clientId);
        });

        socket.on('new-message', function (data) {
            var from = data.client.nickname;
            var message = data.message;

            insertMessage(from, message, true, false, false);
        });

        socket.on('new-game', function (data) {
            newGame(data.player, data.playercount);
        });

        socket.on('list-clients', function (data) {
            addRoom(data.room);
            setCurrentRoom(data.room);
            insertMessage(SERVER_DISPLAY_NAME, 'Welcome to the table', true, false, true);

            players.removeAll();

            // add all clients to the list
            for (var i = 0, len = data.clients.length; i < len; i++) {
                addClient(data.clients[i]);
            }
        });

        socket.on('set-observer', function (data) {
            var client = getClient(data.clientId);
            client.isObserver(data.isObserver);
        });

        socket.on('set-presence', function (data) {
            if (data.state == 'online') {
                addClient(data.client, true);
            }
            else if (data.state == 'offline') {
                removeClient(data.client, true);
            }
        });

        socket.on('set-vote', function (data) {
            var client = getClient(data.clientId);
            client.hasVoted(data.hasVoted);
            table.update();
        });

        socket.on('end-game', function (data) {
            hasGame(false);
            insertMessage('Game', 'Game complete, the average estimate was ' + data.average, true, false, true);
        });
    }

    // Private methods

    function addRoom(name) {
        name = name.replace('/', '');

        var $html = $(Mustache.render(templates.room, {
            room: name
        }));

        $html.appendTo('.chat-rooms ul');
    }

    function addClient(client) {
        var p = new Player();
        p.id(client.id);
        p.name(client.nickname);
        p.isObserver(client.isObserver);

        players.push(p);

        insertMessage(SERVER_DISPLAY_NAME, p.name() + ' has joined the room', true, false, true);

        table.init(players());
    }

    function removeClient(client, announce) {

        players.remove(function (item) { return item.id() == client.id });

        insertMessage(SERVER_DISPLAY_NAME, client.nickname + ' has left the room', true, false, true);
    }

    function createRoom() {
        var room = $('#addroom-popup .input input').val().trim();

        socket.emit('subscribe', {
            room: room
        });
    }

    function setCurrentRoom(room) {
        currentRoom = room;
    }

    function insertMessage(sender, message, showTime, isMe, isServer) {
        var $html = $(Mustache.render(templates.message, {
            sender: sender,
            text: message,
            time: showTime ? getTime() : ''
        }));

        if (isMe) {
            $html.addClass('info');
        }

        if (isServer) {
            $html.find('.sender').addClass('badge-important');
        }
        var $log = $('#message-log');
        $log.append($html);
        $log.animate({
            scrollTop: $log[0].scrollHeight
        }, 1000);
    }

    function getClient(clientId) {
        var client = ko.utils.arrayFirst(players(), function (item) {
            return item.id() === clientId;
        });
        return client;
    }

    function setVoteStatus(clientId, hasVoted) {
        table.update();
        var $client = getClient(clientId);

        if (hasVoted)
            $client.find('.status-icon').addClass('icon-ok');
        else
            $client.find('.status-icon').removeClass('icon-ok');
    }

    function newGame(playername, playercount) {

        // reset everyone's vote
        ko.utils.arrayForEach(players(), function (player) {
            player.vote('');
            player.hasVoted(false);
        });

        hasGame(true);

        insertMessage(SERVER_DISPLAY_NAME, playername + ' has started a new game. ' + playercount + ' players.', true, false, true);
    }

    function getTime() {
        var date = new Date();
        return (date.getHours() < 10 ? '0' + date.getHours().toString() : date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes().toString() : date.getMinutes());
    }

    function connect() {
        socket = io.connect();
        bindSocketEvents();
    }
};

$(function () {
    $('#nickname-input').focus();
    ko.applyBindings(new ViewModel());
});