Web Components 是几项技术综合的结果：
- Custom Elements
- HTML Templates
- Shadow DOM
- HTML Imports  

下面将分别介绍这几项技术，同时在最后给出一个例子。

# Custom Elements
首先要定义一个类，这个类用来生成自定义的元素，所以这个类要继承 HTMLElement。如果是在已有元素的基础上扩展，则继承已有元素的构造函数（例如，在 button 的基础上进行扩展，需要继承 HTMLButtonElement）。 

使用类来定义自定义元素的好处在于，this 指向的就是 DOM 元素，因而通过 this 可以完成很多事，比如 this.children 获取子元素，查询后代元素 this.querySelector() 等等，只要是 DOM API，基本上都能使用。

创建自定义元素的规则：
1. 自定义元素的名字必须包含 `-`，这样做的原因是，浏览器可以轻松区分出自定义元素和普通的元素。
2. 相同的名字只能注册一次。
3. 自定义元素不能是自闭合标签，像 `<img>` 这种。

扩展内置元素的好处是，我们可以避免自己去实现一遍内置元素的行为，比如 disabled、click()、keydown、tabindex 等。很遗憾的是，目前还没有浏览器支持扩展原生元素：
```js
class FancyButton extends HTMLButtonElement {
  constructor () {
    super()
    this.addEventListener('click', e => this.drawRipple(e.offsetX, e.offsetY))
  }

  drawRipple(x, y) {
    let div = document.createElement('div')
    div.classList.add('ripple')
    this.appendChild(div)
    div.style.top = `${y - div.clientHeight / 2}px`
    div.style.left = `${x - div.clientWidth / 2}px`
    div.style.backgroundColor = 'currentColor'
    div.classList.add('run')
    div.addEventListener('transitionend', e => div.remove())
  }
}

customElements.define('fancy-button', FancyButton, {extends: 'button'})
```

自定义元素与一般元素的区别在于，可以设定该元素的生命周期回调。
- constructor() - 创建或更新（即下文提到的 element upgrades）元素时执行
- connectedCallback() - 元素插入 DOM 时执行
- disconnectedCallback() - 元素被移除 DOM 时执行
- attributeChangedCallback(attrName, oldVal, newVal) - 元素的属性被增、删、改时执行。另外，通过在类上定义静态 getter 属性 observedAttributes 可以指定哪些属性被监听，返回值可以为数组。
- adoptedCallback 当节点从一个文档移动到另一个文档中时执行。例如，使用 `document.adoptNode(node)` 触发

要注意一些地方：
- attributeChangedCallback 的回调函数的参数为：属性名称, 旧值, 新值, 命名空间。当设置值或者删除值时，相应的旧值或者新值会缺省为 null。
- 这些生命周期回调是同步触发的，比如，当你 `el.setAttribute()` 之后，attributeChangedCalback 会马上执行。
- 只在必要的时候定义相应的生命周期回调。如果你的自定义元素很复杂甚至需要在 connectedCallback 中连接 IndexDB，请一定要在 disconnectedCallback 中清理连接。而且你不能在所有的情景下都依赖元素从 DOM 移除来触发 disconnectedCallback，比如，用户关闭 tab 的时候，就不会触发 disconnectedCallback 回调。

可能 adoptedCallback 还是很不清晰，这里再看一个例子：
```js
function createWindow(srcdoc) {
  let p = new Promise(resolve => {
    let f = document.createElement('iframe');
    f.srcdoc = srcdoc || '';
    f.onload = e => {
      resolve(f.contentWindow);
    };
    document.body.appendChild(f);
  });
  return p;
}

// 1. Create two iframes, w1 and w2.
Promise.all([createWindow(), createWindow()])
  .then(([w1, w2]) => {
    // 2. Define a custom element in w1.
    w1.customElements.define('x-adopt', class extends w1.HTMLElement {
      adoptedCallback() {
        console.log('Adopted!');
      }
    });
    let a = w1.document.createElement('x-adopt');

    // 3. Adopts the custom element into w2 and invokes its adoptedCallback().
    w2.document.body.appendChild(a);
  });
```

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
const myButton = document.createElement('button', {is: 'my-button'})
// or
const myButton = new FancyButton()
```

再看一个扩展 Image 的例子：
```js
customElements.define('bigger-img', class extends Image {
  // Give img default size if users don't specify.
  constructor(width=50, height=50) {
    super(width * 10, height * 10);
  }
}, {extends: 'img'});
```

```html
<img is="bigger-img" width="15" height="20">
```

```js
const BiggerImage = customElements.get('bigger-img'); // 此方法可获取标签名对应的类，主要用于上述匿名类的情况
const image = new BiggerImage(15, 20); // pass ctor values like so.
console.assert(image.width === 150);
console.assert(image.height === 200);
```

### reflects HTML properties as HTML attributes （译为：将 HTML 特性反映到 HTML 属性中，用 `.` 访问的是特性，用 getAttribute 方法访问的是属性。）  

几乎所有内置的 HTML 特性都会自动反映到属性上去，比如 `id`, `disabled` 等。为什么呢？因为属性在很多情况下是很有用的，比如 CSS 属性选择器就依赖于属性。

当你想要保持元素的 DOM 表示跟它的 JS 状态同步的情况下，这种映射是非常有用的。一种情况是，用户为元素的某种状态定义了样式，而这样式是依赖于 HTML 属性的，当 JS 改变了元素的 HTML 特性，我们希望 HTML 属性也跟着改变，这样，用户定义的样式就能够顺利应用到元素上了：
```css
app-drawer[disabled] {
  opacity: 0.5;
  pointer-events: none;
}
```
```js
...

get disabled() {
  return this.hasAttribute('disabled');
}

set disabled(val) {
  // Reflect the value of `disabled` as an attribute.
  if (val) {
    this.setAttribute('disabled', '');
  } else {
    this.removeAttribute('disabled');
  }
  this.toggleDrawer();
}
```

### Observing changes to attributes
HTML 属性是用户声明元素初始状态的得力帮手：
```html
<app-drawer open disabled></app-drawer>
```

将 HTML 特性映射到 HTML 属性后，紧接着我们还可以监听 HTML 属性的变化来做一些工作。

看这个例子：
```js
class AppDrawer extends HTMLElement {
  ...

  static get observedAttributes() {
    return ['disabled', 'open'];
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  // Only called for the disabled and open attributes due to observedAttributes
  attributeChangedCallback(name, oldValue, newValue) {
    // When the drawer is disabled, update keyboard/screen reader behavior.
    if (this.disabled) {
      this.setAttribute('tabindex', '-1');
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.setAttribute('tabindex', '0');
      this.setAttribute('aria-disabled', 'false');
    }
    // TODO: also react to the open attribute changing.
  }
}
```
既然 HTML 特性能映射到 HTML 属性，HTML 属性就应该能映射到 HTML 特性，这个可以通过 attributeChangedCallback 来实现。

### 渐进增强的 HTML

这里还有一个问题可能好多人都会问，如果这个类定义在自定义元素之前还好说，要是在类定义之前就出现了自定义的标签，浏览器会怎么处理呢。其实浏览器会把不认识的标签标记成 undefined 状态（这时可以通过 :not(:defined) 选择器来选中它），等我们定义好类并注册完后，浏览器会对我们的自定义元素进行类似于重新渲染的操作，并将其标记成 defined 状态（这时可以通过 :defined 选择器来选中它）。因而我们能够通过 `:not(:defined)` 规定元素尚未定义时的样式，并通过 `:defined` 更换样式，甚至可以有一个 `opacity` 的过渡动画。

另外，现在有一个方法可以侦听自定义元素的状态：
```js
//@param String tagName
//@returns promise
customeElements.whenDefined(tagName)
```

事实上，从 undefined 到 defined 的这一状态变化过程叫做 `element upgrades`。下面是一个例子：
```html
<share-buttons>
  <social-button type="twitter"><a href="...">Twitter</a></social-button>
  <social-button type="fb"><a href="...">Facebook</a></social-button>
  <social-button type="plus"><a href="...">G+</a></social-button>
</share-buttons>
```
```js
// Fetch all the children of <share-buttons> that are not defined yet.
let undefinedButtons = buttons.querySelectorAll(':not(:defined)');

let promises = [...undefinedButtons].map(socialButton => {
  return customElements.whenDefined(socialButton.localName);
));

// Wait for all the social-buttons to be upgraded.
Promise.all(promises).then(() => {
  // All social-button children are ready.
});
```
我们应该可以猜到，内置的 HTML 元素始终都是 defined 的。

### 总结一下 customElements 下的方法
- define(tagName, ctor, options)
- get(tagName) 如果该元素尚未定义，返回值为 undefined
- whenDefined(tagName) 如果 tagName 不合法，就 reject

# HTML Templates
`<template>` 元素并不会被渲染，但依然会被浏览器解析。
template 元素的 content 属性是一个 documentFragment，这意味着我们可以操纵 template 包含的 DOM 结构，然后使用 `document.importNode()` 或者 `.cloneNode()` 方法将全部或部分 DOM 插入文档中进行渲染。

# Shadow DOM
Shadow DOM 的出现是为了完成代码作用域的隔离，尤其是 CSS 的隔离。我们知道 CSS 样式是层叠的，也就是说当前页面里的每一个元素都可能会受到样式表中每一条规则的影响，有时候我们想避免这种影响，尤其是我们想写一个独立的组件时。我们希望使用组件的用户引入这个组件的时候，组件不会受已有样式的影响。想想这个隔离还是很有必要的。另外，JS 也是会被隔离的，比如当我们使用 document.querySelector 去搜索具备某些特征的元素时，shadowRoot 中的元素并不会被搜索，这样可以避免 DOM 的误操作。
Shadow DOM 必须附加在一个元素上。这个元素可以是 HTML 中的某个元素，也可以是脚本动态创建出来的元素；可以是原生的元素，也可以是自定义元素。实际上只有以下列出的元素可以挂载 shadowRoot。  

自定义元素
article aside blockquote body div header footer
h1 h2 h3 h4 h5 h6
nav p section span

如果一个元素不在这个列表中，原因可能有二：
1. 浏览器已经为该元素创建了 shadowRoot(&lt;textarea&gt;, &lt;input&gt;)
2. 为该元素创建 shadowRoot 没有意义(&lt;img&gt;)

要改变 Shadow DOM 中元素的样式，可以在 Shadow DOM 中添加 style 标签，这里定义的样式通常情况下只能影响 shadowRoot 里的元素。  
还要注意的一点是，一旦一个元素挂载了 shadowRoot，它所有的子元素都将被隐藏掉。那是不是说子元素就没有任何的作用了呢，也不是。我们可以将子元素填充进 shadowRoot 中相应的占位符。

创建 Shadow DOM 的语法如下：
```js
//@returns [object ShadowRoot]shadowRoot
//shadowRootInit: {mode: 'open' | 'closed', delegatesFocus: true | false}
const shadowRoot = Element.attachShadow(shadowRootInit)
```  

这里详细说一下这两个选项：  
1. mode: open 代表开放的封装模式 closed 代表关闭的封装模式
当 mode 为 closed 模式的时候，会产生以下效果：
- Element.shadowRoot 获取不到 shadowRoot，值为 null
- Element.assignedSlot / TextNode.assignedSlot 返回值为 null
- 对于绑定在 shadowDOM 中元素上的事件，Event.composedPath() 返回值为 []
简言之就是限制外部对 shadowDOM 的访问，但其实并没什么卵用，所以一般我们都不会使用 closed 模式。
 
delegatesFocus 为 true 的时候，有如下效果：
- 如果你 click 了一个 shadowDOM 中的元素，而这个元素不是 focusable 的，那么 shadowDOM 中第一个 focusable 的元素会 focus
- 当 shadowDOM 中的元素 focus 了，则宿主元素也将 focus （可通过 :focus 选择器匹配）

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
- host shadowRoot 所依附的宿主元素
- innerHTML shadowRoot 的 HTML 内容

另外还有一些 document 和 shadowRoot 共有的属性和方法，由 DocumentOrShadowRoot 这个构造函数定义，由于是共有的，因此其与 document 中对应方法的表现大体一致。
- activeElement
- styleSheets
- getSelection()
- elementFromPoint()
- elementsFromPoint()
- caretPositionFromPoint()

Tip: 当 shadowDOM 中有表单元素时，document.activeElement 会先定位到宿主元素，也就是说，想从外边引用当前获取焦点的元素，可以这么写：
```js
document.activeElement.shadowRoot.activeElement
```

*CSS*
虽说是为了隔离代码作用域而生的，但是总有些时候我们需要一些手段来对 shadowRoot 里的东西施加一定的影响。
- 外部控制 shadowRoot
- shadowRoot 控制其所属元素的样式
- shadowRoot 控制通过 slot 传进来的 HTML 的样式

| 选择器 | 在 shadowRoot 中 | 在 document 中 |
|:----------:| ------------ | ------------ |
|:host|匹配宿主元素|NaN|
|:host(<selector>)|匹配括号中选择器对应的宿主元素|匹配括号中选择器对应的元素|
|:host-context(<selector>)|如果宿主元素的祖先元素匹配括号中选择器，则整个选择器匹配宿主元素|NaN|
|::slotted(<selector>)|匹配通过 slot 传进来的元素（只匹配顶级子元素，即子元素的子元素不会被匹配）|NaN|

层叠规则，对于两个优先级相同的 CSS 声明，不带 !important 时，外部样式优先于内部样式，带 !important 时，内部样式优先于外部样式。这实际上是为了让外部样式能够控制内部样式，而内部样式又不至于失去控制权。  

继承，shadowRoot 中顶级元素的样式从宿主元素继承而来。  

我们还可以通过 CSS 自定义属性为组件的使用者提供一些样式钩子：
```html
<!-- main page -->
<style>
  fancy-tabs {
    margin-bottom: 32px;
    --fancy-tabs-bg: black;
  }
</style>
<fancy-tabs background>...</fancy-tabs>

<!-- component -->
:host([background]) {
  background: var(--fancy-tabs-bg, #9E9E9E);
  border-radius: 10px;
  padding: 10px;
}
```

*Event*
在 shadowRoot 中，你可以监控通过 slot 传递进来的 DOM 元素的变化。这个监控手段就是侦听 slot 元素分发的 slotchange 事件。不过这个事件貌似只侦听元素的 add/remove，要想实现监听其他跟复杂类型的变化，可以使用 MutationObserver。

*事件的作用域*
一般而言，事件从 shadowDOM 中冒泡的时候，浏览器会进行处理，让事件看起来好像是从宿主元素发出的，这主要是为了保持 shadowDOM 良好的封装性。一些事件甚至都不会冒泡到 shadowDOM 外面。

会冒泡到外面的事件有：
Focus Events: blur, focus, focusin, focusout
Mouse Events: click, dblclick, mousedown, mouseenter, mousemove, etc.
Wheel Events: wheel
Input Events: beforeinput, input
Keyboard Events: keydown, keyup
Composition Events: compositionstart, compositionupdate, compositionend
DragEvent: dragstart, drag, dragend, drop, etc.

对于自定义事件，可以通过指定 bubbles 和 composed 属性为 true，来完成跨越 shadowRoot 的事件冒泡。
```js
d.dispatchEvent(new Event('my-custom', {bubbles: true, composed: true}))
```
与此同时，在侦听这种跨越 shadowRoot 的冒泡事件时，event 对象上提供了一个 composedPath 方法，用来替代 event.path 属性。

*Tips & Tricks*
- use css containment `:host {display: block;contain: content;}`
- reset inheritable styles `:host {all: initial;}`

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
            p.textContent = `+ 条目${++List.count}`
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

最后再提一点，所有的自定义元素，默认是 inline 水平的。为什么是这样呢，其实包括所有的原生标签本来都是 inline 水平的，只是浏览器给某些元素设置了新的默认样式，比如 div，ul 等浏览器会默认给它们的 display 设置成 block。

参考文章：http://www.tuicool.com/articles/iiue6zb  
