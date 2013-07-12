define(['ko', 'config'],
    function (ko, config) {
        return function () {

            var self = this;

            this.id = ko.observable('');
            this.name = ko.observable('');
            this.hasVoted = ko.observable(false);
            this.isPlaying = ko.observable(false);
            this.isObserver = ko.observable(false);
            this.vote = ko.observable();

            this.reset = function () {
                self.vote('');
                self.hasVoted(false);
                self.isPlaying(false);
            }
        };
    }
);