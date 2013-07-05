(function($, ko){

});

function Table() {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    
    centerX = parseInt(canvas.width / 2);
    centerY = parseInt(canvas.height / 2);

    var players;
    // var requestAnimationFrame =  
    //     window.requestAnimationFrame ||
    //     window.webkitRequestAnimationFrame ||
    //     window.mozRequestAnimationFrame ||
    //     window.msRequestAnimationFrame ||
    //     window.oRequestAnimationFrame ||
    //     function(callback) {
    //         return setTimeout(callback, 1);
    //     };

    var init = function(p) {
        players = p;
        update();        
    };

    var update = function() {
        context.clearRect(0,0,canvas.width, canvas.height);
        for (var i = players.length - 1; i >= 0; i--) {

            var player = players[i];

            player.xPos = centerX;
            player.yPos = centerY;

            drawPlayer(player);
        };
    };

    var vm = {
        init: init,
        update: update,
    }

    return vm;

    // private functions
    function drawPlayer(player) {
        
        // draw player image
        var playerImage = new Image();
        playerImage.src = '/img/player.png';

        var imgHeight, imgWidth;

        playerImage.onload = function() {
            imgHeight = this.height;
            imgWidth = this.width;

            context.drawImage(
                playerImage, 
                player.xPos - (imgWidth / 2), 
                player.yPos - (imgHeight / 2));

            // draw player name
            context.fillStyle = "#211E1E";
            context.textAlign = 'center';
            context.font = "10pt Arial";
            context.fillText(
                player.name(), 
                player.xPos, 
                (player.yPos + (imgHeight / 2) + 15));
        };

        if (player.hasVoted()) {
            var checkImage = new Image();
            checkImage.src = '/img/check.png';

            checkImage.onload = function() {
                context.drawImage(
                    checkImage,
                    player.xPos, player.yPos);
            };
        };
    };
}


function Deck() {
    this.cards = [];
    
    this.cards.push(new Card(0));
    this.cards.push(new Card(0.5));
    this.cards.push(new Card(1));
    this.cards.push(new Card(2));
    this.cards.push(new Card(3));
    this.cards.push(new Card(5));
    this.cards.push(new Card(8));
    this.cards.push(new Card(13));
    this.cards.push(new Card(20));
    this.cards.push(new Card(40));
    this.cards.push(new Card(100));
    this.cards.push(new Card('Coffee'));
    this.cards.push(new Card('Infinite'));
    this.cards.push(new Card('Unknown'));
}

function Card(value) {
    this.value = value
}

function drawCard() {
    
}