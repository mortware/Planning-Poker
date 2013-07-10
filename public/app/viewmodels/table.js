define(['ko', 'config'],
    function (ko, config) {
        return function () {

            var self = this;

            this.isGameRunning = ko.observable(false);
            this.deck = ko.observableArray([]);

            this.createDeck = function() {
                self.deck.removeAll();

                self.deck.push('0');
                self.deck.push('1/2');
                self.deck.push('1');
                self.deck.push('2');
                self.deck.push('3');
                self.deck.push('5');
                self.deck.push('8');
                self.deck.push('13');
                self.deck.push('20');
                self.deck.push('40');
                self.deck.push('100');
                self.deck.push('~');
                self.deck.push('?');
                self.deck.push('c');
            };

            this.selectCard = function(value) {

            };
        };
    }
);