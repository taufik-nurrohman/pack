import {D, getChildFirst, getChildren, getHTML, getType, setChildLast, setElement, setHTML} from '../document';
import {forEachArray, getValueInMap, hasKeyInMap, letValueInMap, setValueInMap} from '../f';
import {isArray, isString} from '../is';
import {toCount} from '../to';

const {now} = Date;

const history = new WeakMap;
const historyIndex = new WeakMap;

const _getSelection = () => D.getSelection();

const _setRange = () => D.createRange();

export const focusTo = (node, mode, selection) => selectTo(node, mode || 1, selection);

export const getCharAfterCaret = (node, n, selection) => {
    selection = selection || _getSelection();
    if (!hasSelection(node, selection)) {
        return null;
    }
    let range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);
    range.setEnd(node, toCount(node));
    return (range + "").slice(0, n || 1);
};

export const getCharBeforeCaret = (node, n, selection) => {
    selection = selection || _getSelection();
    if (!hasSelection(node, selection)) {
        return null;
    }
    let range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);
    range.setStart(node, 0);
    return (range + "").slice(-(n || 1));
};

// The `node` parameter is currently not in use
export const getSelection = (node, selection) => {
    selection = selection || _getSelection();
    if (!hasSelection(node, selection)) {
        return null;
    }
    let c = setElement('div');
    for (let i = 0, j = selection.rangeCount; i < j; ++i) {
        setChildLast(c, selection.getRangeAt(i).cloneContents());
    }
    return getHTML(c);
};

// The `node` parameter is currently not in use
export const hasSelection = (node, selection) => (selection || _getSelection()).rangeCount > 0;

// <https://stackoverflow.com/a/6691294/1163000>
// The `node` parameter is currently not in use
export const insertAtSelection = (node, content, mode, selection) => {
    selection = selection || _getSelection();
    let from, range, to;
    if (!hasSelection(node, selection)) {
        return false;
    }
    range = selection.getRangeAt(0);
    range.deleteContents();
    to = D.createDocumentFragment();
    let nodeCurrent, nodeFirst, nodeLast;
    if (isString(content)) {
        from = setElement('div');
        setHTML(from, content);
        while (nodeCurrent = getChildFirst(from, 1)) {
            nodeLast = setChildLast(to, nodeCurrent);
        }
    } else if (isArray(content)) {
        forEachArray(content, v => (nodeLast = setChildLast(to, v)));
    } else {
        nodeLast = setChildLast(to, content);
    }
    nodeFirst = getChildFirst(to, 1);
    range.insertNode(to);
    if (nodeLast) {
        range = range.cloneRange();
        range.setStartAfter(nodeLast);
        range.setStartBefore(nodeFirst);
        if (1 === mode) {
            range.collapse(true);
        } else if (-1 === mode) {
            range.collapse();
        }
        setSelection(node, range, selectToNone(node, selection));
    }
    return selection;
};

// The `node` parameter is currently not in use
export const letSelection = (node, selection) => {
    selection = selection || _getSelection();
    return selection.empty(), selection;
};

export const redoState = (node, selection) => {
    let h = getValueInMap(node, history) ?? [],
        i = getValueInMap(node, historyIndex) ?? toCount(h) - 1, j;
    if (!(j = h[i + 1])) {
        return restoreSelection(node, h[i][1], selection);
    }
    i++;
    setValueInMap(node, i, historyIndex);
    return setHTML(node, j[0]), restoreSelection(node, j[1], selection);
};

export const resetState = (node, selection) => {
    letValueInMap(node, history);
    letValueInMap(node, historyIndex);
    return saveState(node, selection);
};

// <https://stackoverflow.com/a/13950376/1163000>
export const restoreSelection = (node, store, selection) => {
    let index = 0,
        range = _setRange();
    range.setStart(node, 0);
    range.collapse(true);
    let exit, hasStart, nodeCurrent, nodeStack = [node];
    while (!exit && (nodeCurrent = nodeStack.pop())) {
        if (3 === getType(nodeCurrent)) {
            let indexNext = index + toCount(nodeCurrent);
            if (!hasStart && store[0] >= index && store[0] <= indexNext) {
                range.setStart(nodeCurrent, store[0] - index);
                hasStart = true;
            }
            if (hasStart && store[1] >= index && store[1] <= indexNext) {
                exit = true;
                range.setEnd(nodeCurrent, store[1] - index);
            }
            index = indexNext;
        } else {
            forEachArray(getChildren(nodeCurrent, null, 1), v => nodeStack.push(v));
        }
    }
    return setSelection(node, range, letSelection(node, selection));
};

// <https://stackoverflow.com/a/13950376/1163000>
export const saveSelection = (node, selection) => {
    let range = (selection || _getSelection()).getRangeAt(0),
        rangeClone = range.cloneRange();
    rangeClone.selectNodeContents(node);
    rangeClone.setEnd(range.startContainer, range.startOffset);
    let start = toCount(rangeClone + "");
    return [start, start + toCount(range + "")];
};

export const saveState = (node, selection) => {
    let h = getValueInMap(node, history) ?? [],
        i = getValueInMap(node, historyIndex) ?? toCount(h) - 1, j,
        v = getHTML(node) ?? "";
    j = hasSelection(node, selection) ? saveSelection(node, selection) : [];
    if (h[i] && v === h[i][0] && j[0] === h[i][1][0] && j[1] === h[i][1][1]) {
        return node; // No change
    }
    // Trim future history if `undoState()` was used
    if (i < toCount(h) - 1) {
        h.splice(i + 1);
    }
    h.push([v, j, now()]);
    setValueInMap(node, h, history);
    setValueInMap(node, ++i, historyIndex);
    return node;
};

export const selectTo = (node, mode, selection) => {
    selection = selection || _getSelection();
    letSelection(node, selection);
    let range = _setRange();
    range.selectNodeContents(node);
    selection = setSelection(node, range, selection);
    if (1 === mode) {
        selection.collapseToEnd();
    } else if (-1 === mode) {
        selection.collapseToStart();
    } else {
        // Select all
    }
};

// The `node` parameter is currently not in use
export const selectToNone = (node, selection) => {
    selection = (selection || _getSelection());
    // selection.removeAllRanges();
    if (selection.rangeCount) {
        selection.removeRange(selection.getRangeAt(0));
    }
    return selection;
};

// The `node` parameter is currently not in use
export const setSelection = (node, range, selection) => {
    selection = selection || _getSelection();
    if (isArray(range)) {
        return restoreSelection(node, range, selection);
    }
    return selection.addRange(range), selection;
};

export const undoState = (node, selection) => {
    let h = getValueInMap(node, history) ?? [],
        i = getValueInMap(node, historyIndex) ?? toCount(h) - 1, j;
    if (!(j = h[i - 1])) {
        return restoreSelection(node, h[i][1], selection);
    }
    i--;
    setValueInMap(node, i, historyIndex);
    return setHTML(node, j[0]), restoreSelection(node, j[1], selection);
};