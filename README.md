Pack
====

Usage
-----

~~~ js
import f from '@taufik-nurrohman/pack';

f.forEachArray([1, 2, 3, 4], function (v) { /* … */ });
~~~

~~~ js
import {forEachArray} from '@taufik-nurrohman/pack';

forEachArray([1, 2, 3, 4], function (v) { /* … */ });
~~~

~~~ js
import {document, event} from '@taufik-nurrohman/pack';

const {B, getHTML, setElement, setHTML} = document;
const {offEventDefault, onEvent} = event;

const mark = setElement('mark');

setHTML(mark, Date.now() + "");

onEvent('click', mark, function (e) {
    console.log(getHTML(this));
    offEventDefault(e);
});

setChildLast(B, mark);
~~~