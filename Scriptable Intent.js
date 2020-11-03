// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: cog;
/**
 * A script result object.
 * @typedef ScriptResult
 * @property {string} kind - One of 'Result' or a JS Error name.
 * @property {string} value - Either the script output, or the Error message.
 */

/**
 * Evaluate arbitrary JavaScript code from Shortcuts.
 * Handles both native shortcut arguments (iOS 13+) and pasteboard input (iOS 12).
 * @author Martin Kopischke <martin@kopischke.net>
 * @version 2.1.2
 * @returns {ScriptResult} The result of running the script (as JSON on Pasteboard).
 */
const processor = {}

if (args.shortcutParameter != null) {
  // iOS 13+: use args and native output
  processor.in  = () => args.shortcutParameter
  processor.out = Script.setShortcutOutput
} else {
  // iOS 12: use Pasteboard (with JSON return data)
  processor.in  = Pasteboard.pasteString
  processor.out = o => {
    Pasteboard.copyString(JSON.stringify(o))
    Script.complete()
  }
}

var result
try {
  let code = processor.in()
  if (code == null || !code.trim().length) throw new EvalError('No code to evaluate.')
  result = { kind: 'Result', value: Function(code)() }
} catch (e) {
  result = { kind: e.name, value: e.message }
}

processor.out(result)
