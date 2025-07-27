const connections = {};

// Подключение DevTools панели
chrome.runtime.onConnect.addListener((port) => {
  console.log('port:', port);
  if (port.name === "devtools-panel") {
    console.log("DevTools panel connected");
    
    // Принимаем tabId от панели
    port.onMessage.addListener((message) => {
      if (message.type === "init") {
        const tabId = message.tabId;
        connections[tabId] = port;
        console.log(`Connected tab ${tabId}`);
      }
    });

    // Закрытие соединения
    port.onDisconnect.addListener(() => {
      console.log("DevTools panel disconnected");
      for (const [tabId, p] of Object.entries(connections)) {
        if (p === port) {
          delete connections[tabId];
          break;
        }
      }
    });
  }
});

// Ловим сообщения из content-script
chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("PLUGIN: Message received in background:", message, sender, connections);
  
  if (message.type === "@log" && sender.tab?.id) {
    const tabId = sender.tab.id;
    if (connections[tabId]) {
      console.log("Forwarding message to DevTools");
      connections[tabId].postMessage(message);
    }
  }
});