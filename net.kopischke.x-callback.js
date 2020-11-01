// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: puzzle-piece;
/**
 * Helpers for x-callback operations inside Scriptable.
 * Source master repository on {@link https://github.com/kopischke/scriptable|GitHub}).
 * @author Martin Kopischke <martin@kopischke.net>
 * @version 1.2.0
 * @license MIT
 * @module
 */

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
 */
module.exports.XCallbackResult = class XCallbackResult {
  /**
   * Creates an XCallbackResult with handler functions for all canonical cases,
   * independently of if appropriate callback URLs have been provided.
   * @param {Object} parameters - An object with the x-callback return URLs.
   * @param {String} [parameters.x-success] - The x-success base URL.
   * @param {String} [parameters.x-cancel]  - The x-cancel base URL.
   * @param {String} [parameters.x-error]   - The x-error base URL.
   */
  constructor (parameters) {
    /**
     * x-callback URL handling function.
     * @typedef URLHandler
     * @function
     * @param {?Object} payload - Key / value pairs to return as URL parameters.
     */

    /**
     * Get an URL building function accepting variable payloads.
     * @param   {?String} base - The base `x-(success|cancel|error)` callback URL.
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

    /** @type URLHandler */
    this.successURL = makeURLHandlerFor(parameters['x-success'])
    /** @type URLHandler */
    this.cancelURL = makeURLHandlerFor(parameters['x-cancel'])
    /** @type URLHandler */
    this.errorURL = makeURLHandlerFor(parameters['x-error'])
  }
  
  /**
   * x-success result handler.
   * @param {?Object} payload - Key / value pairs to return as x-success URL parameters.
   * @param {?String} message - Message to log if XCallbackResult#successURL is null.
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
   * x-cancel result handler.
   * @param {?String} message - Message to log if XCallbackResult#cancelURL is null.
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
   * x-error result handler.
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