const handlers = new WeakMap();

function parse(event) {
    const dotIndex = event.indexOf('.');
    if (dotIndex > 0) {
        return {
            e: event.slice(0, dotIndex),
            ns: event.slice(dotIndex + 1, event.length)
        };
    }
    return {
        e: event
    };
}

function findHandlers(el, selector, event, callback) {
    event = parse(event);
    return new Set([...(handlers.get(el) || new Set())].filter(handler => {
        return handler && (!event.e || event.e === handler.e)
            && (!event.ns || event.ns === handler.ns)
            && (!selector || selector === handler.selector)
            && (!callback || callback === handler.callback);
    }));
}

function removeEvent(el, selector, event, callback) {
    const {e: eventName} = parse(event);

    if (!handlers.has(el)) return;
    const elHandlers = handlers.get(el);
    const matchedHandlers = findHandlers(el, selector, event, callback);
    matchedHandlers.forEach(handler => {
        if (el.removeEventListener) {
            el.removeEventListener(eventName, handler.delegator || handler.callback);
        } else {
            el.detachEvent('on' + eventName, handler.delegator || handler.callback);
        }
        elHandlers.remove(handler);
    });
}

function bindEvent(el, selector, event, callback, delegator) {
    const {e: eventName, ns} = parse(event);

    if (el.addEventListener) {
        el.addEventListener(eventName, delegator || callback, false);
    } else {
        el.attachEvent('on' + eventName, delegator || callback);
    }

    if (!handlers.has(el)) handlers.set(el, new Set());
    const elHandlers = handlers.get(el);
    elHandlers.add({
        e: eventName,
        ns,
        callback,
        delegator,
        selector
    });
}

const Events = {
    on(el, eventType, callback) {
        bindEvent(el, null, eventType, callback);
    },
    off(el, eventType, callback) {
        removeEvent(el, null, eventType, callback);
    },
    once(el, eventType, callback) {
        const onceCall = e => {
            this.off(e.currentTarget, e.type, onceCall);
            return callback(e);
        };
        this.on(el, eventType, onceCall);
    },
    delegate(el, selector, eventType, callback) {
        const delegator = function (e) {
            const els = el.querySelectorAll(selector);
            let matched = false;
            for (let _el of els) {
                if (_el === e.target || _el.contains(e.target)) {
                    matched = _el;
                    break;
                }
            }
            if (matched) {
                callback.apply(matched, [...arguments]);
            }
        };
        bindEvent(el, selector, eventType, callback, delegator);
    },
    undelegate(el, selector, eventType, callback) {
        removeEvent(el, selector, eventType, callback);
    },
    emit(el, eventType, props) {
        props || (props = {});
        props.bubbles || (props.bubbles = true);
        props.cancelable || (props.cancelable = true);
        const event = new Event(eventType, props);
        el.dispatchEvent(event);
    }
};
