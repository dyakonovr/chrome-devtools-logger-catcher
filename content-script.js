const nativeConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

const handler = {
  get(target, prop) {
    if (['log', 'warn', 'error'].includes(prop)) {
      return function(...args) {
        nativeConsole[prop](...args);
        if (args.some(arg => String(arg).startsWith('@'))) {
          window.postMessage({
            type: 'CONSOLE_LOG_TO_EXTENSION',
            data: {
              text: args.join(' '),
              method: prop,
              url: window.location.href  // Добавляем URL страницы
            }
          }, '*');
        }
      };
    }
    return target[prop];
  }
};

window.console = new Proxy(console, handler);