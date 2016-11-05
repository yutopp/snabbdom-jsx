"use strict";

var slice = Array.prototype.slice;

function isPrimitive(val) {
    return typeof val === 'string'   ||
           typeof val === 'number'   ||
           typeof val === 'boolean'  ||
           typeof val === 'symbol'   ||
           val === null              ||
           val === undefined;
}

function normalizeAttrs(attrs, nsURI, defNS, modules, tag) {
    var map = { ns: nsURI };
    for (var key in attrs) {
        if(key !== 'key' && key !== 'classNames' && key !== 'selector' && key !== 'id') {
            var idx = key.indexOf('-');
            if (idx != -1) {
                let nmod = key.slice(0, idx);
                let nkey = key.slice(idx+1);
                if (modules.indexOf(nmod) != -1) {
                    addAttr(nmod, nkey, attrs[key]);
                } else {
                    addAttr(defNS, key, attrs[key])
                }
            } else {
                if (modules.indexOf(key) != -1) {
                    if (!isPrimitive(attrs[key])) {
                        let nmod = key;
                        let nattrs = attrs[key];
                        for (var nkey in nattrs) {
                            addAttr(nmod, nkey, nattrs[nkey]);
                        }
                    } else {
                        console.log(`ignored <${tag}> ${key} = ${JSON.stringify(attrs[key])}`);
                    }
                } else {
                    addAttr(defNS, key, attrs[key]);
                }
            }
        }
    }
    return map;

    function addAttr(namespace, key, val) {
        var ns = map[namespace] || (map[namespace] = {});
        ns[key] = val;
    }
}

function genNewAttrs(attrHooks, attrs) {
    var map = {};
    for (var key in attrs) {
        var nkey = key;
        if (attrHooks[key]) {
            nkey = attrHooks[key](key);
        }
        map[nkey] = attrs[key];
    }
    return map;
}

function buildFromStringTag(nsURI, defNS, modules, attrHooks, tag, attrs, children) {
    attrs = genNewAttrs(attrHooks, attrs);

    return {
        sel      : tag,
        data     : normalizeAttrs(attrs, nsURI, defNS, modules, tag),
        children : children.map((c) => isPrimitive(c) ? {text: c} : c),
        key      : attrs.key
    };
}

function buildFromComponent(nsURI, defNS, modules, _attrHooks, tag, attrs, children) {
    var res;
    if (typeof tag === 'function') {
        res = tag(attrs, children);
    } else if(tag && typeof tag.view === 'function') {
        res = tag.view(attrs, children);
    } else if(tag && typeof tag.render === 'function') {
        res = tag.render(attrs, children);
    } else {
        throw "JSX tag must be either a string, a function or an object with 'view' or 'render' methods";
    }

    res.key = attrs.key;
    return res;
}

function flatten(nested, start, flat) {
    for (var i = start, len = nested.length; i < len; i++) {
        var item = nested[i];
        if (Array.isArray(item)) {
            flatten(item, 0, flat);
        } else {
            flat.push(item);
        }
    }
}

function maybeFlatten(array) {
    if (array) {
        for (var i = 0, len = array.length; i < len; i++) {
            if (Array.isArray(array[i])) {
                var flat = array.slice(0, i);
                flatten(array, i, flat);
                array = flat;
                break;
            }
        }
    }
    return array;
}

function buildVnode(nsURI, defNS, modules, attrHooks, tag, attrs, children) {
    attrs = attrs || {};
    children = maybeFlatten(children);
    if(typeof tag === 'string') {
        return buildFromStringTag(nsURI, defNS, modules, attrHooks, tag, attrs, children)
    } else {
        return buildFromComponent(nsURI, defNS, modules, attrHooks, tag, attrs, children)
    }
}

function JSX(nsURI, defNS, modules, attrHooks) {
    attrHooks = attrHooks || {};
    return function jsxWithCustomNS(tag, attrs, children) {
        if(arguments.length > 3 || !Array.isArray(children)) {
            children = slice.call(arguments, 2);
        }
        return buildVnode(nsURI, defNS, modules, attrHooks, tag, attrs, children);
    };
}



var modulesNS = ['hook', 'on', 'style', 'props', 'attrs', 'dataset'];
var attrHooks = {
    'class': function (_) { return 'classNames'},
    'for':   function (_) { return 'htmlFor' }
};

var modulesNSClsMod = ['hook', 'on', 'style', 'class', 'props', 'attrs', 'dataset'];

const basicAttrs = ["accept", "acceptCharset", "accessKey", "action",
                    "allowFullScreen", "allowTransparency", "alt", "async",
                    "autoComplete", "autoFocus", "autoPlay", "capture",
                    "cellPadding", "cellSpacing", "challenge", "charSet",
                    "checked", "cite", "id", "class", "colSpan",
                    "cols", "content", "contentEditable", "contextMenu",
                    "controls", "coords", "crossOrigin", "data", "dateTime",
                    "default", "defer", "dir", "disabled", "download",
                    "draggable", "encType", "form", "formAction", "formEncType",
                    "formMethod", "formNoValidate", "formTarget", "frameBorder",
                    "headers", "height", "hidden", "high", "href", "hrefLang",
                    "htmlFor", "httpEquiv", "icon", "id", "inputMode", "integrity",
                    "is", "keyParams", "keyType", "kind", "label", "lang", "list",
                    "loop", "low", "manifest", "marginHeight", "marginWidth",
                    "max", "maxLength", "media", "mediaGroup", "method", "min",
                    "minLength", "multiple", "muted", "name", "noValidate",
                    "nonce", "open", "optimum", "pattern", "placeholder", "poster",
                    "preload", "profile", "radioGroup", "readOnly", "rel",
                    "required", "reversed", "role", "rowSpan", "rows", "sandbox",
                    "scope", "scoped", "scrolling", "seamless", "selected",
                    "shape", "size", "sizes", "span", "spellCheck", "src",
                    "srcDoc", "srcLang", "srcSet", "start", "step", "style",
                    "summary", "tabIndex", "target", "title", "type", "useMap",
                    "value", "width", "wmode", "wrap"];
const attrs = new Set(basicAttrs);

// if the tag name is lower-case, assume it is a native tag
function isNativeTag(tag) {
    return tag === tag.toLowerCase()
}

function isAttribute(tag, attr) {
    return isNativeTag(tag);
}

const htmlTraits = {
    ns: undefined,
};

var SVGNS = 'http://www.w3.org/2000/svg';
const svgTraits = {
    ns: SVGNS,
};

module.exports = {
    html: JSX(undefined, 'props', modulesNS, attrHooks),
    svg:  JSX(SVGNS, 'attrs', modulesNS),
    JSX:  JSX
};
