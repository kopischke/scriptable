// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: puzzle-piece;
/**
 * Internationalization helpers for Scriptable.
 * Source master repository on {@link https://github.com/kopischke/scriptable|GitHub}).
 * @author Martin Kopischke <martin@kopischke.net>
 * @version 1.2.3
 * @license MIT
 * @module
 */

/**
 * Localize messages and UI text into device language.
 *
 * Localization is based on a set of template strings for different
 * languages; the nearest match(es) to the device language and the fallback
 * are merged into a set of translated strings. Dynamic insertion into these
 * is possible by using the placeholder syntax `${key[:default text]}`.
 *
 * @example
 * const strings = {
 *   en: {
 *     promptTitle: 'Password',
 *     promptMessage: 'Please enter your password for use by %{source:the source app}.'
 *   },
 *   de: {
 *     promptTitle: 'Passwort',
 *     promptMessage: 'Bitte Passwort für die Verwendung durch %{source:die aufrufende App} eingeben.'
 *   }
 * }
 * 
 * const { Localization } = importModule('net.kopischke.i18n.js')
 * const l8n = new Localization(strings)
 * let msg = l8n.string('promptMessage', {source: 'Scriptable'})
 */
module.exports.Localization = class Localization {
  /**
   * Dictionary of localized string templates.
   * Named placeholders with the syntax %{name[:default text]} can be specified
   * and will be replaced by the dictionary value matching `name` in {@link Localization#string};
   * umatched placeholders will be replaced by `default text` (if specified).
   * @typedef {object.<string, string>} LocalizedStrings
   */

  /**
   * Creates a localisation string set for the device language.
   * The set is merged, in order of descending precedence, from:
   *
   * - entries for the compound IETF language tag (i.e. 'de-AT')
   * - entries for the ISO 639 language tag (i.e. 'de')
   * - entries for 'en-US'
   * - entries for 'en'
   *
   * @param {object.<LocalizedStrings>} strings - Localised strings, keyed by language code.
   * @property {string} language - The device language tag the localisation tries to match.
   * @property {LocalizedStrings} strings - The merged set of localised string templates.
   * @see {@link https://en.wikipedia.org/wiki/Language_code|“Language Code” on Wikipedia}
   */
  constructor (strings) {
    // As of iOS 12, this is the shortest IETF language tag applicable.
    this.language = Device.language()
    let lang = this.language
    let base = this.language.split('-')[0]

    // Baseline and fallback is (US) English.
    let langFallback = 'en-US'
    let baseFallback = 'en'

    this.strings = strings[baseFallback] || {}
    if (strings[langFallback]) {
      this.strings = Object.assign(this.strings, strings[langFallback])
    }

    // Prefer strings from the language group (e.g 'fr') …
    if (base !== baseFallback && strings[base]) {
      this.strings = Object.assign(this.strings, strings[base])
    }

    // … or, even better, from the precise language (e.g. 'fr-CA').
    if (lang !== langFallback && lang !== base && strings[lang]) {
      this.strings = Object.assign(this.strings, strings[lang])
    }
  }

  /**
   * Get a localized string for a known key.
   * @returns {string} The localized string with placeholders replaced.
   * @param {string} key - the template key of the string to localize
   * @param {object} replacements - A dictionary of placeholder replacements values.
   * @default {string} The literal `key`.
   * @see LocalizedStrings
   */
  string (key, replacements) {
    let str = this.strings[key] || key
    if (str.includes('%{')) {
      if (replacements != null) {
        // replace matching placeholders
        str = Object.keys(replacements).reduce((acc, cur) => {
          if (replacements[cur] != null) {
            let regex = new RegExp(`%\\{${cur}(:[^}]+)?\\}`, 'g')
            acc = acc.replace(regex, replacements[cur])
          }
          return acc
        }, str)
      }
      // replace unmatched placeholders with provided defaults.
      str = str.replace(/%\{[^:}]+:([^}]+)\}/g, '$1')
    }
    return str
  }
}
