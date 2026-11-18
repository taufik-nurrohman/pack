import {
    hasValue
} from '../has';

import {
    isArray,
    isObject,
    isSet
} from '../is';

import {
    toArrayCount,
    toObjectCount,
    toObjectKeys,
    toValue
} from '../to';

export const fromArray = x => {};
export const fromBool = x => {};
export const fromBoolean = fromBool;

export const fromHTML = (x, escapeQuote) => {
    x = x.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
    if (escapeQuote) {
        x = x.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
    }
    return x;
};

export const fromJSON = x => {
    let value = null;
    try {
        value = JSON.parse(x);
    } catch(e) {}
    return value;
};

export const fromNumber = x => {};

function _fromQueryDeep(o, props, value) {
    let prop = props.split('['), i, j = toArrayCount(prop), k;
    for (i = 0; i < j - 1; ++i) {
        k = ']' === prop[i].slice(-1) ? prop[i].slice(0, -1) : prop[i];
        k = "" === k ? toObjectCount(o) : k;
        o = o[k] || (o[k] = {});
    }
    k = ']' === prop[i].slice(-1) ? prop[i].slice(0, -1) : prop[i];
    o["" === k ? toObjectCount(o) : k] = value;
}

export const fromQuery = (x, parseValue = true, defaultValue = true) => {
    let out = {}, q = x && '?' === x[0] ? x.slice(1) : x;
    if ("" === q) {
        return out;
    }
    q.split('&').forEach(v => {
        let a = v.split('='),
            key = fromURL(a[0]),
            value = isSet(a[1]) ? fromURL(a[1]) : defaultValue;
        value = parseValue ? toValue(value) : value;
        // `a[b]=c`
        if (']' === key.slice(-1)) {
            _fromQueryDeep(out, key, value);
        // `a=b`
        } else {
            out[key] = value;
        }
    });
    return out;
};

export const fromStates = (...lot) => {
    let out = lot.shift();
    for (let i = 0, j = toArrayCount(lot); i < j; ++i) {
        for (let k in lot[i]) {
            // Assign value
            if (!isSet(out[k])) {
                out[k] = lot[i][k];
                continue;
            }
            // Merge array
            if (isArray(out[k]) && isArray(lot[i][k])) {
                out[k] = [/* Clone! */].concat(out[k]);
                for (let ii = 0, jj = toArrayCount(lot[i][k]); ii < jj; ++ii) {
                    if (!hasValue(lot[i][k][ii], out[k])) {
                        out[k].push(lot[i][k][ii]);
                    }
                }
            // Merge object recursive
            } else if (isObject(out[k]) && isObject(lot[i][k])) {
                out[k] = fromStates({/* Clone! */}, out[k], lot[i][k]);
            // Replace value
            } else {
                out[k] = lot[i][k];
            }
        }
    }
    return out;
};

export const fromString = x => {};

export const fromURL = x => decodeURIComponent(x);

export const fromValue = x => {
    if (isArray(x)) {
        return x.map(v => fromValue(v));
    }
    if (isObject(x)) {
        for (let k of toObjectKeys(x)) {
            x[k] = fromValue(x[k]);
        }
        return x;
    }
    return String(x);
};