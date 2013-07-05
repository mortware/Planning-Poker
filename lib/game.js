module.exports = function Game() {
    var dict = require('dict');
    var players = dict();

    var game = {
        players: players,
        setVote: setVote,
        addPlayer: addPlayer,
        removePlayer: removePlayer,
        numPlayers: numPlayers,
        needsVotes: needsVotes,
        getAverage: getAverage,
    }

    return game;

    function addPlayer(playerId) {
        if (!players.has(playerId))
            players.set(playerId, '');
    }

    function removePlayer(playerId) {
        if (!players.has(playerId))
            players.delete(playerId);
    }

    function setVote(playerId, vote) {
        this.players.set(playerId, vote);
    };

    function numPlayers() {
        return players.size;
    };

    function getAverage() {
        var totalPlayers = numPlayers();
        var voteTotal = 0;
        players.forEach(function (value, key) {
            if (!isNaN(value)) {
                voteTotal += value;
            }
        });
        return parseInt(voteTotal / totalPlayers);
    };

    function needsVotes() {
        players.forEach(function (value, key) {
            console.log(key, value, isNaN(value), value === "");
        });

        var BreakException = {};

        try {
            players.forEach(function (value, key) {
                if (value === "") throw BreakException;
            });
            return false;
        } catch (e) {
            if (e !== BreakException) throw e;
            return true;
        }
    };
}
