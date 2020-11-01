// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: key;
/**
 * A script result object.
 * @typedef ScriptResult
 * @property {string} kind - One of 'Result' or a JS Error name.
 * @property {string} value - Either the script output, or the Error message.
 */

/**
 * Securely prompt for a password from Shortcuts (password autofill supported).
 * Note we return a generic Error when the user cancels the prompt.
 * Source master repository on {@link https://github.com/kopischke/scriptable|GitHub}).
 * @author Martin Kopischke <martin@kopischke.net>
 * @version 1.0.1
 * @license MIT
 * @returns {ScriptResult} The script result with the password, if succesful.
 * @param {object} params – The prompt parameters.
 * @param {string} [params.origin] – The calling shortcut or application.
 * @param {string} [params.saveAs] – The Keychain key to store the password under.
 * @param {string} [params.title] – A user defined prompt title.
 * @param {string} [params.message] – A user defined prompt message.
 */
const {Localization} = importModule('net.kopischke.i18n')

// Localized strings. Passed to the `Localization` constructor.
const strings = {
  en: {
    promptTitle:'Password',
    promptMessage: 'Please enter your password for use by %{origin:the source app}.',
    promptDone: 'OK',
    promptSave: 'Save',
    promptOverwrite: 'Overwrite',
    promptCancel: 'Cancel',
    promptPlaceholder: 'password'
  },

  de: {
    promptTitle:'Passwort',
    promptMessage: 'Bitte Passwort für die Verwendung durch %{origin:die aufrufende App} eingeben.',
    promptOK: 'OK',
    promptSave: 'Speichern',
    promptOverwrite: 'Überschreiben',
    promptCancel: 'Abbrechen',
    promptPlaceholder: 'Passwort'
  }
}

// Main script logic.
const params = args.shortcutParameter
const l8n = new Localization(strings)

var result

try {
  let prompt = new Alert()
  prompt.title = params.title || l8n.string('promptTitle')
  prompt.message = params.message || l8n.string('promptMessage', {source: params.origin})
  prompt.addSecureTextField(l8n.string('promptPlaceholder'))
  prompt.addCancelAction(l8n.string('promptCancel'))
  if (params.saveAs) {
    if (Keychain.contains(key)) {
      prompt.addDestructiveAction(l8n.string('promptOverwrite'))
    } else {
      prompt.addAction(l8n.string('promptSave'))
    }
  } else {
    prompt.addAction(l8n.string('promptOK'))
  }

  let response = await prompt.presentAlert()
  if (response == -1) {
    throw new Error('Password input canceled by user.')
  } else {
    result = {kind: 'Result', value: prompt.textFieldValue(0)}
  }

} catch (e) {
  result = {kind: e.name, value: e.message }
}

// Save the value to the Keychain if a `save` key was provided.
// Note we do not return an error if this fails, as we still want to return the input value.
if (params.save) {
  try {
    Keychain.set(params.saveAs, password)
  } catch(e) {
    console.error(`Could not save password due to ${e.name}: ${e.message}.`)
  }
}

Script.setShortcutOutput(result)
