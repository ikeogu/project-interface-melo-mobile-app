// Must be CommonJS (no import statements) so this runs BEFORE any module loads.
// Babel hoists ES6 imports above plain code, which would defeat the polyfill.

// DOMException is used by livekit-client at module-load time.
// Hermes throws ReferenceError for missing browser globals.
if (typeof global.DOMException === 'undefined') {
  global.DOMException = class DOMException extends Error {
    constructor(message = '', name = 'Error') {
      super(message);
      this.name = name;
      this.code = 0;
    }
  };
}

const { registerRootComponent } = require('expo');
const App = require('./App').default;

registerRootComponent(App);
