// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: star-of-life;
/**
 * Checks the 7 day incidence number of selected places.
 * Input data will be parsed out of a comma seperated list for the widget parameters.
 * This version looks up 5-digit German postal codes (”Postleitzahlen") with
 * a German service (obviously), but the code easily adapts to other sources:
 * just change input normalisation in {@link getLookupCodes} and data
 * retrieval and processing in {@link getData} to fit your needs.
 *
 * - Adaptive support for different widget sizes, dark mode and accessibilty text settings.
 * - Robust handling of messy parameters and variance in returned data.
 * - Fully internationalised for German and English.
 * - Uses system display formats for numbers and dates.
 * - Caching of data for offline refresh cycles (with indicator of stale data).
 * - Data handling decoupled from widget building for adaptability.
 *
 * @author Martin Kopischke <martin@kopischke.net>
 * @version 1.1.4
 */
const { Localization } = importModule('net.kopischke.i18n.js')
const strings = {
  en: {
    headlineShort:'Incidence',
    headlineLong: 'COVID-19 Incidence',
    updated: '%{date:date unknown}, %{time:time unknown}',
    msgUnknownShort: '?',
    msgUnknownLong: 'unknown',
    msgCode: 'Code %{code:?}',
    msgCodeError: 'No valid German postal codes found in parameters.',
    msgNoData: 'Unable to retrieve incidence data.'
  },
  de: {
    headlineShort: 'Inzidenz',
    headlineLong: 'COVID-19-Inzidenz',
    updated: '%{date:Datum unbekannt}, %{time:Zeit unbekannt}',
    msgUnknownShort: '?',
    msgUnknownLong: 'unbekannt',
    msgCode: 'PLZ %{code}',
    msgCodeError: 'Keine Postleitzahlen in der Eingabe gefunden.',
    msgRequestError: 'Inzidenzdaten können nicht abgerufen werden.'
  }
}
const l8n = new Localization(strings)

/**
 * Widget preferences.
 * @property {boolean} debugLogging - Whether to log debugging info to the console.
 * @property {boolean} preferDistricts - Preferrably use ditrict name.
 * @property {number} refreshInterval - Interval for widget refresh, in minutes.
 * @property {string} widgetURL - The URL to load on widget interaction.
 */
const prefs = {
  debugLogging: false,
  preferDistricts: false,
  refreshInterval: 60,
  widgetURL: 'https://npgeo-corona-npgeo-de.hub.arcgis.com/app/478220a4c454480e823b17327b2bf1d4'
 }

/**
 * Test data for script runs not triggered by the widget.
 * This is intentionally messy and should resolve to three entries:
 *
 * - Köln (Cologne)
 * - Depending on `preferDistricts` pref: “Bergisch Gladbach“ or “Rheinisch-Bergischer Kreis”
 * - Code 99999 with an unknown value (localised).
 */
const testData = [' 50937', '51063', null, [1], 'foo', 51429, '99999']

// Present the widget when we run this in-app.
if (config.runsInWidget) {
  const widget = await makeWidget(config.widgetFamily)
  Script.setWidget(widget)
} else {
  const widget = await makeWidget('large')
  widget.presentLarge()
}

Script.complete()

/**
 * Log a message to console only if `debugLogging` is set in prefs.
 * @param {string} The message to log.
 */
function logDebug (message) {
  if (prefs.debugLogging) console.log(message)
}

/**
 * Source format independent incidence information data.
 * @typedef {object} IncidenceInfo
 * @property {string} code - The lookup code the information belongs to.
 * @property {string} place - The name of the exact place matching the code.
 * @property {?string} district - The larger organisational unit the place belongs to.
 * @property {number} incidence - The current incidence value.
 * @property {?number} previousIncidence - The historical incidence value.
 * @property {?string} credit - The source credit for the information
 * @property {?string} url - The lookup URL of the information.
 */

/**
 * Look up the incidence data for the provided codes.
 * @returns {Array.<?IncidenceInfo>} The looked up data.
 * @param {Array.<string>} codes - The postal codes to look up.
 */
async function getData (codes) {
  const responses = []
  for (code of codes) {
    const url = `https://covid.9digits.de/lockdown/${code}`
    logDebug(`Querying URL '${url}'`)
    const request = new Request(url)
    request.headers = { 'Accept': 'application/json' }
    try {
      const resp = await request.loadJSON()
      logDebug(`Response: ${JSON.stringify(resp)}`)
      const data = {
        code: code,
        place: resp.cityName,
        district: resp.districtName,
        incidence: Number.parseFloat(resp.lockdownIndex),
        previousIncidence: Number.parseFloat(resp.lockdownIndexPrevious2),
        credit: resp.dataSource,
        url: url
      }
      responses.push(data)
    } catch (error) {
      console.error(error)
      return []
    }
  }
  return responses
}

/**
 * Retrieve and deduplicate plausible postal codes to look up.
 * Essentially, we collect anything that resolves to a 5-digit string.
 * @returns {Array.<?string>} The requested postal codes.
 */
function getLookupCodes () {
  const toCodes = val => `${val}`.trim().match(/^\d{5}$/)
  const notEmpty = val => val != null
  const unique = (val, idx, ary) => idx === 0 || !ary.slice(0, idx - 1).includes(val)

  let codes = []
  if (config.runsInWidget) {
    const params = args.widgetParameter
    if (params != null) codes = params.split(',')
  } else {
    codes = testData
  }

  logDebug(`Input parameters: ${JSON.stringify(codes)}`)
  return codes.map(toCodes).filter(notEmpty).filter(unique)
}

/**
 * Retrieve the colour to use for a certain incidence index.
 * @returns {?Color} The colour to use.
 * @param {number} forIndex - The incidence index level to match.
 */
function getIncidenceColour (forIndex) {
  if (forIndex >= 50) return Color.red()
  if (forIndex >= 35) return Color.yellow()
  return null
}

/**
 * Retrieve the SF symbol to use to indicate a value trend.
 * @returns {SFSymbol} The SF Symbol.
 * @param {number} current - The current value number.
 * @param {number} comparedTo - The elder value to compare the current one with.
 */
function getTrendSymbol (value, comparedTo) {
  const diff = value - comparedTo
  if (diff >= comparedTo) return SFSymbol.named('arrow.up.circle')
  if (diff >= 1) return SFSymbol.named('arrow.up.right.circle')
  if (diff <= -1) return SFSymbol.named('arrow.down.right.circle')
  if (diff <= -comparedTo) return SFSymbol.named('arrow.down.circle')
  return SFSymbol.named('equal.circle')
}

/**
 * Get a localised update date and time string.
 * @returns {string} The localised string.
 * @param {number} timestamp - The UNIX timestamp representing the update time.
 * @param {boolean} [shortForm=false] - Whether to use a shortened display format.
 */
function getUpdateInfo(timestamp, shortForm) {
  const date = new Date(timestamp)
  const dateFmt = new DateFormatter()
  const timeFmt = new DateFormatter()
  if (shortForm) {
    dateFmt.useShortDateStyle()
    timeFmt.useShortTimeStyle()
  } else {
    dateFmt.useFullDateStyle()
    timeFmt.useShortTimeStyle()
  }
  const values = { date: dateFmt.string(date), time: timeFmt.string(date) }
  return l8n.string('updated', values)
}

/**
 * Retrieve current data and create the widget proper.
 * @returns {ListWidget} The widget.
 */
async function makeWidget (size) {
  logDebug(`Widget size: '${size}'`)

  const maxLines = size === 'large' ? 11 : 3
  const smallWidget = size === 'small'
  const colours = {
    demoted: Color.lightGray(),
    warning: Color.yellow(),
    error: Color.orange()
  }

  const widget = new ListWidget()
  widget.spacing = 2
  widget.url = prefs.widgetURL

  // Widget title.
  const titleStr = smallWidget ? l8n.string('headlineShort') : l8n.string('headlineLong')
  const title = widget.addText(titleStr)
  title.font = Font.headline()

  // Get sanitised input data.
  const codes = getLookupCodes()
  logDebug(`Sanitised parameters: ${JSON.stringify(codes)}`)
  if (!codes.length) {
    let error = widget.addText(l8n.string('msgCodeError'))
    error.textColor = colours.error
    error.font = Font.body()
    return widget
  }

  // Look up data; use local caching for offline support.
  const responses = await getData(codes)
  const fm = FileManager.local()
  const cache = `${fm.libraryDirectory()}/net.kopischke.covid-19.data`
  if (responses.length) {
    logDebug(`Updating cached data at '${cache}'.`)
    const respData = { updated: Date.now(), data: responses }
    fm.writeString(cache, JSON.stringify(respData))
  }

  logDebug(`Found cached data at '${cache}': ${fm.fileExists(cache)}.`)
  const locData = fm.fileExists(cache)
    ? JSON.parse(fm.readString(cache))
    : { updated: Date.now(), data: null }
  logDebug(`Using location data ${JSON.stringify(locData)}`)

  // Widget update line, adapted to widget size.
  // We add warning symbols when cached data goes stale.
  const updated = getUpdateInfo(locData.updated, smallWidget)
  const updateStack = widget.addStack()
  const updateInfo = updateStack.addText(updated)
  updateInfo.color = colours.demoted
  updateInfo.font = Font.footnote()

  updateStack.addSpacer(null)

  const age = Date.now() - locData.updated
  const hours = 60 * 60 * 1000 // timestamp conversion from ms to hrs
  logDebug(`Data is about ${age === 0 ? age : Math.round(age / hours)} hours old.`)
  if (age > 24 * hours) {
    let symbol, colour
    if (age > 72 * hours) {
      symbol = SFSymbol.named('xmark.circle.fill')
      colour = colours.error
    } else {
      symbol = SFSymbol.named('exclamationmark.circle.fill')
      colour = colours.warning
    }
    symbol.applyFont(updateInfo.font)

    const updateWarning = updateStack.addImage(symbol.image)
    updateWarning.tintColor = colour
    updateWarning.resizable = false
    updateWarning.centerAlignImage()
  }

  widget.addSpacer(widget.spacing)

  // Just display an error message if there is no data.
  if (locData.data == null || locData.data.length == 0) {
    const fail = widget.addText(l8n.string('msgNoData'))
    fail.textColor = colours.error
    fail.font = Font.body()
    return widget
  }

  // Insert up to maxLines of location data.
  const credits = [] 
  const locations = []
  locData.data.forEach((data, idx) => {
    logDebug(`Processing data: ${JSON.stringify(data)}`)
    if (locations.length < maxLines) {
      const locationStack = widget.addStack()
      const name = prefs.preferDistricts ? data.district : data.place || data.district
      const location = name || l8n.string('msgCode', { code: codes[idx] })
      if (!locations.includes(location)) {
        locations.push(location)

        const label = locationStack.addText(location)
        label.font = Font.body()
        if (data.url) label.url = data.url

        locationStack.addSpacer(null)

        const current = data.incidence
        if (current != null) {
          const incidence = locationStack.addText(current.toLocaleString())
          incidence.font = Font.headline()
          const incidenceColour = getIncidenceColour(current)
          if (incidenceColour) incidence.textColor = incidenceColour
          if (data.url) incidence.url = data.url

          if (!smallWidget) {
            locationStack.addSpacer(8)

            const previous = data.previousIncidence
            const symbol = previous == null
              ? SFSymbol.named('questionmark.circle')
              : getTrendSymbol(current, previous)
            symbol.applyFont(label.font)

            let trend = locationStack.addImage(symbol.image)
            trend.tintColor = incidence.textColor
            trend.resizable = false
            trend.centerAlignImage()
          }

          if (data.credit && !credits.includes(data.credit)) credits.push(data.credit)
        } else {
          if (data.errorMessage) console.warn(`Lookup error: ${data.errorMessage}`)
          const unknown = locationStack.addText(
            smallWidget ? l8n.string('msgUnknownShort') : l8n.string('msgUnknownLong')
          )
          unknown.font = Font.headline()
          unknown.textColor = colours.error
        }
      }
    }
  })

  // Top align contents.
  widget.addSpacer(null)

  // Add credits to large widgets.
  if (size === 'large' && credits.length) {
    widget.addSpacer(widget.spacing)
    const credit = widget.addText(credits.join(', '))
    credit.color = colours.demoted
    credit.font = Font.footnote()
  }

  // Set up widget refresh.
  const refresh = new Date()
  refresh.setMinutes(refresh.getMinutes() + prefs.refreshInterval)
  widget.refreshAfterDate = refresh
  return widget
}
