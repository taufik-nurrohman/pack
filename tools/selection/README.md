Selection Utility
=================

Usage
-----

~~~ js
import {getSelection} from '@taufik-nurrohman/selection';

console.log(getSelection());
~~~

Methods
-------

### focusTo(node, mode = 1)

### getCharAfterCaret(node, n = 1)

### getCharBeforeCaret(node, n = 1)

### getSelection(node)

### hasSelection(node)

### insertAtSelection(node, content|childNode|[childNode, ...], mode = true)

### letSelection(node)

### redoState(node)

### resetState(node)

### restoreSelection(node, store)

### saveSelection(node)

### saveState(node)

### selectTo(node, mode = true)

### selectToNone(node)

### setSelection(node, range|[start, end])

### undoState(node)