define(function () {

    var self = this,
        names = ['Nile', 'Bernard', 'Tony', 'Luther', 'Norma', 'Jocelyn', 'Omar', 'Robert', 'Sylver', 'Lenny', 'Jill', 'Sonny', 'Gerardo', 'Bill', 'Nathaniel', 'Jessica', 'Alfa', 'Luci', 'Jerry', 'Cherie', 'Curt', 'Jenn', 'Richard'];

    var MAX_NICKNAME_LENGTH = 12,
        SERVER_DISPLAY_NAME = 'Server';

    var getRandomName = function () {
        return names[Math.floor((Math.random() * names.length) + 1)];
    }

    return {
        MAX_NICKNAME_LENGTH: MAX_NICKNAME_LENGTH,
        SERVER_DISPLAY_NAME: SERVER_DISPLAY_NAME,
        getRandomName: getRandomName
    }
});