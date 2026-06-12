chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.action !== 'transcriptPayload') return

  const payload = message.payload || ''

  // store the payload and open the viewer page
  try {
    chrome.storage.local.set({ transcript_payload: payload }, () => {
      // Open CSP-safe viewer page as a new tab
      chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html') })
    })
  } catch (err) {
    console.error('background: failed to store/open viewer', err)
  }

})

