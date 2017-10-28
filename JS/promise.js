const PENDING = 0, FULFILLED = 1, REJECTED = 2

const utils = {
    isFunction: function (x) {
        return typeof x === 'function'
    },
    isObject: function (x) {
        if (x == null) return false
        return typeof x === 'object' || typeof x === 'function';
    },
    delay: (process && process.nextTick) || setTimeout
}

const Promise = function (fn) {
    this.state = PENDING
    this.value = null
    this.handlers = []

    doExecute.call(this, fn, this.resolve, this.reject)
}

function doExecute(fn, resolve, reject) {
    let done = false, promise = this
    try {
        fn.call(null, function (value) {
            if (done) return
            resolve.call(promise, value)
            done = true
        }, function (reason) {
            if (done) return
            reject.call(promise, reason)
            done = true
        })
    } catch (e) {
        if (done) return
        reject.call(promise, e)
        done = true
    }
}

const promiseProto = {
    then(onFulfilled, onRejected) {
        const promise = this
        return new Promise(function (resolve, reject) {
            promise.handle({
                onFulfilled: function (value) {
                    if (!utils.isFunction(onFulfilled)) onFulfilled = function (v) {return v}
                    try {
                        resolve(onFulfilled(value))
                    } catch (e) {
                        return reject(e)
                    }
                },
                onRejected: function (reason) {
                    if (!utils.isFunction(onRejected)) onRejected = function (r) {throw r}
                    try {
                        resolve(onRejected(reason))
                    } catch (e) {
                        return reject(e)
                    }
                }
            })
        })
    },
    handle(coupleHandlers) {
        let promise = this, state = this.state, value = this.value
        switch (state) {
            case FULFILLED: {
                return utils.delay(function () {
                    coupleHandlers.onFulfilled(value)
                })
            }
            case REJECTED: {
                return utils.delay(function () {
                    coupleHandlers.onRejected(value)
                })
            }
            default: return promise.handlers.push(coupleHandlers)
        }
    },
    fulfill(value) {
        utils.delay(() => {
            this.state = FULFILLED
            this.value = value
            for (let {onFulfilled} of this.handlers) {
                onFulfilled(value)
            }
            this.handlers = null
        })
    },
    reject(reason) {
        utils.delay(() => {
            this.state = REJECTED
            this.value = reason
            for (let {onRejected} of this.handlers) {
                onRejected(reason)
            }
            this.handlers = null
        })
    },
    resolve(x) {
        let promise = this, done = false

        if (x === promise) {
            return promise.reject(new TypeError('The promise and value should not refer to the same object.'))
        } else if (x instanceof Promise) {
            return x.then(promise.resolve.bind(promise), promise.reject.bind(promise))
        } else if (utils.isObject(x)) {
            let then
            try {
                then = x.then
            } catch (e) {
                return promise.reject(e)
            }
            if (utils.isFunction(then)) {
                try {
                    then.call(x, resolvePromise, rejectPromise)
                } catch (e) {
                    if (!done) {
                        return promise.reject(e)
                    }
                }
            } else {
                return promise.fulfill(x)
            }
        } else {
            return promise.fulfill(x)
        }

        function resolvePromise(y) {
            if (!done) {
                promise.resolve(y)
                done = true
            }
        }

        function rejectPromise(r) {
            if (!done) {
                promise.reject(r)
                done = true
            }
        }
    }
}

Promise.deferred = Promise.defer = function() {
  const dfd = {}
  dfd.promise = new Promise(function(resolve, reject) {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}

Object.assign(Promise.prototype, promiseProto)

module.exports = Promise
