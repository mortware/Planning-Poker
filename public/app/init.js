require.config({
    paths: {
        ko: '../lib/knockout-2.2.1',
        jquery: '../lib/jquery-1.10.2.min',
        bootstrap: '../lib/bootstrap.min',
        //jquerymobile: 'http://code.jquery.com/mobile/1.3.1/jquery.mobile-1.3.1.min',
        config: 'config'
    },
    shim: { bootstrap: { deps: ["jquery"]}}
});

require(['ko', '/app/viewmodels/main.js', 'jquery', 'bootstrap'],
    function (ko, appViewModel, $) {
        var vm = new appViewModel();

        ko.applyBindings(vm, document.getElementById('main-page'));

        

        //$('#login-panel').panel('open');
        $('#name-input').focus();

    }
);