var Table = function (players) {

    var hasGameStarted = ko.observable(false),
    	deck = ko.observableArray([]);


    var card = {
    	value: 0
    }

    var me = null;
    
    var vm = {
    	createDeck: createDeck,
        deck: deck
    };

    return vm;

    function createDeck(){
    	deck.removeAll();

    	deck.push(0);
    	deck.push(0.5);
    	deck.push(1);
    	deck.push(2);
    	deck.push(3);
    	deck.push(5);
    	deck.push(8);
    	deck.push(13);
    	deck.push(20);
    	deck.push(40);
    	deck.push(100);
    	deck.push('~');
    	deck.push('?');
    	deck.push('c');
    }
}