G.def('test/b', ['a'], function( a ) {
    return {
        set: function(v) {
            a.set(v);
        },
        get: function  () {
            return a.get();
        }
    };
});
