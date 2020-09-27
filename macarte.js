/* Polyfill for IE */
(function () {

  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

import './index.css'

// Set preferences
import config from './src/config'
document.title = config.title;

// Create Map
import macarte from './src/map'

// EXPORT
window.carteWidget = macarte;
