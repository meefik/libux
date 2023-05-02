import State from './state';

export default class Locale extends State {
  /**
   * Get list of supperted languages.
   *
   * @memberof Locale#
   * @type {string[]}
   */
  get languages () {
    return Object.keys(this.params.locales || {});
  }

  /**
   * `Locale` class constructor.
   *
   * @constructor Locale
   * @extends State
   * @param {object} params Locale parameters.
   * @param {object} params.locales Translations into desired languages.
   * @param {string} [params.lang] Default language.
   * @example
   * // create a new instance
   * var locales = { en: { hello: 'Hello %{name}!' }, ru: { hello: 'Привет %{name}!' } };
   * var l10n = new Locale({ locales, lang: 'en' });
   * // get translation for specified path
   * l10n.t('hello', { name: 'World' }); // Hello World!
   * // list of supported languages
   * l10n.languages; // ['en', 'ru']
   * // switch to localization 'ru'
   * l10n.update({ lang: 'ru' });
   */
  constructor (params) {
    super(params);
    /**
     * @memberof Locale#
     * @name state
     * @type {object}
     * @property {string} lang Localization language.
     */
    this.update({
      lang: this.params.lang
    });
  }

  /**
   * Update the language after updating the state.
   *
   * @override
   * @memberof Locale#
   * @listens Locale#event:updated
   */
  events () {
    return {
      updated () {
        let { lang } = this.state;
        lang = lang || navigator.language;
        const locales = this.params.locales || {};
        lang = locales[lang] ? lang : 'en';
        this.state.lang = lang;
      }
    };
  }

  /**
   * Get a translation into the selected language by key.
   *
   * @memberof Locale#
   * @param {string} path Key name.
   * @param {object} [data] Variables in the text as %{var}.
   * @returns {string} Localized text.
   */
  t (path, data = {}) {
    const locales = this.params.locales || {};
    let value = this.getValue(path, locales[this.state.lang]);
    if (!value) return path;
    for (const k in data) {
      value = value.replace(`%{${k}}`, data[k]);
    }
    return value;
  }
}
