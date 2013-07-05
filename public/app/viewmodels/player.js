var Player = function () {
    var id = ko.observable(''),
        name = ko.observable(''),
        hasVoted = ko.observable(false),
        isObserver = ko.observable(false),
        vote = ko.observable();

    var vm = {
        id: id,
        name: name,
        isObserver: isObserver,
        hasVoted: hasVoted,
        vote: vote,
    };

    return vm;
}