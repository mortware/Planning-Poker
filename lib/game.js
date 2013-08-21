module.exports = function Game() {

    Object.size = function (obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    var players = {};

    return {
        players: players,
        setVote: setVote,
        addPlayer: addPlayer,
        removePlayer: removePlayer,
        numPlayers: numPlayers,
        needsVotes: needsVotes,
        getAverage: getAverage,
        getResults: getResults
    };

    function addPlayer(playerId) {
        players[playerId] = '';
    }

    function removePlayer(playerId) {
        delete players[playerId];
    }

    function setVote(playerId, vote) {
        players[playerId] = vote;
    }

    function numPlayers() {
        return Object.size(players);
    }

    function getAverage() {
        var totalPlayers = numPlayers(),
            voteTotal = 0,
            key;
        for (key in players) {
            if (!isNaN(players[key])) {
                voteTotal += parseInt(players[key]);
            }
        }
        return parseInt(voteTotal / totalPlayers);
    }

    function getResults() {
        var results = [],
            key;
        for (key in players) {
            if (!isNaN(players[key])) {
                results.push({ playerId: key, vote: players[key] });
            }
        }
        return results;
    }

    function needsVotes() {
        var key;
        for (key in players) {
            if (players[key] === "") {
                return true;
            }
        }
        return false;
    }
};

