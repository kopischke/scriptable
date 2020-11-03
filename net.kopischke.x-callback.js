// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: puzzle-piece;
/**
 * Helpers for x-callback operations inside Scriptable.
 * Source master repository on {@link https://github.com/kopischke/scriptable|GitHub}).
 * @author Martin Kopischke <martin@kopischke.net>
 * @version 1.2.1
 * @license MIT
 * @module
 */

/**
 * x-callback URL handling function.
 * @typedef {function} URLHandler
 * @param {?object} payload - Key / value pairs to return as URL parameters.
 */

/**
 */
module.exports.XCallbackResult = class XCallbackResult {
  /**
   * Handle x-callback returns, with fallbacks where no callback URLs are provided.
   *
   * This allows for vastly simplified returning of operation results to the caller
   * when a Scriptable script is executed via x-callback:
   * 
   * @example
   * const {XCallbackResult} = require('net.kopischke.x-callback.js')
   * const params = URLScheme.allParameters()
   * const result = new XCallbackResult(params)
   *
   * depending on outcome:
   * result.success({foo: 'bar'})
   * result.cancel({foo: 'bar'}, 'Dialog canceled by user')
   * result.error(err)
   * @param {object} parameters - An object with the x-callback return URLs.
   * @param {string} [parameters.x-success] - The x-success base URL.
   * @param {string} [parameters.x-cancel]  - The x-cancel base URL.
   * @param {string} [parameters.x-error]   - The x-error base URL.
   * @property {URLHandler} successURL - The 'x-success' URL handler.
   * @property {URLHandler} cancelURL - The 'x-cancel' URL handler.
   * @property {URLHandler} errorURL - The 'x-error' URL handler.
   */
  constructor (parameters) {
    /**
     * Get an URL building function accepting variable payloads.
     * @param   {?string} base - The base `x-(success|cancel|error)` callback URL.
     * @returns {?URLHandler} null if no callback URL is provided.
     * @private
     */
    const makeURLHandlerFor = base => {
      return base == null ? null : payload => {
        let url = base
        if (payload != null) {
          let parts = Object.keys(payload).reduce((acc, cur) => {
            let val = payload[cur]
            if (val != null) {
              if (typeof val !== 'string') val = JSON.stringify(val)
              acc.push(`${encodeURIComponent(cur)}=${encodeURIComponent(val)}`)
            }
            return acc
          }, [])
          if (parts.length > 0) url += `?${parts.join('&')}`
        }
        return url
      }
    }

    this.successURL = makeURLHandlerFor(parameters['x-success'])
    this.cancelURL = makeURLHandlerFor(parameters['x-cancel'])
    this.errorURL = makeURLHandlerFor(parameters['x-error'])
  }

  /**
   * x-success result action.
   * @param {?object} payload - Key / value pairs to return as x-success URL parameters.
   * @param {?string} message - Message to log if XCallbackResult#successURL is null.
   */
  success (payload, message) {
    if (this.successURL != null) {
      let url = this.successURL(payload)
      Safari.open(url)
    } else {
      let msg = message || 'x-callback: Operation successful.'
      console.log(msg)
    }
  }

  /**
   * x-cancel result action.
   * @param {?string} message - Message to log if XCallbackResult#cancelURL is null.
   */
  cancel (message) {
    if (this.cancelURL != null) {
      let url = this.cancelURL(null)
      Safari.open(url)
    } else {
      let msg = message || 'x-callback: Operation canceled.'
      console.log(msg)
    }
  }

  /**
   * x-error result action.
   * @param {Error} err - The error triggering the x-error handler.
   * @throws The passed error if XCallbackResult#errorURL is null.
   */
  error (err) {
    if (this.errorURL != null) {
      let url = this.errorURL({errorCode: err.name, errorMessage: err.message})
      Safari.open(url)
    } else {
      throw err
    }
  }
}
