这次我们来聊一聊Range，之前没有重视过这块儿，用到的时候难免焦头烂额，借这个机会，把这方面的知识梳理一下。

首先要明确两个概念，Range 和 Selection 不是一回事儿，Range 在浏览器中是看不见的，而 Selection 则是看得见的，就像用户选中的一段文字会变成蓝底白字。Range 的主要作用是操作 DOM。

- Range
```js
//Range实例的属性
collapsed, commonAncestorContainer, startContainer, startOffset, endContainer, endOffset
//Range实例的方法
//定位方法
setStart(container, offset), setEnd(container, offset), setStartBefore, setStartAfter, setEndBefore, setEndAfter,
selectNode, selectNodeContents, collapse
//编辑方法
cloneContents, extractContents, deleteContents, insertNode, surroundConntents,
//其他方法
compareBoundaryPoints, cloneRange, detach, toString
```
- Selection
```js
//属性
anchorNode, anchorOffset, focusNode, focusOffset, isCollapsed, rangeCount
//方法
getRangeAt(index), collapse, extend, modify, collapseToStart, collapseToEnd, selectAllChildren, addRange, removeRange, removeAllRanges,
deleteFromDocument, selectionLanguageChange, toString, containsNode,
```

- Range => Selection
```js
//针对有value属性的元素
let input = document.getElementsByTagName('textarea')[0];
let val = input.value, len = val.length;
if (input.createTextRange) {
    let range = input.creatTextRange();
    range.moveEnd('character', len);
    range.moveStart('character', 0);
    range.select();
} else {
    input.setSelectionRange(0, len);
    input.focus();
}
//其他元素
let userSelection;
if (window.getSelection) {
    userSelection = window.getSelection();
} else if (document.selection) {
    userSelection = document.selection.createRange();
}
var range = document.createRange();
range.selectNodeContents(span);
userSelection.addRange(range);
```

- Selection => Range
```js
//获取用户选择的内容
let userSelection;
if (window.getSelection) {
    userSelection = window.getSelection();
} else if (document.selection) {
    userSelection = document.selection.createRange();
}

const getRangeFromSelection = function (selectionObj) {
    if (selectionObj.getRangeAt) {
        return selectionObj.getRangeAt(0);
    } else {
        let range = document.createRange();
        range.setStart(selectionObj.anchorNode, selectionObj.anchorOffset);
        range.setEnd(selectionObj.focusNode, selectionObj.focusOffset);
        return range;
    }
}
let rangeObj = getRangeFromSelection(userSelection);
```

