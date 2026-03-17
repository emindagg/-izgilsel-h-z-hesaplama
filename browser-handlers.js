(function (globalScope) {
  function registerWindowHandlers(target, handlers) {
    Object.entries(handlers).forEach(([name, handler]) => {
      target[name] = handler;
    });

    return target;
  }

  const api = {
    registerWindowHandlers
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.BrowserHandlers = api;
})(typeof window !== 'undefined' ? window : globalThis);
