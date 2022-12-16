export default class State {
  /**
   * Get or set the class parameters.
   *
   * @memberof State#
   * @type {object}
   */
  get params () {
    return this._params;
  }

  /**
   * @memberof State#
   * @fires State#changed
   */
  set params (newv) {
    const oldv = this._params;
    this._params = newv;
    /**
     * Class parameters changed.
     *
     * @event State#changed
     * @property {object} newv New value.
     * @property {object} oldv Old value.
     */
    this.dispatchEvent('changed', newv, oldv);
  }

  /**
   * Get and set the current state without clone.
   *
   * @memberof State#
   * @type {object}
   * @fires State#updated
   */
  get state () {
    return this._state || {};
  }

  /**
   * @memberof State#
   * @fires State#updated
   */
  set state (newv) {
    const oldv = this._state || {};
    this._state = newv || {};
    /**
     * The event called after a state update.
     *
     * @event State#updated
     * @property {string} path State variable path.
     * @property {*} newv New value.
     * @property {*} oldv Old value.
     */
    this.dispatchEvent('updated', '', newv, oldv);
  }

  /**
   * `State` class constructor.
   *
   * @constructor State
   * @param {object} [params] Arbitrary parameters.
   * @param {object} [params.state] Initial state data.
   * @param {object[]} [params.events] List of event handlers.
   */
  constructor (params) {
    this._params = params || {};
    this._events = {};
    this._state = this.data() || {};
    [].concat(this.events() || []).forEach(events => {
      for (const e in events) {
        this.on(e, events[e]);
      }
    });
  }

  /**
   * Initial state data.
   *
   * @memberof State#
   * @returns {object} State data.
   */
  data () {
    return this.params.state || {};
  }

  /**
   * List of event handlers.
   *
   * @memberof State#
   * @listens State#event:*
   * @returns {object[]} Event handlers in the format `event: function() {}`.
   */
  events () {
    return this.params.events || [];
  }

  /**
   * Add an event handler.
   *
   * @memberof State#
   * @param {string} event Event name.
   * @param {function} cb Callback function.
   */
  on (event, cb) {
    if (!event || !cb) return;
    event = [].concat(event);
    event.forEach(ev => {
      if (!this._events[ev]) this._events[ev] = [];
      this._events[ev].push(cb);
    });
  }

  /**
   * Remove an event handler.
   *
   * @memberof State#
   * @param {string} event Event name.
   * @param {function} cb Callback function.
   */
  off (event, cb) {
    if (!event) return;
    event = [].concat(event);
    event.forEach(e => {
      if (!cb) delete this._events[e];
      const fn = this._events[e];
      if (fn) {
        const index = fn.indexOf(cb);
        if (index > -1) fn.splice(index, 1);
      }
    });
  }

  /**
   * Dispatch an event.
   *
   * @memberof State#
   * @param {string} event Event name.
   * @param {...any} [args] Event data.
   * @returns {Promise}
   */
  dispatchEvent (event, ...args) {
    const promises = [];
    const cb = this._events[event];
    if (cb) {
      cb.forEach(item => promises.push(item.call(this, ...args)));
    }
    return Promise.all(promises);
  }

  /**
   * Add a specific field to the state.
   *
   * @memberof State#
   * @param {string} path State variable path.
   * @param {*} newv New data.
   * @fires State#added
   */
  add (path, newv) {
    if (!path) return;
    const { target, key } = this.getValue(path, this._state, true);
    if (Array.isArray(target[key])) target[key].push(newv);
    else target[key] = newv;
    const oldv = undefined;
    /**
     * The event called after a state update.
     *
     * @event State#added
     * @property {string} path State variable path.
     * @property {*} newv New value.
     * @property {*} oldv Old value.
     */
    this.dispatchEvent('added', path, newv, oldv);
  }

  /**
   * Remove a specific field from the state.
   *
   * @memberof State#
   * @param {string} path State variable path.
   * @fires State#deleted
   */
  delete (path) {
    if (!path) return;
    const { target, key } = this.getValue(path, this._state, true);
    const oldv = target[key];
    if (Array.isArray(target)) target.splice(key, 1);
    else delete target[key];
    const newv = undefined;
    /**
     * The event called after a state update.
     *
     * @event State#deleted
     * @property {string} path State variable path.
     * @property {*} newv New value.
     * @property {*} oldv Old value.
     */
    this.dispatchEvent('deleted', path, newv, oldv);
  }

  /**
   * Update the state.
   *
   * @memberof State#
   * @param {string} path State variable path.
   * @param {*} newv New data.
   * @fires State#updated
   */
  update (path, newv) {
    if (!path) return;
    if (typeof path === 'object') {
      newv = path;
      for (const path in newv) {
        const oldv = this.clone(path);
        const value = newv[path];
        this.setValue(path, value);
        this.dispatchEvent('updated', path, value, oldv);
      }
    } else {
      const oldv = this.clone(path);
      this.setValue(path, newv);
      this.dispatchEvent('updated', path, newv, oldv);
    }
  }

  /**
   * Check the existence of a field in the state.
   *
   * @memberof State#
   * @param {string|string[]} path State variable path.
   * @param {object} [obj=this.state] Data object.
   * @returns {boolean} It exists or not.
   */
  exists (path, obj = this._state) {
    if (!path || !obj) return false;
    const arr = [].concat(path);
    for (let i = 0; i < arr.length; i++) {
      const { target, key } = this.getValue(arr[i], obj, true);
      if (Object.prototype.hasOwnProperty.call(target, key)) return true;
    }
    return false;
  }

  /**
   * Clone the state.
   *
   * @memberof State#
   * @param {string} [path] Data field path.
   * @param {object} [obj=this.state] Data object.
   * @returns {*} A copy of the state or part of it.
   */
  clone (path, obj = this._state) {
    if (path && obj) {
      const val = this.getValue(path, obj);
      if (typeof val !== 'undefined') {
        return this.clone(false, val);
      } else {
        return val;
      }
    }
    if (typeof obj !== 'object' || obj === null || obj instanceof Date) {
      return obj;
    }
    const clone = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      const val = obj[key];
      if (typeof val !== 'undefined') {
        const copy = this.clone(false, val);
        if (typeof copy !== 'undefined') {
          clone[key] = copy;
        }
      }
    }
    return clone;
  }

  /**
   * Deep comparison of objects.
   *
   * @memberof State#
   * @param {object} newv New data object.
   * @param {object} [oldv=this.state] Old data object.
   * @returns {object} Changed data object.
   */
  diff (newv, oldv = this._state) {
    let diff;
    for (const key in newv) {
      if (typeof oldv[key] === 'undefined') {
        // added
        if (!diff) diff = Array.isArray(newv) ? [] : {};
        diff[key] = newv[key];
      }
    }
    for (const key in oldv) {
      if (typeof newv[key] === 'undefined') {
        // deleted
        if (!diff) diff = {};
        diff[key] = undefined;
      }
      if (
        typeof newv[key] !== 'undefined' &&
        typeof oldv[key] === 'object' &&
        oldv[key] !== null &&
        oldv[key] instanceof Date === false
      ) {
        if (!diff) diff = Array.isArray(newv) ? [] : {};
        diff[key] = this.diff(newv[key], oldv[key]);
        if (typeof diff[key] === 'undefined') {
          delete diff[key];
        }
      } else if (oldv[key] !== newv[key]) {
        // changed
        if (!diff) diff = Array.isArray(newv) ? [] : {};
        diff[key] = newv[key];
      }
    }
    return diff;
  }

  /**
   * Get a value from the object along its path.
   *
   * @memberof State#
   * @param {string} path Data field path.
   * @param {object} [obj=this.state] Data object.
   * @param {boolean} [struct=false] Return as structure (value, key, target).
   * @returns {*} Specified field data.
   */
  getValue (path, obj = this._state, struct = false) {
    if (!path || !obj) {
      return struct ? { value: obj } : obj;
    }
    const arr = path.split('.');
    const val = arr.reduce((o, k, i) => {
      if (i + 1 < arr.length) o[k] = {};
      return o.value ? { value: o.value[k], key: k, target: o.value } : o;
    }, { value: obj });
    return struct ? val : val.value;
  }

  /**
   * Set a value to the object along its path.
   *
   * @memberof State#
   * @param {string} path Data field path.
   * @param {*} val Value to set.
   * @param {object} [obj=this.state] Data object.
   * @returns {object} Object data merged with the value.
   */
  setValue (path, val, obj = this._state) {
    if (!path || !obj) return obj;
    const arr = path.split('.');
    return arr.reduce((o, k, i) => {
      if (i + 1 < arr.length) o[k] = {};
      else o[k] = val;
      return o[k];
    }, obj);
  }

  /**
   * Convert the state to JSON object.
   *
   * @memberof State#
   * @returns {object}
   */
  toJSON () {
    return this.clone();
  }
}
