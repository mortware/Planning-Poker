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