G.def('a', function() {
    var v = 0,
        a = {
            get: function() {
                return v;
            },
            set: function(a) {
                v = a;
            }
        };
    return a;
});
