const PENDING = 0, FULFILLED = 1, REJECTED = 2;

const utils = {
    isFunction: function (x) {
        return typeof x === 'function';
    },
    isObject: function (x) {
        return Object(x) === x;
    }
}

const Promise = function (fn) {
    this.state = PENDING;
    this.value = null;
    this.reason = null;
    this.handlers = [];

    doExecute.call(this, fn, this.resolve, this.reject);
}

function doExecute(fn, resolve, reject) {
    let done = false, promise = this;
    try {
        fn.call(null, function (value) {
            if (done) return;
            resolve.call(promise, value);
            done = true;
        }, function (reason) {
            if (done) return;
            reject.call(promise, reason);
            done = true;
        })
    } catch (e) {
        if (done) return;
        reject.call(promise, e);
        done = true;
    }
}

const promiseProto = {
    then(onFulfilled, onRejected) {
        const promise = this;
        return new Promise(function (resolve, reject) {
            process.nextTick(function () {
                promise.handle({
                    onFulfilled: function (value) {
                        resolve(utils.isFunction(onFulfilled) ? onFulfilled(value) : value);
                    },
                    onRejected: function (reason) {
                        reject(utils.isFunction(onRejected) ? onRejected(reason) : reason);
                    }
                })
            })
        })
    },
    handle(obj) {
        let promise = this, state = this.state, value = this.value, reason = this.reason;
        switch (state) {
            case PENDING: promise.handlers.push(obj); break;
            case FULFILLED: obj.onFulfilled(value); break;
            case REJECTED: obj.onRejected(reason);
        }
    },
    fulfill(value) {
        this.state = FULFILLED;
        this.value = value;
        for (let {onFulfilled} of this.handlers) {
            onFulfilled(value);
        }
        this.handlers = null;
    },
    reject(reason) {
        this.state = REJECTED;
        this.reason = reason;
        for (let {onRejected} of this.handlers) {
            onRejected(reason);
        }
        this.handlers = null;
    },
    resolve(x) {
        let promise = this, done = false;

        if (x === promise) {
            throw new TypeError('The promise and value should not refer to the same object.');
        } else if (x instanceof Promise) {
            let state = x.state;
            switch(state) {
                case PENDING: x.then(promise.resolve.bind(promise), promise.reject.bind(promise)); break;
                case FULFILLED: promise.fulfill(x.value); break;
                case REJECTED: promise.reject(x.reason); break;
            }
        } else if (utils.isObject(x)) {
            let then;
            try {
                then = x.then;
            } catch (e) {
                promise.reject(e);
            }
            if (utils.isFunction(then)) {
                try {
                    then.call(x, resolvePromise, rejectPromise);
                } catch (e) {
                    if (!done) {
                        promise.reject(e);
                    }
                }
            } else {
                promise.fulfill(x);
            }
        } else {
            promise.fulfill(x);
        }

        function resolvePromise(y) {
            if (!done) {
                promise.resolve(y);
                done = true;
            }
        }

        function rejectPromise(r) {
            if (!done) {
                promise.reject(r);
                done = true;
            }
        }
    }
}

Object.assign(Promise.prototype, promiseProto);

module.exports = Promise;