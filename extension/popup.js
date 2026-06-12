document.getElementById('fetch').addEventListener('click', async () => {
  const status = document.getElementById('status')
  status.textContent = 'Searching for sisselfservice tab...'

  // Find a tab that matches the target host
  const tabs = await chrome.tabs.query({})
  const target = tabs.find(t => t.url && t.url.includes('sisselfservice.zewailcity.edu.eg'))

  if (!target) {
    status.textContent = 'Open the SelfService page first in a tab.'
    return
  }

  status.textContent = 'Requesting transcript from page...'

  chrome.tabs.sendMessage(target.id, {action: 'fetchTranscript'}, (resp) => {
    // content script will reply asynchronously by opening the viewer
    if (chrome.runtime.lastError) {
      status.textContent = 'Failed to contact content script: ' + chrome.runtime.lastError.message
    } else {
      status.textContent = 'Fetch initiated — viewer will open when ready.'
    }
  })

})

