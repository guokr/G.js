G.def('./a', function() {
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
