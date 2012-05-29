G.def('b', function() {
    var v = 0;
    return {
        set: function (vv) {
            v = vv;
        },
        get: function (){
            return v;
        }
    };
});
