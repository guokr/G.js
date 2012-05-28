/**
 * G.js
 * A small simple javascript lib to help you define and require Module.
 * Not exactly follow the CommonJS AMDjs.
 * @author mzhou
 * @version 0.3.0
 * @log 0.1
 *      0.2 rebuild the code and api, add nameToUrl rules
 *      0.3 auto find the relativeUrl, add preload support
 */

/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:true, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:true, undef:true */
/*global G:true, console:false */

(function(host, notDefined) {
    'use strict';
    // prevent load again
    if (typeof G !== 'undefined') {
        return;
    }
    host.G = {};

    /**
     * Get the url of this scripts
     */

    function getScriptsUrl() {
        if (host.GJS_URL) {
            return host.GJS_URL;
        }

        var scripts = document.getElementsByTagName('script'),
            node = scripts[scripts.length - 1],
            loaderScriptUrl;

        loaderScriptUrl = node.hasAttribute ?
        // non-IE6/7
        node.src :
        // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
        node.getAttribute('src', 4);

        loaderScriptUrl = loaderScriptUrl.replace(/\/[^\/]*$/, '') + '/';
        return loaderScriptUrl;
    }

    var doc = host.document,
        loading = {},
        // loading modules, or it's dependency is loading
        waiting = {},
        // callbacks which waiting for module loaded
        loaded = {},
        // loaded but not executed module
        module = {},
        // executed module for cache
        config = {
            // url prefix for which module name
            url: getScriptsUrl() || '/js/',
            version: host.GJS_VERSION ? '?v' + host.GJS_VERSION : '',
            preload: host.GJS_PRELOAD || []
            // libUrl: '/lib/'
        },
        isPreloading = false,
        isPreloaded = false,
        preloadCallbacks, readyStates = { // script's readyStates
            'complete': 1,
            'loaded': 1,
            'undefined': 1
            // for non-ie
        },
        toString = Object.prototype.toString,
        absoluteReg = /^(\/|http:\/\/)/,
        // validate: http:// or /
        relativeReg = /^\.{1,2}?\//,
        // validate: ./ or ../
        jsSuffixReg = /\.js(?:(?:\?|#)[\w\W]*)?$/,
        // validate: .js or .js?v=1 or .js#test
        jsSuffix = '.js' + config.version;
    // url prefix for lib module
    // if url is '/js/' and libUrl is 'lib'
    // then
    //      ./jQuery ==> /js/jQuery.js
    //      share ==> /js/lib/share.js
    //      ./post/comment ==> /js/post/comment.js
    //      ../other ==> /other.js  (!!! not recommend)
    //      /index ==> /index.js
    //      http://www.guokr.com/js/h.js ==> http://www.guokr.com/js/h.js
    config.libUrl = config.url + (host.GJS_LIB_URL || 'lib/');


    /**
     * Canonicalizes a path.
     * realpath('./a//b/../c') ==> 'a/c'
     * copy from seajs, sea: https://github.com/seajs/seajs/blob/v1.1.0/src/util-path.js
     * @param {string} path
     * @return {string} Canonicalized path
     */

    function realpath(path) {
        // 'file:///a//b/c' ==> 'file:///a/b/c'
        // 'http://a//b/c' ==> 'http://a/b/c'
        path = path.replace(/([^:\/])\/+/g, '$1\/');

        // 'a/b/c', just return.
        if (path.indexOf('.') === -1) {
            return path;
        }

        var old = path.split('/'),
            ret = [],
            i = 0,
            part, len = old.length;

        for (; i < len; i++) {
            part = old[i];
            if (part === '..') {
                if (ret.length === 0) {
                    G.log('Invalid module path:' + path);
                }
                ret.pop();
            } else if (part !== '.') {
                ret.push(part);
            }
        }

        return ret.join('/');
    }

    /**
     * change module name to url of javascript file.
     * @param {string} name
     * @return {string}
     */

    function nameToUrl(name) {
        var firstLetter = name.slice(0, 1),
            isAbsolute = absoluteReg.test(name),
            isRelative = relativeReg.test(name);
        if (isRelative) {
            name = config.url + name.slice(1);
        } else if (!isAbsolute) {
            name = config.libUrl + name;
        }

        name = realpath(name);
        if (!jsSuffixReg.test(name)) {
            name += jsSuffix;
        }
        return name;
    }

    /**
     * Used to load script
     * @param {string} url script string
     * @param {function} callback
     */
    G.loadScript = function(url, callback) {
        var node = doc.createElement('script'),
            head = doc.getElementsByTagName('head')[0];

        node.onload = node.onerror = node.onreadystatechange = function() {
            if (readyStates[node.readyState]) {
                if (callback) {
                    callback();
                }

                // clean memory
                node.onload = node.onerror = node.onreadystatechange = null;
                try {
                    if (node.clearAttributes) {
                        node.clearAttributes();
                    } else {
                        for (var p in node) {
                            delete node[p];
                        }
                    }
                } catch (x) {}
                head.removeChild(node);
                node = notDefined;
            }
        };

        node.async = true;
        node.src = url;
        node.type = 'text/javascript';
        head.insertBefore(node, head.firstChild);
    };

    /**
     * Define a module
     * @param {string} name
     * @param {array} deps dependencies
     * @param {function/object} wrap
     */
    G.def = function(name, deps, wrap) {
        if ((name in module) || (name in loaded)) {
            return;
        }
        var tmp = wrap ? deps : notDefined;
        wrap = wrap || deps;
        deps = tmp;
        if (toString.call(wrap) !== '[object Function]') {
            module[name] = wrap;
        } else {
            loaded[name] = {
                name: name,
                deps: deps,
                wrap: wrap
            };
        }
    };

    /**
     * Clean loaded module;
     * Call waiting callbacks.
     * @param {string} name 模块名
     * @param {function} callback 回调函数
     */

    function clearMod(name, callback) {
        callback.call(null, name);
        if (name in waiting) {
            var wait = waiting[name];
            for (var i = 0, len = wait.length; i < len; i++) {
                wait[i].call(null, name);
            }
            delete waiting[name];
        }
        delete loaded[name];
        delete loading[name];
    }

    /**
     * execute loaded module,
     * if has dependencies then load and execute them;
     * @param {string} name module's name
     * @param {function} callback
     */

    function exeMod(name, callback) {
        var mod = loaded[name];
        if (mod.deps) {
            // execute module after dependencies
            var exed = false,
                afterDeps = function(dep) {
                    if (exed) {
                        return;
                    }
                    var depModules = isModsExed(mod.deps);
                    if (depModules) {
                        module[name] = mod.wrap.apply(null, depModules);
                        clearMod(name, callback);
                        exed = true;
                    }
                };
            for (var i = 0, len = mod.deps.length; i < len; i++) {
                loadMod(mod.deps[i], afterDeps);
            }
            afterDeps = notDefined;
        } else {
            module[name] = mod.wrap.apply();
            clearMod(name, callback);
        }
    }

    /**
     * make sure modules were executed.
     * if it is executed, return them.
     * @param {array} names array of module's name
     * @returns {boolean/array} all modules or false
     */

    function isModsExed(names) {
        var mods = [];
        for (var i = 0, len = names.length; i < len; i++) {
            var name = names[i],
                mod = module[name];
            if (name in module) {
                mods.push(mod);
            } else {
                return false;
            }
        }
        return mods;
    }

    /**
     * load and execute a module, prevent duplicate load or execute.
     * @param {string} name
     * @param {function} callback
     */

    function loadMod(name, callback) {
        // loaded and executed
        if (name in module) {
            callback.call(null, name);
            return;
        }
        // loading or waitting dependencies
        if (name in loading) { // prevent circle dependence
            waiting[name] = waiting[name] || [];
            waiting[name].push(callback);
            return;
        }
        loading[name] = true;
        // loaded but not executed
        if (name in loaded) {
            exeMod(name, callback);
            return;
        }
        // start download module
        G.loadScript(nameToUrl(name), function() {
            if (name in module) {
                clearMod(name, callback);
            } else if (name in loaded) {
                exeMod(name, callback);
            } else {
                G.log('Module: ' + name + ' is not defined!');
                module[name] = notDefined;
                clearMod(name, callback);
            }
        });
    }

    /**
     * Require executed(sync) module.
     * The different from execMod method is it's dependencies must be executed.
     * @param {string} name
     * @return {object} module
     */

    function requireSync(name) {
        if (name in module) {
            return module[name];
        }
        var mod = loaded[name];
        if (mod) {
            var depNames = mod.deps,
                depModules = [];
            if (depNames) {
                for (var i = 0, len = depNames.length; i < len; i++) {
                    depModules.push(requireSync(depNames[i]));
                }
            }
            module[name] = mod.wrap.apply(null, depModules);
            delete loaded[name];
            return module[name];
        } else {
            G.log('Module ' + name + ' is not loaded!');
            return;
        }
    }

    /**
     * require async module
     * @param {array} reqs modules name
     * @param {function} callback
     * @returns {array}
     */
    function requireAsync(reqs, callback) {
        // single module name
        if (reqs.length === 1) {
            loadMod(reqs[0], function(name) {
                if (callback.call) {
                    callback.call(null, module[name]);
                }
            });
            // multi module name
        } else {
            var i = 0,
                len = reqs.length,
                exed = false,
                // make sure callback only call once
                cb = function cb() {
                    if (exed) {
                        return;
                    }
                    var reqsModules = isModsExed(reqs);
                    if (reqsModules) {
                        if (callback.apply) {
                            callback.apply(null, reqsModules);
                        }
                        exed = true;
                    }
                };
            for (; i < len; i++) {
                loadMod(reqs[i], cb);
            }
        }
    }

    /**
     * require module
     * @param {array/string} reqs modules name
     * @param {function} callback
     * @returns {array}
     */
    function require(reqs, callback) {
        reqs = toString.call(reqs) === '[object Array]' ? reqs : [reqs];

        // if no callback, then use requireSync
        if (!callback) {
            if (reqs.length === 1) {
                return requireSync(reqs[0]);
            } else {
                var i = 0,
                    len = reqs.length,
                    reqsModules = [];
                for (; i < len; i++) {
                    reqsModules.push(requireSync(reqs[i]));
                }
                return reqsModules;
            }
        }
        requireAsync(reqs, callback);
    }

    /**
     * require module with preload
     * @param {array/string} reqs modules name
     * @param {function} callback
     * @returns {array}
     */
    G.req = function req(reqs, callback) {
        if (isPreloaded || !config.preload.length) {
            return require(reqs, callback);
            // return when callback === undefined
        } else {
            if (!isPreloading) {
                isPreloading = true;
                require(config.preload, function() {
                    isPreloaded = true;
                    isPreloading = false;
                    var i = 0,
                        l = config.preload.length;
                    for (; i < l; i++) {
                        preloadCallbacks[i]();
                    }
                });
            }
            preloadCallbacks.push(function() {
                require(reqs, callback);
            });
        }
    };

    /**
     * Use console.log to print log message, or do nothing~
     */
    if (typeof(console) !== 'undefined' && typeof(console.log) !== 'undefined') {
        G.log = console.log.apply ?
        function() {
            console.log.apply(console, arguments);
        } : console.log; // for IE8 has no apply method on console.log
    } else {
        G.log = function() {};
    }

})(window);
