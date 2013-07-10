define(['ko', 'jquery'], function (ko, $) {

    // binds a callback function to a particular jQuery element event
    var bindEventToList = function (rootSelector, selector, callback, eventName) {
        var eName = eventName || 'click';

        function eventHandler() {
            var data = ko.dataFor(this);
            callback(data);
            return false;
        }
        $(rootSelector).unbind(eName, selector, eventHandler);
        $(rootSelector).on(eName, selector, eventHandler);
    };

    return {
        bindEventToList: bindEventToList
    }
});

