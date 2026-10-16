document.addEventListener(
  'click',
  (e) => {
    const target = e.target;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const normX = Math.max(0.05, Math.min(0.95, e.clientX / window.innerWidth));
    const normY = Math.max(0.05, Math.min(0.95, e.clientY / window.innerHeight));
    const label =
      (target.innerText || target.getAttribute('aria-label') || target.tagName || 'Element')
        .trim()
        .slice(0, 60);

    chrome.runtime.sendMessage({
      type: 'CLICK_CAPTURED',
      step: {
        title: `Click "${label}"`,
        x: Number(normX.toFixed(3)),
        y: Number(normY.toFixed(3)),
        tooltipText: `Click "${label}" on ${window.location.hostname}`,
        url: window.location.href,
        rect: { width: rect.width, height: rect.height },
      },
    });
  },
  true
);
