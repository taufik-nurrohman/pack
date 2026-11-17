Any Utility
===========

Utility functions that do not fit into a specific category.

Usage
-----

~~~ js
import {forEachArray} from '@taufik-nurrohman/f';

forEachArray([1, 2, 3], function (value, key) {
    console.log(value);
});
~~~

Methods
-------

### forEachArray(array, at)

~~~ js
forEachArray(array, function (value, index) {
    return -1; // Delete at index `index`
    return 0; // Break
    return 1; // Continue
    return; // Continue
});
~~~

### forEachMap(map, at)

~~~ js
forEachMap(map, function (value, key) {
    return -1; // Delete entry `key`
    return 0; // Break
    return 1; // Continue
    return; // Continue
});
~~~

### forEachObject(object, at)

~~~ js
forEachObject(object, function (value, key) {
    return -1; // Delete entry `key`
    return 0; // Break
    return 1; // Continue
    return; // Continue
});
~~~

### forEachSet(set, at)

~~~ js
forEachSet(set, function (value) {
    return -1; // Delete entry `value`
    return 0; // Break
    return 1; // Continue
    return; // Continue
});
~~~

### getPrototype(of)

### getReference(key)

### getValueInMap(key, map)

### hasKeyInMap(key, map)

### letReference(key)

### letValueInMap(key)

### onAnimationsEnd(node, task)

### setObjectAttributes(of, attributes, asStaticAttributes)

~~~ js
function Editor(self, state) {
    this.self = self;
    this.state = state;
    return this;
}

setObjectAttributes(Editor, {
    'name': {
        value: 'Editor'
    }
}, true);

setObjectAttributes(Editor, {
    'value': {
        get: function () {
            return this.self.value;
        },
        set: function (value) {
            this.self.value = value;
        }
    }
});
~~~

### setObjectMethods(of, methods, asStaticMethods)

~~~ js
function Editor(self, state) {
    this.self = self;
    this.state = state;
    return this;
}

setObjectMethods(Editor, {
    'restore': function () {
        this.value = localStorage.getItem('session');
        return this;
    },
    'save': function () {
        localStorage.setItem('session', this.value);
        return this;
    }
});
~~~

### setPrototype(of, value)

### setReference(key, value)

### setValueInMap(key, value, map)

### toKeyFirstFromMap(map)

### toKeyLastFromMap(map)

### toKeysFromMap(map)

### toValueFirstFromMap(map)

### toValueLastFromMap(map)

### toValuesFromMap(map)