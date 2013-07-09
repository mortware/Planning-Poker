define(['ko', 'config', 'viewmodels/player', 'viewmodels/table'],
    function (ko, config, playerViewModel, tableViewModel) {
        return function () {

            var self = this;

            var chatMessage = function () {
                this.sender = 'Test';
                this.text = '';
                this.time = null;
                this.isMe = false;
                this.isServer = false;
            };

            this.player = new playerViewModel();
            this.table = new tableViewModel();
            this.players = ko.observableArray([]);
            this.hasGame = ko.observable(false);
            this.canVote = ko.observable(false);
            this.room = ko.observable('');
            this.message = ko.observable('');
            this.messages = ko.observableArray([]);
            
            var socket = null;

            this.setName = function (sender, args) {
                var n = args || self.player.name().trim();
                //var n = name().trim();
                if (n && n.length <= config.MAX_NICKNAME_LENGTH) {
                    $('#menu').collapse();
                    self.player.name(n);
                    connect();
                } else {
                    self.player.name('');
                }
            };

            this.toggleObserver = function () {
                player.isObserver(!player.isObserver());
                socket.emit('set-observer', { isObserver: player.isObserver() });
            };

            this.sendMessage = function () {

                var m = self.message().trim();

                if (m) { socket.emit('new-message', { message: m }); }

                self.message('');
            };

            this.startGame = function () {
                socket.emit('new-game', null);
            };

            this.setVote = function (vote) {
                var v = vote || parseInt(player.vote());

                if (v) {
                    self.player.hasVoted(true);
                    socket.emit('submit-vote', { vote: v });
                }
            };

            var bindEventToList = function (rootSelector, selector, callback, eventName) {
                var eName = eventName || 'click';
                $(rootSelector).on(eName, selector, function () {
                    var data = ko.dataFor(this);
                    callback(data);
                    return false;
                });
            };

            function bindSocketEvents() {
                socket.on('connect', function () {
                    socket.emit('connect', { nickname: self.player.name() });
                });

                socket.on('disconnect', function () {
                    insertMessage(config.SERVER_DISPLAY_NAME, 'Server offline', true, false, true);
                });

                socket.on('set-ready', function (data) {
                    $('#workspace-panel').show();
                    $('#message-input').focus();
                    self.player.id(data.clientId);

                    //table.init(players);
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
                    insertMessage(config.SERVER_DISPLAY_NAME, 'Welcome to the table', true, false, true);

                    self.players.removeAll();

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
                });

                socket.on('end-game', function (data) {
                    self.hasGame(false);
                    insertMessage('Game', 'Game complete, the average estimate was ' + data.average, true, false, true);
                });
            }

            function addClient(client) {
                var p = new playerViewModel();
                p.id(client.id);
                p.name(client.nickname);
                p.isObserver(client.isObserver);

                self.players.push(p);

                insertMessage(config.SERVER_DISPLAY_NAME, p.name() + ' has joined the room', true, false, true);
            }

            function removeClient(client) {

                self.players.remove(function (item) { return item.id() == client.id; });

                insertMessage(config.SERVER_DISPLAY_NAME, client.nickname + ' has left the room', true, false, true);
            }

            function insertMessage(sender, message, showTime, isMe, isServer) {

                var m = new chatMessage();
                m.isMe = isMe;
                m.isServer = isServer;
                m.sender = sender;
                m.text = message;
                m.time = showTime ? getTime() : '';

                self.messages.push(m);
            }

            function getClient(clientId) {
                var client = ko.utils.arrayFirst(self.players(), function (item) {
                    return item.id() === clientId;
                });
                return client;
            }

            function setVoteStatus(clientId, hasVoted) {
                var $client = getClient(clientId);

                if (hasVoted)
                    $client.find('.status-icon').addClass('icon-ok');
                else
                    $client.find('.status-icon').removeClass('icon-ok');
            }

            function newGame(playername, playercount) {

                // reset everyone's vote
                ko.utils.arrayForEach(self.players(), function (player) {
                    player.vote('');
                    player.hasVoted(false);
                });

                self.table.createDeck();

                self.hasGame(true);

                insertMessage(config.SERVER_DISPLAY_NAME, playername + ' has started a new game. ' + playercount + ' players.', true, false, true);
                bindEventToList('.card-list', '.card', self.setVote);
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
    }
);