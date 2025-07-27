const port = chrome.runtime.connect({ name: "devtools-panel" });

// Отправляем tabId в background.js
port.postMessage({
  type: "init",
  tabId: chrome.devtools.inspectedWindow.tabId
});

// Ловим сообщения от background.js
const methodColors = {
  log: 'log',
  warn: 'warn',
  error: 'error'
};

const logsContainer = document.getElementById('logs');

function formatTime(date) {
  return date.toTimeString().substring(0, 8);
}

port.onMessage.addListener((message) => {
  if (message.type === '@log') {
    const now = new Date();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    logEntry.innerHTML = `
      <div class="log-time">${formatTime(now)}</div>
      <div class="log-content">
        <span class="log-method ${methodColors[message.method] || 'log'}">${message.method.toUpperCase()}</span>
        <span class="log-message">${message.text}</span>
      </div>
    `;
    
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }
});