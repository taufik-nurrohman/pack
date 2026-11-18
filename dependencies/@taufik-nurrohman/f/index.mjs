import {
    isArray,
    isBool,
    isCallable,
    isFloat,
    isFunction,
    isInteger,
    isNull,
    isNumeric,
    isObject,
    isString
} from '../is';
import { isCallable } from '../is/index.mjs';

import {
    toArrayCount,
    toIterator,
    toStringCount
} from '../to';

export const forEach = function (object, at) {
    let v;
    for (let k in object) {
        if (!Object.hasOwn(object, k)) {
            continue;
        }
        v = at.call(object, object[k], k);
        if (-1 === v) {
            delete object[k];
            continue;
        } else if (0 === v) {
            break;
        }
    }
    return object;
};

export const forEachArray = function (array, at) {
    for (let i = 0, j = toArrayCount(array), v; i < j; ++i) {
        v = at.call(array, array[i], i);
        if (-1 === v) {
            array.splice(i--, 1);
            --j;
            continue;
        } else if (0 === v) {
            break;
        }
    }
    return array;
};

export const forEachMap = function (map, at) {
    let items = toIterator(map),
        item = items.next();
    while (!item.done) {
        let [k, v] = item.value;
        v = at.call(map, v, k);
        if (-1 === v) {
            letValueInMap(k, map);
        } else if (0 === v) {
            break;
        }
        item = items.next();
    }
    return map;
};

export const forEachObject = forEach;

export const forEachSet = function (set, at) {
    let items = toIterator(set),
        item = items.next();
    while (!item.done) {
        let k, v = item.value;
        v = at.call(set, v, k = v);
        if (-1 === v) {
            letValueInMap(k, set);
        } else if (0 === v) {
            break;
        }
        item = items.next();
    }
    return set;
};

export const getPrototype = of => of.prototype;

export const getReference = key => getValueInMap(key, references) || null;

export const getValueInMap = (k, map) => map.get(k);

export const hasKeyInMap = (k, map) => map.has(k);

export const letReference = k => letValueInMap(k, references);

export const letValueInMap = (k, map) => map.delete(k);

export const onAnimationsEnd = (node, task) => {
    return (isFunction(node.getAnimations) ? Promise.all(node.getAnimations().map(v => v.finished)).then(task) : task()), node;
};

export const php = {};

// TODO
php.is_array = isArray;
php.is_bool = isBool;
php.is_callable = isCallable;
php.is_float = isFloat;
php.is_int = isInteger;
php.is_null = isNull;
php.is_numeric = isNumeric;
php.is_object = isObject;
php.is_string = isString;
php.ltrim = function (str, s = "") {};
php.rtrim = function (str, s = "") {};
php.strcspn = function (str, s = "", i = 0) {};
php.stripos = function (str, s = "", i = 0) {};
php.strlen = str => toStringCount(str);
php.strpos = function (str, i = 0) {};
php.strspn = function (str, s = "", i = 0) {};
php.strstr = function (str, s = "", before) {};
php.trim = function (str, s = "") {};

export const setObjectAttributes = function (of, attributes, asStaticAttributes) {
    if (!asStaticAttributes) {
        of = getPrototype(of);
    }
    return forEach(attributes, (v, k) => {
        Object.defineProperty(of, k, v);
    }), of;
};

export const setObjectMethods = function (of, methods, asStaticMethods) {
    if (!asStaticMethods) {
        of = getPrototype(of);
    }
    return forEach(methods, (v, k) => {
        of[k] = v;
    }), of;
};

export const setPrototype = (of, value) => (of.prototype = value);

export const setReference = (key, value) => setValueInMap(key, value, references);

export const setValueInMap = (k, v, map) => map.set(k, v);

export const toKeyFirstFromMap = map => map.keys().next().value;

export const toKeyLastFromMap = map => {
    let key, last;
    for (key of map.keys()) last = key;
    return last;
};

export const toKeysFromMap = function (map) {
    let r = [];
    return forEachMap(map, (v, k) => {
        r.push(k);
    }), r;
};

export const toValueFirstFromMap = map => toValuesFromMap(map).shift();

export const toValueLastFromMap = map => toValuesFromMap(map).pop();

export const toValuesFromMap = function (map) {
    let r = [];
    return forEachMap(map, v => {
        r.push(v);
    }), r;
};

const references = new WeakMap;