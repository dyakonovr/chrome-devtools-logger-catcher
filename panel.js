const port = chrome.runtime.connect({ name: "devtools-panel" });
const logsContainer = document.getElementById('logs');
const header = document.querySelector('#header');
let currentTabUrl = '';

// Получаем URL текущей вкладки
chrome.devtools.inspectedWindow.eval(
  'location.href',
  (result, isException) => {
    if (!isException && result) {
      currentTabUrl = new URL(result).origin;
      updateHeader();
    }
  }
);

function updateHeader() {
  header.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
    </svg>
    Filtered logs (@) - ${currentTabUrl || 'Current tab'}
  `;
}

const methodColors = {
  log: 'log',
  warn: 'warn',
  error: 'error'
};

function formatTime(date) {
  return date.toTimeString().substring(0, 8) + '.' + 
    date.getMilliseconds().toString().padStart(3, '0');
}

// Отправляем tabId в background.js
port.postMessage({
  type: "init",
  tabId: chrome.devtools.inspectedWindow.tabId
});

// Ловим сообщения от background.js
port.onMessage.addListener((message) => {
  if (message.type === '@log') {
    // Фильтруем логи только для текущего URL
    if (message.url && currentTabUrl && new URL(message.url).origin !== currentTabUrl) {
      return;
    }
    
    const now = new Date();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    logEntry.innerHTML = `
      <div class="log-time">${formatTime(now)}</div>
      <div class="log-content">
        <span class="log-method ${methodColors[message.method] || 'log'}">
          ${message.method.toUpperCase()}
        </span>
        <span class="log-message">${message.text}</span>
        ${message.url && currentTabUrl && new URL(message.url).origin !== currentTabUrl ? 
          `<div class="log-url">${message.url}</div>` : ''}
      </div>
    `;
    
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }
});