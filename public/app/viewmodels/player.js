define(['ko', 'config'],
    function (ko, config) {
        return function () {
            this.id = ko.observable('');
            this.name = ko.observable('');
            this.hasVoted = ko.observable(false);
            this.isObserver = ko.observable(false);
            this.vote = ko.observable();
        };
    }
);