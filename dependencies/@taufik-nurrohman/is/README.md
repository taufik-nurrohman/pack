Conditional Utility
===================

I like to group all type checking tasks into helper functions like this to be used internally. This has the advantage in case of code minification.

These functions are very inspired by PHP which already has standard functions such as `is_array()`, `is_object()`, `is_string()`, etc.

Usage
-----

~~~ js
import {isString} from '@taufik-nurrohman/is';

console.log(isString('false'));
~~~

Methods
-------

### isArray(any)

### isBool(any)

### isBoolean(any)

This is an alias of `isBool(any)`.

### isCallable(any, parent = window)

~~~ js
console.log(isCallable('parseInt'));
console.log(isCallable(parseInt));
~~~

### isDefined(any)

### isFloat(number)

### isFunction(any)

### isInstance(object, constructor, exact = false)

### isInteger(number)

### isNull(any)

### isNumber(any)

### isNumeric(string)

### isObject(any, isPlain = true)

### isScalar(any)

### isSet(any)

### isString(any)

### isVoid(any)