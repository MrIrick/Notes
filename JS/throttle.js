const throttle = function(func, wait, options) {
    let ctx, args, result;
    let timeout = null;
    let previous = 0;
    options || (options = {});
    const later = function () {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(ctx, args);
        if (!timeout) ctx = args = null;
    };

    return function () {
        let now = Date.now();
        if (!previous && options.leading === false) previous = now;
        let remaining = wait - (now - previous);
        ctx = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = func.apply(ctx, args);
            if (!timeout) ctx = args = null;
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
};

const debouce = function (func, wait, immediate) {
    let timeout, args, ctx, result, previous;
    
    const later = function () {
        let last = Date.now() - previous;
        if (last < wait && last > 0) {
            timeout = setTimeout(later, wait - last);
        } else {
            timeout = null;
            if (!immediate) {
                result = func.apply(ctx, args);
                if (!timeout) ctx = args = null;
            }
        }
    };

    return function () {
        ctx = this;
        args = arguments;
        previous = Date.now();
        let callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
            result = func.apply(ctx, args);
            ctx = args = null;
        }
        return result;
    };
};