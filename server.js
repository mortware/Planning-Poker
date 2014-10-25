var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app).listen(3000);
var io = require('socket.io').listen(server);

app.use(express.static(__dirname +'/public'));
app.use(express.static(__dirname +'/bower_components'));

//app.get('/', function (req, res) {
//    res.sendfile('index.html');
//});
//
//http.listen(3000, function() {
//    console.log('listening on *:3000');
//});


io.sockets.on('connection', function(socket) {
    console.log('Connected!');

    socket.on('send-msg', function (data) {
        io.sockets.emit('get-msg', data);
    });
});
