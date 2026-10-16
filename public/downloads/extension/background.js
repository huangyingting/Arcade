let recording = false;
let capturedSteps = [];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_RECORDING') {
    recording = true;
    capturedSteps = [];
    sendResponse({ ok: true, recording });
  } else if (msg.type === 'GET_STATUS') {
    sendResponse({ recording, count: capturedSteps.length });
  } else if (msg.type === 'CLICK_CAPTURED' && recording) {
    capturedSteps.push(msg.step);
    sendResponse({ ok: true, count: capturedSteps.length });
  } else if (msg.type === 'STOP_AND_UPLOAD') {
    recording = false;
    const serverUrl = msg.serverUrl || 'http://localhost:3000';
    fetch(`${serverUrl}/api/flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: msg.title || 'Chrome Extension Recorded Flow',
        sourceUrl: msg.sourceUrl || 'https://whoami.genisisiq.com',
        recordedSteps: capturedSteps,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const flowId = data.flow?.id || '4fLyMFzH8BjqgKQF4Bd6';
        chrome.tabs.create({ url: `${serverUrl}/flows/${flowId}/edit` });
        sendResponse({ ok: true, flowId });
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
