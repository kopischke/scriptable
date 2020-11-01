// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: puzzle-piece;
/**
 * unpkg: like NPM but not as good and available in Scriptable
 * Modified from Melanie Kat’s ùnpkg`, available on GitHub at
 * https://gist.github.com/ZicklePop/603b19dd3b9e09f99030bc24e616ca6c
 * @author Martin Kopischke <martin@kopischke.net>
 * @version 1.1.1
 * @module
 */

/**
 * Imports NPM modules from `modules` in Scriptable’s documents directory,
 * downloading them from unpkg.com first if necessary.
 *
 * @example
 * const unpkg = importModule('com.melaniekat.unpkg')
 * const _ = await unpkg('lodash')
 *
 * @returns {Promise} The retrieval opration, resolving to the source.
 * @param {string} package – the package name on NPM
 * @param {string} [file=package] – the package file to import
 * @param {string} [version] – the package version to import
 */
module.exports.unpkg = (package, file, version) => {
  return new Promise((resolve, reject) => {
    try {
      const jsFile = file || package
      const jsFileName = jsFile.split('/').pop()
      const pkgVersion = version ? `@${version}` : ''
      
      const fm = FileManager.iCloud() || FileManager.local()
      const modulesPath = fm.joinPath(fm.documentsDirectory(), 'modules')
      const modulePath = fm.joinPath(modulesPath, `${package}${pkgVersion}`)
      const filePath = fm.joinPath(modulePath, `${jsFileName}.js`)
      
      if (!fm.fileExists(modulePath)) fm.createDirectory(modulePath, true)
      if (fm.fileExists(filePath)) resolve(importModule(filePath))

      let target = `https://unpkg.com/${package}${pkgVersion}/${jsFile}.js`
      const req = new Request(target)
      req.loadString().then(res => {
        if (res) {
          fm.writeString(filePath, `${res}`).then(() => {
            resolve(importModule(filePath))
          })
        } else {
          let errMsg = `Request to ${target} returned code ${req.resonse.statusCode}.`
          reject(new Error(errMsg))
      })

    } catch(e) {
      reject(e)
    }
  })
}