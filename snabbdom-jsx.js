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

function switchAttrs(tag, attrName, attrs, modules) {
    var idx = attrName.indexOf('-');
    if (idx != -1) {
        let mod = attrName.slice(0, idx);
        if (modules.indexOf(mod) != -1) {
            let key = attrName.slice(idx+1);
            return [mod, key, attrs[attrName]];
        }
    }

    if (modules.indexOf(attrName) != -1) {
        if (!isPrimitive(attrs[attrName])) {
            return [attrName, null, attrs[attrName]];
        } else {
            console.warn(`ignored <${tag}> ${attrName} = ${JSON.stringify(attrs[attrName])}`);
            return null;
        }
    }

    return null;
}

function switchAttrsHtml(tag, attrName, attrs, modules) {
    var v = switchAttrs(tag, attrName, attrs, modules);
    if ( v ) { return v; }

    if (isNativeTag(tag)) {
        if (isHtmlAttribute(attrName)) {
            return ['attrs', attrName, attrs[attrName]];
        }
    }

    return ['props', attrName, attrs[attrName]];
}

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
                    "for", "httpEquiv", "icon", "inputMode", "integrity",
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

function isHtmlAttribute(attr) {
    return attrs.has(attr) || (attr.indexOf("data-") === 0) || (attr.indexOf("aria-") === 0)
}

function normalizeAttrs(traits, tag, attrs) {
    var map = { ns: traits.ns };
    for (var key in attrs) {
        if (key === 'key') { continue; }

        var res = traits.attrSwitcher(tag, key, attrs, traits.modules);
        if (res !== null) {
            var [mod, attr, value] = res;
            if (attr) {
                addAttr(mod, attr, value)
            } else {
                mergeAttr(mod, value);
            }
        }
    }
    return map;

    function addAttr(namespace, key, val) {
        var ns = map[namespace] || (map[namespace] = {});
        ns[key] = val;
    }

    function mergeAttr(namespace, obj) {
        map[namespace] = map[namespace] || {};

        if (obj.constructor.name === 'Object') {
            Object.assign(map[namespace], obj);
        } else {
            map[namespace] = obj;
        }
    }
}

function buildFromStringTag(traits, tag, attrs, children) {
    return {
        sel      : tag,
        data     : normalizeAttrs(traits, tag, attrs),
        children : children.map((c) => isPrimitive(c) ? {text: c} : c),
        key      : attrs.key
    };
}

function buildFromComponent(_traits, tag, attrs, children) {
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

function buildVnode(traits, tag, attrs, children) {
    attrs = attrs || {};
    children = maybeFlatten(children);
    if(typeof tag === 'string') {
        return buildFromStringTag(traits, tag, attrs, children)
    } else {
        return buildFromComponent(traits, tag, attrs, children)
    }
}

function JSX(traits) {
    return function jsxWithCustomNS(tag, attrs, children) {
        if(arguments.length > 3 || !Array.isArray(children)) {
            children = slice.call(arguments, 2);
        }
        return buildVnode(traits, tag, attrs, children);
    };
}



var modulesNS = ['hook', 'on', 'style', 'props', 'attrs', 'dataset'];

const htmlTraits = {
    ns: undefined,
    modules: modulesNS,
    attrSwitcher: switchAttrsHtml
};

var SVGNS = 'http://www.w3.org/2000/svg';
const svgTraits = {
    ns: SVGNS,
    modules: modulesNS,
    attrSwitcher: switchAttrs
};

module.exports = {
    html: JSX(htmlTraits),
    svg:  JSX(svgTraits),
    JSX:  JSX
};
