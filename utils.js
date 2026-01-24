/* global window, document */
(function (global) {
  // rAF polyfill
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = (
      global.webkitRequestAnimationFrame ||
      global.mozRequestAnimationFrame ||
      global.msRequestAnimationFrame ||
      global.oRequestAnimationFrame ||
      function (callback) {
        return global.setTimeout(callback, 17 /* ~1000/60 */);
      }
    );
  }

  // Namespace
  var Probes = global.Probes = global.Probes || {};

  // Utils module (keep a legacy alias as window.utils)
  var utils = Probes.utils = Probes.utils || {};
  global.utils = utils;

  /**
   * Keeps track of the current mouse position, relative to an element.
   * @param {HTMLElement} element
   * @return {object} Contains properties: x, y, event
   */
  utils.captureMouse = function (element) {
    var mouse = { x: 0, y: 0, event: null };
    var body_scrollLeft = document.body.scrollLeft;
    var element_scrollLeft = document.documentElement.scrollLeft;
    var body_scrollTop = document.body.scrollTop;
    var element_scrollTop = document.documentElement.scrollTop;
    var offsetLeft = element.offsetLeft;
    var offsetTop = element.offsetTop;

    element.addEventListener('mousemove', function (event) {
      var x, y;

      if (event.pageX || event.pageY) {
        x = event.pageX;
        y = event.pageY;
      } else {
        x = event.clientX + body_scrollLeft + element_scrollLeft;
        y = event.clientY + body_scrollTop + element_scrollTop;
      }
      x -= offsetLeft;
      y -= offsetTop;

      mouse.x = x;
      mouse.y = y;
      mouse.event = event;
    }, false);

    return mouse;
  };

  // returns a random integer between min and max (inclusive)
  utils.getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  utils.getRandomFloat = function (min, max) {
    return Math.random() * (max - min) + min;
  };

  utils.getDistance = function (x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  };

  utils.areColliding = function (x1, y1, radius1, x2, y2, radius2) {
    return utils.getDistance(x1, y1, x2, y2) <= radius1 + radius2;
  };
}(window));
