angular.module('app', [])
    .factory('socket', function () {
        return io.connect('http://localhost:3000');
    })
    .controller('ChatController', function ($scope, socket) {
        var vm = this;


        vm.messages = [];
        vm.message = 'Blah!';
        vm.sendMessage = function () {
            socket.emit('send-msg', vm.message);
        }

        socket.on('get-msg', function (data) {

            $scope.$apply(function() {
                vm.messages.push(data);
            });

        });

    });