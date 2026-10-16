const statusEl = document.getElementById('status');
const serverInput = document.getElementById('serverUrl');

chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
  if (res && res.recording) {
    statusEl.textContent = `Recording active (${res.count} clicks captured)...`;
  }
});

document.getElementById('startBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'START_RECORDING' }, () => {
    statusEl.textContent = 'Recording active! Click elements on the page.';
  });
});

document.getElementById('stopBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  statusEl.textContent = 'Uploading to Arcade Studio...';
  chrome.runtime.sendMessage({
    type: 'STOP_AND_UPLOAD',
    serverUrl: serverInput.value,
    sourceUrl: tab?.url || 'https://whoami.genisisiq.com',
    title: tab?.title || 'Recorded Interactive Flow',
  });
});
