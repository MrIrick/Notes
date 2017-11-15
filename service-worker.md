out of date...
以下 Service Worker 简称SW。

SW 可以充当 Web 应用程序之间或者浏览器和网络之间的代理服务器。它的目的在于，提供更好的离线体验，拦截网络请求，并根据网络连接是否可用和已缓存的资源，采取适当的行为。此外它还支持推送通知和后台同步功能。本文将分别介绍这三个功能的使用。

### 简介
SW 是一种注册在特定源和路径上的事件驱动的Worker。它采用JavaScript控制关联的页面或者网站，拦截并修改访问和资源请求，细粒度地缓存资源。你可以完全控制应用在特定情形（最常见的情形是网络不可用）下的表现。

SW 被设计为完全异步，因此不能在 SW 中使用同步API（如 XHR 和 localStorage）。

出于安全考虑，SW 一般只能工作在 HTTPS 下。

### 下载、安装和激活
- 用户首次访问 SW 控制的网站时，SW 会立刻被下载。之后最多 24 小时就会被重新下载一次。
- 如果下载的文件是新的（第一次访问或者 SW 脚本有更新），就会尝试进行安装，安装分以下两种情况。
  - 如果是首次启用 SW，在安装成功后它会被激活。
  - 如果现有的 SW 已启用，新版本会在后台安装，但不会被激活，而是进入等待状态。直到所有已加载页面不再使用旧的 SW 时，才会激活新的 SW（可以通过 `self.skipWaiting` 方法来跳过）。
- 可以监听 install 事件，来使用内建的 storage API 创建缓存并放置应用离线时所需要的资源。
- 可以监听 activate 事件，来清理旧缓存和旧的 SW 关联的资源。
- SW 可以通过 fetch 事件去响应请求，使用 FetchEvent.responseWith 修改对于这些请求的响应。

### Worker lifecycle(生命周期)
- Installing `event.waitUntil(promise)` `self.skipWaiting()`
- Installed
- Activating `event.waitUntil(promise)` `self.clients.claim()`
- Activated
- Redundant

### SW 支持的所有事件
install activate message
Functional Events: fetch sync push

### cache API

```js
Cache.match(req, opts)
/* opts
{
    ignoreSearch: Boolean(false),
    ignoreMethod: Boolean(false),
    ignoreVary: Boolean(false),
    cacheName: DOMString,
}
*/
Cache.matchAll(req, opts)
//同上
Cache.add(req)
Cache.addAll(reqs)
Cache.put(req, res)
Cache.delete(req, opts)
//同上
Cache.keys(req, opts)
//同上
```

### clients API
```js
Clients.get()
Clients.matchAll(opts)
{
    includeUncontrolled: Boolean(false),
    type: window | worker | sharedworker | all(default)
}
Clients.openWindow()
Clients.claim()
```

### serviceWorker API
```js
//@returns promise
navigator.serviceWorker.register('[脚本位置]', {scope: 'SW 脚本作用域（相对于 origin 的前缀而非路径）'})
//@returns promise
navigator.serviceWorker.ready

navigator.serviceWorker.controller
navigator.serviceWorker.oncontrollerchange
navigator.serviceWorker.controller.onstatechange

```

### Push API
```js
pushManager.getSubscription()
//@returns promise.resolve('granted', 'denied', 'prompt')
pushManager.permissionState()
//@returns promise
//options userVisibleOnly || applicationServerKey
pushManager.subscribe(options)
//@returns ArrayBuffer
//name: representing the encryption method used to generate a client key. p256dh | auth
subscription.getKey(name)
```

*index.js*
```js
let key, endpoint, authSecret
navigator.serviceWorker.register('sw.js').then(function (registration) {
  return registration.pushManager.getSubscription().then(subscription => {
    if (subscription) return subscription
    return registration.pushManager.subscribe({userVisibleOnly: true})
  })
}).then(subscription => {
  const hasGetKey = subscription.getKey ? true : false
  const rawKey = hasGetKey ? subscription.getKey('p256dh') : ''
  key = rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : ''
  const rawAuthSecret = hasGetKey ? subscription.getKey('auth') : ''
  authSecret = rawAuthSecret ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : ''
  endpoint = subscription.endpoint

  fetch('./register', {
    method: 'post',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      endpoint,
      key,
      authSecret
    })
  })
})

const waiting = 3000
setTimeout(sendNotification, waiting)
function sendNotification(payload = 'hello', delay = 1, ttl = 2) {
  fetch('./sendNotification', {
    method: 'post',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      endpoint,
      key,
      authSecret,
      payload, // message to push
      delay,
      ttl, // time-to-live
    })
  })
}
```

*server.js*
```js
// A real world app would store the subscription info
const webPush = require('web-push')
const payloads = {}

webPush.setGCMAPIKey(process.env.GCM_API_KEY)
module.exports = function (app, route) {
  app.post(route + 'register', function (req, res) {
    res.sendStatus(201)
  })
  app.post(route + 'sendNotification', function (req, res) {
    const {endpoint, key, authSecret, payload, delay, ttl} = req.body
    payloads[endpoint] = payload
    setTimeout(function () {
      webPush.sendNotification({
        endpoint,
        TTL: ttl,
        keys: {
          p256dh: key,
          auth: authSecret
        }
      }, payload)
      .then(function () {
        res.sendStatus(201)
      })
      .catch(function (err) {
        console.log(err)
        res.sendStatus(500)
      })
    }, delay * 1000)
  })
  app.get(route + 'getPayload', function (req, res) {
    res.send(payloads[req.query.endpoint])
  })
}
```

*sw.js*
```js
self.addEventListener('push', function (event)  {
  const payload = event.data ? event.data.text() : 'no payload'
  event.waitUntil(
    self.registration.showNotification('ServiceWorker Cookbook', {
      lang: 'la',
      body: payload,
      icon: 'caesar.jpg',
      vibrate: [500, 100, 500],
      tag: 'swc' // a notification with the same tag of another one will replace it
    })
  )
})
```
