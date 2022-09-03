import State from './state';

export default class Component extends State {
  /**
   * Get the root element of this component.
   *
   * @readonly
   * @memberof Component#
   * @type {HTMLElement}
   */
  get el () {
    return this._el;
  }

  /**
   * Check for the presence of the component in the DOM.
   *
   * @readonly
   * @memberof Component#
   * @type {boolean}
   */
  get mounted () {
    return !!this._el?.parentNode;
  }

  /**
   * `Component` class constructor.
   *
   * @constructor Component
   * @extends State
   * @param {object} [params] Arbitrary component parameters.
   * @param {HTMLElement} [params.container] Target element to mount.
   */
  constructor (...args) {
    super(...args);
    let templates = this.template();
    if (typeof templates === 'string') {
      templates = { default: templates };
    }
    this._compiled = {};
    for (const tpl in templates) {
      this._compiled[tpl] = this.compile(templates[tpl]);
    }
    this._el = this.render('default');
    [].concat(this.events() || []).forEach(events => {
      this.listen(events);
    });
    this.mount(this.params.container);
  }

  /**
   * The function returns the component template.
   *
   * @memberof Component#
   * @returns {string} Template text.
   */
  template () {
    return '';
  }

  /**
   * The function creates an HTML element.
   *
   * @memberof Component#
   * @param {string} [tpl="default"] Template name.
   * @param {object} [data] Data for template rendering.
   * @returns {HTMLElement} HTML element.
   */
  render (tpl = 'default', data = {}) {
    const el = document.createElement('DIV');
    el.innerHTML = this._compiled[tpl] ? this._compiled[tpl](data) : '';
    return el.childElementCount > 1 ? el : el.removeChild(el.firstElementChild);
  }

  /**
   * Mount the component to the DOM.
   *
   * @memberof Component#
   * @fires Component#mounted
   * @param {HTMLElement} [target=this.params.container] Where to mount.
   */
  mount (target = this.params.container) {
    if (target instanceof HTMLElement && !this.mounted) {
      target.appendChild(this._el);
      /**
       * Component has mounted.
       *
       * @event Component#mounted
       * @property {Element} target Target element.
       */
      this.dispatchEvent('mounted', target);
    }
  }

  /**
   * Remove the component from DOM.
   *
   * @memberof Component#
   * @fires Component#removed
   */
  remove () {
    if (this.mounted) {
      const parent = this._el.parentNode;
      this._el.remove();
      /**
       * Component has removed.
       *
       * @event Component#removed
       * @property {Element} parent Parent element.
       */
      this.dispatchEvent('removed', parent);
    }
  }

  /**
   * Attach event handlers for DOM elements.
   *
   * @memberof Component#
   * @param {Object} events List of events with handlers.
   */
  listen (events = {}) {
    for (const event in events) {
      const handler = events[event];
      if (typeof handler === 'object') {
        for (const selector in handler) {
          const fn = handler[selector];
          if (typeof fn === 'function') {
            const wrappedFn = e => {
              const target = this.locate(selector, e);
              if (target) fn(e, target);
            };
            this._el.addEventListener(event, wrappedFn, true);
          }
        }
      }
    }
  }

  /**
   * Find the DOM element that triggered the event.
   *
   * @memberof Component#
   * @param {string} selector Element class name.
   * @param {Event} e Event.
   */
  locate (selector, e) {
    if (!selector || !e) return;
    let path = e.path;
    if (!path) {
      path = [];
      let target = e.target;
      while (target.parentNode !== null) {
        path.push(target);
        target = target.parentNode;
      }
    }
    for (let i = 0; i < path.length; i++) {
      const el = path[i];
      if (el instanceof Element !== true) continue;
      if (el.matches(`.${selector}`)) return el;
    }
  }

  /**
   * Find child element.
   *
   * @memberof Component#
   * @param {string} selector A class name to find an element.
   * @param {HTMLElement} [el=this.el] The parent element to start the search from.
   * @returns {HTMLElement} Found element.
   */
  $ (selector, el = this._el) {
    return el?.querySelector(`.${selector}`);
  }

  /**
   * Find all child elements.
   *
   * @memberof Component#
   * @param {string} selector A class name for finding elements.
   * @param {HTMLElement} [el=this.el] The parent element to start the search from.
   * @returns {HTMLElement[]} List of found elements.
   */
  $$ (selector, el = this._el) {
    return [...el?.querySelectorAll(`.${selector}`) || []];
  }

  /**
   * Compile the template.
   *
   * @memberof Component
   * @param {string} text Template text.
   * @param {object} [settings] Compilation options.
   * @param {object} [settings.variable="data"]
   * @param {object} [settings.escape]
   * @param {object} [settings.interpolate]
   * @param {object} [settings.evaluate]
   */
  compile (text = '', settings = {}) {
    if (typeof text !== 'string') text = `${text}`;
    const { variable, evaluate, interpolate, escape } = {
      variable: 'data',
      escape: /<%-([\s\S]+?)%>/g,
      interpolate: /<%=([\s\S]+?)%>/g,
      evaluate: /<%([\s\S]+?)%>/g,
      ...settings
    };
    const noMatch = /(.)^/;
    const escapes = {
      '\\': '\\',
      '\'': '\'',
      '\r': 'r',
      '\n': 'n',
      '\u2028': 'u2028',
      '\u2029': 'u2029'
    };
    const escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;
    const escapeChar = function (match) {
      return '\\' + escapes[match];
    };
    const matcher = new RegExp(
      [
        (escape || noMatch).source,
        (interpolate || noMatch).source,
        (evaluate || noMatch).source
      ].join('|') + '|$',
      'g'
    );
    let index = 0;
    let source = `with(${variable}){`;
    source += "var __t,__p='',__f=function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&#34;'}[c]||c};";
    source += "__p+='";
    text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;
      if (escape) {
        source += `'+((__t=(${escape}))==null?'':(''+__t).replace(/[&<>"]/g,__f))+'`;
      } else if (interpolate) {
        source += `'+((__t=(${interpolate}))==null?'':__t)+'`;
      } else if (evaluate) {
        source += `';${evaluate}__p+='`;
      }
      return match;
    });
    source += "';}";
    source += 'return __p;';
    try {
      // eslint-disable-next-line no-new-func
      const render = new Function(variable, source);
      return render.bind(this);
    } catch (e) {
      e.source = source;
      throw e;
    }
  }
}
