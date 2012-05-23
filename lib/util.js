/**
 * Utils
 * @author mzhou
 * @version 0.1
 * @log
 */

/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:true, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqeqeq:false, eqnull:true, undef:true */
/*global G:true, $:true, jQuery:true */

G.def('util', function() {
    'use strict';
    var doc = document,
        ArrayProto = Array.prototype,
        ObjProto = Object.prototype,
        StringProto = String.prototype,
        nativeIsArray = Array.isArray,
        nativeFilter = ArrayProto.filter,
        nativeEvery = ArrayProto.every,
        nativeSome = ArrayProto.some,
        nativeMap = ArrayProto.map,
        toString = ObjProto.toString,
        htmlReg = /^[^<]*(<[\w\W]+>)[^>]*$/,
        // validate html
        class2type = { // Ideas from jquery, but don't use string and each to make it faster
            '[object Boolean]': 'boolean',
            '[object Number]': 'number',
            '[object String]': 'string',
            '[object Function]': 'function',
            '[object Array]': 'array',
            '[object Date]': 'date',
            '[object RegExp]': 'regexp',
            '[object Object]': 'object'
        };

    /**
     * 用于替代字符串拼接的模板函数
     *      G.format( '{1} name is {2}!', { 1: 'Her', 2: 'Mo' });
     *      G.format( '{v} is good!', 'JavaScript' );
     *      G.format( '{s} is good!', '{s}', 'JavaScript' );
     *      G.format( '<1> name is <2>!', { 1: 'Her', 2: 'Mo' }, /<([^<>]+)>/g);
     * @param {string} tmpl 模板字符串
     * @param {string/object} key 如果是字符串则是键值；
     *                            如果是object则是Map,key为键值，value为替换值;
     *                            如果没有第三个参数，则key为{v}，value为此值
     * @param {string/regexp} val 如果key是字符串，则val是被替换值
     *                            如果key是Map，且有val，则val是搜索key的正则，例如：/<([^<>]+)>\/g
     * @return {string} 替换成功后的值
     */
    G.format = function(tmpl, _key, _val) {
        if (!_key) {
            return tmpl;
        }
        var val;

        if (typeof _key !== 'object') {
            var key = _val ? _key : '{v}';
            val = _val || _key;
            return tmpl.replace(new RegExp(key, 'g'), ('' + val));
        } else {
            var obj = _key;
            return tmpl.replace(_val || /\{([^{}]+)\}/g, function(match, key) {
                val = obj[key];
                return (val !== undefined) ? ('' + val) : '';
            });
        }
    };


    /**
     * 截字，如果超过长度就添加'...'
     * @param {string} s 字符串
     * @param {number} n 最大长度
     * @return {string}
     */
    G.ellipsis = function(s, num) {
        return s.length > num ? (s.slice(0, num) + '...') : s;
    };

    /**
     * Get the type of target.
     *      results: null, undefined, boolean, function, number,
     *               string, array, date, regexp, object
     * @param {object} obj everything
     */
    G.type = function(obj) {
        return obj == null ? String(obj) : class2type[toString.call(obj)] || 'object';
    };

    /**
     * G.ua.isIE
     * G.ua.isIE6
     * G.ua.isIE7
     * G.ua.isIE8
     * 浏览器判断，总之不靠谱，不得以不要用
     */
    G.ua = (function() {
        var isIE = !+'\v1',
            // NOTE: 注意压缩之后 (\v1)会变成(\u000b1)，一定要替换回来 @_@!!。
            isIE6 = isIE && !('maxHeight' in doc.body.style),
            isIE8 = isIE && 'prototype' in Image,
            isIE7 = isIE && !isIE6 && !isIE8,
            isIE9 = $.browser.msie && ($.browser.version == '9.0'),
            ua = navigator.userAgent;
        // NOTE：isIE6,7,8的判断都是与IE的文档模式保持一致
        //       而isIE9是通过UA判断，故与浏览器模式保持一致
        //       isIE是用于判断IE6,7,8，IE9的值为false
        return {
            isIE: isIE,
            // alt     : !!-[1,]
            isIE6: isIE6,
            isIE8: isIE8,
            isIE7: isIE7,
            isIE9: isIE9,
            isOpera: $.browser.opera,
            isIpad: ua.match(/iPad/i) !== null,
            isIphone: ua.match(/iPhone/i) !== null
            //isIE9 : this.isIE && .1 === +(.09).toFixed(1),
        };
    })();

    /**
     * 判断对象是不是一个函数
     * @param {object} obj 被判断对象
     * @return {boolean} 是或否
     */
    G.isFun = function(obj) {
        return toString.call(obj).slice(8, -1) === 'Function';
    };

    /**
     * 判断对象是不是Array
     * @param {object} obj 被判断对象
     * @return {boolean} 是或否
     */
    G.isArray = nativeIsArray ||
    function(obj) {
        return toString.call(obj) === '[object Array]';
    };

    /**
     * 判断对象是不是数字
     * @param {object} obj 被判断对象
     * @return {boolean} 是或否
     */
    G.isNumber = function(obj) {
        return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
    };

    /**
     * 判断对象是不是html
     * @param {object} obj 被判断对象
     * @return {boolean} 是或否
     */
    G.isHtml = function(htmlString) {
        return htmlReg.test(htmlString);
    };

    /**
     * forEach函数
     * @param {array/object} array 被迭代数组或map
     * @param {function} iterator 迭代函数 callback: function( array[key], key, array );
     * @param {object} context 设置的this对象
     */
    G.each = function(array, iterator, context) {
        var value;
        if (array == null) {
            return;
        }

        if (ArrayProto.forEach && array.forEach === ArrayProto.forEach) {
            array.forEach(iterator, context);
        } else if (G.isNumber(array.length)) {
            for (var i = 0, l = array.length; i < l; i++) {
                if (i in array) {
                    iterator.call(context, array[i], i, array);
                }
            }
        } else {
            for (var key in array) {
                if (ObjProto.hasOwnProperty.call(array, key)) {
                    iterator.call(context, array[key], key, array);
                }
            }
        }
    };

    /**
     * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
     * 根据回调函数，过滤数组的各个值
     * @param {array} array 被迭代数组
     * @param {function} iterator 过滤数组的回调函数
     * @param {object} context 回调函数的this值
     * @return {array} 过滤之后的数组
     */
    G.filter = function(array, iterator, context) {
        var results = [];
        if (array == null) {
            return;
        }

        if (nativeFilter && array.filter === nativeFilter) {
            return array.filter(iterator, context);
        } else {
            G.each(array, function(value, index, list) {
                if (iterator.call(context, value, index, list)) {
                    results.push(value);
                }
            });
            return results;
        }
    };

    /**
     * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
     * 用于判断数组内的值是否都满足“回调函数”的判断
     * @param {array} array 被迭代数组
     * @param {function} iterator 回调函数
     * @param {object} context 回调函数的this值
     * @return {boolean} 成功与否
     */
    G.every = function(array, iterator, context) {
        var result = true;
        if (array == null) {
            return result;
        }

        if (nativeEvery && array.every === nativeEvery) {
            return some.every(iterator, context);
        } else {
            G.each(array, function(value, index, list) {
                if (!iterator.call(context, value, index, list)) {
                    return false;
                }
            });
            return result;
        }
    };

    /**
     * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
     * 用于判断数组内的值是否有任意一个满足“回调函数”的判断
     * @param {array} array 被迭代数组
     * @param {function} iterator 回调函数
     * @param {object} context 回调函数的this值
     * @return {boolean} 成功与否
     */
    G.some = function(array, iterator, context) {
        var result = false;
        if (array == null) {
            return result;
        }

        if (nativeSome && array.some === nativeSome) {
            return array.some(iterator, context);
        } else {
            G.each(array, function(value, index, list) {
                if (iterator.call(context, value, index, list)) {
                    return true;
                }
            });
            return result;
        }
    };

    /**
     * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/map
     * 用于判断map函数
     *
     */
    G.map = function(array, iterator, context) {
        var results = [];
        if (array == null) {
            return;
        }

        if (nativeMap && array.map === nativeMap) {
            return array.map(iterator, context);
        } else {
            G.each(array, function(value, index, list) {
                results.push(iterator.call(context, value, index, list));
            });
            return results;
        }
    };

    /**
     * 不修改原字符串，返回去掉首尾空格的字符
     * @return {string} 去掉首尾空格的字符
     */
    if (!StringProto.trim) {
        StringProto.trim = (function() {
            var trimLeft = /^\s+/,
                trimRight = /\s+$/
            return function() {
                return this.replace(trimLeft, "").replace(trimRight, "")
            };
        })();
    }

    /**
     * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/create
     * @param {object} o 对象
     * @return {object} 被创建的对象
     */
    if (!Object.create) {
        Object.create = function(o) {
            if (arguments.length > 1) {
                throw new Error('Object.create implementation only accepts the first parameter.');
            }

            function F() {}
            F.prototype = o;
            return new F();
        };
    }

    /**
     * 数组的indexOf方法，查询元素在数组中的位置
     * @param {object} searchElement 搜索元素
     * @param {number} fromIndex 从第几个开始搜索，与slice方法一样支持负数
     * @return {number} 搜索到的位置
     */
    if (!ArrayProto.indexOf) {
        ArrayProto.indexOf = function(searchElement, fromIndex) {
            if (this === undefined || this === null) throw new TypeError();

            var t = Object(this),
                len = t.length >>> 0; // 去掉小数点后数字，字符串转为0
            if (len === 0) return -1;

            var n = 0;
            if (arguments.length > 0) {
                n = Number(arguments[1]);
                if (isNaN(n)) { // 验证n是不是NaN
                    n = 0;
                } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) { // n !== 0,Infinity,-Infinity
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }

            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0); // 负数为倒过来计算位置
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }

});
