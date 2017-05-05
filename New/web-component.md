Web Components 是几项技术综合的结果：
- Custom Elements
- HTML Templates
- Shadow DOM
- HTML Imports  

下面将分别介绍这几项技术，同时在最后给出一个例子。

# Custom Elements
首先要定义一个类，这个类用来生成自定义的元素，所以这个类要继承 HTMLElement，如果是在已有元素的基础上扩展，则继承已有元素的构造函数（例如，在 button 的基础上进行扩展，需要继承 HTMLButtonElement）。

自定义元素与一般元素的区别在于，可以设定该元素的生命周期回调。
- constructor - 创建元素时执行
- connectedCallback - 元素插入DOM时执行
- disconnectedCallback - 元素被移除DOM时执行
- attributeChangedCallback - 元素的属性被增、删、改时执行。另外，通过在类上定义静态 getter 属性 observedAttributes 可以指定哪些属性被监听，返回值可以为数组。
- adoptedCallback 使用 `document.adoptNode(node)` 触发

注意，attributeChangedCallback 的回调函数的参数为：属性名称, 旧值, 新值, 命名空间。当设置值或者删除值时，相应的旧值或者新值会缺省为 null。

定义好类之后，还需要注册才能使用。原因其实很简单，如果你不告诉浏览器你这个自定义元素在 HTML 中是个怎样的标签（叫什么名字，是否继承已有元素），浏览器根本不知道该怎么渲染你这个自定义元素啊。注册通过下面的方法完成。
```js
// 目前 Chrome58 支持两种注册方法
const myCustom = document.registerElement('my-custom', CustomElment, {extends: 'button'})
// 下面是最新的规范中指定的方法
//@returns undefined
customElements.define('my-custom', CustomElment, {extends: 'button'})
```

定义和注册之后，我们就可以使用自定义元素了。有两种使用方法，一种是直接在 HTML 中写标签，另一种则是通过 JS 来动态创建自定义元素。
*方法一*
```html
<my-custom></my-custom>
<!-- 如果是扩展 -->
<button is="my-button"></button>
```
*方法二*
```js
const myEle = document.createElement('my-custom')
// 如果是扩展
const myButton = document.createElement('button', 'my-button')
```

这里还有一个问题可能好多人都会问，如果这个类定义在自定义元素之前还好说，要是在类定义之前就出现了自定义的标签，浏览器会怎么处理呢。其实浏览器会把不认识的标签标记成 undefined 状态（这时可以通过 :not(:defined) 选择器来选中它），等我们定义好类并注册完后，浏览器会对我们的自定义元素进行类似于重新渲染的操作，并将其标记成 defined 状态（这是可以通过 :defined 选择器来选中它）。  

另外，现在有一个方法可以侦听自定义元素的状态：
```js
//@param String tagName
//@returns promise
customeElements.whenDefined(tagName)
```

# HTML Templates
`<template>` 元素并不会被渲染，但依然会被浏览器解析。
template 元素的 content 属性是一个 documentFragment，这意味着我们可以操纵 template 包含的 DOM 结构，然后使用 `document.importNode()` 或者 `.clone` 方法将全部或部分 DOM 插入文档中进行渲染。

# Shadow DOM
Shadow DOM 的出现是为了完成代码作用域的隔离，尤其是 CSS 的隔离。我们知道 CSS 样式是层叠的，也就是说当前页面里的每一个元素都可能会受到样式表中每一条规则的影响，有时候我们想避免这种影响，尤其是我们想写一个独立的组件时。我们希望使用组件的用户引入这个组件的时候，组件不会受已有样式的影响。想想这个隔离还是很有必要的。另外，JS 也是会被隔离的，比如当我们使用 document.querySelector 去搜索具备某些特征的元素时，shadowRoot 中的元素并不会被搜索，这样可以避免 DOM 的误操作。
Shadow DOM 必须附加在一个元素上。这个元素可以是 HTML 中的某个元素，也可以是脚本动态创建出来的元素；可以是原生的元素，也可以是自定义元素。实际上只有以下列出的元素可以挂载 shadowRoot。  

自定义元素
article aside blockquote body div header footer
h1 h2 h3 h4 h5 h6
nav p section span  

要改变 Shadow DOM 中元素的样式，可以在 Shadow DOM 中添加 style 标签，这里定义的样式通常情况下只能影响 shadowRoot 里的元素。  
还要注意的一点是，一旦一个元素挂载了 shadowRoot，它所有的子元素都将被隐藏掉。那是不是说子元素就没有任何的作用了呢，也不是。我们可以将子元素填充进 shadowRoot 中相应的占位符。

创建 Shadow DOM 的语法如下：
```js
//@returns [object ShadowRoot]shadowRoot
//shadowRootInit: {mode: 'open' | 'closed'} open 代表开放的封装模式 closed 代表关闭的封装模式
const shadowRoot = Element.attachShadow(shadowRootInit)
```  

在 shadowRoot 中，我们可以使用一种特殊的叫做 slot 的标签，实际上相当于占位符，其由 HTMLSlotElement 定义。slot 元素包含如下属性方法。
- name 就是标识这个占位符的一个名字而已，将要分配给这个占位符的元素可以通过将自身的 slot 属性指定为这个名字，从而指定是要分配给哪个占位符。
- assignedNodes(option) 返回分配给这个占位符的元素序列，如果没有分配，返回空数组。options 有一个 flatten 属性，默认为 false，设置为 true 时，会返回 slot 元素原先准备的 fallback 内容。  

每个 HTML 元素现在都有如下属性方法。
- shadowRoot 指向该元素下挂载的 shadowRoot，如果元素没有挂载 shadowRoot，则该属性为 null。
- assignedSlot 只读，这个元素如果被分配到 shasdowRoot 中的一个占位符（即上文中提到的 slot 标签），则会返回对应的那个 slot 元素。
- slot 元素的 slot 属性，用来指定 slot 的名称。
- isConnected() 返回布尔值。用来表示该元素是否存在于当前 HTML 文档中。
- getRootNode(options) 返回该元素的 root，即当前作用域的顶级文档对象，可能是 shadowRoot 或 document。当 options 的 composed 属性为 true 时，会跨越可能存在的 shadowRoot 直达当前页面最顶层，即 document。

shadowRoot 类似于 documentFragment，基本上 documentFragment 上的方法 shadowRoot 都可以使用，只不过作用域被限制在 shadowRoot 内。除此之外，shadowRoot 还有以下属性。
- mode: open | closed 当设置为 closed 时，外部无法通过元素的 shadowRoot 属性访问到其下的 shadowRoot（除非你把 shadowRoot 保存在了一个全局变量里）。
- host shadowRoot 所依附的元素
- innerHTML shadowRoot 的 HTML 内容

另外还有一些 document 和 shadowRoot 共有的属性和方法，由 DocumentOrShadowRoot 这个构造函数定义，由于是共有的，因此其与 document 中对应方法的表现大体一致。
- activeElement
- styleSheets
- getSelection()
- elementFromPoint()
- elementsFromPoint()
- caretPositionFromPoint()

*CSS*
虽说是为了隔离代码作用域而生的，但是总有些时候我们需要一些手段来对 shadowRoot 里的东西施加一定的影响。
- 外部控制 shadowRoot
- shadowRoot 控制其所属元素的样式
- shadowRoot 控制通过 slot 传进来的 HTML 的样式

| 选择器 | 在 shadowRoot 中 | 在 document 中 |
|:----------:| ------------ | ------------ |
|:host|匹配宿主元素|NaN|
|:host(<selector>)|匹配括号中选择器对应的宿主元素|匹配括号中选择器对应的元素|
|:host-context(<selector>)|匹配括号中选择器对应的，宿主元素的父级元素|NaN|
|::slotted()|匹配通过 slot 传进来的元素|NaN|
|::shadow(已弃用)|NaN|匹配 shadowRoot|
|/deep/(已弃用)|NaN|匹配 shadowRoot 中的后代元素|

层叠规则，对于两个优先级相同的 CSS 声明，不带 !important 时，外部样式优先于内部样式，带 !important 时，内部样式优先于外部样式。这实际上是为了让外部样式能够控制内部样式，而内部样式又不至于失去控制权。  

继承，shadowRoot 中顶级元素的样式从宿主元素继承而来。

*Event*
在 shadowRoot 中，你可以监控通过 slot 传递进来的 DOM 元素的变化。这个监控手段就是侦听 slot 元素分发的 slotchange 事件。

*事件的作用域*
默认情况下，事件不会冒泡到 shadowRoot 的外面，除了一些 UIEvents。对于自定义事件，可以通过指定 bubbles 和 composed 属性为 true，来完成跨越 shadowRoot 的事件冒泡。
```js
d.dispatchEvent(new Event('my-custom', {bubbles: true, composed: true}))
```
与此同时，在侦听这种跨越 shadowRoot 的冒泡事件时，event 对象上提供了一个 composedPath 方法，用来替代 event.path。

# HTML Imports  
HTML Imports 的目的是为 Web Components 提供打包机制。使用方法如下。  
```html
<link rel="import" href="...">
```
注意，HTML Imports 受浏览器同源策略的限制。并且在引入的 HTML 中，script 标签里的 document 是指向主文档的 document 的，要获取引入的 HTML 的 document，可以使用 `document.currentScript.ownerDocument`。
注意，在引入的 HTML 中不能使用以下方法。
- document.open()  
- document.write()
- document.close()

原本的 link 元素现在多了一个只读的 import 属性，值为引入的 HTML 文件的文档对象，类似于 document。因此可以通过这个属性去访问和操作引入的那部分文档对象。
```js
const link = document.querySelector('link[rel="import"]')
const imported = link.import
const elm = imported.querySelector('div.logo')
```

### 综合示例
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
  <style>
    ul {
      padding: 0;
      margin: 0;
    }
  </style>
  <template id="list">
    <style>
      ::content p {
        color: #fff;
        padding: 5px 8px;
        background: darkred;
      }
      :host(ul[is="my-list"]) {
        background: silver;
        width: 200px;
        padding: 10px 20px!important;
      }
      button {
        outline: none;
        border-radius: 2px;
        line-height: 1.5;
        border: none;
        padding: 6px 10px;
        box-shadow: 0 0 2px 1px rgba(0,0,0,0.3);
        cursor: pointer;
      }
      button:hover {
        background-image: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1))
      }
    </style>
    <content select=".item"></content>
    <button id="add">Add a item</button>
  </template>
</head>
<body>
  <ul is="my-list">
    <p class="item" slot="item">条目1</p>
    <p class="item" slot="item">条目2</p>
    <p class="item" slot="item">条目3</p>
  </ul>
  <script>
    {
      class List extends HTMLUListElement {
        constructor() {
          super()
        }
        createdCallback() {
          const shadow = this.createShadowRoot({mode: 'open'})
          const template = document.importNode(document.getElementById('list').content, true)
          shadow.appendChild(template)
        }
        attachedCallback() {
          const root = this.shadowRoot
          const btn = root.querySelector('button')
          btn.addEventListener('click', () => {
            const p = document.createElement('p')
            p.slot = 'item'
            p.className = 'item'
            p.textContent = `条目${++List.count}`
            this.appendChild(p)
          })
        }
      }

      List.extends = 'ul'
      List.count = 3

      document.registerElement('my-list', List)
    }
  </script>
</body>
</html>
```

参考文章：http://www.tuicool.com/articles/iiue6zb  
