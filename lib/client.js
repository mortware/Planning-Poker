module.exports = function Client(id, socketId, room) {
    this.id = id,
    this.socketId = socketId,
    this.nickname = null,
    this.isObserver = false,
    this.room = room
}