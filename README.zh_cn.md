#G.js
一个帮助你require和define javscript模块的库。

#特点

1. 类AMDjs语法；
2. define 和 require javascript模块；
3. 只有1.7kb大小（Minified and Gzipped）

#如何使用

    <h1 id="hello"></h1>
    <script src="./G.js"></script>
    <script>
    G.req('jQuery', function ($) {
        $('#hello').text('Welcome to use G.js!');
    });
    </script>

#API
确保一个javascript文件只有一个模块

##定义一个模块

###函数

    // file: lib/a.js
    G.def('a', function() {
        return 'a'; // G.req('a') === 'a';
    });

###对象

    // file: lib/b.js
    G.def('b', {
        name: 'b'
    });

###添加依赖

    // file: lib/c.js
    G.def('c', ['a', 'b'], function (a, b) {
        return a + b.name; // G.req('c') === 'ab';
    });

###异步的require一个模块

    // file: demo.html
    <script src="./G.js"></script>
    <script>
    G.req('c', function (c) {
        G.log('c'); // print 'ab' by console.log if exist
    });
    </script>

###同步的require一个模块

    // file: demo2.html
    <script src="./G.js"></script>
    // must include modules!
    <script src="lib/a.js"></script>
    <script src="lib/b.js"></script>
    <script src="lib/c.js"></script>
    <script>
    G.log(
        G.req('c');// print 'ab' by console.log if exist
    );
    </script>

###模块名和路径的命名规则

BaseUrl是G.js文件所处路径，你也可以通过全局变量GJS_URL来设置。

LibUrl是baseUrl+'/lib/',你可以通过全局变量GJS_LIBURL来设置。此路径通常用来放置javascript的基础模块（或称全局模块）。

HostUrl是 location.protocol + '//' + location.host，如果它是一个本地文件，则是baseUrl。

例如:

Lib url规则

    http://guokr.com/     (filepath: ~/guokr/G/)
                    G.js
                    lib/
                        a.js
                        b.js
                        c.js
                        other/d.js
                    index.html
                    e.js
                    c.js

####Lib路径规则:

LibUrl是'http://guokr.com/lib/'，全局模块的名字是相对于libUrl的。

~/guokr/G/lib/a.js 是一个全局模块:
    
    G.def('a', function() {
        return 'a';
    });

~/guokr/G/lib/other/d.js是一个全局模块:

    G.def('other/d', function() {
        return 'other/d';
    });

####相对路径规则:

BaseUrl是'http://guokr.com/'，局部模块的名字是相对于baseUrl的。

~/guokr/G/c.js是一个局部模块:
    
    G.def('./c.js', function() {
        return './c';
    });

####使用相对路径来依赖模块:

例如:

    //filename: ~/guokr/G/lib/c.js
    G.def('c', function() {
        return 'c';
    });


    //filename: ~/guokr/G/lib/b.js
    G.def('b', ['./c'], function( c ) {
        // is relative to ~/guokr/G/lib/b.js not baseUrl
        return c === 'c';   // true
    });

c.js与b.js是全局模块。依赖模块时，相对路径名是依据当前模块的路径来计算的，不是BaseUrl。

####绝对路径规则:
模块名必须是以'/'、'http://'、'https://'或'file://'开头的。

如果以'/'开头，例如:

e.js是一个绝对模块名

    G.def('/e', {
        name: 'e'
    });

注意：hostUrl是在online和offline的时候不一样，所以使用'/'开头的模块名是不推荐的。推荐使用相对路径名;

如果模块名以'http://'、'https://'或'file://'开头。

例如：

    // e.js
    G.def('http://guokr.com/e.js', function() {
        return 'e';
    });

注意：虽然一个模块可以被命名成很多情况，你也可以用各种情况来require它们。

例如:

    G.req('./lib/a.js', function (a) {
        return a === 'a'; // true
    });

###配置和预加载

    <script>
    var GJS_VERSION = '0.2',    // will be prepend to javascript file url
        GJS_PRELOAD = ['preloadModuleName'],
        GJS_URL = '/js/',
        GJS_LIB_URL = 'lib/';
    </script>
    <script>
    (function() {
    var type = 'text/javascript',
        async = true,
        s = document.getElementsByTagName('script')[0],
        G = document.createElement('script');
    G.type = type;
    G.async = async;
    G.src = 'http://guokr.com/G.js';
    s.parentNode.insertBefore(G, s);
    })();
    </script>

#其他
你可以看下我们的build工具：[build tool from guokr](https://github.com/guokr/guokr-build).

也请查看下demo.html~


#Licentse
MIT.


