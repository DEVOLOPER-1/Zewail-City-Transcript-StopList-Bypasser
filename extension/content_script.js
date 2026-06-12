// Listens for messages from the extension popup and performs a same-origin fetch
// so the browser will include cookies/session information.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.action !== 'fetchTranscript') return

  (async () => {
    try {
      const endpoint = '/PowerCampusSelfService/Students/UnofficialTranscripts/undefined'
      const resp = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      })

      const text = await resp.text()

      // Send the payload to the background to store and open viewer
      chrome.runtime.sendMessage({ action: 'transcriptPayload', payload: text })

      sendResponse({ ok: true })
    } catch (err) {
      chrome.runtime.sendMessage({ action: 'transcriptPayload', payload: null })
      sendResponse({ ok: false, error: String(err) })
    }
  })()

  // indicate we'll call sendResponse asynchronously
  return true
})

