G.def('a', function() {
    var v = 0;

    return {
        get: function() {
            return v;
        },
        set: function(a) {
            v = a;
        }
    };
});
