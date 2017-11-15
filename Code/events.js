const handlers = new WeakMap()

function parse(event) {
  const dotIndex = event.indexOf('.')
  if (dotIndex > 0) {
    return {
      e: event.slice(0, dotIndex),
      ns: event.slice(dotIndex + 1)
    }
  }
  return {e: event}
}
function unbindEvent(el, selector, eventType, callback) {
  const {e, ns} = parse(eventType)
  const set = handlers.get(el) || new Set()
  if (!set.size) return
  set.forEach((o) => {
    if ((!e || e === o.e) && (!ns || ns === o.ns) && (!selector || selecotr === o.selector) && (!callback || callback === o.callback)) {
      el.removeEventListener(e, o.delegator || callback)
      set.delete(o)
    }
  })
}
function bindEvent(el, selector, eventType, callback, delegator) {
  const {e, ns} = parse(eventType)
  el.addEventListener(e, delegator || callback)
  if (!handlers.has(el)) handlers.set(el, new Set())
  const set = handlers.get(el)
  set.add({
    e,
    ns,
    selector,
    callback,
    delegator
  })
}
const Events = {
  on(el, eventType, callback) {
    bindEvent(el, null, eventType, callback)
  },
  off(el, eventType, callback) {
    unbindEvent(el, null, eventType, callback)
  },
  once(el, eventType, callback) {
    const oncer = e => {
      this.off(el, eventType, oncer)
      return callback.call(el, e)
    }
    bindEvent(el, null, eventType, callback, oncer)
  },
  delegate(el, selector, eventType, callback) {
    bindEvent(el, selector, eventType, callback, delegator)
    function delegator(e) {
      const t = e.target, ms = el.querySelectorAll(selector)
      for (let m of ms) {
        if (m === t || m.contains(t)) {
          callback.call(m, e)
          break;
        }
      }
    }
  },
  undelegate(...args) {
    unbindEvent(...args)
  },
  emit(el, eventType, props) {
    props || (props = {})
    props.bubbles || (props.bubbles = true)
    props.cancelable || (props.cancelable = true)
    const event = new Event(eventType, props)
    el.dispatchEvent(event)
  }
}

export Events
