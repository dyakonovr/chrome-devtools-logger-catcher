const port = chrome.runtime.connect({ name: "devtools-panel" });
const logsContainer = document.getElementById('logs');
const header = document.querySelector('#header');
let currentTabUrl = '';

// Очистка логов
function clearLogs() {
  logsContainer.innerHTML = '';
}

// Отслеживание обновления страницы
chrome.devtools.network.onNavigated.addListener(() => {
  clearLogs();
  updateCurrentUrl();
});

// Получение текущего URL
function updateCurrentUrl() {
  chrome.devtools.inspectedWindow.eval(
    'location.href',
    (result, isException) => {
      if (!isException && result) {
        currentTabUrl = new URL(result).origin;
        updateHeader();
        // Уведомляем background о смене URL
        port.postMessage({
          type: "url-change",
          tabId: chrome.devtools.inspectedWindow.tabId,
          url: currentTabUrl
        });
      }
    }
  );
}

function updateHeader() {
  header.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
    </svg>
    Filtered logs (@) - ${currentTabUrl || 'Current tab'}
    <button id="clear-btn" style="margin-left: auto; background: none; border: none; color: #9aa0a6; cursor: pointer;">
      Clear
    </button>
  `;
  
  document.getElementById('clear-btn').addEventListener('click', clearLogs);
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

// Инициализация
updateCurrentUrl();
clearLogs();

const tabId = chrome.devtools.inspectedWindow.tabId;
port.postMessage({
  type: "init",
  tabId,
});

port.onMessage.addListener((message) => {
  if (message.type === '@log') {
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
      </div>
    `;
    
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }
});