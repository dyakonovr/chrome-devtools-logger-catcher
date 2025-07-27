// Слушаем сообщения из MAIN world
window.addEventListener('message', (event) => {
  if (event.data.type === 'CONSOLE_LOG_TO_EXTENSION') {
    chrome.runtime.sendMessage({
      type: '@log',
      ...event.data.data
    }).catch(e => console.error('Bridge error:', e));
  }
});