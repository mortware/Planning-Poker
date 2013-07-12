require.config({
    paths: {
        ko: '../lib/knockout-2.2.1',
        jquery: '../lib/jquery-1.10.2.min',
        bootstrap: '../lib/bootstrap.min',
        //jquerymobile: 'http://code.jquery.com/mobile/1.3.1/jquery.mobile-1.3.1.min',
        config: 'config',
        helper: 'system/helper',
    },
    shim: { bootstrap: { deps: ["jquery"] } }
});

require(['ko', '/app/viewmodels/main.js', 'jquery', 'config', 'helper', 'bootstrap'],
    function (ko, appViewModel, $, config, helper) {
        var vm = appViewModel;
        ko.applyBindings(vm, document.getElementById('main-page'));
        helper.bindEventToList('.card-list', '.card', vm.setVote);
        $('#name-input').focus();

        // debug section - remove to allow users to enter their own name
        //vm.setName('debug', config.getRandomName());
    }
);