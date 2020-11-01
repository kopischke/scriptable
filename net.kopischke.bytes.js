// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: puzzle-piece;
/**
 * Byte stream handling helpers for Scriptable.
 * Source master repository on {@link https://github.com/kopischke/scriptable|GitHub}).
 * @author Martin Kopischke <martin@kopischke.net>
 * @version 1.1.0
 * @license MIT
 * @module
 */

/**
 * The built in Uint8ClampedArray object.
 * @external Uint8ClampedArray
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray|Uint8ClampedArray reference on MDN}
 */

/**
 * Decodable sequence of bytes.
 *
 * @extends external:Uint8ClampedArray
 * @example
 * const { ByteSequence } = loadModule('net.kopischke.bytes.js')
 * const bytes = ByteSequence.fromChars('SanjÃ»rokunin no jÃ´kyaku')
 * let decoded = bytes.toUTF8String() // 'Sanjûrokunin no jôkyaku'
 */
module.exports.ByteSequence = class ByteSequence extends Uint8ClampedArray {
  /**
   * Creates a new ByteSequence instance.
   * @param {...string} bytes - The bytes to store in the sequence, in order.
   */
  constructor () {
    super(...arguments)
  }

  /**
   * Creates a new ByteSequence from an array-like or iterable object.
   * See also {@link Array.from()}.
   * @returns {ByteSequence} The new ByteSequence object.
   * @param {*} iterable - Any iterable primitive or object.
   */
  static from (iterable) { // super.from throws TypeError for thisArg
    let ary = Array.from(iterable)
    return new ByteSequence(ary)
  }

  /**
   * Creates a new ByteSequence with a variable number of arguments.
   * See also {@link Array.of()}.
   * @returns {ByteSequence} The new ByteSequence object.
   * @param {...*} - Any number of primitives or objects.
   */
  static of () { // super.of throws TypeError for thisArg
    let ary = Array.of(...arguments)
    return new ByteSequence(ary)
  }

  /**
   * Create a new ByteSequence of character codes.
   *
   * This is a convenience initialiser equivalent to
   * ByteSequence.from(str, c => c.charCodeAt(0)).
   * @returns {ByteSequence}
   * @param {string} str - The string representation of the byte sequence.
   */
  static fromChars (str) {
    return ByteSequence.from(str, c => c.charCodeAt(0))
  }

  /**
   * Decode the byte sequence as UTF-8.
   *
   * Adapted from the code in {@link https://weblog.rogueamoeba.com/2017/02/27/javascript-correctly-converting-a-byte-array-to-a-utf-8-string/|“JavaScript: Correctly Converting a Byte Array to a UTF-8 String” by Ed Wynne},
   * with less emphasis on bitwise operations and hex values, added errors and more efficient
   * generation of the resulting string.
   * @returns {string} The decoded string.
   * @throws Will throw an error on invalid UTF-8 byte sequences.
   * @see {@link https://en.wikipedia.org/wiki/UTF-8|“UTF-8” on Wikipedia}
   */
  toUTF8String () {
    const startBytes = [240, 224, 192] // multibyte start bytes 1111|1110|110X XXXX
    const decoded = []
    
    for (let pos = 0; pos < this.length;) {
      let code = this[pos++]
      if (code > 127) { // multibyte codepoint (if valid)
        let forward = 3 - startBytes.findIndex(v => code >= v)
        if (forward > 3 || (pos + forward) > this.length) {
          let msg = `Invalid start of UTF-8 multibyte codepoint at position ${pos}: ${code}.`
          throw new Error(msg)
        }

        code = code & (63 >> forward)
        for (; forward > 0; forward--) {
          let byte = this[pos++]
          if (byte > 191) { // multibyte followup bytes must be 10XX XXXX
            let msg = `Invalid UTF-8 multibyte codepoint part at position ${pos}: ${byte}.`
            throw new Error(msg)
          }
          code = (code << 6) | (byte & 63)
        }
      }      
      decoded.push(code)
    }
    return String.fromCharCode(...decoded)
  }
}