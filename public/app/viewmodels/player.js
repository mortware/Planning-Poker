
var Player = function () {
    
    // observables
    var id = ko.observable(''),
        name = ko.observable(''),
        hasVoted = ko.observable(false),
        isObserver = ko.observable(false),
        vote = ko.observable();

    var xPos = 0,
        yPos = 0;

    var vm = {
        id: id,
        name: name,
        xPos: xPos,
        yPos: yPos,
        isObserver: isObserver,
        hasVoted: hasVoted,
        vote: vote,
    };

    return vm;
}