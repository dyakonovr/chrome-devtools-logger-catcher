const MAX_STORED_LOGS = 1000; // Максимальное количество хранимых логов
const storedLogs = new Map(); // Хранилище логов по tabId

// Обработчик сообщений от content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === '@log' && sender.tab?.id) {
    const tabId = sender.tab.id;
    
    // Сохраняем лог в хранилище
    if (!storedLogs.has(tabId)) {
      storedLogs.set(tabId, []);
    }
    
    const logs = storedLogs.get(tabId);
    logs.push({
      text: message.text,
      method: message.method,
      url: message.url,
      timestamp: Date.now()
    });
    
    // Ограничиваем размер хранилища
    if (logs.length > MAX_STORED_LOGS) {
      logs.splice(0, logs.length - MAX_STORED_LOGS);
    }
    
    // Отправляем в открытую панель DevTools (если есть)
    if (devToolsConnections[tabId]) {
      devToolsConnections[tabId].postMessage(message);
    }
  }
});

// Подключение DevTools panel
const devToolsConnections = {};

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "devtools-panel") {
    port.onMessage.addListener((msg) => {
      if (msg.type === 'init') {
        const tabId = msg.tabId;
        devToolsConnections[tabId] = port;
        
        // Отправляем сохраненные логи при подключении
        if (storedLogs.has(tabId)) {
          const logs = storedLogs.get(tabId);
          logs.forEach(log => {
            port.postMessage({
              type: '@log',
              ...log
            });
          });
        }
      }
    });
    
    port.onDisconnect.addListener(() => {
      for (const [tabId, p] of Object.entries(devToolsConnections)) {
        if (p === port) delete devToolsConnections[tabId];
      }
    });
  }
});

// Очистка старых логов при закрытии вкладки
chrome.tabs.onRemoved.addListener((tabId) => {
  storedLogs.delete(tabId);
});