module.exports = function Player(id, room) {
    this.id = id,
    this.name = null,
    this.isObserver = false,
    this.room = room
}