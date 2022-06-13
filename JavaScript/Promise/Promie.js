const STATE = {
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  PENDING: 'pending',
};

class Promie {
  #thenCbs = [];
  #catchCbs = [];
  #state = STATE.PENDING;
  #value;
  #bindedResolve = this.#resolve.bind(this);
  #bindedReject = this.#reject.bind(this);

  constructor(cb) {
    try {
      cb(this.#bindedResolve, this.#bindedReject);
    } catch (error) {
      this.#reject(error);
    }
  }

  #runCallbacks() {
    if (this.#state === STATE.FULFILLED) {
      this.#thenCbs.forEach((callback) => {
        callback(this.#value);
      });
      this.#thenCbs = [];
    }
    if (this.#state === STATE.REJECTED) {
      this.#catchCbs.forEach((callback) => {
        callback(this.#value);
      });
      this.#catchCbs = [];
    }
  }

  #resolve(value) {
    if (this.#state !== STATE.PENDING) return;

    if (value instanceof Promie) {
      value.then(this.#bindedResolve, this.#bindedReject);
      return;
    }
    this.#value = value;
    this.#state = STATE.FULFILLED;
    this.#runCallbacks();
  }

  #reject(value) {
    queueMicrotask(() => {
      if (this.#state !== STATE.PENDING) return;

      if (value instanceof Promie) {
        value.then(this.#bindedResolve, this.#bindedReject);
        return;
      }

      if (this.#catchCbs.length === 0) {
        throw new UncaughtPromiseError(value);
      }

      this.#value = value;
      this.#state = STATE.REJECTED;
      this.#runCallbacks();
    });
  }

  then(thenCb, catchCb) {
    return new Promie((resolve, reject) => {
      this.#thenCbs.push((result) => {
        if (thenCb == null) {
          resolve(result);
          return;
        }
        try {
          resolve(thenCb(result));
        } catch (error) {
          reject(error);
        }
      });

      this.#catchCbs.push((result) => {
        if (catchCb == null) {
          reject(result);
          return;
        }
        try {
          resolve(catchCb(result));
        } catch (error) {
          reject(error);
        }
      });
      this.#runCallbacks();
    });
  }

  catch(cb) {
    return this.then(undefined, cb);
  }

  finally(cb) {
    return this.then(
      (result) => {
        cb();
        return result;
      },
      (result) => {
        cb();
        throw result;
      }
    );
  }

  static resolve(value) {
    return new Promie((resolve) => {
      resolve(value);
    });
  }

  static reject(value) {
    return new Promie((resolve, reject) => {
      reject(value);
    });
  }

  static all(promises) {
    const results = [];
    let completedPromises = 0;
    return new Promie((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i]
          .then((value) => {
            completedPromises++;
            results[i] = value;

            if (completedPromises === promises.length) {
              resolve(results);
            }
          })
          .catch(reject);
      }
    });
  }

  static allSettled(promises) {
    const results = [];
    let completedPromises = 0;
    return new Promie((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i]
          .then((value) => {
            results[i] = { status: STATE.FULFILLED, value };
          })
          .catch((reason) => {
            results[i] = { status: STATE.REJECTED, reason };
          })
          .finally(() => {
            completedPromises++;
            if (completedPromises == promises.length) {
              resolve(results);
            }
          });
      }
    });
  }

  static race(promises) {
    return new Promie((resolve, reject) => {
      promises.forEach((promise) => {
        promise.then(resolve).catch(reject);
      });
    });
  }

  static any(promises) {
    const errors = [];
    let rejectedPromises = 0;
    return new Promie((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i].then(resolve).catch((value) => {
          rejectedPromises++;
          errors[i] = value;

          if (rejectedPromises === promises.length) {
            reject(new AggregateError(errors, 'All promises were rejected'));
          }
        });
      }
    });
  }
}

class UncaughtPromiseError extends Error {
  constructor(error) {
    super(error);
    this.stack = `(in promise) ${error.stack}`;
  }
}

export default Promie;
