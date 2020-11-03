// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: puzzle-piece;
/**
 * Asynchronous timers for Scriptable.
 * Source master repository on {@link https://github.com/kopischke/scriptable|GitHub}).
 * @author Martin Kopischke <martin@kopischke.net>
 * @version 1.1.2
 * @license MIT
 * @deprecated since Scriptable 1.4.4
 * @module
 */

/**
 * A Timer host allowing to launch an indefinite number of asynchronous timers.
 *
 * @example
 * const { Timer } = loadModule('net.kopischke.timer.js')
 * comst timer = new Timer()
 *
 * let timer1 = timer.add(2500).then(console.log('2.5 sec. timer elapsed'))
 * let timer2 = timer.add(500).then(console.log('0.5 sec. timer elapsed'))
 */
 module.exports.Timer = class Timer {
  /**
   * Creates a Timer host instance.
   * @property {Promise<Boolean>} ready - Resolves when the host is ready to launch timers.
   */
  constructor () {
    this.view = new WebView()
    let html = '<script>function wait (ms) { setTimeout(completion, ms) }</script>'
    this.ready = this.view.loadHTML(html).then(() => true)
  }

  /**
   * Starts an asynchronous timer. Will wait on the host to be ready, subtracting
   * that wait time from the timer run (which makes the ready delay the minimum
   * effective length for a timer launched immediately on host creation).
   * @returns {Promise} The timer.
   * @param {Number} delay - The timer running time, in ms.
   */
  async add (delay) {
    let target = Date.now() + delay
    await this.ready
    let remain = target - Date.now()
    return remain > 0
      ? this.view.evaluateJavaScript(`wait(${remain})`, true)
      : Promise.resolve()
  }
}
