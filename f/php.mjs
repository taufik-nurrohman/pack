import {
    isArray,
    isBool,
    isCallable,
    isFloat,
    isInteger,
    isNull,
    isNumeric,
    isObject,
    isString
} from '@taufik-nurrohman/is';

import {
    toStringCount
} from '@taufik-nurrohman/to';

export const is_array = isArray;
export const is_bool = isBool;
export const is_callable = isCallable;
export const is_float = isFloat;
export const is_int = isInteger;
export const is_null = isNull;
export const is_numeric = isNumeric;
export const is_object = isObject;
export const is_string = isString;

export const ltrim = function (str, s = "") {};

export const rtrim = function (str, s = "") {};

export const strcspn = function (str, s = "", i = 0) {};

export const stripos = function (str, s = "", i = 0) {};

export const strlen = str => toStringCount(str);

export const strpos = function (str, i = 0) {};

export const strspn = function (str, s = "", i = 0) {};

export const strstr = function (str, s = "", before) {};

export const trim = function (str, s = "") {};