import {isFunction} from '../is';
import {toCount} from '../to';

function _toIterator(v) {
    return v[Symbol.iterator]();
}

export const forEachArray = function (array, at) {
    for (let i = 0, j = toCount(array), v; i < j; ++i) {
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
    let items = _toIterator(map),
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

export const forEachObject = function (object, at) {
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

export const forEachSet = function (set, at) {
    let items = _toIterator(set),
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

export const setObjectAttributes = function (of, attributes, asStaticAttributes) {
    if (!asStaticAttributes) {
        of = getPrototype(of);
    }
    return forEachObject(attributes, (v, k) => {
        Object.defineProperty(of, k, v);
    }), of;
};

export const setObjectMethods = function (of, methods, asStaticMethods) {
    if (!asStaticMethods) {
        of = getPrototype(of);
    }
    return forEachObject(methods, (v, k) => {
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