/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/animejs/lib/anime.es.js":
/*!**********************************************!*\
  !*** ./node_modules/animejs/lib/anime.es.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/*
 * anime.js v3.2.1
 * (c) 2020 Julian Garnier
 * Released under the MIT license
 * animejs.com
 */

// Defaults

var defaultInstanceSettings = {
  update: null,
  begin: null,
  loopBegin: null,
  changeBegin: null,
  change: null,
  changeComplete: null,
  loopComplete: null,
  complete: null,
  loop: 1,
  direction: 'normal',
  autoplay: true,
  timelineOffset: 0
};

var defaultTweenSettings = {
  duration: 1000,
  delay: 0,
  endDelay: 0,
  easing: 'easeOutElastic(1, .5)',
  round: 0
};

var validTransforms = ['translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY', 'perspective', 'matrix', 'matrix3d'];

// Caching

var cache = {
  CSS: {},
  springs: {}
};

// Utils

function minMax(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function stringContains(str, text) {
  return str.indexOf(text) > -1;
}

function applyArguments(func, args) {
  return func.apply(null, args);
}

var is = {
  arr: function (a) { return Array.isArray(a); },
  obj: function (a) { return stringContains(Object.prototype.toString.call(a), 'Object'); },
  pth: function (a) { return is.obj(a) && a.hasOwnProperty('totalLength'); },
  svg: function (a) { return a instanceof SVGElement; },
  inp: function (a) { return a instanceof HTMLInputElement; },
  dom: function (a) { return a.nodeType || is.svg(a); },
  str: function (a) { return typeof a === 'string'; },
  fnc: function (a) { return typeof a === 'function'; },
  und: function (a) { return typeof a === 'undefined'; },
  nil: function (a) { return is.und(a) || a === null; },
  hex: function (a) { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a); },
  rgb: function (a) { return /^rgb/.test(a); },
  hsl: function (a) { return /^hsl/.test(a); },
  col: function (a) { return (is.hex(a) || is.rgb(a) || is.hsl(a)); },
  key: function (a) { return !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes'; },
};

// Easings

function parseEasingParameters(string) {
  var match = /\(([^)]+)\)/.exec(string);
  return match ? match[1].split(',').map(function (p) { return parseFloat(p); }) : [];
}

// Spring solver inspired by Webkit Copyright © 2016 Apple Inc. All rights reserved. https://webkit.org/demos/spring/spring.js

function spring(string, duration) {

  var params = parseEasingParameters(string);
  var mass = minMax(is.und(params[0]) ? 1 : params[0], .1, 100);
  var stiffness = minMax(is.und(params[1]) ? 100 : params[1], .1, 100);
  var damping = minMax(is.und(params[2]) ? 10 : params[2], .1, 100);
  var velocity =  minMax(is.und(params[3]) ? 0 : params[3], .1, 100);
  var w0 = Math.sqrt(stiffness / mass);
  var zeta = damping / (2 * Math.sqrt(stiffness * mass));
  var wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
  var a = 1;
  var b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

  function solver(t) {
    var progress = duration ? (duration * t) / 1000 : t;
    if (zeta < 1) {
      progress = Math.exp(-progress * zeta * w0) * (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
    } else {
      progress = (a + b * progress) * Math.exp(-progress * w0);
    }
    if (t === 0 || t === 1) { return t; }
    return 1 - progress;
  }

  function getDuration() {
    var cached = cache.springs[string];
    if (cached) { return cached; }
    var frame = 1/6;
    var elapsed = 0;
    var rest = 0;
    while(true) {
      elapsed += frame;
      if (solver(elapsed) === 1) {
        rest++;
        if (rest >= 16) { break; }
      } else {
        rest = 0;
      }
    }
    var duration = elapsed * frame * 1000;
    cache.springs[string] = duration;
    return duration;
  }

  return duration ? solver : getDuration;

}

// Basic steps easing implementation https://developer.mozilla.org/fr/docs/Web/CSS/transition-timing-function

function steps(steps) {
  if ( steps === void 0 ) steps = 10;

  return function (t) { return Math.ceil((minMax(t, 0.000001, 1)) * steps) * (1 / steps); };
}

// BezierEasing https://github.com/gre/bezier-easing

var bezier = (function () {

  var kSplineTableSize = 11;
  var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1 }
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1 }
  function C(aA1)      { return 3.0 * aA1 }

  function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT }
  function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1) }

  function binarySubdivide(aX, aA, aB, mX1, mX2) {
    var currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) { aB = currentT; } else { aA = currentT; }
    } while (Math.abs(currentX) > 0.0000001 && ++i < 10);
    return currentT;
  }

  function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
    for (var i = 0; i < 4; ++i) {
      var currentSlope = getSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) { return aGuessT; }
      var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }

  function bezier(mX1, mY1, mX2, mY2) {

    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) { return; }
    var sampleValues = new Float32Array(kSplineTableSize);

    if (mX1 !== mY1 || mX2 !== mY2) {
      for (var i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }
    }

    function getTForX(aX) {

      var intervalStart = 0;
      var currentSample = 1;
      var lastSample = kSplineTableSize - 1;

      for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
        intervalStart += kSampleStepSize;
      }

      --currentSample;

      var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      var guessForT = intervalStart + dist * kSampleStepSize;
      var initialSlope = getSlope(guessForT, mX1, mX2);

      if (initialSlope >= 0.001) {
        return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
      }

    }

    return function (x) {
      if (mX1 === mY1 && mX2 === mY2) { return x; }
      if (x === 0 || x === 1) { return x; }
      return calcBezier(getTForX(x), mY1, mY2);
    }

  }

  return bezier;

})();

var penner = (function () {

  // Based on jQuery UI's implemenation of easing equations from Robert Penner (http://www.robertpenner.com/easing)

  var eases = { linear: function () { return function (t) { return t; }; } };

  var functionEasings = {
    Sine: function () { return function (t) { return 1 - Math.cos(t * Math.PI / 2); }; },
    Circ: function () { return function (t) { return 1 - Math.sqrt(1 - t * t); }; },
    Back: function () { return function (t) { return t * t * (3 * t - 2); }; },
    Bounce: function () { return function (t) {
      var pow2, b = 4;
      while (t < (( pow2 = Math.pow(2, --b)) - 1) / 11) {}
      return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow(( pow2 * 3 - 2 ) / 22 - t, 2)
    }; },
    Elastic: function (amplitude, period) {
      if ( amplitude === void 0 ) amplitude = 1;
      if ( period === void 0 ) period = .5;

      var a = minMax(amplitude, 1, 10);
      var p = minMax(period, .1, 2);
      return function (t) {
        return (t === 0 || t === 1) ? t : 
          -a * Math.pow(2, 10 * (t - 1)) * Math.sin((((t - 1) - (p / (Math.PI * 2) * Math.asin(1 / a))) * (Math.PI * 2)) / p);
      }
    }
  };

  var baseEasings = ['Quad', 'Cubic', 'Quart', 'Quint', 'Expo'];

  baseEasings.forEach(function (name, i) {
    functionEasings[name] = function () { return function (t) { return Math.pow(t, i + 2); }; };
  });

  Object.keys(functionEasings).forEach(function (name) {
    var easeIn = functionEasings[name];
    eases['easeIn' + name] = easeIn;
    eases['easeOut' + name] = function (a, b) { return function (t) { return 1 - easeIn(a, b)(1 - t); }; };
    eases['easeInOut' + name] = function (a, b) { return function (t) { return t < 0.5 ? easeIn(a, b)(t * 2) / 2 : 
      1 - easeIn(a, b)(t * -2 + 2) / 2; }; };
    eases['easeOutIn' + name] = function (a, b) { return function (t) { return t < 0.5 ? (1 - easeIn(a, b)(1 - t * 2)) / 2 : 
      (easeIn(a, b)(t * 2 - 1) + 1) / 2; }; };
  });

  return eases;

})();

function parseEasings(easing, duration) {
  if (is.fnc(easing)) { return easing; }
  var name = easing.split('(')[0];
  var ease = penner[name];
  var args = parseEasingParameters(easing);
  switch (name) {
    case 'spring' : return spring(easing, duration);
    case 'cubicBezier' : return applyArguments(bezier, args);
    case 'steps' : return applyArguments(steps, args);
    default : return applyArguments(ease, args);
  }
}

// Strings

function selectString(str) {
  try {
    var nodes = document.querySelectorAll(str);
    return nodes;
  } catch(e) {
    return;
  }
}

// Arrays

function filterArray(arr, callback) {
  var len = arr.length;
  var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
  var result = [];
  for (var i = 0; i < len; i++) {
    if (i in arr) {
      var val = arr[i];
      if (callback.call(thisArg, val, i, arr)) {
        result.push(val);
      }
    }
  }
  return result;
}

function flattenArray(arr) {
  return arr.reduce(function (a, b) { return a.concat(is.arr(b) ? flattenArray(b) : b); }, []);
}

function toArray(o) {
  if (is.arr(o)) { return o; }
  if (is.str(o)) { o = selectString(o) || o; }
  if (o instanceof NodeList || o instanceof HTMLCollection) { return [].slice.call(o); }
  return [o];
}

function arrayContains(arr, val) {
  return arr.some(function (a) { return a === val; });
}

// Objects

function cloneObject(o) {
  var clone = {};
  for (var p in o) { clone[p] = o[p]; }
  return clone;
}

function replaceObjectProps(o1, o2) {
  var o = cloneObject(o1);
  for (var p in o1) { o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p]; }
  return o;
}

function mergeObjects(o1, o2) {
  var o = cloneObject(o1);
  for (var p in o2) { o[p] = is.und(o1[p]) ? o2[p] : o1[p]; }
  return o;
}

// Colors

function rgbToRgba(rgbValue) {
  var rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
  return rgb ? ("rgba(" + (rgb[1]) + ",1)") : rgbValue;
}

function hexToRgba(hexValue) {
  var rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  var hex = hexValue.replace(rgx, function (m, r, g, b) { return r + r + g + g + b + b; } );
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);
  return ("rgba(" + r + "," + g + "," + b + ",1)");
}

function hslToRgba(hslValue) {
  var hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
  var h = parseInt(hsl[1], 10) / 360;
  var s = parseInt(hsl[2], 10) / 100;
  var l = parseInt(hsl[3], 10) / 100;
  var a = hsl[4] || 1;
  function hue2rgb(p, q, t) {
    if (t < 0) { t += 1; }
    if (t > 1) { t -= 1; }
    if (t < 1/6) { return p + (q - p) * 6 * t; }
    if (t < 1/2) { return q; }
    if (t < 2/3) { return p + (q - p) * (2/3 - t) * 6; }
    return p;
  }
  var r, g, b;
  if (s == 0) {
    r = g = b = l;
  } else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return ("rgba(" + (r * 255) + "," + (g * 255) + "," + (b * 255) + "," + a + ")");
}

function colorToRgb(val) {
  if (is.rgb(val)) { return rgbToRgba(val); }
  if (is.hex(val)) { return hexToRgba(val); }
  if (is.hsl(val)) { return hslToRgba(val); }
}

// Units

function getUnit(val) {
  var split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
  if (split) { return split[1]; }
}

function getTransformUnit(propName) {
  if (stringContains(propName, 'translate') || propName === 'perspective') { return 'px'; }
  if (stringContains(propName, 'rotate') || stringContains(propName, 'skew')) { return 'deg'; }
}

// Values

function getFunctionValue(val, animatable) {
  if (!is.fnc(val)) { return val; }
  return val(animatable.target, animatable.id, animatable.total);
}

function getAttribute(el, prop) {
  return el.getAttribute(prop);
}

function convertPxToUnit(el, value, unit) {
  var valueUnit = getUnit(value);
  if (arrayContains([unit, 'deg', 'rad', 'turn'], valueUnit)) { return value; }
  var cached = cache.CSS[value + unit];
  if (!is.und(cached)) { return cached; }
  var baseline = 100;
  var tempEl = document.createElement(el.tagName);
  var parentEl = (el.parentNode && (el.parentNode !== document)) ? el.parentNode : document.body;
  parentEl.appendChild(tempEl);
  tempEl.style.position = 'absolute';
  tempEl.style.width = baseline + unit;
  var factor = baseline / tempEl.offsetWidth;
  parentEl.removeChild(tempEl);
  var convertedUnit = factor * parseFloat(value);
  cache.CSS[value + unit] = convertedUnit;
  return convertedUnit;
}

function getCSSValue(el, prop, unit) {
  if (prop in el.style) {
    var uppercasePropName = prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    var value = el.style[prop] || getComputedStyle(el).getPropertyValue(uppercasePropName) || '0';
    return unit ? convertPxToUnit(el, value, unit) : value;
  }
}

function getAnimationType(el, prop) {
  if (is.dom(el) && !is.inp(el) && (!is.nil(getAttribute(el, prop)) || (is.svg(el) && el[prop]))) { return 'attribute'; }
  if (is.dom(el) && arrayContains(validTransforms, prop)) { return 'transform'; }
  if (is.dom(el) && (prop !== 'transform' && getCSSValue(el, prop))) { return 'css'; }
  if (el[prop] != null) { return 'object'; }
}

function getElementTransforms(el) {
  if (!is.dom(el)) { return; }
  var str = el.style.transform || '';
  var reg  = /(\w+)\(([^)]*)\)/g;
  var transforms = new Map();
  var m; while (m = reg.exec(str)) { transforms.set(m[1], m[2]); }
  return transforms;
}

function getTransformValue(el, propName, animatable, unit) {
  var defaultVal = stringContains(propName, 'scale') ? 1 : 0 + getTransformUnit(propName);
  var value = getElementTransforms(el).get(propName) || defaultVal;
  if (animatable) {
    animatable.transforms.list.set(propName, value);
    animatable.transforms['last'] = propName;
  }
  return unit ? convertPxToUnit(el, value, unit) : value;
}

function getOriginalTargetValue(target, propName, unit, animatable) {
  switch (getAnimationType(target, propName)) {
    case 'transform': return getTransformValue(target, propName, animatable, unit);
    case 'css': return getCSSValue(target, propName, unit);
    case 'attribute': return getAttribute(target, propName);
    default: return target[propName] || 0;
  }
}

function getRelativeValue(to, from) {
  var operator = /^(\*=|\+=|-=)/.exec(to);
  if (!operator) { return to; }
  var u = getUnit(to) || 0;
  var x = parseFloat(from);
  var y = parseFloat(to.replace(operator[0], ''));
  switch (operator[0][0]) {
    case '+': return x + y + u;
    case '-': return x - y + u;
    case '*': return x * y + u;
  }
}

function validateValue(val, unit) {
  if (is.col(val)) { return colorToRgb(val); }
  if (/\s/g.test(val)) { return val; }
  var originalUnit = getUnit(val);
  var unitLess = originalUnit ? val.substr(0, val.length - originalUnit.length) : val;
  if (unit) { return unitLess + unit; }
  return unitLess;
}

// getTotalLength() equivalent for circle, rect, polyline, polygon and line shapes
// adapted from https://gist.github.com/SebLambla/3e0550c496c236709744

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function getCircleLength(el) {
  return Math.PI * 2 * getAttribute(el, 'r');
}

function getRectLength(el) {
  return (getAttribute(el, 'width') * 2) + (getAttribute(el, 'height') * 2);
}

function getLineLength(el) {
  return getDistance(
    {x: getAttribute(el, 'x1'), y: getAttribute(el, 'y1')}, 
    {x: getAttribute(el, 'x2'), y: getAttribute(el, 'y2')}
  );
}

function getPolylineLength(el) {
  var points = el.points;
  var totalLength = 0;
  var previousPos;
  for (var i = 0 ; i < points.numberOfItems; i++) {
    var currentPos = points.getItem(i);
    if (i > 0) { totalLength += getDistance(previousPos, currentPos); }
    previousPos = currentPos;
  }
  return totalLength;
}

function getPolygonLength(el) {
  var points = el.points;
  return getPolylineLength(el) + getDistance(points.getItem(points.numberOfItems - 1), points.getItem(0));
}

// Path animation

function getTotalLength(el) {
  if (el.getTotalLength) { return el.getTotalLength(); }
  switch(el.tagName.toLowerCase()) {
    case 'circle': return getCircleLength(el);
    case 'rect': return getRectLength(el);
    case 'line': return getLineLength(el);
    case 'polyline': return getPolylineLength(el);
    case 'polygon': return getPolygonLength(el);
  }
}

function setDashoffset(el) {
  var pathLength = getTotalLength(el);
  el.setAttribute('stroke-dasharray', pathLength);
  return pathLength;
}

// Motion path

function getParentSvgEl(el) {
  var parentEl = el.parentNode;
  while (is.svg(parentEl)) {
    if (!is.svg(parentEl.parentNode)) { break; }
    parentEl = parentEl.parentNode;
  }
  return parentEl;
}

function getParentSvg(pathEl, svgData) {
  var svg = svgData || {};
  var parentSvgEl = svg.el || getParentSvgEl(pathEl);
  var rect = parentSvgEl.getBoundingClientRect();
  var viewBoxAttr = getAttribute(parentSvgEl, 'viewBox');
  var width = rect.width;
  var height = rect.height;
  var viewBox = svg.viewBox || (viewBoxAttr ? viewBoxAttr.split(' ') : [0, 0, width, height]);
  return {
    el: parentSvgEl,
    viewBox: viewBox,
    x: viewBox[0] / 1,
    y: viewBox[1] / 1,
    w: width,
    h: height,
    vW: viewBox[2],
    vH: viewBox[3]
  }
}

function getPath(path, percent) {
  var pathEl = is.str(path) ? selectString(path)[0] : path;
  var p = percent || 100;
  return function(property) {
    return {
      property: property,
      el: pathEl,
      svg: getParentSvg(pathEl),
      totalLength: getTotalLength(pathEl) * (p / 100)
    }
  }
}

function getPathProgress(path, progress, isPathTargetInsideSVG) {
  function point(offset) {
    if ( offset === void 0 ) offset = 0;

    var l = progress + offset >= 1 ? progress + offset : 0;
    return path.el.getPointAtLength(l);
  }
  var svg = getParentSvg(path.el, path.svg);
  var p = point();
  var p0 = point(-1);
  var p1 = point(+1);
  var scaleX = isPathTargetInsideSVG ? 1 : svg.w / svg.vW;
  var scaleY = isPathTargetInsideSVG ? 1 : svg.h / svg.vH;
  switch (path.property) {
    case 'x': return (p.x - svg.x) * scaleX;
    case 'y': return (p.y - svg.y) * scaleY;
    case 'angle': return Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
  }
}

// Decompose value

function decomposeValue(val, unit) {
  // const rgx = /-?\d*\.?\d+/g; // handles basic numbers
  // const rgx = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  var rgx = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  var value = validateValue((is.pth(val) ? val.totalLength : val), unit) + '';
  return {
    original: value,
    numbers: value.match(rgx) ? value.match(rgx).map(Number) : [0],
    strings: (is.str(val) || unit) ? value.split(rgx) : []
  }
}

// Animatables

function parseTargets(targets) {
  var targetsArray = targets ? (flattenArray(is.arr(targets) ? targets.map(toArray) : toArray(targets))) : [];
  return filterArray(targetsArray, function (item, pos, self) { return self.indexOf(item) === pos; });
}

function getAnimatables(targets) {
  var parsed = parseTargets(targets);
  return parsed.map(function (t, i) {
    return {target: t, id: i, total: parsed.length, transforms: { list: getElementTransforms(t) } };
  });
}

// Properties

function normalizePropertyTweens(prop, tweenSettings) {
  var settings = cloneObject(tweenSettings);
  // Override duration if easing is a spring
  if (/^spring/.test(settings.easing)) { settings.duration = spring(settings.easing); }
  if (is.arr(prop)) {
    var l = prop.length;
    var isFromTo = (l === 2 && !is.obj(prop[0]));
    if (!isFromTo) {
      // Duration divided by the number of tweens
      if (!is.fnc(tweenSettings.duration)) { settings.duration = tweenSettings.duration / l; }
    } else {
      // Transform [from, to] values shorthand to a valid tween value
      prop = {value: prop};
    }
  }
  var propArray = is.arr(prop) ? prop : [prop];
  return propArray.map(function (v, i) {
    var obj = (is.obj(v) && !is.pth(v)) ? v : {value: v};
    // Default delay value should only be applied to the first tween
    if (is.und(obj.delay)) { obj.delay = !i ? tweenSettings.delay : 0; }
    // Default endDelay value should only be applied to the last tween
    if (is.und(obj.endDelay)) { obj.endDelay = i === propArray.length - 1 ? tweenSettings.endDelay : 0; }
    return obj;
  }).map(function (k) { return mergeObjects(k, settings); });
}


function flattenKeyframes(keyframes) {
  var propertyNames = filterArray(flattenArray(keyframes.map(function (key) { return Object.keys(key); })), function (p) { return is.key(p); })
  .reduce(function (a,b) { if (a.indexOf(b) < 0) { a.push(b); } return a; }, []);
  var properties = {};
  var loop = function ( i ) {
    var propName = propertyNames[i];
    properties[propName] = keyframes.map(function (key) {
      var newKey = {};
      for (var p in key) {
        if (is.key(p)) {
          if (p == propName) { newKey.value = key[p]; }
        } else {
          newKey[p] = key[p];
        }
      }
      return newKey;
    });
  };

  for (var i = 0; i < propertyNames.length; i++) loop( i );
  return properties;
}

function getProperties(tweenSettings, params) {
  var properties = [];
  var keyframes = params.keyframes;
  if (keyframes) { params = mergeObjects(flattenKeyframes(keyframes), params); }
  for (var p in params) {
    if (is.key(p)) {
      properties.push({
        name: p,
        tweens: normalizePropertyTweens(params[p], tweenSettings)
      });
    }
  }
  return properties;
}

// Tweens

function normalizeTweenValues(tween, animatable) {
  var t = {};
  for (var p in tween) {
    var value = getFunctionValue(tween[p], animatable);
    if (is.arr(value)) {
      value = value.map(function (v) { return getFunctionValue(v, animatable); });
      if (value.length === 1) { value = value[0]; }
    }
    t[p] = value;
  }
  t.duration = parseFloat(t.duration);
  t.delay = parseFloat(t.delay);
  return t;
}

function normalizeTweens(prop, animatable) {
  var previousTween;
  return prop.tweens.map(function (t) {
    var tween = normalizeTweenValues(t, animatable);
    var tweenValue = tween.value;
    var to = is.arr(tweenValue) ? tweenValue[1] : tweenValue;
    var toUnit = getUnit(to);
    var originalValue = getOriginalTargetValue(animatable.target, prop.name, toUnit, animatable);
    var previousValue = previousTween ? previousTween.to.original : originalValue;
    var from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
    var fromUnit = getUnit(from) || getUnit(originalValue);
    var unit = toUnit || fromUnit;
    if (is.und(to)) { to = previousValue; }
    tween.from = decomposeValue(from, unit);
    tween.to = decomposeValue(getRelativeValue(to, from), unit);
    tween.start = previousTween ? previousTween.end : 0;
    tween.end = tween.start + tween.delay + tween.duration + tween.endDelay;
    tween.easing = parseEasings(tween.easing, tween.duration);
    tween.isPath = is.pth(tweenValue);
    tween.isPathTargetInsideSVG = tween.isPath && is.svg(animatable.target);
    tween.isColor = is.col(tween.from.original);
    if (tween.isColor) { tween.round = 1; }
    previousTween = tween;
    return tween;
  });
}

// Tween progress

var setProgressValue = {
  css: function (t, p, v) { return t.style[p] = v; },
  attribute: function (t, p, v) { return t.setAttribute(p, v); },
  object: function (t, p, v) { return t[p] = v; },
  transform: function (t, p, v, transforms, manual) {
    transforms.list.set(p, v);
    if (p === transforms.last || manual) {
      var str = '';
      transforms.list.forEach(function (value, prop) { str += prop + "(" + value + ") "; });
      t.style.transform = str;
    }
  }
};

// Set Value helper

function setTargetsValue(targets, properties) {
  var animatables = getAnimatables(targets);
  animatables.forEach(function (animatable) {
    for (var property in properties) {
      var value = getFunctionValue(properties[property], animatable);
      var target = animatable.target;
      var valueUnit = getUnit(value);
      var originalValue = getOriginalTargetValue(target, property, valueUnit, animatable);
      var unit = valueUnit || getUnit(originalValue);
      var to = getRelativeValue(validateValue(value, unit), originalValue);
      var animType = getAnimationType(target, property);
      setProgressValue[animType](target, property, to, animatable.transforms, true);
    }
  });
}

// Animations

function createAnimation(animatable, prop) {
  var animType = getAnimationType(animatable.target, prop.name);
  if (animType) {
    var tweens = normalizeTweens(prop, animatable);
    var lastTween = tweens[tweens.length - 1];
    return {
      type: animType,
      property: prop.name,
      animatable: animatable,
      tweens: tweens,
      duration: lastTween.end,
      delay: tweens[0].delay,
      endDelay: lastTween.endDelay
    }
  }
}

function getAnimations(animatables, properties) {
  return filterArray(flattenArray(animatables.map(function (animatable) {
    return properties.map(function (prop) {
      return createAnimation(animatable, prop);
    });
  })), function (a) { return !is.und(a); });
}

// Create Instance

function getInstanceTimings(animations, tweenSettings) {
  var animLength = animations.length;
  var getTlOffset = function (anim) { return anim.timelineOffset ? anim.timelineOffset : 0; };
  var timings = {};
  timings.duration = animLength ? Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration; })) : tweenSettings.duration;
  timings.delay = animLength ? Math.min.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.delay; })) : tweenSettings.delay;
  timings.endDelay = animLength ? timings.duration - Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration - anim.endDelay; })) : tweenSettings.endDelay;
  return timings;
}

var instanceID = 0;

function createNewInstance(params) {
  var instanceSettings = replaceObjectProps(defaultInstanceSettings, params);
  var tweenSettings = replaceObjectProps(defaultTweenSettings, params);
  var properties = getProperties(tweenSettings, params);
  var animatables = getAnimatables(params.targets);
  var animations = getAnimations(animatables, properties);
  var timings = getInstanceTimings(animations, tweenSettings);
  var id = instanceID;
  instanceID++;
  return mergeObjects(instanceSettings, {
    id: id,
    children: [],
    animatables: animatables,
    animations: animations,
    duration: timings.duration,
    delay: timings.delay,
    endDelay: timings.endDelay
  });
}

// Core

var activeInstances = [];

var engine = (function () {
  var raf;

  function play() {
    if (!raf && (!isDocumentHidden() || !anime.suspendWhenDocumentHidden) && activeInstances.length > 0) {
      raf = requestAnimationFrame(step);
    }
  }
  function step(t) {
    // memo on algorithm issue:
    // dangerous iteration over mutable `activeInstances`
    // (that collection may be updated from within callbacks of `tick`-ed animation instances)
    var activeInstancesLength = activeInstances.length;
    var i = 0;
    while (i < activeInstancesLength) {
      var activeInstance = activeInstances[i];
      if (!activeInstance.paused) {
        activeInstance.tick(t);
        i++;
      } else {
        activeInstances.splice(i, 1);
        activeInstancesLength--;
      }
    }
    raf = i > 0 ? requestAnimationFrame(step) : undefined;
  }

  function handleVisibilityChange() {
    if (!anime.suspendWhenDocumentHidden) { return; }

    if (isDocumentHidden()) {
      // suspend ticks
      raf = cancelAnimationFrame(raf);
    } else { // is back to active tab
      // first adjust animations to consider the time that ticks were suspended
      activeInstances.forEach(
        function (instance) { return instance ._onDocumentVisibility(); }
      );
      engine();
    }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return play;
})();

function isDocumentHidden() {
  return !!document && document.hidden;
}

// Public Instance

function anime(params) {
  if ( params === void 0 ) params = {};


  var startTime = 0, lastTime = 0, now = 0;
  var children, childrenLength = 0;
  var resolve = null;

  function makePromise(instance) {
    var promise = window.Promise && new Promise(function (_resolve) { return resolve = _resolve; });
    instance.finished = promise;
    return promise;
  }

  var instance = createNewInstance(params);
  var promise = makePromise(instance);

  function toggleInstanceDirection() {
    var direction = instance.direction;
    if (direction !== 'alternate') {
      instance.direction = direction !== 'normal' ? 'normal' : 'reverse';
    }
    instance.reversed = !instance.reversed;
    children.forEach(function (child) { return child.reversed = instance.reversed; });
  }

  function adjustTime(time) {
    return instance.reversed ? instance.duration - time : time;
  }

  function resetTime() {
    startTime = 0;
    lastTime = adjustTime(instance.currentTime) * (1 / anime.speed);
  }

  function seekChild(time, child) {
    if (child) { child.seek(time - child.timelineOffset); }
  }

  function syncInstanceChildren(time) {
    if (!instance.reversePlayback) {
      for (var i = 0; i < childrenLength; i++) { seekChild(time, children[i]); }
    } else {
      for (var i$1 = childrenLength; i$1--;) { seekChild(time, children[i$1]); }
    }
  }

  function setAnimationsProgress(insTime) {
    var i = 0;
    var animations = instance.animations;
    var animationsLength = animations.length;
    while (i < animationsLength) {
      var anim = animations[i];
      var animatable = anim.animatable;
      var tweens = anim.tweens;
      var tweenLength = tweens.length - 1;
      var tween = tweens[tweenLength];
      // Only check for keyframes if there is more than one tween
      if (tweenLength) { tween = filterArray(tweens, function (t) { return (insTime < t.end); })[0] || tween; }
      var elapsed = minMax(insTime - tween.start - tween.delay, 0, tween.duration) / tween.duration;
      var eased = isNaN(elapsed) ? 1 : tween.easing(elapsed);
      var strings = tween.to.strings;
      var round = tween.round;
      var numbers = [];
      var toNumbersLength = tween.to.numbers.length;
      var progress = (void 0);
      for (var n = 0; n < toNumbersLength; n++) {
        var value = (void 0);
        var toNumber = tween.to.numbers[n];
        var fromNumber = tween.from.numbers[n] || 0;
        if (!tween.isPath) {
          value = fromNumber + (eased * (toNumber - fromNumber));
        } else {
          value = getPathProgress(tween.value, eased * toNumber, tween.isPathTargetInsideSVG);
        }
        if (round) {
          if (!(tween.isColor && n > 2)) {
            value = Math.round(value * round) / round;
          }
        }
        numbers.push(value);
      }
      // Manual Array.reduce for better performances
      var stringsLength = strings.length;
      if (!stringsLength) {
        progress = numbers[0];
      } else {
        progress = strings[0];
        for (var s = 0; s < stringsLength; s++) {
          var a = strings[s];
          var b = strings[s + 1];
          var n$1 = numbers[s];
          if (!isNaN(n$1)) {
            if (!b) {
              progress += n$1 + ' ';
            } else {
              progress += n$1 + b;
            }
          }
        }
      }
      setProgressValue[anim.type](animatable.target, anim.property, progress, animatable.transforms);
      anim.currentValue = progress;
      i++;
    }
  }

  function setCallback(cb) {
    if (instance[cb] && !instance.passThrough) { instance[cb](instance); }
  }

  function countIteration() {
    if (instance.remaining && instance.remaining !== true) {
      instance.remaining--;
    }
  }

  function setInstanceProgress(engineTime) {
    var insDuration = instance.duration;
    var insDelay = instance.delay;
    var insEndDelay = insDuration - instance.endDelay;
    var insTime = adjustTime(engineTime);
    instance.progress = minMax((insTime / insDuration) * 100, 0, 100);
    instance.reversePlayback = insTime < instance.currentTime;
    if (children) { syncInstanceChildren(insTime); }
    if (!instance.began && instance.currentTime > 0) {
      instance.began = true;
      setCallback('begin');
    }
    if (!instance.loopBegan && instance.currentTime > 0) {
      instance.loopBegan = true;
      setCallback('loopBegin');
    }
    if (insTime <= insDelay && instance.currentTime !== 0) {
      setAnimationsProgress(0);
    }
    if ((insTime >= insEndDelay && instance.currentTime !== insDuration) || !insDuration) {
      setAnimationsProgress(insDuration);
    }
    if (insTime > insDelay && insTime < insEndDelay) {
      if (!instance.changeBegan) {
        instance.changeBegan = true;
        instance.changeCompleted = false;
        setCallback('changeBegin');
      }
      setCallback('change');
      setAnimationsProgress(insTime);
    } else {
      if (instance.changeBegan) {
        instance.changeCompleted = true;
        instance.changeBegan = false;
        setCallback('changeComplete');
      }
    }
    instance.currentTime = minMax(insTime, 0, insDuration);
    if (instance.began) { setCallback('update'); }
    if (engineTime >= insDuration) {
      lastTime = 0;
      countIteration();
      if (!instance.remaining) {
        instance.paused = true;
        if (!instance.completed) {
          instance.completed = true;
          setCallback('loopComplete');
          setCallback('complete');
          if (!instance.passThrough && 'Promise' in window) {
            resolve();
            promise = makePromise(instance);
          }
        }
      } else {
        startTime = now;
        setCallback('loopComplete');
        instance.loopBegan = false;
        if (instance.direction === 'alternate') {
          toggleInstanceDirection();
        }
      }
    }
  }

  instance.reset = function() {
    var direction = instance.direction;
    instance.passThrough = false;
    instance.currentTime = 0;
    instance.progress = 0;
    instance.paused = true;
    instance.began = false;
    instance.loopBegan = false;
    instance.changeBegan = false;
    instance.completed = false;
    instance.changeCompleted = false;
    instance.reversePlayback = false;
    instance.reversed = direction === 'reverse';
    instance.remaining = instance.loop;
    children = instance.children;
    childrenLength = children.length;
    for (var i = childrenLength; i--;) { instance.children[i].reset(); }
    if (instance.reversed && instance.loop !== true || (direction === 'alternate' && instance.loop === 1)) { instance.remaining++; }
    setAnimationsProgress(instance.reversed ? instance.duration : 0);
  };

  // internal method (for engine) to adjust animation timings before restoring engine ticks (rAF)
  instance._onDocumentVisibility = resetTime;

  // Set Value helper

  instance.set = function(targets, properties) {
    setTargetsValue(targets, properties);
    return instance;
  };

  instance.tick = function(t) {
    now = t;
    if (!startTime) { startTime = now; }
    setInstanceProgress((now + (lastTime - startTime)) * anime.speed);
  };

  instance.seek = function(time) {
    setInstanceProgress(adjustTime(time));
  };

  instance.pause = function() {
    instance.paused = true;
    resetTime();
  };

  instance.play = function() {
    if (!instance.paused) { return; }
    if (instance.completed) { instance.reset(); }
    instance.paused = false;
    activeInstances.push(instance);
    resetTime();
    engine();
  };

  instance.reverse = function() {
    toggleInstanceDirection();
    instance.completed = instance.reversed ? false : true;
    resetTime();
  };

  instance.restart = function() {
    instance.reset();
    instance.play();
  };

  instance.remove = function(targets) {
    var targetsArray = parseTargets(targets);
    removeTargetsFromInstance(targetsArray, instance);
  };

  instance.reset();

  if (instance.autoplay) { instance.play(); }

  return instance;

}

// Remove targets from animation

function removeTargetsFromAnimations(targetsArray, animations) {
  for (var a = animations.length; a--;) {
    if (arrayContains(targetsArray, animations[a].animatable.target)) {
      animations.splice(a, 1);
    }
  }
}

function removeTargetsFromInstance(targetsArray, instance) {
  var animations = instance.animations;
  var children = instance.children;
  removeTargetsFromAnimations(targetsArray, animations);
  for (var c = children.length; c--;) {
    var child = children[c];
    var childAnimations = child.animations;
    removeTargetsFromAnimations(targetsArray, childAnimations);
    if (!childAnimations.length && !child.children.length) { children.splice(c, 1); }
  }
  if (!animations.length && !children.length) { instance.pause(); }
}

function removeTargetsFromActiveInstances(targets) {
  var targetsArray = parseTargets(targets);
  for (var i = activeInstances.length; i--;) {
    var instance = activeInstances[i];
    removeTargetsFromInstance(targetsArray, instance);
  }
}

// Stagger helpers

function stagger(val, params) {
  if ( params === void 0 ) params = {};

  var direction = params.direction || 'normal';
  var easing = params.easing ? parseEasings(params.easing) : null;
  var grid = params.grid;
  var axis = params.axis;
  var fromIndex = params.from || 0;
  var fromFirst = fromIndex === 'first';
  var fromCenter = fromIndex === 'center';
  var fromLast = fromIndex === 'last';
  var isRange = is.arr(val);
  var val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
  var val2 = isRange ? parseFloat(val[1]) : 0;
  var unit = getUnit(isRange ? val[1] : val) || 0;
  var start = params.start || 0 + (isRange ? val1 : 0);
  var values = [];
  var maxValue = 0;
  return function (el, i, t) {
    if (fromFirst) { fromIndex = 0; }
    if (fromCenter) { fromIndex = (t - 1) / 2; }
    if (fromLast) { fromIndex = t - 1; }
    if (!values.length) {
      for (var index = 0; index < t; index++) {
        if (!grid) {
          values.push(Math.abs(fromIndex - index));
        } else {
          var fromX = !fromCenter ? fromIndex%grid[0] : (grid[0]-1)/2;
          var fromY = !fromCenter ? Math.floor(fromIndex/grid[0]) : (grid[1]-1)/2;
          var toX = index%grid[0];
          var toY = Math.floor(index/grid[0]);
          var distanceX = fromX - toX;
          var distanceY = fromY - toY;
          var value = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
          if (axis === 'x') { value = -distanceX; }
          if (axis === 'y') { value = -distanceY; }
          values.push(value);
        }
        maxValue = Math.max.apply(Math, values);
      }
      if (easing) { values = values.map(function (val) { return easing(val / maxValue) * maxValue; }); }
      if (direction === 'reverse') { values = values.map(function (val) { return axis ? (val < 0) ? val * -1 : -val : Math.abs(maxValue - val); }); }
    }
    var spacing = isRange ? (val2 - val1) / maxValue : val1;
    return start + (spacing * (Math.round(values[i] * 100) / 100)) + unit;
  }
}

// Timeline

function timeline(params) {
  if ( params === void 0 ) params = {};

  var tl = anime(params);
  tl.duration = 0;
  tl.add = function(instanceParams, timelineOffset) {
    var tlIndex = activeInstances.indexOf(tl);
    var children = tl.children;
    if (tlIndex > -1) { activeInstances.splice(tlIndex, 1); }
    function passThrough(ins) { ins.passThrough = true; }
    for (var i = 0; i < children.length; i++) { passThrough(children[i]); }
    var insParams = mergeObjects(instanceParams, replaceObjectProps(defaultTweenSettings, params));
    insParams.targets = insParams.targets || params.targets;
    var tlDuration = tl.duration;
    insParams.autoplay = false;
    insParams.direction = tl.direction;
    insParams.timelineOffset = is.und(timelineOffset) ? tlDuration : getRelativeValue(timelineOffset, tlDuration);
    passThrough(tl);
    tl.seek(insParams.timelineOffset);
    var ins = anime(insParams);
    passThrough(ins);
    children.push(ins);
    var timings = getInstanceTimings(children, params);
    tl.delay = timings.delay;
    tl.endDelay = timings.endDelay;
    tl.duration = timings.duration;
    tl.seek(0);
    tl.reset();
    if (tl.autoplay) { tl.play(); }
    return tl;
  };
  return tl;
}

anime.version = '3.2.1';
anime.speed = 1;
// TODO:#review: naming, documentation
anime.suspendWhenDocumentHidden = true;
anime.running = activeInstances;
anime.remove = removeTargetsFromActiveInstances;
anime.get = getOriginalTargetValue;
anime.set = setTargetsValue;
anime.convertPx = convertPxToUnit;
anime.path = getPath;
anime.setDashoffset = setDashoffset;
anime.stagger = stagger;
anime.timeline = timeline;
anime.easing = parseEasings;
anime.penner = penner;
anime.random = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (anime);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[0].use[1]!./src/graphics/widget.css":
/*!***************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[0].use[1]!./src/graphics/widget.css ***!
  \***************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "/* variables */\r\n:root {\r\n    --color-primary: #1976d2;\r\n    --color-secondary: #15315d;\r\n    --color-accent: #ffc400;\r\n    --color-white: #f9f9f9;\r\n    --color-black: #1a1a1a;\r\n    --color-ahead: #99ff99;\r\n    --color-behind: #ff9999;\r\n\r\n    --circle-logo-inner-diameter: 70px;\r\n    --circle-logo-outer-diameter: calc(70px + 2pt);\r\n\r\n    /* I used math! This percentage is based on the following:\r\n        1. A width-to-height ratio of 7 to 1\r\n        2. A slant angle of 15°\r\n        If the width-to-height ratio changes, this will need to as well.\r\n        The calculation is tan(t)*h/w to get the percentage of width for the triangle. */\r\n    --trapezoid-ratio: 3.83%;\r\n\r\n    /* animations */\r\n    --color-animation-info-transition-leader: var(--color-white);\r\n    --color-animation-info-transition-bg: var(--color-secondary);\r\n    --color-animation-info-transition-text: var(--color-white);\r\n    --color-animation-gold-split-bg: var(--color-accent);\r\n    --color-animation-gold-split-text: var(--color-black);\r\n}\r\n\r\n/* css reset */\r\n* {\r\n    padding: 0;\r\n    margin: 0;\r\n}\r\n\r\nbody {\r\n    font-family: sans-serif;\r\n    background:rgba(37, 68, 56, 0.705);\r\n}\r\n\r\n.monospace {\r\n    font-family: monospace;\r\n}\r\n\r\nh2 {\r\n    border-bottom: 1px solid rgba(0, 0, 0, 0.205);\r\n}\r\n\r\nlabel {\r\n    font-weight: bold;\r\n}\r\n\r\n/* widget */\r\n.widget-container {\r\n    margin: 50px 0 0 50px;\r\n    display: inline-block;\r\n}\r\n\r\n.widget-upper-border {\r\n    position: relative;\r\n    width: 420px;\r\n    height: 60px;\r\n    overflow: visible;\r\n    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.75));\r\n}\r\n.widget-upper-border::after {\r\n    content: '';\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    z-index: -2;\r\n    width: 100%;\r\n    height: 100%;\r\n    background-color: var(--color-white);\r\n    clip-path: polygon(0 0, 100% 0, calc(100% - var(--trapezoid-ratio)) 100%, var(--trapezoid-ratio) 100%);\r\n}\r\n\r\n.widget-upper {\r\n    position: absolute;\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n    top: 1pt;\r\n    left: 1pt;\r\n    width: calc(420px - 2pt);\r\n    height: calc(60px - 2pt);\r\n    color: var(--color-white);\r\n}\r\n.widget-upper::after {\r\n    content: '';\r\n    display: block;\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    z-index: -1;\r\n    width: 100%;\r\n    height: 100%;\r\n    background-image: linear-gradient(to right, var(--color-primary), var(--color-black), var(--color-primary));\r\n    clip-path: polygon(0.1% 0, 99.9% 0, calc(100% - var(--trapezoid-ratio)) 100%, var(--trapezoid-ratio) 100%);\r\n}\r\n\r\n.widget-inner-left,\r\n.widget-inner-right {\r\n    display: flex;\r\n    position: relative;\r\n    width: 50%;\r\n    height: 100%;\r\n    max-width: calc((100% - var(--trapezoid-ratio) - var(--circle-logo-outer-diameter)) / 2);\r\n    flex-grow: 0;\r\n    white-space: nowrap;\r\n}\r\n.widget-inner-left {\r\n    margin-left: calc(var(--trapezoid-ratio) / 2);\r\n    padding-right: calc(var(--circle-logo-outer-diameter) / 2);\r\n    clip-path: polygon(calc(-1 * var(--trapezoid-ratio)) 0, 100% 0, 100% 100%, var(--trapezoid-ratio) 100%);\r\n    flex-direction: row-reverse;\r\n}\r\n.widget-inner-right {\r\n    margin-right: calc(var(--trapezoid-ratio) / 2);\r\n    padding-left: calc(var(--circle-logo-outer-diameter) / 2);\r\n    clip-path: polygon(0 0, calc(100% + var(--trapezoid-ratio)) 0, calc(100% - var(--trapezoid-ratio)) 100%, 0 100%);\r\n}\r\n\r\n.widget-inner-left > div,\r\n.widget-inner-right > div {\r\n    margin: auto;\r\n}\r\n\r\n.widget-inner-circle {\r\n    position: absolute;\r\n    left: 50%;\r\n    transform: translateX(-50%);\r\n    width: var(--circle-logo-inner-diameter);\r\n    height: var(--circle-logo-inner-diameter);\r\n    background-color: var(--color-secondary);\r\n    /* webpack-ignore */\r\n    background-image: url(\"/assets/livesplit/logos/logo_inverted_160x81.png\");\r\n    background-position: center;\r\n    background-size: contain;\r\n    background-repeat: no-repeat;\r\n    border-radius: 50%;\r\n    border: 2pt solid var(--color-black);\r\n    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.75);\r\n}\r\n\r\n/* widget lower */\r\n.widget-lower-border {\r\n    position: relative;\r\n    width: 360px;\r\n    height: calc(30px + 2pt);\r\n    z-index: -1;\r\n    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.75));\r\n    margin: -1pt auto 0;\r\n}\r\n.widget-lower-border::after {\r\n    content: '';\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    z-index: -2;\r\n    width: 100%;\r\n    height: 100%;\r\n    background-color: var(--color-white);\r\n    /* I used math! These percentages are based on the following:\r\n        1. A width-to-height ratio of 12 to 1\r\n        2. A slant angle of 15° (or 85°)\r\n        If the width-to-height ratio changes, these will need to as well.\r\n        The calculation is tan(t)*h/w to get the percentage of width for point 4. */\r\n    clip-path: polygon(0 0, 100% 0, 97.77% 100%, 2.23% 100%);\r\n}\r\n\r\n.widget-lower {\r\n    position: absolute;\r\n    top: 1pt;\r\n    left: 1pt;\r\n    width: calc(360px - 2pt);\r\n    height: 30px;\r\n    color: var(--color-white);\r\n    text-align: center;\r\n    white-space: nowrap;\r\n    background-color: var(--color-black);\r\n    clip-path: polygon(0.1% 0, 99.9% 0, 97.77% 100%, 2.23% 100%);\r\n}\r\n\r\n/* timers */\r\n.timer {\r\n    font-family: vox-round, sans-serif;\r\n    font-weight: 600;\r\n    font-style: normal;\r\n    font-size: xx-large;\r\n}\r\n\r\n.timer-sub {\r\n    font-size: 60%;\r\n}\r\n\r\n.timer-ahead {\r\n    color: var(--color-ahead);\r\n}\r\n\r\n.timer-behind {\r\n    color: var(--color-behind);\r\n}\r\n\r\n/* information displays */\r\n.text {\r\n    width: 100%;\r\n    height: 100%;\r\n    font-family: apotek-cond, sans-serif;\r\n    font-weight: 300;\r\n    font-style: normal;\r\n    font-size: 24pt;\r\n    line-height: 1em;\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n}\r\n\r\n/* p tags within this class will have their font size automatically scaled to fit */\r\n.shrink-fit {\r\n    height: 75%;\r\n    width: 80%;\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n}\r\n\r\n.shrink-fit > p {\r\n    display: inline-block;\r\n    white-space: nowrap;\r\n}\r\n\r\n.hidden {\r\n    display: none;\r\n}\r\n\r\n/* animations */\r\n.animation-container {\r\n    display: flex;\r\n    justify-content: flex-start;\r\n    align-items: center;\r\n    position: absolute;\r\n    width: 100%;\r\n    height: 100%;\r\n    visibility: hidden;\r\n}\r\n\r\n.widget-inner-left .animation-container {\r\n    margin-right: calc((70px + 2pt) / -2);\r\n    transform: skewX(15deg);\r\n    flex-direction: row-reverse;\r\n}\r\n\r\n.widget-inner-right .animation-container {\r\n    margin-left: calc((70px + 2pt) / -2);\r\n    transform: skewX(-15deg);\r\n}\r\n\r\n.transition-box {\r\n    display: flex;\r\n    position: absolute;\r\n    height: 100%;\r\n    justify-content: center;\r\n    align-items: center;\r\n}\r\n\r\n#widget-full-animations {\r\n    justify-content: center;\r\n    overflow: hidden;\r\n    clip-path: polygon(0 0, 100% 0, calc(100% - var(--trapezoid-ratio)) 100%, var(--trapezoid-ratio) 100%);\r\n    z-index: 2;\r\n}\r\n\r\n.transition-circle {\r\n    width: var(--circle-logo-inner-diameter);\r\n    height: var(--circle-logo-inner-diameter);\r\n    background-color: transparent;\r\n    border-radius: 50%;\r\n    border: 5px solid var(--color-animation-gold-split-bg);\r\n    margin: auto;\r\n}\r\n\r\n.transition-circle-full {\r\n    width: var(--circle-logo-inner-diameter);\r\n    height: var(--circle-logo-inner-diameter);\r\n    background-color: var(--color-animation-gold-split-bg);\r\n    border-radius: 50%;\r\n}\r\n\r\n.transition-box-small {\r\n    width: 15px;\r\n    background-color: var(--color-animation-info-transition-leader);\r\n}\r\n\r\n.transition-box-large {\r\n    width: 100%;\r\n    background-color: var(--color-animation-info-transition-bg);\r\n    border: 5px solid var(--color-animation-info-transition-leader);\r\n    border-top: none;\r\n    border-bottom: none;\r\n    box-sizing: border-box;\r\n}\r\n\r\n.widget-inner-left .transition-box {\r\n    transform-origin: right center;\r\n}\r\n\r\n.widget-inner-right .transition-box {\r\n    transform-origin: left center;\r\n}\r\n\r\n.transition-box-text {\r\n    color: var(--color-animation-info-transition-text);\r\n    font-weight: 500;\r\n    font-variant: small-caps;\r\n}\r\n\r\n.transition-box-text-gold {\r\n    color: var(--color-animation-gold-split-text);\r\n    font-weight: 500;\r\n    text-transform: uppercase;\r\n}", "",{"version":3,"sources":["webpack://./src/graphics/widget.css"],"names":[],"mappings":"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","sourcesContent":["/* variables */\r\n:root {\r\n    --color-primary: #1976d2;\r\n    --color-secondary: #15315d;\r\n    --color-accent: #ffc400;\r\n    --color-white: #f9f9f9;\r\n    --color-black: #1a1a1a;\r\n    --color-ahead: #99ff99;\r\n    --color-behind: #ff9999;\r\n\r\n    --circle-logo-inner-diameter: 70px;\r\n    --circle-logo-outer-diameter: calc(70px + 2pt);\r\n\r\n    /* I used math! This percentage is based on the following:\r\n        1. A width-to-height ratio of 7 to 1\r\n        2. A slant angle of 15°\r\n        If the width-to-height ratio changes, this will need to as well.\r\n        The calculation is tan(t)*h/w to get the percentage of width for the triangle. */\r\n    --trapezoid-ratio: 3.83%;\r\n\r\n    /* animations */\r\n    --color-animation-info-transition-leader: var(--color-white);\r\n    --color-animation-info-transition-bg: var(--color-secondary);\r\n    --color-animation-info-transition-text: var(--color-white);\r\n    --color-animation-gold-split-bg: var(--color-accent);\r\n    --color-animation-gold-split-text: var(--color-black);\r\n}\r\n\r\n/* css reset */\r\n* {\r\n    padding: 0;\r\n    margin: 0;\r\n}\r\n\r\nbody {\r\n    font-family: sans-serif;\r\n    background:rgba(37, 68, 56, 0.705);\r\n}\r\n\r\n.monospace {\r\n    font-family: monospace;\r\n}\r\n\r\nh2 {\r\n    border-bottom: 1px solid rgba(0, 0, 0, 0.205);\r\n}\r\n\r\nlabel {\r\n    font-weight: bold;\r\n}\r\n\r\n/* widget */\r\n.widget-container {\r\n    margin: 50px 0 0 50px;\r\n    display: inline-block;\r\n}\r\n\r\n.widget-upper-border {\r\n    position: relative;\r\n    width: 420px;\r\n    height: 60px;\r\n    overflow: visible;\r\n    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.75));\r\n}\r\n.widget-upper-border::after {\r\n    content: '';\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    z-index: -2;\r\n    width: 100%;\r\n    height: 100%;\r\n    background-color: var(--color-white);\r\n    clip-path: polygon(0 0, 100% 0, calc(100% - var(--trapezoid-ratio)) 100%, var(--trapezoid-ratio) 100%);\r\n}\r\n\r\n.widget-upper {\r\n    position: absolute;\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n    top: 1pt;\r\n    left: 1pt;\r\n    width: calc(420px - 2pt);\r\n    height: calc(60px - 2pt);\r\n    color: var(--color-white);\r\n}\r\n.widget-upper::after {\r\n    content: '';\r\n    display: block;\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    z-index: -1;\r\n    width: 100%;\r\n    height: 100%;\r\n    background-image: linear-gradient(to right, var(--color-primary), var(--color-black), var(--color-primary));\r\n    clip-path: polygon(0.1% 0, 99.9% 0, calc(100% - var(--trapezoid-ratio)) 100%, var(--trapezoid-ratio) 100%);\r\n}\r\n\r\n.widget-inner-left,\r\n.widget-inner-right {\r\n    display: flex;\r\n    position: relative;\r\n    width: 50%;\r\n    height: 100%;\r\n    max-width: calc((100% - var(--trapezoid-ratio) - var(--circle-logo-outer-diameter)) / 2);\r\n    flex-grow: 0;\r\n    white-space: nowrap;\r\n}\r\n.widget-inner-left {\r\n    margin-left: calc(var(--trapezoid-ratio) / 2);\r\n    padding-right: calc(var(--circle-logo-outer-diameter) / 2);\r\n    clip-path: polygon(calc(-1 * var(--trapezoid-ratio)) 0, 100% 0, 100% 100%, var(--trapezoid-ratio) 100%);\r\n    flex-direction: row-reverse;\r\n}\r\n.widget-inner-right {\r\n    margin-right: calc(var(--trapezoid-ratio) / 2);\r\n    padding-left: calc(var(--circle-logo-outer-diameter) / 2);\r\n    clip-path: polygon(0 0, calc(100% + var(--trapezoid-ratio)) 0, calc(100% - var(--trapezoid-ratio)) 100%, 0 100%);\r\n}\r\n\r\n.widget-inner-left > div,\r\n.widget-inner-right > div {\r\n    margin: auto;\r\n}\r\n\r\n.widget-inner-circle {\r\n    position: absolute;\r\n    left: 50%;\r\n    transform: translateX(-50%);\r\n    width: var(--circle-logo-inner-diameter);\r\n    height: var(--circle-logo-inner-diameter);\r\n    background-color: var(--color-secondary);\r\n    /* webpack-ignore */\r\n    background-image: url(\"/assets/livesplit/logos/logo_inverted_160x81.png\");\r\n    background-position: center;\r\n    background-size: contain;\r\n    background-repeat: no-repeat;\r\n    border-radius: 50%;\r\n    border: 2pt solid var(--color-black);\r\n    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.75);\r\n}\r\n\r\n/* widget lower */\r\n.widget-lower-border {\r\n    position: relative;\r\n    width: 360px;\r\n    height: calc(30px + 2pt);\r\n    z-index: -1;\r\n    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.75));\r\n    margin: -1pt auto 0;\r\n}\r\n.widget-lower-border::after {\r\n    content: '';\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    z-index: -2;\r\n    width: 100%;\r\n    height: 100%;\r\n    background-color: var(--color-white);\r\n    /* I used math! These percentages are based on the following:\r\n        1. A width-to-height ratio of 12 to 1\r\n        2. A slant angle of 15° (or 85°)\r\n        If the width-to-height ratio changes, these will need to as well.\r\n        The calculation is tan(t)*h/w to get the percentage of width for point 4. */\r\n    clip-path: polygon(0 0, 100% 0, 97.77% 100%, 2.23% 100%);\r\n}\r\n\r\n.widget-lower {\r\n    position: absolute;\r\n    top: 1pt;\r\n    left: 1pt;\r\n    width: calc(360px - 2pt);\r\n    height: 30px;\r\n    color: var(--color-white);\r\n    text-align: center;\r\n    white-space: nowrap;\r\n    background-color: var(--color-black);\r\n    clip-path: polygon(0.1% 0, 99.9% 0, 97.77% 100%, 2.23% 100%);\r\n}\r\n\r\n/* timers */\r\n.timer {\r\n    font-family: vox-round, sans-serif;\r\n    font-weight: 600;\r\n    font-style: normal;\r\n    font-size: xx-large;\r\n}\r\n\r\n.timer-sub {\r\n    font-size: 60%;\r\n}\r\n\r\n.timer-ahead {\r\n    color: var(--color-ahead);\r\n}\r\n\r\n.timer-behind {\r\n    color: var(--color-behind);\r\n}\r\n\r\n/* information displays */\r\n.text {\r\n    width: 100%;\r\n    height: 100%;\r\n    font-family: apotek-cond, sans-serif;\r\n    font-weight: 300;\r\n    font-style: normal;\r\n    font-size: 24pt;\r\n    line-height: 1em;\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n}\r\n\r\n/* p tags within this class will have their font size automatically scaled to fit */\r\n.shrink-fit {\r\n    height: 75%;\r\n    width: 80%;\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n}\r\n\r\n.shrink-fit > p {\r\n    display: inline-block;\r\n    white-space: nowrap;\r\n}\r\n\r\n.hidden {\r\n    display: none;\r\n}\r\n\r\n/* animations */\r\n.animation-container {\r\n    display: flex;\r\n    justify-content: flex-start;\r\n    align-items: center;\r\n    position: absolute;\r\n    width: 100%;\r\n    height: 100%;\r\n    visibility: hidden;\r\n}\r\n\r\n.widget-inner-left .animation-container {\r\n    margin-right: calc((70px + 2pt) / -2);\r\n    transform: skewX(15deg);\r\n    flex-direction: row-reverse;\r\n}\r\n\r\n.widget-inner-right .animation-container {\r\n    margin-left: calc((70px + 2pt) / -2);\r\n    transform: skewX(-15deg);\r\n}\r\n\r\n.transition-box {\r\n    display: flex;\r\n    position: absolute;\r\n    height: 100%;\r\n    justify-content: center;\r\n    align-items: center;\r\n}\r\n\r\n#widget-full-animations {\r\n    justify-content: center;\r\n    overflow: hidden;\r\n    clip-path: polygon(0 0, 100% 0, calc(100% - var(--trapezoid-ratio)) 100%, var(--trapezoid-ratio) 100%);\r\n    z-index: 2;\r\n}\r\n\r\n.transition-circle {\r\n    width: var(--circle-logo-inner-diameter);\r\n    height: var(--circle-logo-inner-diameter);\r\n    background-color: transparent;\r\n    border-radius: 50%;\r\n    border: 5px solid var(--color-animation-gold-split-bg);\r\n    margin: auto;\r\n}\r\n\r\n.transition-circle-full {\r\n    width: var(--circle-logo-inner-diameter);\r\n    height: var(--circle-logo-inner-diameter);\r\n    background-color: var(--color-animation-gold-split-bg);\r\n    border-radius: 50%;\r\n}\r\n\r\n.transition-box-small {\r\n    width: 15px;\r\n    background-color: var(--color-animation-info-transition-leader);\r\n}\r\n\r\n.transition-box-large {\r\n    width: 100%;\r\n    background-color: var(--color-animation-info-transition-bg);\r\n    border: 5px solid var(--color-animation-info-transition-leader);\r\n    border-top: none;\r\n    border-bottom: none;\r\n    box-sizing: border-box;\r\n}\r\n\r\n.widget-inner-left .transition-box {\r\n    transform-origin: right center;\r\n}\r\n\r\n.widget-inner-right .transition-box {\r\n    transform-origin: left center;\r\n}\r\n\r\n.transition-box-text {\r\n    color: var(--color-animation-info-transition-text);\r\n    font-weight: 500;\r\n    font-variant: small-caps;\r\n}\r\n\r\n.transition-box-text-gold {\r\n    color: var(--color-animation-gold-split-text);\r\n    font-weight: 500;\r\n    text-transform: uppercase;\r\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/***/ ((module) => {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";

      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }

      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }

      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }

      content += cssWithMappingToString(item);

      if (needLayer) {
        content += "}";
      }

      if (item[2]) {
        content += "}";
      }

      if (item[4]) {
        content += "}";
      }

      return content;
    }).join("");
  }; // import a list of modules into the list


  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }

      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }

      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }

      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }

      list.push(item);
    }
  };

  return list;
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/sourceMaps.js":
/*!************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/sourceMaps.js ***!
  \************************************************************/
/***/ ((module) => {



module.exports = function (item) {
  var content = item[1];
  var cssMapping = item[3];

  if (!cssMapping) {
    return content;
  }

  if (typeof btoa === "function") {
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    var sourceURLs = cssMapping.sources.map(function (source) {
      return "/*# sourceURL=".concat(cssMapping.sourceRoot || "").concat(source, " */");
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join("\n");
  }

  return [content].join("\n");
};

/***/ }),

/***/ "./node_modules/fitty/dist/fitty.module.js":
/*!*************************************************!*\
  !*** ./node_modules/fitty/dist/fitty.module.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * fitty v2.3.6 - Snugly resizes text to fit its parent container
 * Copyright (c) 2022 Rik Schennink <rik@pqina.nl> (https://pqina.nl/)
 */

var e=function(e){if(e){var t=function(e){return[].slice.call(e)},n=0,i=1,r=2,o=3,a=[],l=null,u="requestAnimationFrame"in e?function(){e.cancelAnimationFrame(l),l=e.requestAnimationFrame((function(){return s(a.filter((function(e){return e.dirty&&e.active})))}))}:function(){},c=function(e){return function(){a.forEach((function(t){return t.dirty=e})),u()}},s=function(e){e.filter((function(e){return!e.styleComputed})).forEach((function(e){e.styleComputed=m(e)})),e.filter(y).forEach(v);var t=e.filter(p);t.forEach(d),t.forEach((function(e){v(e),f(e)})),t.forEach(S)},f=function(e){return e.dirty=n},d=function(e){e.availableWidth=e.element.parentNode.clientWidth,e.currentWidth=e.element.scrollWidth,e.previousFontSize=e.currentFontSize,e.currentFontSize=Math.min(Math.max(e.minSize,e.availableWidth/e.currentWidth*e.previousFontSize),e.maxSize),e.whiteSpace=e.multiLine&&e.currentFontSize===e.minSize?"normal":"nowrap"},p=function(e){return e.dirty!==r||e.dirty===r&&e.element.parentNode.clientWidth!==e.availableWidth},m=function(t){var n=e.getComputedStyle(t.element,null);return t.currentFontSize=parseFloat(n.getPropertyValue("font-size")),t.display=n.getPropertyValue("display"),t.whiteSpace=n.getPropertyValue("white-space"),!0},y=function(e){var t=!1;return!e.preStyleTestCompleted&&(/inline-/.test(e.display)||(t=!0,e.display="inline-block"),"nowrap"!==e.whiteSpace&&(t=!0,e.whiteSpace="nowrap"),e.preStyleTestCompleted=!0,t)},v=function(e){e.element.style.whiteSpace=e.whiteSpace,e.element.style.display=e.display,e.element.style.fontSize=e.currentFontSize+"px"},S=function(e){e.element.dispatchEvent(new CustomEvent("fit",{detail:{oldValue:e.previousFontSize,newValue:e.currentFontSize,scaleFactor:e.currentFontSize/e.previousFontSize}}))},h=function(e,t){return function(){e.dirty=t,e.active&&u()}},w=function(e){return function(){a=a.filter((function(t){return t.element!==e.element})),e.observeMutations&&e.observer.disconnect(),e.element.style.whiteSpace=e.originalStyle.whiteSpace,e.element.style.display=e.originalStyle.display,e.element.style.fontSize=e.originalStyle.fontSize}},b=function(e){return function(){e.active||(e.active=!0,u())}},z=function(e){return function(){return e.active=!1}},F=function(e){e.observeMutations&&(e.observer=new MutationObserver(h(e,i)),e.observer.observe(e.element,e.observeMutations))},g={minSize:16,maxSize:512,multiLine:!0,observeMutations:"MutationObserver"in e&&{subtree:!0,childList:!0,characterData:!0}},W=null,E=function(){e.clearTimeout(W),W=e.setTimeout(c(r),x.observeWindowDelay)},M=["resize","orientationchange"];return Object.defineProperty(x,"observeWindow",{set:function(t){var n="".concat(t?"add":"remove","EventListener");M.forEach((function(t){e[n](t,E)}))}}),x.observeWindow=!0,x.observeWindowDelay=100,x.fitAll=c(o),x}function C(e,t){var n=Object.assign({},g,t),i=e.map((function(e){var t=Object.assign({},n,{element:e,active:!0});return function(e){e.originalStyle={whiteSpace:e.element.style.whiteSpace,display:e.element.style.display,fontSize:e.element.style.fontSize},F(e),e.newbie=!0,e.dirty=!0,a.push(e)}(t),{element:e,fit:h(t,o),unfreeze:b(t),freeze:z(t),unsubscribe:w(t)}}));return u(),i}function x(e){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return"string"==typeof e?C(t(document.querySelectorAll(e)),n):C([e],n)[0]}}("undefined"==typeof window?null:window);/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (e);


/***/ }),

/***/ "./src/graphics/widget.css":
/*!*********************************!*\
  !*** ./src/graphics/widget.css ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_0_use_1_widget_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[0].use[1]!./widget.css */ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[0].use[1]!./src/graphics/widget.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_0_use_1_widget_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_0_use_1_widget_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_0_use_1_widget_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_0_use_1_widget_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/***/ ((module) => {



var stylesInDOM = [];

function getIndexByIdentifier(identifier) {
  var result = -1;

  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }

  return result;
}

function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };

    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }

    identifiers.push(identifier);
  }

  return identifiers;
}

function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);

  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }

      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };

  return updater;
}

module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];

    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }

    var newLastIdentifiers = modulesToDom(newList, options);

    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];

      var _index = getIndexByIdentifier(_identifier);

      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();

        stylesInDOM.splice(_index, 1);
      }
    }

    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js":
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
/***/ ((module) => {



var memo = {};
/* istanbul ignore next  */

function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself

    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }

    memo[target] = styleTarget;
  }

  return memo[target];
}
/* istanbul ignore next  */


function insertBySelector(insert, style) {
  var target = getTarget(insert);

  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }

  target.appendChild(style);
}

module.exports = insertBySelector;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js":
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
/***/ ((module) => {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}

module.exports = insertStyleElement;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;

  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}

module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js":
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
/***/ ((module) => {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";

  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }

  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }

  var needLayer = typeof obj.layer !== "undefined";

  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }

  css += obj.css;

  if (needLayer) {
    css += "}";
  }

  if (obj.media) {
    css += "}";
  }

  if (obj.supports) {
    css += "}";
  }

  var sourceMap = obj.sourceMap;

  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  } // For old IE

  /* istanbul ignore if  */


  options.styleTagTransform(css, styleElement, options.options);
}

function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }

  styleElement.parentNode.removeChild(styleElement);
}
/* istanbul ignore next  */


function domAPI(options) {
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}

module.exports = domAPI;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js":
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
/***/ ((module) => {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }

    styleElement.appendChild(document.createTextNode(css));
  }
}

module.exports = styleTagTransform;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!********************************!*\
  !*** ./src/graphics/widget.js ***!
  \********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _widget_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./widget.css */ "./src/graphics/widget.css");
/* harmony import */ var animejs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! animejs */ "./node_modules/animejs/lib/anime.es.js");
/* harmony import */ var fitty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! fitty */ "./node_modules/fitty/dist/fitty.module.js");




/* =================== VARIABLES & SETUP =================== */
const COLORS = {
    primary: '#1976d2',
    secondary: '#15315d',
    accent: '#ffc400',
    white: '#f9f9f9',
    black: '#1a1a1a',
    ahead: '#99ff99',
    behind: '#ff9999'
}

const rLivesplit = nodecg.Replicant('livesplit')
const rLogos = nodecg.Replicant('assets:logos')
const infoDisplays = ['delta', 'bestPossibleTime', 'finalTime']
const animations = [{
    tl: createTransitionTimeline(),
    duration: 2850,
    safeTime: 2850 / 2
}, {
    tl: createGoldSplitTimeline(),
    duration: 1000
}]

let currentInfoIndex = 0

;(0,fitty__WEBPACK_IMPORTED_MODULE_2__["default"])('.shrink-fit > p', {
    minSize: 12,
    maxSize: 56
})

/* =================== REPLICANTS =================== */

rLivesplit.on('change', (newValue, oldValue) => {
    const connStatus = newValue.connection.status
    document.getElementById('connection-status').textContent = `${connStatus.charAt(0).toUpperCase()}${connStatus.slice(1)} ${connStatus === 'connected' ? 'to' : 'from'} LiveSplit`

    if (newValue.timer) {
        document.querySelector('#widget-timer-current .timer-main').innerText = newValue.timer.currentTime.slice(0, -2)
        document.querySelector('#widget-timer-current .timer-sub').innerText = newValue.timer.currentTime.slice(-2)

        Object.keys(newValue.timer).forEach((k, i) => {
            if (infoDisplays.includes(k)) {
                const query = `#widget-timer-${k}`
                document.querySelector(query + ' .timer-main').innerText = newValue.timer[k].slice(0, -2)
                document.querySelector(query + ' .timer-sub').innerText = newValue.timer[k].slice(-2)
            }
        })

        if (newValue.timer.delta && newValue.timer.delta.charAt(0) === '+') {
            document.getElementById('widget-timer-delta').classList.add('timer-behind')
            document.getElementById('widget-timer-delta').classList.remove('timer-ahead')
        } else {
            document.getElementById('widget-timer-delta').classList.add('timer-ahead')
            document.getElementById('widget-timer-delta').classList.remove('timer-behind')
        }
    }
})

/* =================== MESSAGES =================== */

nodecg.listenFor('changeInfoDisplay', () => {
    changeInfoDisplay()
})

nodecg.listenFor('split', segment => {
    onSplit(segment)
})

nodecg.listenFor('undoSplit', segment => {
    onUndoSplit(segment)
})

/* =================== STATE CHANGES =================== */

function changeInfoDisplay(playAnimation = true) {
    const animation = animations[0]
    const currentInfo = infoDisplays[currentInfoIndex]
    currentInfoIndex = currentInfoIndex === infoDisplays.length - 1 ? 0 : currentInfoIndex + 1
    const nextInfo = infoDisplays[currentInfoIndex]

    if (playAnimation) {
        document.querySelector('.widget-right-animations').style.visibility = 'visible'
        document.getElementById('widget-right-transition-text').innerText = nextInfo.charAt(0).toUpperCase() + nextInfo.slice(1)
        animation.tl.finished.then(() => {
            document.querySelector('.widget-right-animations').style.visiblity = 'hidden'
        })
        animation.tl.play()
    }

    setTimeout(() => {
        document.getElementById(`widget-timer-${currentInfo}`).classList.add('hidden')
        document.getElementById(`widget-timer-${nextInfo}`).classList.remove('hidden')
    }, animation.safeTime)
}

function onSplit(segment) {
    if (segment.isGold) {
        // Play gold split animation
        const animation = animations[1]
        document.querySelector('#widget-full-animations').style.visibility = 'visible'
        animation.tl.finished.then(() => {
            document.querySelector('#widget-full-animations').style.visibility = 'hidden'
        })
        animation.tl.play()

        // Add some delay for the next animation
    }

    // Display some additional info about the segment
}

function onUndoSplit(segment) {
    // Cancel any animations in progress, except the info display change
    for (let i = 1; i < animations.length; i++) {
        animations[i].tl.restart()
        animations[i].tl.pause()
    }
}

/* =================== ANIMATIONS =================== */

function createTransitionTimeline() {
    const fullWidth = animejs__WEBPACK_IMPORTED_MODULE_1__["default"].get(document.querySelector('.widget-right-animations'), 'width')
    const easeOut = 'easeOutCubic'
    const easeIn = 'easeInCubic'

    const tl = animejs__WEBPACK_IMPORTED_MODULE_1__["default"].timeline({
        easing: easeOut,
        autoplay: false
    })

    const smallBoxAnim = {
        targets: '.widget-right-animations .transition-box-small',
        translateX: [
            { value: fullWidth, duration: 500 },
            { value: 0, duration: 0 },
            { value: fullWidth, duration: 500, delay: 1850, easing: easeIn }
        ]
    }

    const largeBoxAnim = {
        targets: '.widget-right-animations .transition-box-large',
        width: [
            { value: [0, '100%'], duration: 500 },
            { value: 0, duration: 500, delay: 1500, easing: easeIn },
        ],
        translateX: [
            { value: fullWidth, duration: 500, delay: 2000, easing: easeIn }
        ]
    }

    const textAnim = {
        targets: '#widget-right-transition-text',
        translateX: [
            { value: ['-200%', 0], duration: 333 },
            { value: 20, duration: 1500, easing: 'linear' },
            { value: '200%', duration: 333, easing: easeIn }
        ]
    }

    tl.add(smallBoxAnim).add(largeBoxAnim, 133).add(textAnim, 300)

    return tl
}

function createGoldSplitTimeline() {
    const easeOut = 'easeOutCubic'
    const easeIn = 'easeInCubic'

    const tl = animejs__WEBPACK_IMPORTED_MODULE_1__["default"].timeline({
        easing: easeOut,
        autoplay: false,
        duration: 300
    })

    const logoOut = logoExit()
    const logoIn = {
        targets: '.widget-inner-circle',
        scale: 1,
        duration: 500,
        easing: 'easeOutElastic'
    }

    const pulse = {
        targets: '#widget-full-animations .transition-circle',
        scale: [0, 6],
        opacity: 0,
        delay: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].stagger(200, { easing: 'easeOutQuad' })
    }

    const fillBoxIn = {
        targets: '#widget-full-animations .transition-circle-full',
        scale: [0, 6]
    }

    const textIn = {
        targets: '#widget-full-animations .text',
        scale: [
            { value: 0, duration: 0 },
            { value: 0.9, duration: 300 },
            { value: 1, duration: 5000, easing: 'linear' }
        ],
        opacity: [0, 1]
    }

    const textAndFillBoxOut = {
        targets: ['#widget-full-animations .text', '#widget-full-animations .transition-circle-full'],
        scale: 1.5,
        opacity: 0,
        duration: 1000,
        delay: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].stagger(500)
    }

    tl.add(logoOut)
        .add(pulse, '-=500')
        .add(fillBoxIn, '-=250')
        .add(textIn, '-=100')
        .add(textAndFillBoxOut)
        .add(logoIn, '-=300')

    return tl
}

function logoExit() {
    addMotionBlur('.widget-inner-circle')

    // We set this in the CSS classes, but the animation will override it if we don't set it inline
    animejs__WEBPACK_IMPORTED_MODULE_1__["default"].set('.widget-inner-circle', {
        translateX: '-50%'
    })

    return {
        targets: '.widget-inner-circle',
        scale: [
            { value: 1, duration: 4000 },
            { value: 1.5, duration: 1000, easing: 'easeInQuad' },
            { value: 0, duration: 1000, easing: 'easeInElastic' }
        ],
        rotate: [
            { value: 1080 * 27, duration: 6000, easing: 'easeInExpo', delay: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].stagger(10) },
        ],
        translateX: [
            { value: '-50%', duration: 4000 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-51, -49) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-51, -49) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-51, -49) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-51, -49) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-51, -49) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-51, -49) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-51, -49) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-51, -49) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-51, -49) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-51, -49) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-52, -48) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-52, -48) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-52, -48) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-52, -48) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-52, -48) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-52, -48) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-52, -48) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-52, -48) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-52, -48) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-52, -48) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-53, -47) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-53, -47) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-53, -47) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-53, -47) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-53, -47) + '%', duration: 50 },
            { value: '-50%', duration: 50 },
            { value: '-50%', duration: 700 }
        ],
        translateY: [
            { value: 0, duration: 4000 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-1, 1) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-1, 1) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-1, 1) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-1, 1) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-1, 1) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-1, 1) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-1, 1) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-1, 1) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-1, 1) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-1, 1) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-2, 2) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-2, 2) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-2, 2) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-2, 2) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-2, 2) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-2, 2) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-2, 2) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-2, 2) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-2, 2) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-2, 2) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-3, 3) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-3, 3) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-3, 3) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-3, 3) + '%', duration: 50 },
            { value: animejs__WEBPACK_IMPORTED_MODULE_1__["default"].random(-3, 3) + '%', duration: 50 },
            { value: 0, duration: 50 },
            { value: 0, duration: 700 }
        ],
        borderColor: [
            { value: COLORS.white, duration: 3000, delay: 1000, easing: 'easeInExpo' },
            { value: COLORS.accent, duration: 1000, delay: 750, easing: 'easeInExpo' },
            { value: COLORS.black, delay: 250 },
        ],
        backgroundColor: [
            { value: COLORS.accent, duration: 1000, delay: 5000, easing: 'easeInExpo' },
            { value: COLORS.secondary }
        ]
    }
}

// Creates duplicate elements to simulate motion blur
function addMotionBlur(selector, steps = 10) {
    const elem = document.querySelector(selector)
    const parent = elem.parentNode
    for (let i = 0; i < steps - 1; i++) {
        const dupe = elem.cloneNode()
        dupe.style.opacity = 1 - 1/steps - i/steps
        dupe.style.boxShadow = 'none'
        parent.appendChild(dupe)
    }
}
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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WUFBWSxhQUFhLE9BQU8sS0FBSyxZQUFZLFdBQVcsVUFBVSxZQUFZLGFBQWEsTUFBTSxLQUFLLFVBQVUsWUFBWSxXQUFXLFVBQVUsVUFBVSxVQUFVLFVBQVUsWUFBWSxhQUFhLE9BQU8sS0FBSyxZQUFZLFdBQVcsWUFBWSxhQUFhLFdBQVcsVUFBVSxZQUFZLGFBQWEsYUFBYSxNQUFNLEtBQUssVUFBVSxVQUFVLFlBQVksV0FBVyxVQUFVLFVBQVUsVUFBVSxVQUFVLFlBQVksYUFBYSxPQUFPLE1BQU0sVUFBVSxZQUFZLFdBQVcsVUFBVSxZQUFZLFdBQVcsWUFBWSxNQUFNLEtBQUssWUFBWSxhQUFhLGFBQWEsYUFBYSxNQUFNLEtBQUssWUFBWSxhQUFhLGFBQWEsT0FBTyxNQUFNLFVBQVUsT0FBTyxLQUFLLFlBQVksV0FBVyxZQUFZLGFBQWEsYUFBYSxhQUFhLGFBQWEsYUFBYSxhQUFhLGFBQWEsYUFBYSxhQUFhLGFBQWEsYUFBYSxPQUFPLFlBQVksTUFBTSxZQUFZLFdBQVcsWUFBWSxXQUFXLFlBQVksYUFBYSxNQUFNLEtBQUssVUFBVSxZQUFZLFdBQVcsVUFBVSxVQUFVLFVBQVUsVUFBVSxZQUFZLFNBQVMsT0FBTyxhQUFhLE9BQU8sS0FBSyxZQUFZLFdBQVcsVUFBVSxZQUFZLFdBQVcsWUFBWSxhQUFhLGFBQWEsYUFBYSxhQUFhLE9BQU8sVUFBVSxLQUFLLFlBQVksYUFBYSxhQUFhLGFBQWEsT0FBTyxLQUFLLFVBQVUsT0FBTyxLQUFLLFlBQVksT0FBTyxLQUFLLFlBQVksT0FBTyxZQUFZLE1BQU0sVUFBVSxVQUFVLFlBQVksYUFBYSxhQUFhLFdBQVcsWUFBWSxXQUFXLFlBQVksYUFBYSxPQUFPLFlBQVksTUFBTSxVQUFVLFVBQVUsVUFBVSxZQUFZLGFBQWEsT0FBTyxLQUFLLFlBQVksYUFBYSxPQUFPLEtBQUssVUFBVSxPQUFPLFVBQVUsS0FBSyxVQUFVLFlBQVksYUFBYSxhQUFhLFdBQVcsVUFBVSxZQUFZLE9BQU8sS0FBSyxZQUFZLGFBQWEsYUFBYSxPQUFPLEtBQUssWUFBWSxhQUFhLE9BQU8s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QUE2QjtBQUM5RCxjQUFjLE9BQU8sc0RBQVksNkJBQTZCO0FBQzlELGNBQWMsT0FBTyxzREFBWSw2QkFBNkI7QUFDOUQsY0FBYyxPQUFPLHNEQUFZLDZCQUE2QjtBQUM5RCxjQUFjLE9BQU8sc0RBQVksNkJBQTZCO0FBQzlELGNBQWMsT0FBTyxzREFBWSw2QkFBNkI7QUFDOUQsY0FBYyxPQUFPLHNEQUFZLDZCQUE2QjtBQUM5RCxjQUFjLE9BQU8sc0RBQVksNkJBQTZCO0FBQzlELGNBQWMsT0FBTyxzREFBWSw2QkFBNkI7QUFDOUQsY0FBYyxPQUFPLHNEQUFZLDZCQUE2QjtBQUM5RCxjQUFjLE9BQU8sc0RBQVksNkJBQTZCO0FBQzlELGNBQWMsT0FBTyxzREFBWSw2QkFBNkI7QUFDOUQsY0FBYyxPQUFPLHNEQUFZLDZCQUE2QjtBQUM5RCxjQUFjLE9BQU8sc0RBQVksNkJBQTZCO0FBQzlELGNBQWMsT0FBTyxzREFBWSw2QkFBNkI7QUFDOUQsY0FBYyx3QkFBd0I7QUFDdEMsY0FBYztBQUNkO0FBQ0E7QUFDQSxjQUFjLHdFQUF3RTtBQUN0RixjQUFjLHdFQUF3RTtBQUN0RixjQUFjLGlDQUFpQztBQUMvQztBQUNBO0FBQ0EsY0FBYyx5RUFBeUU7QUFDdkYsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsZUFBZTtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQyIsInNvdXJjZXMiOlsid2VicGFjazovL2xpdmVzcGxpdC8uL25vZGVfbW9kdWxlcy9hbmltZWpzL2xpYi9hbmltZS5lcy5qcyIsIndlYnBhY2s6Ly9saXZlc3BsaXQvLi9zcmMvZ3JhcGhpY3Mvd2lkZ2V0LmNzcyIsIndlYnBhY2s6Ly9saXZlc3BsaXQvLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzIiwid2VicGFjazovL2xpdmVzcGxpdC8uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9zb3VyY2VNYXBzLmpzIiwid2VicGFjazovL2xpdmVzcGxpdC8uL25vZGVfbW9kdWxlcy9maXR0eS9kaXN0L2ZpdHR5Lm1vZHVsZS5qcyIsIndlYnBhY2s6Ly9saXZlc3BsaXQvLi9zcmMvZ3JhcGhpY3Mvd2lkZ2V0LmNzcz81YmFiIiwid2VicGFjazovL2xpdmVzcGxpdC8uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qcyIsIndlYnBhY2s6Ly9saXZlc3BsaXQvLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRCeVNlbGVjdG9yLmpzIiwid2VicGFjazovL2xpdmVzcGxpdC8uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luc2VydFN0eWxlRWxlbWVudC5qcyIsIndlYnBhY2s6Ly9saXZlc3BsaXQvLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXMuanMiLCJ3ZWJwYWNrOi8vbGl2ZXNwbGl0Ly4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVEb21BUEkuanMiLCJ3ZWJwYWNrOi8vbGl2ZXNwbGl0Ly4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVUYWdUcmFuc2Zvcm0uanMiLCJ3ZWJwYWNrOi8vbGl2ZXNwbGl0L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2xpdmVzcGxpdC93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9saXZlc3BsaXQvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2xpdmVzcGxpdC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2xpdmVzcGxpdC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2xpdmVzcGxpdC8uL3NyYy9ncmFwaGljcy93aWRnZXQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIGFuaW1lLmpzIHYzLjIuMVxuICogKGMpIDIwMjAgSnVsaWFuIEdhcm5pZXJcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogYW5pbWVqcy5jb21cbiAqL1xuXG4vLyBEZWZhdWx0c1xuXG52YXIgZGVmYXVsdEluc3RhbmNlU2V0dGluZ3MgPSB7XG4gIHVwZGF0ZTogbnVsbCxcbiAgYmVnaW46IG51bGwsXG4gIGxvb3BCZWdpbjogbnVsbCxcbiAgY2hhbmdlQmVnaW46IG51bGwsXG4gIGNoYW5nZTogbnVsbCxcbiAgY2hhbmdlQ29tcGxldGU6IG51bGwsXG4gIGxvb3BDb21wbGV0ZTogbnVsbCxcbiAgY29tcGxldGU6IG51bGwsXG4gIGxvb3A6IDEsXG4gIGRpcmVjdGlvbjogJ25vcm1hbCcsXG4gIGF1dG9wbGF5OiB0cnVlLFxuICB0aW1lbGluZU9mZnNldDogMFxufTtcblxudmFyIGRlZmF1bHRUd2VlblNldHRpbmdzID0ge1xuICBkdXJhdGlvbjogMTAwMCxcbiAgZGVsYXk6IDAsXG4gIGVuZERlbGF5OiAwLFxuICBlYXNpbmc6ICdlYXNlT3V0RWxhc3RpYygxLCAuNSknLFxuICByb3VuZDogMFxufTtcblxudmFyIHZhbGlkVHJhbnNmb3JtcyA9IFsndHJhbnNsYXRlWCcsICd0cmFuc2xhdGVZJywgJ3RyYW5zbGF0ZVonLCAncm90YXRlJywgJ3JvdGF0ZVgnLCAncm90YXRlWScsICdyb3RhdGVaJywgJ3NjYWxlJywgJ3NjYWxlWCcsICdzY2FsZVknLCAnc2NhbGVaJywgJ3NrZXcnLCAnc2tld1gnLCAnc2tld1knLCAncGVyc3BlY3RpdmUnLCAnbWF0cml4JywgJ21hdHJpeDNkJ107XG5cbi8vIENhY2hpbmdcblxudmFyIGNhY2hlID0ge1xuICBDU1M6IHt9LFxuICBzcHJpbmdzOiB7fVxufTtcblxuLy8gVXRpbHNcblxuZnVuY3Rpb24gbWluTWF4KHZhbCwgbWluLCBtYXgpIHtcbiAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KHZhbCwgbWluKSwgbWF4KTtcbn1cblxuZnVuY3Rpb24gc3RyaW5nQ29udGFpbnMoc3RyLCB0ZXh0KSB7XG4gIHJldHVybiBzdHIuaW5kZXhPZih0ZXh0KSA+IC0xO1xufVxuXG5mdW5jdGlvbiBhcHBseUFyZ3VtZW50cyhmdW5jLCBhcmdzKSB7XG4gIHJldHVybiBmdW5jLmFwcGx5KG51bGwsIGFyZ3MpO1xufVxuXG52YXIgaXMgPSB7XG4gIGFycjogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIEFycmF5LmlzQXJyYXkoYSk7IH0sXG4gIG9iajogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIHN0cmluZ0NvbnRhaW5zKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKSwgJ09iamVjdCcpOyB9LFxuICBwdGg6IGZ1bmN0aW9uIChhKSB7IHJldHVybiBpcy5vYmooYSkgJiYgYS5oYXNPd25Qcm9wZXJ0eSgndG90YWxMZW5ndGgnKTsgfSxcbiAgc3ZnOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gYSBpbnN0YW5jZW9mIFNWR0VsZW1lbnQ7IH0sXG4gIGlucDogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGEgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50OyB9LFxuICBkb206IGZ1bmN0aW9uIChhKSB7IHJldHVybiBhLm5vZGVUeXBlIHx8IGlzLnN2ZyhhKTsgfSxcbiAgc3RyOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gdHlwZW9mIGEgPT09ICdzdHJpbmcnOyB9LFxuICBmbmM6IGZ1bmN0aW9uIChhKSB7IHJldHVybiB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJzsgfSxcbiAgdW5kOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gdHlwZW9mIGEgPT09ICd1bmRlZmluZWQnOyB9LFxuICBuaWw6IGZ1bmN0aW9uIChhKSB7IHJldHVybiBpcy51bmQoYSkgfHwgYSA9PT0gbnVsbDsgfSxcbiAgaGV4OiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gLyheI1swLTlBLUZdezZ9JCl8KF4jWzAtOUEtRl17M30kKS9pLnRlc3QoYSk7IH0sXG4gIHJnYjogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIC9ecmdiLy50ZXN0KGEpOyB9LFxuICBoc2w6IGZ1bmN0aW9uIChhKSB7IHJldHVybiAvXmhzbC8udGVzdChhKTsgfSxcbiAgY29sOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gKGlzLmhleChhKSB8fCBpcy5yZ2IoYSkgfHwgaXMuaHNsKGEpKTsgfSxcbiAga2V5OiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gIWRlZmF1bHRJbnN0YW5jZVNldHRpbmdzLmhhc093blByb3BlcnR5KGEpICYmICFkZWZhdWx0VHdlZW5TZXR0aW5ncy5oYXNPd25Qcm9wZXJ0eShhKSAmJiBhICE9PSAndGFyZ2V0cycgJiYgYSAhPT0gJ2tleWZyYW1lcyc7IH0sXG59O1xuXG4vLyBFYXNpbmdzXG5cbmZ1bmN0aW9uIHBhcnNlRWFzaW5nUGFyYW1ldGVycyhzdHJpbmcpIHtcbiAgdmFyIG1hdGNoID0gL1xcKChbXildKylcXCkvLmV4ZWMoc3RyaW5nKTtcbiAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMV0uc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKHApIHsgcmV0dXJuIHBhcnNlRmxvYXQocCk7IH0pIDogW107XG59XG5cbi8vIFNwcmluZyBzb2x2ZXIgaW5zcGlyZWQgYnkgV2Via2l0IENvcHlyaWdodCDCqSAyMDE2IEFwcGxlIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gaHR0cHM6Ly93ZWJraXQub3JnL2RlbW9zL3NwcmluZy9zcHJpbmcuanNcblxuZnVuY3Rpb24gc3ByaW5nKHN0cmluZywgZHVyYXRpb24pIHtcblxuICB2YXIgcGFyYW1zID0gcGFyc2VFYXNpbmdQYXJhbWV0ZXJzKHN0cmluZyk7XG4gIHZhciBtYXNzID0gbWluTWF4KGlzLnVuZChwYXJhbXNbMF0pID8gMSA6IHBhcmFtc1swXSwgLjEsIDEwMCk7XG4gIHZhciBzdGlmZm5lc3MgPSBtaW5NYXgoaXMudW5kKHBhcmFtc1sxXSkgPyAxMDAgOiBwYXJhbXNbMV0sIC4xLCAxMDApO1xuICB2YXIgZGFtcGluZyA9IG1pbk1heChpcy51bmQocGFyYW1zWzJdKSA/IDEwIDogcGFyYW1zWzJdLCAuMSwgMTAwKTtcbiAgdmFyIHZlbG9jaXR5ID0gIG1pbk1heChpcy51bmQocGFyYW1zWzNdKSA/IDAgOiBwYXJhbXNbM10sIC4xLCAxMDApO1xuICB2YXIgdzAgPSBNYXRoLnNxcnQoc3RpZmZuZXNzIC8gbWFzcyk7XG4gIHZhciB6ZXRhID0gZGFtcGluZyAvICgyICogTWF0aC5zcXJ0KHN0aWZmbmVzcyAqIG1hc3MpKTtcbiAgdmFyIHdkID0gemV0YSA8IDEgPyB3MCAqIE1hdGguc3FydCgxIC0gemV0YSAqIHpldGEpIDogMDtcbiAgdmFyIGEgPSAxO1xuICB2YXIgYiA9IHpldGEgPCAxID8gKHpldGEgKiB3MCArIC12ZWxvY2l0eSkgLyB3ZCA6IC12ZWxvY2l0eSArIHcwO1xuXG4gIGZ1bmN0aW9uIHNvbHZlcih0KSB7XG4gICAgdmFyIHByb2dyZXNzID0gZHVyYXRpb24gPyAoZHVyYXRpb24gKiB0KSAvIDEwMDAgOiB0O1xuICAgIGlmICh6ZXRhIDwgMSkge1xuICAgICAgcHJvZ3Jlc3MgPSBNYXRoLmV4cCgtcHJvZ3Jlc3MgKiB6ZXRhICogdzApICogKGEgKiBNYXRoLmNvcyh3ZCAqIHByb2dyZXNzKSArIGIgKiBNYXRoLnNpbih3ZCAqIHByb2dyZXNzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb2dyZXNzID0gKGEgKyBiICogcHJvZ3Jlc3MpICogTWF0aC5leHAoLXByb2dyZXNzICogdzApO1xuICAgIH1cbiAgICBpZiAodCA9PT0gMCB8fCB0ID09PSAxKSB7IHJldHVybiB0OyB9XG4gICAgcmV0dXJuIDEgLSBwcm9ncmVzcztcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldER1cmF0aW9uKCkge1xuICAgIHZhciBjYWNoZWQgPSBjYWNoZS5zcHJpbmdzW3N0cmluZ107XG4gICAgaWYgKGNhY2hlZCkgeyByZXR1cm4gY2FjaGVkOyB9XG4gICAgdmFyIGZyYW1lID0gMS82O1xuICAgIHZhciBlbGFwc2VkID0gMDtcbiAgICB2YXIgcmVzdCA9IDA7XG4gICAgd2hpbGUodHJ1ZSkge1xuICAgICAgZWxhcHNlZCArPSBmcmFtZTtcbiAgICAgIGlmIChzb2x2ZXIoZWxhcHNlZCkgPT09IDEpIHtcbiAgICAgICAgcmVzdCsrO1xuICAgICAgICBpZiAocmVzdCA+PSAxNikgeyBicmVhazsgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdCA9IDA7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBkdXJhdGlvbiA9IGVsYXBzZWQgKiBmcmFtZSAqIDEwMDA7XG4gICAgY2FjaGUuc3ByaW5nc1tzdHJpbmddID0gZHVyYXRpb247XG4gICAgcmV0dXJuIGR1cmF0aW9uO1xuICB9XG5cbiAgcmV0dXJuIGR1cmF0aW9uID8gc29sdmVyIDogZ2V0RHVyYXRpb247XG5cbn1cblxuLy8gQmFzaWMgc3RlcHMgZWFzaW5nIGltcGxlbWVudGF0aW9uIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2ZyL2RvY3MvV2ViL0NTUy90cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvblxuXG5mdW5jdGlvbiBzdGVwcyhzdGVwcykge1xuICBpZiAoIHN0ZXBzID09PSB2b2lkIDAgKSBzdGVwcyA9IDEwO1xuXG4gIHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gTWF0aC5jZWlsKChtaW5NYXgodCwgMC4wMDAwMDEsIDEpKSAqIHN0ZXBzKSAqICgxIC8gc3RlcHMpOyB9O1xufVxuXG4vLyBCZXppZXJFYXNpbmcgaHR0cHM6Ly9naXRodWIuY29tL2dyZS9iZXppZXItZWFzaW5nXG5cbnZhciBiZXppZXIgPSAoZnVuY3Rpb24gKCkge1xuXG4gIHZhciBrU3BsaW5lVGFibGVTaXplID0gMTE7XG4gIHZhciBrU2FtcGxlU3RlcFNpemUgPSAxLjAgLyAoa1NwbGluZVRhYmxlU2l6ZSAtIDEuMCk7XG5cbiAgZnVuY3Rpb24gQShhQTEsIGFBMikgeyByZXR1cm4gMS4wIC0gMy4wICogYUEyICsgMy4wICogYUExIH1cbiAgZnVuY3Rpb24gQihhQTEsIGFBMikgeyByZXR1cm4gMy4wICogYUEyIC0gNi4wICogYUExIH1cbiAgZnVuY3Rpb24gQyhhQTEpICAgICAgeyByZXR1cm4gMy4wICogYUExIH1cblxuICBmdW5jdGlvbiBjYWxjQmV6aWVyKGFULCBhQTEsIGFBMikgeyByZXR1cm4gKChBKGFBMSwgYUEyKSAqIGFUICsgQihhQTEsIGFBMikpICogYVQgKyBDKGFBMSkpICogYVQgfVxuICBmdW5jdGlvbiBnZXRTbG9wZShhVCwgYUExLCBhQTIpIHsgcmV0dXJuIDMuMCAqIEEoYUExLCBhQTIpICogYVQgKiBhVCArIDIuMCAqIEIoYUExLCBhQTIpICogYVQgKyBDKGFBMSkgfVxuXG4gIGZ1bmN0aW9uIGJpbmFyeVN1YmRpdmlkZShhWCwgYUEsIGFCLCBtWDEsIG1YMikge1xuICAgIHZhciBjdXJyZW50WCwgY3VycmVudFQsIGkgPSAwO1xuICAgIGRvIHtcbiAgICAgIGN1cnJlbnRUID0gYUEgKyAoYUIgLSBhQSkgLyAyLjA7XG4gICAgICBjdXJyZW50WCA9IGNhbGNCZXppZXIoY3VycmVudFQsIG1YMSwgbVgyKSAtIGFYO1xuICAgICAgaWYgKGN1cnJlbnRYID4gMC4wKSB7IGFCID0gY3VycmVudFQ7IH0gZWxzZSB7IGFBID0gY3VycmVudFQ7IH1cbiAgICB9IHdoaWxlIChNYXRoLmFicyhjdXJyZW50WCkgPiAwLjAwMDAwMDEgJiYgKytpIDwgMTApO1xuICAgIHJldHVybiBjdXJyZW50VDtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5ld3RvblJhcGhzb25JdGVyYXRlKGFYLCBhR3Vlc3NULCBtWDEsIG1YMikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgKytpKSB7XG4gICAgICB2YXIgY3VycmVudFNsb3BlID0gZ2V0U2xvcGUoYUd1ZXNzVCwgbVgxLCBtWDIpO1xuICAgICAgaWYgKGN1cnJlbnRTbG9wZSA9PT0gMC4wKSB7IHJldHVybiBhR3Vlc3NUOyB9XG4gICAgICB2YXIgY3VycmVudFggPSBjYWxjQmV6aWVyKGFHdWVzc1QsIG1YMSwgbVgyKSAtIGFYO1xuICAgICAgYUd1ZXNzVCAtPSBjdXJyZW50WCAvIGN1cnJlbnRTbG9wZTtcbiAgICB9XG4gICAgcmV0dXJuIGFHdWVzc1Q7XG4gIH1cblxuICBmdW5jdGlvbiBiZXppZXIobVgxLCBtWTEsIG1YMiwgbVkyKSB7XG5cbiAgICBpZiAoISgwIDw9IG1YMSAmJiBtWDEgPD0gMSAmJiAwIDw9IG1YMiAmJiBtWDIgPD0gMSkpIHsgcmV0dXJuOyB9XG4gICAgdmFyIHNhbXBsZVZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSk7XG5cbiAgICBpZiAobVgxICE9PSBtWTEgfHwgbVgyICE9PSBtWTIpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga1NwbGluZVRhYmxlU2l6ZTsgKytpKSB7XG4gICAgICAgIHNhbXBsZVZhbHVlc1tpXSA9IGNhbGNCZXppZXIoaSAqIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFRGb3JYKGFYKSB7XG5cbiAgICAgIHZhciBpbnRlcnZhbFN0YXJ0ID0gMDtcbiAgICAgIHZhciBjdXJyZW50U2FtcGxlID0gMTtcbiAgICAgIHZhciBsYXN0U2FtcGxlID0ga1NwbGluZVRhYmxlU2l6ZSAtIDE7XG5cbiAgICAgIGZvciAoOyBjdXJyZW50U2FtcGxlICE9PSBsYXN0U2FtcGxlICYmIHNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSA8PSBhWDsgKytjdXJyZW50U2FtcGxlKSB7XG4gICAgICAgIGludGVydmFsU3RhcnQgKz0ga1NhbXBsZVN0ZXBTaXplO1xuICAgICAgfVxuXG4gICAgICAtLWN1cnJlbnRTYW1wbGU7XG5cbiAgICAgIHZhciBkaXN0ID0gKGFYIC0gc2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKSAvIChzYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZSArIDFdIC0gc2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKTtcbiAgICAgIHZhciBndWVzc0ZvclQgPSBpbnRlcnZhbFN0YXJ0ICsgZGlzdCAqIGtTYW1wbGVTdGVwU2l6ZTtcbiAgICAgIHZhciBpbml0aWFsU2xvcGUgPSBnZXRTbG9wZShndWVzc0ZvclQsIG1YMSwgbVgyKTtcblxuICAgICAgaWYgKGluaXRpYWxTbG9wZSA+PSAwLjAwMSkge1xuICAgICAgICByZXR1cm4gbmV3dG9uUmFwaHNvbkl0ZXJhdGUoYVgsIGd1ZXNzRm9yVCwgbVgxLCBtWDIpO1xuICAgICAgfSBlbHNlIGlmIChpbml0aWFsU2xvcGUgPT09IDAuMCkge1xuICAgICAgICByZXR1cm4gZ3Vlc3NGb3JUO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGJpbmFyeVN1YmRpdmlkZShhWCwgaW50ZXJ2YWxTdGFydCwgaW50ZXJ2YWxTdGFydCArIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh4KSB7XG4gICAgICBpZiAobVgxID09PSBtWTEgJiYgbVgyID09PSBtWTIpIHsgcmV0dXJuIHg7IH1cbiAgICAgIGlmICh4ID09PSAwIHx8IHggPT09IDEpIHsgcmV0dXJuIHg7IH1cbiAgICAgIHJldHVybiBjYWxjQmV6aWVyKGdldFRGb3JYKHgpLCBtWTEsIG1ZMik7XG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gYmV6aWVyO1xuXG59KSgpO1xuXG52YXIgcGVubmVyID0gKGZ1bmN0aW9uICgpIHtcblxuICAvLyBCYXNlZCBvbiBqUXVlcnkgVUkncyBpbXBsZW1lbmF0aW9uIG9mIGVhc2luZyBlcXVhdGlvbnMgZnJvbSBSb2JlcnQgUGVubmVyIChodHRwOi8vd3d3LnJvYmVydHBlbm5lci5jb20vZWFzaW5nKVxuXG4gIHZhciBlYXNlcyA9IHsgbGluZWFyOiBmdW5jdGlvbiAoKSB7IHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gdDsgfTsgfSB9O1xuXG4gIHZhciBmdW5jdGlvbkVhc2luZ3MgPSB7XG4gICAgU2luZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIDEgLSBNYXRoLmNvcyh0ICogTWF0aC5QSSAvIDIpOyB9OyB9LFxuICAgIENpcmM6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiAxIC0gTWF0aC5zcXJ0KDEgLSB0ICogdCk7IH07IH0sXG4gICAgQmFjazogZnVuY3Rpb24gKCkgeyByZXR1cm4gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIHQgKiB0ICogKDMgKiB0IC0gMik7IH07IH0sXG4gICAgQm91bmNlOiBmdW5jdGlvbiAoKSB7IHJldHVybiBmdW5jdGlvbiAodCkge1xuICAgICAgdmFyIHBvdzIsIGIgPSA0O1xuICAgICAgd2hpbGUgKHQgPCAoKCBwb3cyID0gTWF0aC5wb3coMiwgLS1iKSkgLSAxKSAvIDExKSB7fVxuICAgICAgcmV0dXJuIDEgLyBNYXRoLnBvdyg0LCAzIC0gYikgLSA3LjU2MjUgKiBNYXRoLnBvdygoIHBvdzIgKiAzIC0gMiApIC8gMjIgLSB0LCAyKVxuICAgIH07IH0sXG4gICAgRWxhc3RpYzogZnVuY3Rpb24gKGFtcGxpdHVkZSwgcGVyaW9kKSB7XG4gICAgICBpZiAoIGFtcGxpdHVkZSA9PT0gdm9pZCAwICkgYW1wbGl0dWRlID0gMTtcbiAgICAgIGlmICggcGVyaW9kID09PSB2b2lkIDAgKSBwZXJpb2QgPSAuNTtcblxuICAgICAgdmFyIGEgPSBtaW5NYXgoYW1wbGl0dWRlLCAxLCAxMCk7XG4gICAgICB2YXIgcCA9IG1pbk1heChwZXJpb2QsIC4xLCAyKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAodCkge1xuICAgICAgICByZXR1cm4gKHQgPT09IDAgfHwgdCA9PT0gMSkgPyB0IDogXG4gICAgICAgICAgLWEgKiBNYXRoLnBvdygyLCAxMCAqICh0IC0gMSkpICogTWF0aC5zaW4oKCgodCAtIDEpIC0gKHAgLyAoTWF0aC5QSSAqIDIpICogTWF0aC5hc2luKDEgLyBhKSkpICogKE1hdGguUEkgKiAyKSkgLyBwKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdmFyIGJhc2VFYXNpbmdzID0gWydRdWFkJywgJ0N1YmljJywgJ1F1YXJ0JywgJ1F1aW50JywgJ0V4cG8nXTtcblxuICBiYXNlRWFzaW5ncy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lLCBpKSB7XG4gICAgZnVuY3Rpb25FYXNpbmdzW25hbWVdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIE1hdGgucG93KHQsIGkgKyAyKTsgfTsgfTtcbiAgfSk7XG5cbiAgT2JqZWN0LmtleXMoZnVuY3Rpb25FYXNpbmdzKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdmFyIGVhc2VJbiA9IGZ1bmN0aW9uRWFzaW5nc1tuYW1lXTtcbiAgICBlYXNlc1snZWFzZUluJyArIG5hbWVdID0gZWFzZUluO1xuICAgIGVhc2VzWydlYXNlT3V0JyArIG5hbWVdID0gZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiAxIC0gZWFzZUluKGEsIGIpKDEgLSB0KTsgfTsgfTtcbiAgICBlYXNlc1snZWFzZUluT3V0JyArIG5hbWVdID0gZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiB0IDwgMC41ID8gZWFzZUluKGEsIGIpKHQgKiAyKSAvIDIgOiBcbiAgICAgIDEgLSBlYXNlSW4oYSwgYikodCAqIC0yICsgMikgLyAyOyB9OyB9O1xuICAgIGVhc2VzWydlYXNlT3V0SW4nICsgbmFtZV0gPSBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIHQgPCAwLjUgPyAoMSAtIGVhc2VJbihhLCBiKSgxIC0gdCAqIDIpKSAvIDIgOiBcbiAgICAgIChlYXNlSW4oYSwgYikodCAqIDIgLSAxKSArIDEpIC8gMjsgfTsgfTtcbiAgfSk7XG5cbiAgcmV0dXJuIGVhc2VzO1xuXG59KSgpO1xuXG5mdW5jdGlvbiBwYXJzZUVhc2luZ3MoZWFzaW5nLCBkdXJhdGlvbikge1xuICBpZiAoaXMuZm5jKGVhc2luZykpIHsgcmV0dXJuIGVhc2luZzsgfVxuICB2YXIgbmFtZSA9IGVhc2luZy5zcGxpdCgnKCcpWzBdO1xuICB2YXIgZWFzZSA9IHBlbm5lcltuYW1lXTtcbiAgdmFyIGFyZ3MgPSBwYXJzZUVhc2luZ1BhcmFtZXRlcnMoZWFzaW5nKTtcbiAgc3dpdGNoIChuYW1lKSB7XG4gICAgY2FzZSAnc3ByaW5nJyA6IHJldHVybiBzcHJpbmcoZWFzaW5nLCBkdXJhdGlvbik7XG4gICAgY2FzZSAnY3ViaWNCZXppZXInIDogcmV0dXJuIGFwcGx5QXJndW1lbnRzKGJlemllciwgYXJncyk7XG4gICAgY2FzZSAnc3RlcHMnIDogcmV0dXJuIGFwcGx5QXJndW1lbnRzKHN0ZXBzLCBhcmdzKTtcbiAgICBkZWZhdWx0IDogcmV0dXJuIGFwcGx5QXJndW1lbnRzKGVhc2UsIGFyZ3MpO1xuICB9XG59XG5cbi8vIFN0cmluZ3NcblxuZnVuY3Rpb24gc2VsZWN0U3RyaW5nKHN0cikge1xuICB0cnkge1xuICAgIHZhciBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc3RyKTtcbiAgICByZXR1cm4gbm9kZXM7XG4gIH0gY2F0Y2goZSkge1xuICAgIHJldHVybjtcbiAgfVxufVxuXG4vLyBBcnJheXNcblxuZnVuY3Rpb24gZmlsdGVyQXJyYXkoYXJyLCBjYWxsYmFjaykge1xuICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcbiAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHMubGVuZ3RoID49IDIgPyBhcmd1bWVudHNbMV0gOiB2b2lkIDA7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChpIGluIGFycikge1xuICAgICAgdmFyIHZhbCA9IGFycltpXTtcbiAgICAgIGlmIChjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHZhbCwgaSwgYXJyKSkge1xuICAgICAgICByZXN1bHQucHVzaCh2YWwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuQXJyYXkoYXJyKSB7XG4gIHJldHVybiBhcnIucmVkdWNlKGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLmNvbmNhdChpcy5hcnIoYikgPyBmbGF0dGVuQXJyYXkoYikgOiBiKTsgfSwgW10pO1xufVxuXG5mdW5jdGlvbiB0b0FycmF5KG8pIHtcbiAgaWYgKGlzLmFycihvKSkgeyByZXR1cm4gbzsgfVxuICBpZiAoaXMuc3RyKG8pKSB7IG8gPSBzZWxlY3RTdHJpbmcobykgfHwgbzsgfVxuICBpZiAobyBpbnN0YW5jZW9mIE5vZGVMaXN0IHx8IG8gaW5zdGFuY2VvZiBIVE1MQ29sbGVjdGlvbikgeyByZXR1cm4gW10uc2xpY2UuY2FsbChvKTsgfVxuICByZXR1cm4gW29dO1xufVxuXG5mdW5jdGlvbiBhcnJheUNvbnRhaW5zKGFyciwgdmFsKSB7XG4gIHJldHVybiBhcnIuc29tZShmdW5jdGlvbiAoYSkgeyByZXR1cm4gYSA9PT0gdmFsOyB9KTtcbn1cblxuLy8gT2JqZWN0c1xuXG5mdW5jdGlvbiBjbG9uZU9iamVjdChvKSB7XG4gIHZhciBjbG9uZSA9IHt9O1xuICBmb3IgKHZhciBwIGluIG8pIHsgY2xvbmVbcF0gPSBvW3BdOyB9XG4gIHJldHVybiBjbG9uZTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZU9iamVjdFByb3BzKG8xLCBvMikge1xuICB2YXIgbyA9IGNsb25lT2JqZWN0KG8xKTtcbiAgZm9yICh2YXIgcCBpbiBvMSkgeyBvW3BdID0gbzIuaGFzT3duUHJvcGVydHkocCkgPyBvMltwXSA6IG8xW3BdOyB9XG4gIHJldHVybiBvO1xufVxuXG5mdW5jdGlvbiBtZXJnZU9iamVjdHMobzEsIG8yKSB7XG4gIHZhciBvID0gY2xvbmVPYmplY3QobzEpO1xuICBmb3IgKHZhciBwIGluIG8yKSB7IG9bcF0gPSBpcy51bmQobzFbcF0pID8gbzJbcF0gOiBvMVtwXTsgfVxuICByZXR1cm4gbztcbn1cblxuLy8gQ29sb3JzXG5cbmZ1bmN0aW9uIHJnYlRvUmdiYShyZ2JWYWx1ZSkge1xuICB2YXIgcmdiID0gL3JnYlxcKChcXGQrLFxccypbXFxkXSssXFxzKltcXGRdKylcXCkvZy5leGVjKHJnYlZhbHVlKTtcbiAgcmV0dXJuIHJnYiA/IChcInJnYmEoXCIgKyAocmdiWzFdKSArIFwiLDEpXCIpIDogcmdiVmFsdWU7XG59XG5cbmZ1bmN0aW9uIGhleFRvUmdiYShoZXhWYWx1ZSkge1xuICB2YXIgcmd4ID0gL14jPyhbYS1mXFxkXSkoW2EtZlxcZF0pKFthLWZcXGRdKSQvaTtcbiAgdmFyIGhleCA9IGhleFZhbHVlLnJlcGxhY2Uocmd4LCBmdW5jdGlvbiAobSwgciwgZywgYikgeyByZXR1cm4gciArIHIgKyBnICsgZyArIGIgKyBiOyB9ICk7XG4gIHZhciByZ2IgPSAvXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLmV4ZWMoaGV4KTtcbiAgdmFyIHIgPSBwYXJzZUludChyZ2JbMV0sIDE2KTtcbiAgdmFyIGcgPSBwYXJzZUludChyZ2JbMl0sIDE2KTtcbiAgdmFyIGIgPSBwYXJzZUludChyZ2JbM10sIDE2KTtcbiAgcmV0dXJuIChcInJnYmEoXCIgKyByICsgXCIsXCIgKyBnICsgXCIsXCIgKyBiICsgXCIsMSlcIik7XG59XG5cbmZ1bmN0aW9uIGhzbFRvUmdiYShoc2xWYWx1ZSkge1xuICB2YXIgaHNsID0gL2hzbFxcKChcXGQrKSxcXHMqKFtcXGQuXSspJSxcXHMqKFtcXGQuXSspJVxcKS9nLmV4ZWMoaHNsVmFsdWUpIHx8IC9oc2xhXFwoKFxcZCspLFxccyooW1xcZC5dKyklLFxccyooW1xcZC5dKyklLFxccyooW1xcZC5dKylcXCkvZy5leGVjKGhzbFZhbHVlKTtcbiAgdmFyIGggPSBwYXJzZUludChoc2xbMV0sIDEwKSAvIDM2MDtcbiAgdmFyIHMgPSBwYXJzZUludChoc2xbMl0sIDEwKSAvIDEwMDtcbiAgdmFyIGwgPSBwYXJzZUludChoc2xbM10sIDEwKSAvIDEwMDtcbiAgdmFyIGEgPSBoc2xbNF0gfHwgMTtcbiAgZnVuY3Rpb24gaHVlMnJnYihwLCBxLCB0KSB7XG4gICAgaWYgKHQgPCAwKSB7IHQgKz0gMTsgfVxuICAgIGlmICh0ID4gMSkgeyB0IC09IDE7IH1cbiAgICBpZiAodCA8IDEvNikgeyByZXR1cm4gcCArIChxIC0gcCkgKiA2ICogdDsgfVxuICAgIGlmICh0IDwgMS8yKSB7IHJldHVybiBxOyB9XG4gICAgaWYgKHQgPCAyLzMpIHsgcmV0dXJuIHAgKyAocSAtIHApICogKDIvMyAtIHQpICogNjsgfVxuICAgIHJldHVybiBwO1xuICB9XG4gIHZhciByLCBnLCBiO1xuICBpZiAocyA9PSAwKSB7XG4gICAgciA9IGcgPSBiID0gbDtcbiAgfSBlbHNlIHtcbiAgICB2YXIgcSA9IGwgPCAwLjUgPyBsICogKDEgKyBzKSA6IGwgKyBzIC0gbCAqIHM7XG4gICAgdmFyIHAgPSAyICogbCAtIHE7XG4gICAgciA9IGh1ZTJyZ2IocCwgcSwgaCArIDEvMyk7XG4gICAgZyA9IGh1ZTJyZ2IocCwgcSwgaCk7XG4gICAgYiA9IGh1ZTJyZ2IocCwgcSwgaCAtIDEvMyk7XG4gIH1cbiAgcmV0dXJuIChcInJnYmEoXCIgKyAociAqIDI1NSkgKyBcIixcIiArIChnICogMjU1KSArIFwiLFwiICsgKGIgKiAyNTUpICsgXCIsXCIgKyBhICsgXCIpXCIpO1xufVxuXG5mdW5jdGlvbiBjb2xvclRvUmdiKHZhbCkge1xuICBpZiAoaXMucmdiKHZhbCkpIHsgcmV0dXJuIHJnYlRvUmdiYSh2YWwpOyB9XG4gIGlmIChpcy5oZXgodmFsKSkgeyByZXR1cm4gaGV4VG9SZ2JhKHZhbCk7IH1cbiAgaWYgKGlzLmhzbCh2YWwpKSB7IHJldHVybiBoc2xUb1JnYmEodmFsKTsgfVxufVxuXG4vLyBVbml0c1xuXG5mdW5jdGlvbiBnZXRVbml0KHZhbCkge1xuICB2YXIgc3BsaXQgPSAvWystXT9cXGQqXFwuP1xcZCsoPzpcXC5cXGQrKT8oPzpbZUVdWystXT9cXGQrKT8oJXxweHxwdHxlbXxyZW18aW58Y218bW18ZXh8Y2h8cGN8dnd8dmh8dm1pbnx2bWF4fGRlZ3xyYWR8dHVybik/JC8uZXhlYyh2YWwpO1xuICBpZiAoc3BsaXQpIHsgcmV0dXJuIHNwbGl0WzFdOyB9XG59XG5cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybVVuaXQocHJvcE5hbWUpIHtcbiAgaWYgKHN0cmluZ0NvbnRhaW5zKHByb3BOYW1lLCAndHJhbnNsYXRlJykgfHwgcHJvcE5hbWUgPT09ICdwZXJzcGVjdGl2ZScpIHsgcmV0dXJuICdweCc7IH1cbiAgaWYgKHN0cmluZ0NvbnRhaW5zKHByb3BOYW1lLCAncm90YXRlJykgfHwgc3RyaW5nQ29udGFpbnMocHJvcE5hbWUsICdza2V3JykpIHsgcmV0dXJuICdkZWcnOyB9XG59XG5cbi8vIFZhbHVlc1xuXG5mdW5jdGlvbiBnZXRGdW5jdGlvblZhbHVlKHZhbCwgYW5pbWF0YWJsZSkge1xuICBpZiAoIWlzLmZuYyh2YWwpKSB7IHJldHVybiB2YWw7IH1cbiAgcmV0dXJuIHZhbChhbmltYXRhYmxlLnRhcmdldCwgYW5pbWF0YWJsZS5pZCwgYW5pbWF0YWJsZS50b3RhbCk7XG59XG5cbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZShlbCwgcHJvcCkge1xuICByZXR1cm4gZWwuZ2V0QXR0cmlidXRlKHByb3ApO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0UHhUb1VuaXQoZWwsIHZhbHVlLCB1bml0KSB7XG4gIHZhciB2YWx1ZVVuaXQgPSBnZXRVbml0KHZhbHVlKTtcbiAgaWYgKGFycmF5Q29udGFpbnMoW3VuaXQsICdkZWcnLCAncmFkJywgJ3R1cm4nXSwgdmFsdWVVbml0KSkgeyByZXR1cm4gdmFsdWU7IH1cbiAgdmFyIGNhY2hlZCA9IGNhY2hlLkNTU1t2YWx1ZSArIHVuaXRdO1xuICBpZiAoIWlzLnVuZChjYWNoZWQpKSB7IHJldHVybiBjYWNoZWQ7IH1cbiAgdmFyIGJhc2VsaW5lID0gMTAwO1xuICB2YXIgdGVtcEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbC50YWdOYW1lKTtcbiAgdmFyIHBhcmVudEVsID0gKGVsLnBhcmVudE5vZGUgJiYgKGVsLnBhcmVudE5vZGUgIT09IGRvY3VtZW50KSkgPyBlbC5wYXJlbnROb2RlIDogZG9jdW1lbnQuYm9keTtcbiAgcGFyZW50RWwuYXBwZW5kQ2hpbGQodGVtcEVsKTtcbiAgdGVtcEVsLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgdGVtcEVsLnN0eWxlLndpZHRoID0gYmFzZWxpbmUgKyB1bml0O1xuICB2YXIgZmFjdG9yID0gYmFzZWxpbmUgLyB0ZW1wRWwub2Zmc2V0V2lkdGg7XG4gIHBhcmVudEVsLnJlbW92ZUNoaWxkKHRlbXBFbCk7XG4gIHZhciBjb252ZXJ0ZWRVbml0ID0gZmFjdG9yICogcGFyc2VGbG9hdCh2YWx1ZSk7XG4gIGNhY2hlLkNTU1t2YWx1ZSArIHVuaXRdID0gY29udmVydGVkVW5pdDtcbiAgcmV0dXJuIGNvbnZlcnRlZFVuaXQ7XG59XG5cbmZ1bmN0aW9uIGdldENTU1ZhbHVlKGVsLCBwcm9wLCB1bml0KSB7XG4gIGlmIChwcm9wIGluIGVsLnN0eWxlKSB7XG4gICAgdmFyIHVwcGVyY2FzZVByb3BOYW1lID0gcHJvcC5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciB2YWx1ZSA9IGVsLnN0eWxlW3Byb3BdIHx8IGdldENvbXB1dGVkU3R5bGUoZWwpLmdldFByb3BlcnR5VmFsdWUodXBwZXJjYXNlUHJvcE5hbWUpIHx8ICcwJztcbiAgICByZXR1cm4gdW5pdCA/IGNvbnZlcnRQeFRvVW5pdChlbCwgdmFsdWUsIHVuaXQpIDogdmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0QW5pbWF0aW9uVHlwZShlbCwgcHJvcCkge1xuICBpZiAoaXMuZG9tKGVsKSAmJiAhaXMuaW5wKGVsKSAmJiAoIWlzLm5pbChnZXRBdHRyaWJ1dGUoZWwsIHByb3ApKSB8fCAoaXMuc3ZnKGVsKSAmJiBlbFtwcm9wXSkpKSB7IHJldHVybiAnYXR0cmlidXRlJzsgfVxuICBpZiAoaXMuZG9tKGVsKSAmJiBhcnJheUNvbnRhaW5zKHZhbGlkVHJhbnNmb3JtcywgcHJvcCkpIHsgcmV0dXJuICd0cmFuc2Zvcm0nOyB9XG4gIGlmIChpcy5kb20oZWwpICYmIChwcm9wICE9PSAndHJhbnNmb3JtJyAmJiBnZXRDU1NWYWx1ZShlbCwgcHJvcCkpKSB7IHJldHVybiAnY3NzJzsgfVxuICBpZiAoZWxbcHJvcF0gIT0gbnVsbCkgeyByZXR1cm4gJ29iamVjdCc7IH1cbn1cblxuZnVuY3Rpb24gZ2V0RWxlbWVudFRyYW5zZm9ybXMoZWwpIHtcbiAgaWYgKCFpcy5kb20oZWwpKSB7IHJldHVybjsgfVxuICB2YXIgc3RyID0gZWwuc3R5bGUudHJhbnNmb3JtIHx8ICcnO1xuICB2YXIgcmVnICA9IC8oXFx3KylcXCgoW14pXSopXFwpL2c7XG4gIHZhciB0cmFuc2Zvcm1zID0gbmV3IE1hcCgpO1xuICB2YXIgbTsgd2hpbGUgKG0gPSByZWcuZXhlYyhzdHIpKSB7IHRyYW5zZm9ybXMuc2V0KG1bMV0sIG1bMl0pOyB9XG4gIHJldHVybiB0cmFuc2Zvcm1zO1xufVxuXG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm1WYWx1ZShlbCwgcHJvcE5hbWUsIGFuaW1hdGFibGUsIHVuaXQpIHtcbiAgdmFyIGRlZmF1bHRWYWwgPSBzdHJpbmdDb250YWlucyhwcm9wTmFtZSwgJ3NjYWxlJykgPyAxIDogMCArIGdldFRyYW5zZm9ybVVuaXQocHJvcE5hbWUpO1xuICB2YXIgdmFsdWUgPSBnZXRFbGVtZW50VHJhbnNmb3JtcyhlbCkuZ2V0KHByb3BOYW1lKSB8fCBkZWZhdWx0VmFsO1xuICBpZiAoYW5pbWF0YWJsZSkge1xuICAgIGFuaW1hdGFibGUudHJhbnNmb3Jtcy5saXN0LnNldChwcm9wTmFtZSwgdmFsdWUpO1xuICAgIGFuaW1hdGFibGUudHJhbnNmb3Jtc1snbGFzdCddID0gcHJvcE5hbWU7XG4gIH1cbiAgcmV0dXJuIHVuaXQgPyBjb252ZXJ0UHhUb1VuaXQoZWwsIHZhbHVlLCB1bml0KSA6IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBnZXRPcmlnaW5hbFRhcmdldFZhbHVlKHRhcmdldCwgcHJvcE5hbWUsIHVuaXQsIGFuaW1hdGFibGUpIHtcbiAgc3dpdGNoIChnZXRBbmltYXRpb25UeXBlKHRhcmdldCwgcHJvcE5hbWUpKSB7XG4gICAgY2FzZSAndHJhbnNmb3JtJzogcmV0dXJuIGdldFRyYW5zZm9ybVZhbHVlKHRhcmdldCwgcHJvcE5hbWUsIGFuaW1hdGFibGUsIHVuaXQpO1xuICAgIGNhc2UgJ2Nzcyc6IHJldHVybiBnZXRDU1NWYWx1ZSh0YXJnZXQsIHByb3BOYW1lLCB1bml0KTtcbiAgICBjYXNlICdhdHRyaWJ1dGUnOiByZXR1cm4gZ2V0QXR0cmlidXRlKHRhcmdldCwgcHJvcE5hbWUpO1xuICAgIGRlZmF1bHQ6IHJldHVybiB0YXJnZXRbcHJvcE5hbWVdIHx8IDA7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVsYXRpdmVWYWx1ZSh0bywgZnJvbSkge1xuICB2YXIgb3BlcmF0b3IgPSAvXihcXCo9fFxcKz18LT0pLy5leGVjKHRvKTtcbiAgaWYgKCFvcGVyYXRvcikgeyByZXR1cm4gdG87IH1cbiAgdmFyIHUgPSBnZXRVbml0KHRvKSB8fCAwO1xuICB2YXIgeCA9IHBhcnNlRmxvYXQoZnJvbSk7XG4gIHZhciB5ID0gcGFyc2VGbG9hdCh0by5yZXBsYWNlKG9wZXJhdG9yWzBdLCAnJykpO1xuICBzd2l0Y2ggKG9wZXJhdG9yWzBdWzBdKSB7XG4gICAgY2FzZSAnKyc6IHJldHVybiB4ICsgeSArIHU7XG4gICAgY2FzZSAnLSc6IHJldHVybiB4IC0geSArIHU7XG4gICAgY2FzZSAnKic6IHJldHVybiB4ICogeSArIHU7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVWYWx1ZSh2YWwsIHVuaXQpIHtcbiAgaWYgKGlzLmNvbCh2YWwpKSB7IHJldHVybiBjb2xvclRvUmdiKHZhbCk7IH1cbiAgaWYgKC9cXHMvZy50ZXN0KHZhbCkpIHsgcmV0dXJuIHZhbDsgfVxuICB2YXIgb3JpZ2luYWxVbml0ID0gZ2V0VW5pdCh2YWwpO1xuICB2YXIgdW5pdExlc3MgPSBvcmlnaW5hbFVuaXQgPyB2YWwuc3Vic3RyKDAsIHZhbC5sZW5ndGggLSBvcmlnaW5hbFVuaXQubGVuZ3RoKSA6IHZhbDtcbiAgaWYgKHVuaXQpIHsgcmV0dXJuIHVuaXRMZXNzICsgdW5pdDsgfVxuICByZXR1cm4gdW5pdExlc3M7XG59XG5cbi8vIGdldFRvdGFsTGVuZ3RoKCkgZXF1aXZhbGVudCBmb3IgY2lyY2xlLCByZWN0LCBwb2x5bGluZSwgcG9seWdvbiBhbmQgbGluZSBzaGFwZXNcbi8vIGFkYXB0ZWQgZnJvbSBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9TZWJMYW1ibGEvM2UwNTUwYzQ5NmMyMzY3MDk3NDRcblxuZnVuY3Rpb24gZ2V0RGlzdGFuY2UocDEsIHAyKSB7XG4gIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocDIueCAtIHAxLngsIDIpICsgTWF0aC5wb3cocDIueSAtIHAxLnksIDIpKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2lyY2xlTGVuZ3RoKGVsKSB7XG4gIHJldHVybiBNYXRoLlBJICogMiAqIGdldEF0dHJpYnV0ZShlbCwgJ3InKTtcbn1cblxuZnVuY3Rpb24gZ2V0UmVjdExlbmd0aChlbCkge1xuICByZXR1cm4gKGdldEF0dHJpYnV0ZShlbCwgJ3dpZHRoJykgKiAyKSArIChnZXRBdHRyaWJ1dGUoZWwsICdoZWlnaHQnKSAqIDIpO1xufVxuXG5mdW5jdGlvbiBnZXRMaW5lTGVuZ3RoKGVsKSB7XG4gIHJldHVybiBnZXREaXN0YW5jZShcbiAgICB7eDogZ2V0QXR0cmlidXRlKGVsLCAneDEnKSwgeTogZ2V0QXR0cmlidXRlKGVsLCAneTEnKX0sIFxuICAgIHt4OiBnZXRBdHRyaWJ1dGUoZWwsICd4MicpLCB5OiBnZXRBdHRyaWJ1dGUoZWwsICd5MicpfVxuICApO1xufVxuXG5mdW5jdGlvbiBnZXRQb2x5bGluZUxlbmd0aChlbCkge1xuICB2YXIgcG9pbnRzID0gZWwucG9pbnRzO1xuICB2YXIgdG90YWxMZW5ndGggPSAwO1xuICB2YXIgcHJldmlvdXNQb3M7XG4gIGZvciAodmFyIGkgPSAwIDsgaSA8IHBvaW50cy5udW1iZXJPZkl0ZW1zOyBpKyspIHtcbiAgICB2YXIgY3VycmVudFBvcyA9IHBvaW50cy5nZXRJdGVtKGkpO1xuICAgIGlmIChpID4gMCkgeyB0b3RhbExlbmd0aCArPSBnZXREaXN0YW5jZShwcmV2aW91c1BvcywgY3VycmVudFBvcyk7IH1cbiAgICBwcmV2aW91c1BvcyA9IGN1cnJlbnRQb3M7XG4gIH1cbiAgcmV0dXJuIHRvdGFsTGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBnZXRQb2x5Z29uTGVuZ3RoKGVsKSB7XG4gIHZhciBwb2ludHMgPSBlbC5wb2ludHM7XG4gIHJldHVybiBnZXRQb2x5bGluZUxlbmd0aChlbCkgKyBnZXREaXN0YW5jZShwb2ludHMuZ2V0SXRlbShwb2ludHMubnVtYmVyT2ZJdGVtcyAtIDEpLCBwb2ludHMuZ2V0SXRlbSgwKSk7XG59XG5cbi8vIFBhdGggYW5pbWF0aW9uXG5cbmZ1bmN0aW9uIGdldFRvdGFsTGVuZ3RoKGVsKSB7XG4gIGlmIChlbC5nZXRUb3RhbExlbmd0aCkgeyByZXR1cm4gZWwuZ2V0VG90YWxMZW5ndGgoKTsgfVxuICBzd2l0Y2goZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnY2lyY2xlJzogcmV0dXJuIGdldENpcmNsZUxlbmd0aChlbCk7XG4gICAgY2FzZSAncmVjdCc6IHJldHVybiBnZXRSZWN0TGVuZ3RoKGVsKTtcbiAgICBjYXNlICdsaW5lJzogcmV0dXJuIGdldExpbmVMZW5ndGgoZWwpO1xuICAgIGNhc2UgJ3BvbHlsaW5lJzogcmV0dXJuIGdldFBvbHlsaW5lTGVuZ3RoKGVsKTtcbiAgICBjYXNlICdwb2x5Z29uJzogcmV0dXJuIGdldFBvbHlnb25MZW5ndGgoZWwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldERhc2hvZmZzZXQoZWwpIHtcbiAgdmFyIHBhdGhMZW5ndGggPSBnZXRUb3RhbExlbmd0aChlbCk7XG4gIGVsLnNldEF0dHJpYnV0ZSgnc3Ryb2tlLWRhc2hhcnJheScsIHBhdGhMZW5ndGgpO1xuICByZXR1cm4gcGF0aExlbmd0aDtcbn1cblxuLy8gTW90aW9uIHBhdGhcblxuZnVuY3Rpb24gZ2V0UGFyZW50U3ZnRWwoZWwpIHtcbiAgdmFyIHBhcmVudEVsID0gZWwucGFyZW50Tm9kZTtcbiAgd2hpbGUgKGlzLnN2ZyhwYXJlbnRFbCkpIHtcbiAgICBpZiAoIWlzLnN2ZyhwYXJlbnRFbC5wYXJlbnROb2RlKSkgeyBicmVhazsgfVxuICAgIHBhcmVudEVsID0gcGFyZW50RWwucGFyZW50Tm9kZTtcbiAgfVxuICByZXR1cm4gcGFyZW50RWw7XG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudFN2ZyhwYXRoRWwsIHN2Z0RhdGEpIHtcbiAgdmFyIHN2ZyA9IHN2Z0RhdGEgfHwge307XG4gIHZhciBwYXJlbnRTdmdFbCA9IHN2Zy5lbCB8fCBnZXRQYXJlbnRTdmdFbChwYXRoRWwpO1xuICB2YXIgcmVjdCA9IHBhcmVudFN2Z0VsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB2YXIgdmlld0JveEF0dHIgPSBnZXRBdHRyaWJ1dGUocGFyZW50U3ZnRWwsICd2aWV3Qm94Jyk7XG4gIHZhciB3aWR0aCA9IHJlY3Qud2lkdGg7XG4gIHZhciBoZWlnaHQgPSByZWN0LmhlaWdodDtcbiAgdmFyIHZpZXdCb3ggPSBzdmcudmlld0JveCB8fCAodmlld0JveEF0dHIgPyB2aWV3Qm94QXR0ci5zcGxpdCgnICcpIDogWzAsIDAsIHdpZHRoLCBoZWlnaHRdKTtcbiAgcmV0dXJuIHtcbiAgICBlbDogcGFyZW50U3ZnRWwsXG4gICAgdmlld0JveDogdmlld0JveCxcbiAgICB4OiB2aWV3Qm94WzBdIC8gMSxcbiAgICB5OiB2aWV3Qm94WzFdIC8gMSxcbiAgICB3OiB3aWR0aCxcbiAgICBoOiBoZWlnaHQsXG4gICAgdlc6IHZpZXdCb3hbMl0sXG4gICAgdkg6IHZpZXdCb3hbM11cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYXRoKHBhdGgsIHBlcmNlbnQpIHtcbiAgdmFyIHBhdGhFbCA9IGlzLnN0cihwYXRoKSA/IHNlbGVjdFN0cmluZyhwYXRoKVswXSA6IHBhdGg7XG4gIHZhciBwID0gcGVyY2VudCB8fCAxMDA7XG4gIHJldHVybiBmdW5jdGlvbihwcm9wZXJ0eSkge1xuICAgIHJldHVybiB7XG4gICAgICBwcm9wZXJ0eTogcHJvcGVydHksXG4gICAgICBlbDogcGF0aEVsLFxuICAgICAgc3ZnOiBnZXRQYXJlbnRTdmcocGF0aEVsKSxcbiAgICAgIHRvdGFsTGVuZ3RoOiBnZXRUb3RhbExlbmd0aChwYXRoRWwpICogKHAgLyAxMDApXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldFBhdGhQcm9ncmVzcyhwYXRoLCBwcm9ncmVzcywgaXNQYXRoVGFyZ2V0SW5zaWRlU1ZHKSB7XG4gIGZ1bmN0aW9uIHBvaW50KG9mZnNldCkge1xuICAgIGlmICggb2Zmc2V0ID09PSB2b2lkIDAgKSBvZmZzZXQgPSAwO1xuXG4gICAgdmFyIGwgPSBwcm9ncmVzcyArIG9mZnNldCA+PSAxID8gcHJvZ3Jlc3MgKyBvZmZzZXQgOiAwO1xuICAgIHJldHVybiBwYXRoLmVsLmdldFBvaW50QXRMZW5ndGgobCk7XG4gIH1cbiAgdmFyIHN2ZyA9IGdldFBhcmVudFN2ZyhwYXRoLmVsLCBwYXRoLnN2Zyk7XG4gIHZhciBwID0gcG9pbnQoKTtcbiAgdmFyIHAwID0gcG9pbnQoLTEpO1xuICB2YXIgcDEgPSBwb2ludCgrMSk7XG4gIHZhciBzY2FsZVggPSBpc1BhdGhUYXJnZXRJbnNpZGVTVkcgPyAxIDogc3ZnLncgLyBzdmcudlc7XG4gIHZhciBzY2FsZVkgPSBpc1BhdGhUYXJnZXRJbnNpZGVTVkcgPyAxIDogc3ZnLmggLyBzdmcudkg7XG4gIHN3aXRjaCAocGF0aC5wcm9wZXJ0eSkge1xuICAgIGNhc2UgJ3gnOiByZXR1cm4gKHAueCAtIHN2Zy54KSAqIHNjYWxlWDtcbiAgICBjYXNlICd5JzogcmV0dXJuIChwLnkgLSBzdmcueSkgKiBzY2FsZVk7XG4gICAgY2FzZSAnYW5nbGUnOiByZXR1cm4gTWF0aC5hdGFuMihwMS55IC0gcDAueSwgcDEueCAtIHAwLngpICogMTgwIC8gTWF0aC5QSTtcbiAgfVxufVxuXG4vLyBEZWNvbXBvc2UgdmFsdWVcblxuZnVuY3Rpb24gZGVjb21wb3NlVmFsdWUodmFsLCB1bml0KSB7XG4gIC8vIGNvbnN0IHJneCA9IC8tP1xcZCpcXC4/XFxkKy9nOyAvLyBoYW5kbGVzIGJhc2ljIG51bWJlcnNcbiAgLy8gY29uc3Qgcmd4ID0gL1srLV0/XFxkKyg/OlxcLlxcZCspPyg/OltlRV1bKy1dP1xcZCspPy9nOyAvLyBoYW5kbGVzIGV4cG9uZW50cyBub3RhdGlvblxuICB2YXIgcmd4ID0gL1srLV0/XFxkKlxcLj9cXGQrKD86XFwuXFxkKyk/KD86W2VFXVsrLV0/XFxkKyk/L2c7IC8vIGhhbmRsZXMgZXhwb25lbnRzIG5vdGF0aW9uXG4gIHZhciB2YWx1ZSA9IHZhbGlkYXRlVmFsdWUoKGlzLnB0aCh2YWwpID8gdmFsLnRvdGFsTGVuZ3RoIDogdmFsKSwgdW5pdCkgKyAnJztcbiAgcmV0dXJuIHtcbiAgICBvcmlnaW5hbDogdmFsdWUsXG4gICAgbnVtYmVyczogdmFsdWUubWF0Y2gocmd4KSA/IHZhbHVlLm1hdGNoKHJneCkubWFwKE51bWJlcikgOiBbMF0sXG4gICAgc3RyaW5nczogKGlzLnN0cih2YWwpIHx8IHVuaXQpID8gdmFsdWUuc3BsaXQocmd4KSA6IFtdXG4gIH1cbn1cblxuLy8gQW5pbWF0YWJsZXNcblxuZnVuY3Rpb24gcGFyc2VUYXJnZXRzKHRhcmdldHMpIHtcbiAgdmFyIHRhcmdldHNBcnJheSA9IHRhcmdldHMgPyAoZmxhdHRlbkFycmF5KGlzLmFycih0YXJnZXRzKSA/IHRhcmdldHMubWFwKHRvQXJyYXkpIDogdG9BcnJheSh0YXJnZXRzKSkpIDogW107XG4gIHJldHVybiBmaWx0ZXJBcnJheSh0YXJnZXRzQXJyYXksIGZ1bmN0aW9uIChpdGVtLCBwb3MsIHNlbGYpIHsgcmV0dXJuIHNlbGYuaW5kZXhPZihpdGVtKSA9PT0gcG9zOyB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0QW5pbWF0YWJsZXModGFyZ2V0cykge1xuICB2YXIgcGFyc2VkID0gcGFyc2VUYXJnZXRzKHRhcmdldHMpO1xuICByZXR1cm4gcGFyc2VkLm1hcChmdW5jdGlvbiAodCwgaSkge1xuICAgIHJldHVybiB7dGFyZ2V0OiB0LCBpZDogaSwgdG90YWw6IHBhcnNlZC5sZW5ndGgsIHRyYW5zZm9ybXM6IHsgbGlzdDogZ2V0RWxlbWVudFRyYW5zZm9ybXModCkgfSB9O1xuICB9KTtcbn1cblxuLy8gUHJvcGVydGllc1xuXG5mdW5jdGlvbiBub3JtYWxpemVQcm9wZXJ0eVR3ZWVucyhwcm9wLCB0d2VlblNldHRpbmdzKSB7XG4gIHZhciBzZXR0aW5ncyA9IGNsb25lT2JqZWN0KHR3ZWVuU2V0dGluZ3MpO1xuICAvLyBPdmVycmlkZSBkdXJhdGlvbiBpZiBlYXNpbmcgaXMgYSBzcHJpbmdcbiAgaWYgKC9ec3ByaW5nLy50ZXN0KHNldHRpbmdzLmVhc2luZykpIHsgc2V0dGluZ3MuZHVyYXRpb24gPSBzcHJpbmcoc2V0dGluZ3MuZWFzaW5nKTsgfVxuICBpZiAoaXMuYXJyKHByb3ApKSB7XG4gICAgdmFyIGwgPSBwcm9wLmxlbmd0aDtcbiAgICB2YXIgaXNGcm9tVG8gPSAobCA9PT0gMiAmJiAhaXMub2JqKHByb3BbMF0pKTtcbiAgICBpZiAoIWlzRnJvbVRvKSB7XG4gICAgICAvLyBEdXJhdGlvbiBkaXZpZGVkIGJ5IHRoZSBudW1iZXIgb2YgdHdlZW5zXG4gICAgICBpZiAoIWlzLmZuYyh0d2VlblNldHRpbmdzLmR1cmF0aW9uKSkgeyBzZXR0aW5ncy5kdXJhdGlvbiA9IHR3ZWVuU2V0dGluZ3MuZHVyYXRpb24gLyBsOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRyYW5zZm9ybSBbZnJvbSwgdG9dIHZhbHVlcyBzaG9ydGhhbmQgdG8gYSB2YWxpZCB0d2VlbiB2YWx1ZVxuICAgICAgcHJvcCA9IHt2YWx1ZTogcHJvcH07XG4gICAgfVxuICB9XG4gIHZhciBwcm9wQXJyYXkgPSBpcy5hcnIocHJvcCkgPyBwcm9wIDogW3Byb3BdO1xuICByZXR1cm4gcHJvcEFycmF5Lm1hcChmdW5jdGlvbiAodiwgaSkge1xuICAgIHZhciBvYmogPSAoaXMub2JqKHYpICYmICFpcy5wdGgodikpID8gdiA6IHt2YWx1ZTogdn07XG4gICAgLy8gRGVmYXVsdCBkZWxheSB2YWx1ZSBzaG91bGQgb25seSBiZSBhcHBsaWVkIHRvIHRoZSBmaXJzdCB0d2VlblxuICAgIGlmIChpcy51bmQob2JqLmRlbGF5KSkgeyBvYmouZGVsYXkgPSAhaSA/IHR3ZWVuU2V0dGluZ3MuZGVsYXkgOiAwOyB9XG4gICAgLy8gRGVmYXVsdCBlbmREZWxheSB2YWx1ZSBzaG91bGQgb25seSBiZSBhcHBsaWVkIHRvIHRoZSBsYXN0IHR3ZWVuXG4gICAgaWYgKGlzLnVuZChvYmouZW5kRGVsYXkpKSB7IG9iai5lbmREZWxheSA9IGkgPT09IHByb3BBcnJheS5sZW5ndGggLSAxID8gdHdlZW5TZXR0aW5ncy5lbmREZWxheSA6IDA7IH1cbiAgICByZXR1cm4gb2JqO1xuICB9KS5tYXAoZnVuY3Rpb24gKGspIHsgcmV0dXJuIG1lcmdlT2JqZWN0cyhrLCBzZXR0aW5ncyk7IH0pO1xufVxuXG5cbmZ1bmN0aW9uIGZsYXR0ZW5LZXlmcmFtZXMoa2V5ZnJhbWVzKSB7XG4gIHZhciBwcm9wZXJ0eU5hbWVzID0gZmlsdGVyQXJyYXkoZmxhdHRlbkFycmF5KGtleWZyYW1lcy5tYXAoZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gT2JqZWN0LmtleXMoa2V5KTsgfSkpLCBmdW5jdGlvbiAocCkgeyByZXR1cm4gaXMua2V5KHApOyB9KVxuICAucmVkdWNlKGZ1bmN0aW9uIChhLGIpIHsgaWYgKGEuaW5kZXhPZihiKSA8IDApIHsgYS5wdXNoKGIpOyB9IHJldHVybiBhOyB9LCBbXSk7XG4gIHZhciBwcm9wZXJ0aWVzID0ge307XG4gIHZhciBsb29wID0gZnVuY3Rpb24gKCBpICkge1xuICAgIHZhciBwcm9wTmFtZSA9IHByb3BlcnR5TmFtZXNbaV07XG4gICAgcHJvcGVydGllc1twcm9wTmFtZV0gPSBrZXlmcmFtZXMubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIHZhciBuZXdLZXkgPSB7fTtcbiAgICAgIGZvciAodmFyIHAgaW4ga2V5KSB7XG4gICAgICAgIGlmIChpcy5rZXkocCkpIHtcbiAgICAgICAgICBpZiAocCA9PSBwcm9wTmFtZSkgeyBuZXdLZXkudmFsdWUgPSBrZXlbcF07IH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdLZXlbcF0gPSBrZXlbcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXdLZXk7XG4gICAgfSk7XG4gIH07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wZXJ0eU5hbWVzLmxlbmd0aDsgaSsrKSBsb29wKCBpICk7XG4gIHJldHVybiBwcm9wZXJ0aWVzO1xufVxuXG5mdW5jdGlvbiBnZXRQcm9wZXJ0aWVzKHR3ZWVuU2V0dGluZ3MsIHBhcmFtcykge1xuICB2YXIgcHJvcGVydGllcyA9IFtdO1xuICB2YXIga2V5ZnJhbWVzID0gcGFyYW1zLmtleWZyYW1lcztcbiAgaWYgKGtleWZyYW1lcykgeyBwYXJhbXMgPSBtZXJnZU9iamVjdHMoZmxhdHRlbktleWZyYW1lcyhrZXlmcmFtZXMpLCBwYXJhbXMpOyB9XG4gIGZvciAodmFyIHAgaW4gcGFyYW1zKSB7XG4gICAgaWYgKGlzLmtleShwKSkge1xuICAgICAgcHJvcGVydGllcy5wdXNoKHtcbiAgICAgICAgbmFtZTogcCxcbiAgICAgICAgdHdlZW5zOiBub3JtYWxpemVQcm9wZXJ0eVR3ZWVucyhwYXJhbXNbcF0sIHR3ZWVuU2V0dGluZ3MpXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cbi8vIFR3ZWVuc1xuXG5mdW5jdGlvbiBub3JtYWxpemVUd2VlblZhbHVlcyh0d2VlbiwgYW5pbWF0YWJsZSkge1xuICB2YXIgdCA9IHt9O1xuICBmb3IgKHZhciBwIGluIHR3ZWVuKSB7XG4gICAgdmFyIHZhbHVlID0gZ2V0RnVuY3Rpb25WYWx1ZSh0d2VlbltwXSwgYW5pbWF0YWJsZSk7XG4gICAgaWYgKGlzLmFycih2YWx1ZSkpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUubWFwKGZ1bmN0aW9uICh2KSB7IHJldHVybiBnZXRGdW5jdGlvblZhbHVlKHYsIGFuaW1hdGFibGUpOyB9KTtcbiAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDEpIHsgdmFsdWUgPSB2YWx1ZVswXTsgfVxuICAgIH1cbiAgICB0W3BdID0gdmFsdWU7XG4gIH1cbiAgdC5kdXJhdGlvbiA9IHBhcnNlRmxvYXQodC5kdXJhdGlvbik7XG4gIHQuZGVsYXkgPSBwYXJzZUZsb2F0KHQuZGVsYXkpO1xuICByZXR1cm4gdDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVHdlZW5zKHByb3AsIGFuaW1hdGFibGUpIHtcbiAgdmFyIHByZXZpb3VzVHdlZW47XG4gIHJldHVybiBwcm9wLnR3ZWVucy5tYXAoZnVuY3Rpb24gKHQpIHtcbiAgICB2YXIgdHdlZW4gPSBub3JtYWxpemVUd2VlblZhbHVlcyh0LCBhbmltYXRhYmxlKTtcbiAgICB2YXIgdHdlZW5WYWx1ZSA9IHR3ZWVuLnZhbHVlO1xuICAgIHZhciB0byA9IGlzLmFycih0d2VlblZhbHVlKSA/IHR3ZWVuVmFsdWVbMV0gOiB0d2VlblZhbHVlO1xuICAgIHZhciB0b1VuaXQgPSBnZXRVbml0KHRvKTtcbiAgICB2YXIgb3JpZ2luYWxWYWx1ZSA9IGdldE9yaWdpbmFsVGFyZ2V0VmFsdWUoYW5pbWF0YWJsZS50YXJnZXQsIHByb3AubmFtZSwgdG9Vbml0LCBhbmltYXRhYmxlKTtcbiAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IHByZXZpb3VzVHdlZW4gPyBwcmV2aW91c1R3ZWVuLnRvLm9yaWdpbmFsIDogb3JpZ2luYWxWYWx1ZTtcbiAgICB2YXIgZnJvbSA9IGlzLmFycih0d2VlblZhbHVlKSA/IHR3ZWVuVmFsdWVbMF0gOiBwcmV2aW91c1ZhbHVlO1xuICAgIHZhciBmcm9tVW5pdCA9IGdldFVuaXQoZnJvbSkgfHwgZ2V0VW5pdChvcmlnaW5hbFZhbHVlKTtcbiAgICB2YXIgdW5pdCA9IHRvVW5pdCB8fCBmcm9tVW5pdDtcbiAgICBpZiAoaXMudW5kKHRvKSkgeyB0byA9IHByZXZpb3VzVmFsdWU7IH1cbiAgICB0d2Vlbi5mcm9tID0gZGVjb21wb3NlVmFsdWUoZnJvbSwgdW5pdCk7XG4gICAgdHdlZW4udG8gPSBkZWNvbXBvc2VWYWx1ZShnZXRSZWxhdGl2ZVZhbHVlKHRvLCBmcm9tKSwgdW5pdCk7XG4gICAgdHdlZW4uc3RhcnQgPSBwcmV2aW91c1R3ZWVuID8gcHJldmlvdXNUd2Vlbi5lbmQgOiAwO1xuICAgIHR3ZWVuLmVuZCA9IHR3ZWVuLnN0YXJ0ICsgdHdlZW4uZGVsYXkgKyB0d2Vlbi5kdXJhdGlvbiArIHR3ZWVuLmVuZERlbGF5O1xuICAgIHR3ZWVuLmVhc2luZyA9IHBhcnNlRWFzaW5ncyh0d2Vlbi5lYXNpbmcsIHR3ZWVuLmR1cmF0aW9uKTtcbiAgICB0d2Vlbi5pc1BhdGggPSBpcy5wdGgodHdlZW5WYWx1ZSk7XG4gICAgdHdlZW4uaXNQYXRoVGFyZ2V0SW5zaWRlU1ZHID0gdHdlZW4uaXNQYXRoICYmIGlzLnN2ZyhhbmltYXRhYmxlLnRhcmdldCk7XG4gICAgdHdlZW4uaXNDb2xvciA9IGlzLmNvbCh0d2Vlbi5mcm9tLm9yaWdpbmFsKTtcbiAgICBpZiAodHdlZW4uaXNDb2xvcikgeyB0d2Vlbi5yb3VuZCA9IDE7IH1cbiAgICBwcmV2aW91c1R3ZWVuID0gdHdlZW47XG4gICAgcmV0dXJuIHR3ZWVuO1xuICB9KTtcbn1cblxuLy8gVHdlZW4gcHJvZ3Jlc3NcblxudmFyIHNldFByb2dyZXNzVmFsdWUgPSB7XG4gIGNzczogZnVuY3Rpb24gKHQsIHAsIHYpIHsgcmV0dXJuIHQuc3R5bGVbcF0gPSB2OyB9LFxuICBhdHRyaWJ1dGU6IGZ1bmN0aW9uICh0LCBwLCB2KSB7IHJldHVybiB0LnNldEF0dHJpYnV0ZShwLCB2KTsgfSxcbiAgb2JqZWN0OiBmdW5jdGlvbiAodCwgcCwgdikgeyByZXR1cm4gdFtwXSA9IHY7IH0sXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24gKHQsIHAsIHYsIHRyYW5zZm9ybXMsIG1hbnVhbCkge1xuICAgIHRyYW5zZm9ybXMubGlzdC5zZXQocCwgdik7XG4gICAgaWYgKHAgPT09IHRyYW5zZm9ybXMubGFzdCB8fCBtYW51YWwpIHtcbiAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgIHRyYW5zZm9ybXMubGlzdC5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgcHJvcCkgeyBzdHIgKz0gcHJvcCArIFwiKFwiICsgdmFsdWUgKyBcIikgXCI7IH0pO1xuICAgICAgdC5zdHlsZS50cmFuc2Zvcm0gPSBzdHI7XG4gICAgfVxuICB9XG59O1xuXG4vLyBTZXQgVmFsdWUgaGVscGVyXG5cbmZ1bmN0aW9uIHNldFRhcmdldHNWYWx1ZSh0YXJnZXRzLCBwcm9wZXJ0aWVzKSB7XG4gIHZhciBhbmltYXRhYmxlcyA9IGdldEFuaW1hdGFibGVzKHRhcmdldHMpO1xuICBhbmltYXRhYmxlcy5mb3JFYWNoKGZ1bmN0aW9uIChhbmltYXRhYmxlKSB7XG4gICAgZm9yICh2YXIgcHJvcGVydHkgaW4gcHJvcGVydGllcykge1xuICAgICAgdmFyIHZhbHVlID0gZ2V0RnVuY3Rpb25WYWx1ZShwcm9wZXJ0aWVzW3Byb3BlcnR5XSwgYW5pbWF0YWJsZSk7XG4gICAgICB2YXIgdGFyZ2V0ID0gYW5pbWF0YWJsZS50YXJnZXQ7XG4gICAgICB2YXIgdmFsdWVVbml0ID0gZ2V0VW5pdCh2YWx1ZSk7XG4gICAgICB2YXIgb3JpZ2luYWxWYWx1ZSA9IGdldE9yaWdpbmFsVGFyZ2V0VmFsdWUodGFyZ2V0LCBwcm9wZXJ0eSwgdmFsdWVVbml0LCBhbmltYXRhYmxlKTtcbiAgICAgIHZhciB1bml0ID0gdmFsdWVVbml0IHx8IGdldFVuaXQob3JpZ2luYWxWYWx1ZSk7XG4gICAgICB2YXIgdG8gPSBnZXRSZWxhdGl2ZVZhbHVlKHZhbGlkYXRlVmFsdWUodmFsdWUsIHVuaXQpLCBvcmlnaW5hbFZhbHVlKTtcbiAgICAgIHZhciBhbmltVHlwZSA9IGdldEFuaW1hdGlvblR5cGUodGFyZ2V0LCBwcm9wZXJ0eSk7XG4gICAgICBzZXRQcm9ncmVzc1ZhbHVlW2FuaW1UeXBlXSh0YXJnZXQsIHByb3BlcnR5LCB0bywgYW5pbWF0YWJsZS50cmFuc2Zvcm1zLCB0cnVlKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBBbmltYXRpb25zXG5cbmZ1bmN0aW9uIGNyZWF0ZUFuaW1hdGlvbihhbmltYXRhYmxlLCBwcm9wKSB7XG4gIHZhciBhbmltVHlwZSA9IGdldEFuaW1hdGlvblR5cGUoYW5pbWF0YWJsZS50YXJnZXQsIHByb3AubmFtZSk7XG4gIGlmIChhbmltVHlwZSkge1xuICAgIHZhciB0d2VlbnMgPSBub3JtYWxpemVUd2VlbnMocHJvcCwgYW5pbWF0YWJsZSk7XG4gICAgdmFyIGxhc3RUd2VlbiA9IHR3ZWVuc1t0d2VlbnMubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IGFuaW1UeXBlLFxuICAgICAgcHJvcGVydHk6IHByb3AubmFtZSxcbiAgICAgIGFuaW1hdGFibGU6IGFuaW1hdGFibGUsXG4gICAgICB0d2VlbnM6IHR3ZWVucyxcbiAgICAgIGR1cmF0aW9uOiBsYXN0VHdlZW4uZW5kLFxuICAgICAgZGVsYXk6IHR3ZWVuc1swXS5kZWxheSxcbiAgICAgIGVuZERlbGF5OiBsYXN0VHdlZW4uZW5kRGVsYXlcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0QW5pbWF0aW9ucyhhbmltYXRhYmxlcywgcHJvcGVydGllcykge1xuICByZXR1cm4gZmlsdGVyQXJyYXkoZmxhdHRlbkFycmF5KGFuaW1hdGFibGVzLm1hcChmdW5jdGlvbiAoYW5pbWF0YWJsZSkge1xuICAgIHJldHVybiBwcm9wZXJ0aWVzLm1hcChmdW5jdGlvbiAocHJvcCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUFuaW1hdGlvbihhbmltYXRhYmxlLCBwcm9wKTtcbiAgICB9KTtcbiAgfSkpLCBmdW5jdGlvbiAoYSkgeyByZXR1cm4gIWlzLnVuZChhKTsgfSk7XG59XG5cbi8vIENyZWF0ZSBJbnN0YW5jZVxuXG5mdW5jdGlvbiBnZXRJbnN0YW5jZVRpbWluZ3MoYW5pbWF0aW9ucywgdHdlZW5TZXR0aW5ncykge1xuICB2YXIgYW5pbUxlbmd0aCA9IGFuaW1hdGlvbnMubGVuZ3RoO1xuICB2YXIgZ2V0VGxPZmZzZXQgPSBmdW5jdGlvbiAoYW5pbSkgeyByZXR1cm4gYW5pbS50aW1lbGluZU9mZnNldCA/IGFuaW0udGltZWxpbmVPZmZzZXQgOiAwOyB9O1xuICB2YXIgdGltaW5ncyA9IHt9O1xuICB0aW1pbmdzLmR1cmF0aW9uID0gYW5pbUxlbmd0aCA/IE1hdGgubWF4LmFwcGx5KE1hdGgsIGFuaW1hdGlvbnMubWFwKGZ1bmN0aW9uIChhbmltKSB7IHJldHVybiBnZXRUbE9mZnNldChhbmltKSArIGFuaW0uZHVyYXRpb247IH0pKSA6IHR3ZWVuU2V0dGluZ3MuZHVyYXRpb247XG4gIHRpbWluZ3MuZGVsYXkgPSBhbmltTGVuZ3RoID8gTWF0aC5taW4uYXBwbHkoTWF0aCwgYW5pbWF0aW9ucy5tYXAoZnVuY3Rpb24gKGFuaW0pIHsgcmV0dXJuIGdldFRsT2Zmc2V0KGFuaW0pICsgYW5pbS5kZWxheTsgfSkpIDogdHdlZW5TZXR0aW5ncy5kZWxheTtcbiAgdGltaW5ncy5lbmREZWxheSA9IGFuaW1MZW5ndGggPyB0aW1pbmdzLmR1cmF0aW9uIC0gTWF0aC5tYXguYXBwbHkoTWF0aCwgYW5pbWF0aW9ucy5tYXAoZnVuY3Rpb24gKGFuaW0pIHsgcmV0dXJuIGdldFRsT2Zmc2V0KGFuaW0pICsgYW5pbS5kdXJhdGlvbiAtIGFuaW0uZW5kRGVsYXk7IH0pKSA6IHR3ZWVuU2V0dGluZ3MuZW5kRGVsYXk7XG4gIHJldHVybiB0aW1pbmdzO1xufVxuXG52YXIgaW5zdGFuY2VJRCA9IDA7XG5cbmZ1bmN0aW9uIGNyZWF0ZU5ld0luc3RhbmNlKHBhcmFtcykge1xuICB2YXIgaW5zdGFuY2VTZXR0aW5ncyA9IHJlcGxhY2VPYmplY3RQcm9wcyhkZWZhdWx0SW5zdGFuY2VTZXR0aW5ncywgcGFyYW1zKTtcbiAgdmFyIHR3ZWVuU2V0dGluZ3MgPSByZXBsYWNlT2JqZWN0UHJvcHMoZGVmYXVsdFR3ZWVuU2V0dGluZ3MsIHBhcmFtcyk7XG4gIHZhciBwcm9wZXJ0aWVzID0gZ2V0UHJvcGVydGllcyh0d2VlblNldHRpbmdzLCBwYXJhbXMpO1xuICB2YXIgYW5pbWF0YWJsZXMgPSBnZXRBbmltYXRhYmxlcyhwYXJhbXMudGFyZ2V0cyk7XG4gIHZhciBhbmltYXRpb25zID0gZ2V0QW5pbWF0aW9ucyhhbmltYXRhYmxlcywgcHJvcGVydGllcyk7XG4gIHZhciB0aW1pbmdzID0gZ2V0SW5zdGFuY2VUaW1pbmdzKGFuaW1hdGlvbnMsIHR3ZWVuU2V0dGluZ3MpO1xuICB2YXIgaWQgPSBpbnN0YW5jZUlEO1xuICBpbnN0YW5jZUlEKys7XG4gIHJldHVybiBtZXJnZU9iamVjdHMoaW5zdGFuY2VTZXR0aW5ncywge1xuICAgIGlkOiBpZCxcbiAgICBjaGlsZHJlbjogW10sXG4gICAgYW5pbWF0YWJsZXM6IGFuaW1hdGFibGVzLFxuICAgIGFuaW1hdGlvbnM6IGFuaW1hdGlvbnMsXG4gICAgZHVyYXRpb246IHRpbWluZ3MuZHVyYXRpb24sXG4gICAgZGVsYXk6IHRpbWluZ3MuZGVsYXksXG4gICAgZW5kRGVsYXk6IHRpbWluZ3MuZW5kRGVsYXlcbiAgfSk7XG59XG5cbi8vIENvcmVcblxudmFyIGFjdGl2ZUluc3RhbmNlcyA9IFtdO1xuXG52YXIgZW5naW5lID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJhZjtcblxuICBmdW5jdGlvbiBwbGF5KCkge1xuICAgIGlmICghcmFmICYmICghaXNEb2N1bWVudEhpZGRlbigpIHx8ICFhbmltZS5zdXNwZW5kV2hlbkRvY3VtZW50SGlkZGVuKSAmJiBhY3RpdmVJbnN0YW5jZXMubGVuZ3RoID4gMCkge1xuICAgICAgcmFmID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHN0ZXApO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBzdGVwKHQpIHtcbiAgICAvLyBtZW1vIG9uIGFsZ29yaXRobSBpc3N1ZTpcbiAgICAvLyBkYW5nZXJvdXMgaXRlcmF0aW9uIG92ZXIgbXV0YWJsZSBgYWN0aXZlSW5zdGFuY2VzYFxuICAgIC8vICh0aGF0IGNvbGxlY3Rpb24gbWF5IGJlIHVwZGF0ZWQgZnJvbSB3aXRoaW4gY2FsbGJhY2tzIG9mIGB0aWNrYC1lZCBhbmltYXRpb24gaW5zdGFuY2VzKVxuICAgIHZhciBhY3RpdmVJbnN0YW5jZXNMZW5ndGggPSBhY3RpdmVJbnN0YW5jZXMubGVuZ3RoO1xuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGFjdGl2ZUluc3RhbmNlc0xlbmd0aCkge1xuICAgICAgdmFyIGFjdGl2ZUluc3RhbmNlID0gYWN0aXZlSW5zdGFuY2VzW2ldO1xuICAgICAgaWYgKCFhY3RpdmVJbnN0YW5jZS5wYXVzZWQpIHtcbiAgICAgICAgYWN0aXZlSW5zdGFuY2UudGljayh0KTtcbiAgICAgICAgaSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWN0aXZlSW5zdGFuY2VzLnNwbGljZShpLCAxKTtcbiAgICAgICAgYWN0aXZlSW5zdGFuY2VzTGVuZ3RoLS07XG4gICAgICB9XG4gICAgfVxuICAgIHJhZiA9IGkgPiAwID8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHN0ZXApIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSgpIHtcbiAgICBpZiAoIWFuaW1lLnN1c3BlbmRXaGVuRG9jdW1lbnRIaWRkZW4pIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAoaXNEb2N1bWVudEhpZGRlbigpKSB7XG4gICAgICAvLyBzdXNwZW5kIHRpY2tzXG4gICAgICByYWYgPSBjYW5jZWxBbmltYXRpb25GcmFtZShyYWYpO1xuICAgIH0gZWxzZSB7IC8vIGlzIGJhY2sgdG8gYWN0aXZlIHRhYlxuICAgICAgLy8gZmlyc3QgYWRqdXN0IGFuaW1hdGlvbnMgdG8gY29uc2lkZXIgdGhlIHRpbWUgdGhhdCB0aWNrcyB3ZXJlIHN1c3BlbmRlZFxuICAgICAgYWN0aXZlSW5zdGFuY2VzLmZvckVhY2goXG4gICAgICAgIGZ1bmN0aW9uIChpbnN0YW5jZSkgeyByZXR1cm4gaW5zdGFuY2UgLl9vbkRvY3VtZW50VmlzaWJpbGl0eSgpOyB9XG4gICAgICApO1xuICAgICAgZW5naW5lKCk7XG4gICAgfVxuICB9XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UpO1xuICB9XG5cbiAgcmV0dXJuIHBsYXk7XG59KSgpO1xuXG5mdW5jdGlvbiBpc0RvY3VtZW50SGlkZGVuKCkge1xuICByZXR1cm4gISFkb2N1bWVudCAmJiBkb2N1bWVudC5oaWRkZW47XG59XG5cbi8vIFB1YmxpYyBJbnN0YW5jZVxuXG5mdW5jdGlvbiBhbmltZShwYXJhbXMpIHtcbiAgaWYgKCBwYXJhbXMgPT09IHZvaWQgMCApIHBhcmFtcyA9IHt9O1xuXG5cbiAgdmFyIHN0YXJ0VGltZSA9IDAsIGxhc3RUaW1lID0gMCwgbm93ID0gMDtcbiAgdmFyIGNoaWxkcmVuLCBjaGlsZHJlbkxlbmd0aCA9IDA7XG4gIHZhciByZXNvbHZlID0gbnVsbDtcblxuICBmdW5jdGlvbiBtYWtlUHJvbWlzZShpbnN0YW5jZSkge1xuICAgIHZhciBwcm9taXNlID0gd2luZG93LlByb21pc2UgJiYgbmV3IFByb21pc2UoZnVuY3Rpb24gKF9yZXNvbHZlKSB7IHJldHVybiByZXNvbHZlID0gX3Jlc29sdmU7IH0pO1xuICAgIGluc3RhbmNlLmZpbmlzaGVkID0gcHJvbWlzZTtcbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIHZhciBpbnN0YW5jZSA9IGNyZWF0ZU5ld0luc3RhbmNlKHBhcmFtcyk7XG4gIHZhciBwcm9taXNlID0gbWFrZVByb21pc2UoaW5zdGFuY2UpO1xuXG4gIGZ1bmN0aW9uIHRvZ2dsZUluc3RhbmNlRGlyZWN0aW9uKCkge1xuICAgIHZhciBkaXJlY3Rpb24gPSBpbnN0YW5jZS5kaXJlY3Rpb247XG4gICAgaWYgKGRpcmVjdGlvbiAhPT0gJ2FsdGVybmF0ZScpIHtcbiAgICAgIGluc3RhbmNlLmRpcmVjdGlvbiA9IGRpcmVjdGlvbiAhPT0gJ25vcm1hbCcgPyAnbm9ybWFsJyA6ICdyZXZlcnNlJztcbiAgICB9XG4gICAgaW5zdGFuY2UucmV2ZXJzZWQgPSAhaW5zdGFuY2UucmV2ZXJzZWQ7XG4gICAgY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHsgcmV0dXJuIGNoaWxkLnJldmVyc2VkID0gaW5zdGFuY2UucmV2ZXJzZWQ7IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYWRqdXN0VGltZSh0aW1lKSB7XG4gICAgcmV0dXJuIGluc3RhbmNlLnJldmVyc2VkID8gaW5zdGFuY2UuZHVyYXRpb24gLSB0aW1lIDogdGltZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc2V0VGltZSgpIHtcbiAgICBzdGFydFRpbWUgPSAwO1xuICAgIGxhc3RUaW1lID0gYWRqdXN0VGltZShpbnN0YW5jZS5jdXJyZW50VGltZSkgKiAoMSAvIGFuaW1lLnNwZWVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlZWtDaGlsZCh0aW1lLCBjaGlsZCkge1xuICAgIGlmIChjaGlsZCkgeyBjaGlsZC5zZWVrKHRpbWUgLSBjaGlsZC50aW1lbGluZU9mZnNldCk7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN5bmNJbnN0YW5jZUNoaWxkcmVuKHRpbWUpIHtcbiAgICBpZiAoIWluc3RhbmNlLnJldmVyc2VQbGF5YmFjaykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbkxlbmd0aDsgaSsrKSB7IHNlZWtDaGlsZCh0aW1lLCBjaGlsZHJlbltpXSk7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSQxID0gY2hpbGRyZW5MZW5ndGg7IGkkMS0tOykgeyBzZWVrQ2hpbGQodGltZSwgY2hpbGRyZW5baSQxXSk7IH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXRBbmltYXRpb25zUHJvZ3Jlc3MoaW5zVGltZSkge1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgYW5pbWF0aW9ucyA9IGluc3RhbmNlLmFuaW1hdGlvbnM7XG4gICAgdmFyIGFuaW1hdGlvbnNMZW5ndGggPSBhbmltYXRpb25zLmxlbmd0aDtcbiAgICB3aGlsZSAoaSA8IGFuaW1hdGlvbnNMZW5ndGgpIHtcbiAgICAgIHZhciBhbmltID0gYW5pbWF0aW9uc1tpXTtcbiAgICAgIHZhciBhbmltYXRhYmxlID0gYW5pbS5hbmltYXRhYmxlO1xuICAgICAgdmFyIHR3ZWVucyA9IGFuaW0udHdlZW5zO1xuICAgICAgdmFyIHR3ZWVuTGVuZ3RoID0gdHdlZW5zLmxlbmd0aCAtIDE7XG4gICAgICB2YXIgdHdlZW4gPSB0d2VlbnNbdHdlZW5MZW5ndGhdO1xuICAgICAgLy8gT25seSBjaGVjayBmb3Iga2V5ZnJhbWVzIGlmIHRoZXJlIGlzIG1vcmUgdGhhbiBvbmUgdHdlZW5cbiAgICAgIGlmICh0d2Vlbkxlbmd0aCkgeyB0d2VlbiA9IGZpbHRlckFycmF5KHR3ZWVucywgZnVuY3Rpb24gKHQpIHsgcmV0dXJuIChpbnNUaW1lIDwgdC5lbmQpOyB9KVswXSB8fCB0d2VlbjsgfVxuICAgICAgdmFyIGVsYXBzZWQgPSBtaW5NYXgoaW5zVGltZSAtIHR3ZWVuLnN0YXJ0IC0gdHdlZW4uZGVsYXksIDAsIHR3ZWVuLmR1cmF0aW9uKSAvIHR3ZWVuLmR1cmF0aW9uO1xuICAgICAgdmFyIGVhc2VkID0gaXNOYU4oZWxhcHNlZCkgPyAxIDogdHdlZW4uZWFzaW5nKGVsYXBzZWQpO1xuICAgICAgdmFyIHN0cmluZ3MgPSB0d2Vlbi50by5zdHJpbmdzO1xuICAgICAgdmFyIHJvdW5kID0gdHdlZW4ucm91bmQ7XG4gICAgICB2YXIgbnVtYmVycyA9IFtdO1xuICAgICAgdmFyIHRvTnVtYmVyc0xlbmd0aCA9IHR3ZWVuLnRvLm51bWJlcnMubGVuZ3RoO1xuICAgICAgdmFyIHByb2dyZXNzID0gKHZvaWQgMCk7XG4gICAgICBmb3IgKHZhciBuID0gMDsgbiA8IHRvTnVtYmVyc0xlbmd0aDsgbisrKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9ICh2b2lkIDApO1xuICAgICAgICB2YXIgdG9OdW1iZXIgPSB0d2Vlbi50by5udW1iZXJzW25dO1xuICAgICAgICB2YXIgZnJvbU51bWJlciA9IHR3ZWVuLmZyb20ubnVtYmVyc1tuXSB8fCAwO1xuICAgICAgICBpZiAoIXR3ZWVuLmlzUGF0aCkge1xuICAgICAgICAgIHZhbHVlID0gZnJvbU51bWJlciArIChlYXNlZCAqICh0b051bWJlciAtIGZyb21OdW1iZXIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA9IGdldFBhdGhQcm9ncmVzcyh0d2Vlbi52YWx1ZSwgZWFzZWQgKiB0b051bWJlciwgdHdlZW4uaXNQYXRoVGFyZ2V0SW5zaWRlU1ZHKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocm91bmQpIHtcbiAgICAgICAgICBpZiAoISh0d2Vlbi5pc0NvbG9yICYmIG4gPiAyKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBNYXRoLnJvdW5kKHZhbHVlICogcm91bmQpIC8gcm91bmQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG51bWJlcnMucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgICAvLyBNYW51YWwgQXJyYXkucmVkdWNlIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VzXG4gICAgICB2YXIgc3RyaW5nc0xlbmd0aCA9IHN0cmluZ3MubGVuZ3RoO1xuICAgICAgaWYgKCFzdHJpbmdzTGVuZ3RoKSB7XG4gICAgICAgIHByb2dyZXNzID0gbnVtYmVyc1swXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByb2dyZXNzID0gc3RyaW5nc1swXTtcbiAgICAgICAgZm9yICh2YXIgcyA9IDA7IHMgPCBzdHJpbmdzTGVuZ3RoOyBzKyspIHtcbiAgICAgICAgICB2YXIgYSA9IHN0cmluZ3Nbc107XG4gICAgICAgICAgdmFyIGIgPSBzdHJpbmdzW3MgKyAxXTtcbiAgICAgICAgICB2YXIgbiQxID0gbnVtYmVyc1tzXTtcbiAgICAgICAgICBpZiAoIWlzTmFOKG4kMSkpIHtcbiAgICAgICAgICAgIGlmICghYikge1xuICAgICAgICAgICAgICBwcm9ncmVzcyArPSBuJDEgKyAnICc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwcm9ncmVzcyArPSBuJDEgKyBiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2V0UHJvZ3Jlc3NWYWx1ZVthbmltLnR5cGVdKGFuaW1hdGFibGUudGFyZ2V0LCBhbmltLnByb3BlcnR5LCBwcm9ncmVzcywgYW5pbWF0YWJsZS50cmFuc2Zvcm1zKTtcbiAgICAgIGFuaW0uY3VycmVudFZhbHVlID0gcHJvZ3Jlc3M7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0Q2FsbGJhY2soY2IpIHtcbiAgICBpZiAoaW5zdGFuY2VbY2JdICYmICFpbnN0YW5jZS5wYXNzVGhyb3VnaCkgeyBpbnN0YW5jZVtjYl0oaW5zdGFuY2UpOyB9XG4gIH1cblxuICBmdW5jdGlvbiBjb3VudEl0ZXJhdGlvbigpIHtcbiAgICBpZiAoaW5zdGFuY2UucmVtYWluaW5nICYmIGluc3RhbmNlLnJlbWFpbmluZyAhPT0gdHJ1ZSkge1xuICAgICAgaW5zdGFuY2UucmVtYWluaW5nLS07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0SW5zdGFuY2VQcm9ncmVzcyhlbmdpbmVUaW1lKSB7XG4gICAgdmFyIGluc0R1cmF0aW9uID0gaW5zdGFuY2UuZHVyYXRpb247XG4gICAgdmFyIGluc0RlbGF5ID0gaW5zdGFuY2UuZGVsYXk7XG4gICAgdmFyIGluc0VuZERlbGF5ID0gaW5zRHVyYXRpb24gLSBpbnN0YW5jZS5lbmREZWxheTtcbiAgICB2YXIgaW5zVGltZSA9IGFkanVzdFRpbWUoZW5naW5lVGltZSk7XG4gICAgaW5zdGFuY2UucHJvZ3Jlc3MgPSBtaW5NYXgoKGluc1RpbWUgLyBpbnNEdXJhdGlvbikgKiAxMDAsIDAsIDEwMCk7XG4gICAgaW5zdGFuY2UucmV2ZXJzZVBsYXliYWNrID0gaW5zVGltZSA8IGluc3RhbmNlLmN1cnJlbnRUaW1lO1xuICAgIGlmIChjaGlsZHJlbikgeyBzeW5jSW5zdGFuY2VDaGlsZHJlbihpbnNUaW1lKTsgfVxuICAgIGlmICghaW5zdGFuY2UuYmVnYW4gJiYgaW5zdGFuY2UuY3VycmVudFRpbWUgPiAwKSB7XG4gICAgICBpbnN0YW5jZS5iZWdhbiA9IHRydWU7XG4gICAgICBzZXRDYWxsYmFjaygnYmVnaW4nKTtcbiAgICB9XG4gICAgaWYgKCFpbnN0YW5jZS5sb29wQmVnYW4gJiYgaW5zdGFuY2UuY3VycmVudFRpbWUgPiAwKSB7XG4gICAgICBpbnN0YW5jZS5sb29wQmVnYW4gPSB0cnVlO1xuICAgICAgc2V0Q2FsbGJhY2soJ2xvb3BCZWdpbicpO1xuICAgIH1cbiAgICBpZiAoaW5zVGltZSA8PSBpbnNEZWxheSAmJiBpbnN0YW5jZS5jdXJyZW50VGltZSAhPT0gMCkge1xuICAgICAgc2V0QW5pbWF0aW9uc1Byb2dyZXNzKDApO1xuICAgIH1cbiAgICBpZiAoKGluc1RpbWUgPj0gaW5zRW5kRGVsYXkgJiYgaW5zdGFuY2UuY3VycmVudFRpbWUgIT09IGluc0R1cmF0aW9uKSB8fCAhaW5zRHVyYXRpb24pIHtcbiAgICAgIHNldEFuaW1hdGlvbnNQcm9ncmVzcyhpbnNEdXJhdGlvbik7XG4gICAgfVxuICAgIGlmIChpbnNUaW1lID4gaW5zRGVsYXkgJiYgaW5zVGltZSA8IGluc0VuZERlbGF5KSB7XG4gICAgICBpZiAoIWluc3RhbmNlLmNoYW5nZUJlZ2FuKSB7XG4gICAgICAgIGluc3RhbmNlLmNoYW5nZUJlZ2FuID0gdHJ1ZTtcbiAgICAgICAgaW5zdGFuY2UuY2hhbmdlQ29tcGxldGVkID0gZmFsc2U7XG4gICAgICAgIHNldENhbGxiYWNrKCdjaGFuZ2VCZWdpbicpO1xuICAgICAgfVxuICAgICAgc2V0Q2FsbGJhY2soJ2NoYW5nZScpO1xuICAgICAgc2V0QW5pbWF0aW9uc1Byb2dyZXNzKGluc1RpbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaW5zdGFuY2UuY2hhbmdlQmVnYW4pIHtcbiAgICAgICAgaW5zdGFuY2UuY2hhbmdlQ29tcGxldGVkID0gdHJ1ZTtcbiAgICAgICAgaW5zdGFuY2UuY2hhbmdlQmVnYW4gPSBmYWxzZTtcbiAgICAgICAgc2V0Q2FsbGJhY2soJ2NoYW5nZUNvbXBsZXRlJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGluc3RhbmNlLmN1cnJlbnRUaW1lID0gbWluTWF4KGluc1RpbWUsIDAsIGluc0R1cmF0aW9uKTtcbiAgICBpZiAoaW5zdGFuY2UuYmVnYW4pIHsgc2V0Q2FsbGJhY2soJ3VwZGF0ZScpOyB9XG4gICAgaWYgKGVuZ2luZVRpbWUgPj0gaW5zRHVyYXRpb24pIHtcbiAgICAgIGxhc3RUaW1lID0gMDtcbiAgICAgIGNvdW50SXRlcmF0aW9uKCk7XG4gICAgICBpZiAoIWluc3RhbmNlLnJlbWFpbmluZykge1xuICAgICAgICBpbnN0YW5jZS5wYXVzZWQgPSB0cnVlO1xuICAgICAgICBpZiAoIWluc3RhbmNlLmNvbXBsZXRlZCkge1xuICAgICAgICAgIGluc3RhbmNlLmNvbXBsZXRlZCA9IHRydWU7XG4gICAgICAgICAgc2V0Q2FsbGJhY2soJ2xvb3BDb21wbGV0ZScpO1xuICAgICAgICAgIHNldENhbGxiYWNrKCdjb21wbGV0ZScpO1xuICAgICAgICAgIGlmICghaW5zdGFuY2UucGFzc1Rocm91Z2ggJiYgJ1Byb21pc2UnIGluIHdpbmRvdykge1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgcHJvbWlzZSA9IG1ha2VQcm9taXNlKGluc3RhbmNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0VGltZSA9IG5vdztcbiAgICAgICAgc2V0Q2FsbGJhY2soJ2xvb3BDb21wbGV0ZScpO1xuICAgICAgICBpbnN0YW5jZS5sb29wQmVnYW4gPSBmYWxzZTtcbiAgICAgICAgaWYgKGluc3RhbmNlLmRpcmVjdGlvbiA9PT0gJ2FsdGVybmF0ZScpIHtcbiAgICAgICAgICB0b2dnbGVJbnN0YW5jZURpcmVjdGlvbigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaW5zdGFuY2UucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGlyZWN0aW9uID0gaW5zdGFuY2UuZGlyZWN0aW9uO1xuICAgIGluc3RhbmNlLnBhc3NUaHJvdWdoID0gZmFsc2U7XG4gICAgaW5zdGFuY2UuY3VycmVudFRpbWUgPSAwO1xuICAgIGluc3RhbmNlLnByb2dyZXNzID0gMDtcbiAgICBpbnN0YW5jZS5wYXVzZWQgPSB0cnVlO1xuICAgIGluc3RhbmNlLmJlZ2FuID0gZmFsc2U7XG4gICAgaW5zdGFuY2UubG9vcEJlZ2FuID0gZmFsc2U7XG4gICAgaW5zdGFuY2UuY2hhbmdlQmVnYW4gPSBmYWxzZTtcbiAgICBpbnN0YW5jZS5jb21wbGV0ZWQgPSBmYWxzZTtcbiAgICBpbnN0YW5jZS5jaGFuZ2VDb21wbGV0ZWQgPSBmYWxzZTtcbiAgICBpbnN0YW5jZS5yZXZlcnNlUGxheWJhY2sgPSBmYWxzZTtcbiAgICBpbnN0YW5jZS5yZXZlcnNlZCA9IGRpcmVjdGlvbiA9PT0gJ3JldmVyc2UnO1xuICAgIGluc3RhbmNlLnJlbWFpbmluZyA9IGluc3RhbmNlLmxvb3A7XG4gICAgY2hpbGRyZW4gPSBpbnN0YW5jZS5jaGlsZHJlbjtcbiAgICBjaGlsZHJlbkxlbmd0aCA9IGNoaWxkcmVuLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gY2hpbGRyZW5MZW5ndGg7IGktLTspIHsgaW5zdGFuY2UuY2hpbGRyZW5baV0ucmVzZXQoKTsgfVxuICAgIGlmIChpbnN0YW5jZS5yZXZlcnNlZCAmJiBpbnN0YW5jZS5sb29wICE9PSB0cnVlIHx8IChkaXJlY3Rpb24gPT09ICdhbHRlcm5hdGUnICYmIGluc3RhbmNlLmxvb3AgPT09IDEpKSB7IGluc3RhbmNlLnJlbWFpbmluZysrOyB9XG4gICAgc2V0QW5pbWF0aW9uc1Byb2dyZXNzKGluc3RhbmNlLnJldmVyc2VkID8gaW5zdGFuY2UuZHVyYXRpb24gOiAwKTtcbiAgfTtcblxuICAvLyBpbnRlcm5hbCBtZXRob2QgKGZvciBlbmdpbmUpIHRvIGFkanVzdCBhbmltYXRpb24gdGltaW5ncyBiZWZvcmUgcmVzdG9yaW5nIGVuZ2luZSB0aWNrcyAockFGKVxuICBpbnN0YW5jZS5fb25Eb2N1bWVudFZpc2liaWxpdHkgPSByZXNldFRpbWU7XG5cbiAgLy8gU2V0IFZhbHVlIGhlbHBlclxuXG4gIGluc3RhbmNlLnNldCA9IGZ1bmN0aW9uKHRhcmdldHMsIHByb3BlcnRpZXMpIHtcbiAgICBzZXRUYXJnZXRzVmFsdWUodGFyZ2V0cywgcHJvcGVydGllcyk7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9O1xuXG4gIGluc3RhbmNlLnRpY2sgPSBmdW5jdGlvbih0KSB7XG4gICAgbm93ID0gdDtcbiAgICBpZiAoIXN0YXJ0VGltZSkgeyBzdGFydFRpbWUgPSBub3c7IH1cbiAgICBzZXRJbnN0YW5jZVByb2dyZXNzKChub3cgKyAobGFzdFRpbWUgLSBzdGFydFRpbWUpKSAqIGFuaW1lLnNwZWVkKTtcbiAgfTtcblxuICBpbnN0YW5jZS5zZWVrID0gZnVuY3Rpb24odGltZSkge1xuICAgIHNldEluc3RhbmNlUHJvZ3Jlc3MoYWRqdXN0VGltZSh0aW1lKSk7XG4gIH07XG5cbiAgaW5zdGFuY2UucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICBpbnN0YW5jZS5wYXVzZWQgPSB0cnVlO1xuICAgIHJlc2V0VGltZSgpO1xuICB9O1xuXG4gIGluc3RhbmNlLnBsYXkgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWluc3RhbmNlLnBhdXNlZCkgeyByZXR1cm47IH1cbiAgICBpZiAoaW5zdGFuY2UuY29tcGxldGVkKSB7IGluc3RhbmNlLnJlc2V0KCk7IH1cbiAgICBpbnN0YW5jZS5wYXVzZWQgPSBmYWxzZTtcbiAgICBhY3RpdmVJbnN0YW5jZXMucHVzaChpbnN0YW5jZSk7XG4gICAgcmVzZXRUaW1lKCk7XG4gICAgZW5naW5lKCk7XG4gIH07XG5cbiAgaW5zdGFuY2UucmV2ZXJzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRvZ2dsZUluc3RhbmNlRGlyZWN0aW9uKCk7XG4gICAgaW5zdGFuY2UuY29tcGxldGVkID0gaW5zdGFuY2UucmV2ZXJzZWQgPyBmYWxzZSA6IHRydWU7XG4gICAgcmVzZXRUaW1lKCk7XG4gIH07XG5cbiAgaW5zdGFuY2UucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIGluc3RhbmNlLnJlc2V0KCk7XG4gICAgaW5zdGFuY2UucGxheSgpO1xuICB9O1xuXG4gIGluc3RhbmNlLnJlbW92ZSA9IGZ1bmN0aW9uKHRhcmdldHMpIHtcbiAgICB2YXIgdGFyZ2V0c0FycmF5ID0gcGFyc2VUYXJnZXRzKHRhcmdldHMpO1xuICAgIHJlbW92ZVRhcmdldHNGcm9tSW5zdGFuY2UodGFyZ2V0c0FycmF5LCBpbnN0YW5jZSk7XG4gIH07XG5cbiAgaW5zdGFuY2UucmVzZXQoKTtcblxuICBpZiAoaW5zdGFuY2UuYXV0b3BsYXkpIHsgaW5zdGFuY2UucGxheSgpOyB9XG5cbiAgcmV0dXJuIGluc3RhbmNlO1xuXG59XG5cbi8vIFJlbW92ZSB0YXJnZXRzIGZyb20gYW5pbWF0aW9uXG5cbmZ1bmN0aW9uIHJlbW92ZVRhcmdldHNGcm9tQW5pbWF0aW9ucyh0YXJnZXRzQXJyYXksIGFuaW1hdGlvbnMpIHtcbiAgZm9yICh2YXIgYSA9IGFuaW1hdGlvbnMubGVuZ3RoOyBhLS07KSB7XG4gICAgaWYgKGFycmF5Q29udGFpbnModGFyZ2V0c0FycmF5LCBhbmltYXRpb25zW2FdLmFuaW1hdGFibGUudGFyZ2V0KSkge1xuICAgICAgYW5pbWF0aW9ucy5zcGxpY2UoYSwgMSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVRhcmdldHNGcm9tSW5zdGFuY2UodGFyZ2V0c0FycmF5LCBpbnN0YW5jZSkge1xuICB2YXIgYW5pbWF0aW9ucyA9IGluc3RhbmNlLmFuaW1hdGlvbnM7XG4gIHZhciBjaGlsZHJlbiA9IGluc3RhbmNlLmNoaWxkcmVuO1xuICByZW1vdmVUYXJnZXRzRnJvbUFuaW1hdGlvbnModGFyZ2V0c0FycmF5LCBhbmltYXRpb25zKTtcbiAgZm9yICh2YXIgYyA9IGNoaWxkcmVuLmxlbmd0aDsgYy0tOykge1xuICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2NdO1xuICAgIHZhciBjaGlsZEFuaW1hdGlvbnMgPSBjaGlsZC5hbmltYXRpb25zO1xuICAgIHJlbW92ZVRhcmdldHNGcm9tQW5pbWF0aW9ucyh0YXJnZXRzQXJyYXksIGNoaWxkQW5pbWF0aW9ucyk7XG4gICAgaWYgKCFjaGlsZEFuaW1hdGlvbnMubGVuZ3RoICYmICFjaGlsZC5jaGlsZHJlbi5sZW5ndGgpIHsgY2hpbGRyZW4uc3BsaWNlKGMsIDEpOyB9XG4gIH1cbiAgaWYgKCFhbmltYXRpb25zLmxlbmd0aCAmJiAhY2hpbGRyZW4ubGVuZ3RoKSB7IGluc3RhbmNlLnBhdXNlKCk7IH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlVGFyZ2V0c0Zyb21BY3RpdmVJbnN0YW5jZXModGFyZ2V0cykge1xuICB2YXIgdGFyZ2V0c0FycmF5ID0gcGFyc2VUYXJnZXRzKHRhcmdldHMpO1xuICBmb3IgKHZhciBpID0gYWN0aXZlSW5zdGFuY2VzLmxlbmd0aDsgaS0tOykge1xuICAgIHZhciBpbnN0YW5jZSA9IGFjdGl2ZUluc3RhbmNlc1tpXTtcbiAgICByZW1vdmVUYXJnZXRzRnJvbUluc3RhbmNlKHRhcmdldHNBcnJheSwgaW5zdGFuY2UpO1xuICB9XG59XG5cbi8vIFN0YWdnZXIgaGVscGVyc1xuXG5mdW5jdGlvbiBzdGFnZ2VyKHZhbCwgcGFyYW1zKSB7XG4gIGlmICggcGFyYW1zID09PSB2b2lkIDAgKSBwYXJhbXMgPSB7fTtcblxuICB2YXIgZGlyZWN0aW9uID0gcGFyYW1zLmRpcmVjdGlvbiB8fCAnbm9ybWFsJztcbiAgdmFyIGVhc2luZyA9IHBhcmFtcy5lYXNpbmcgPyBwYXJzZUVhc2luZ3MocGFyYW1zLmVhc2luZykgOiBudWxsO1xuICB2YXIgZ3JpZCA9IHBhcmFtcy5ncmlkO1xuICB2YXIgYXhpcyA9IHBhcmFtcy5heGlzO1xuICB2YXIgZnJvbUluZGV4ID0gcGFyYW1zLmZyb20gfHwgMDtcbiAgdmFyIGZyb21GaXJzdCA9IGZyb21JbmRleCA9PT0gJ2ZpcnN0JztcbiAgdmFyIGZyb21DZW50ZXIgPSBmcm9tSW5kZXggPT09ICdjZW50ZXInO1xuICB2YXIgZnJvbUxhc3QgPSBmcm9tSW5kZXggPT09ICdsYXN0JztcbiAgdmFyIGlzUmFuZ2UgPSBpcy5hcnIodmFsKTtcbiAgdmFyIHZhbDEgPSBpc1JhbmdlID8gcGFyc2VGbG9hdCh2YWxbMF0pIDogcGFyc2VGbG9hdCh2YWwpO1xuICB2YXIgdmFsMiA9IGlzUmFuZ2UgPyBwYXJzZUZsb2F0KHZhbFsxXSkgOiAwO1xuICB2YXIgdW5pdCA9IGdldFVuaXQoaXNSYW5nZSA/IHZhbFsxXSA6IHZhbCkgfHwgMDtcbiAgdmFyIHN0YXJ0ID0gcGFyYW1zLnN0YXJ0IHx8IDAgKyAoaXNSYW5nZSA/IHZhbDEgOiAwKTtcbiAgdmFyIHZhbHVlcyA9IFtdO1xuICB2YXIgbWF4VmFsdWUgPSAwO1xuICByZXR1cm4gZnVuY3Rpb24gKGVsLCBpLCB0KSB7XG4gICAgaWYgKGZyb21GaXJzdCkgeyBmcm9tSW5kZXggPSAwOyB9XG4gICAgaWYgKGZyb21DZW50ZXIpIHsgZnJvbUluZGV4ID0gKHQgLSAxKSAvIDI7IH1cbiAgICBpZiAoZnJvbUxhc3QpIHsgZnJvbUluZGV4ID0gdCAtIDE7IH1cbiAgICBpZiAoIXZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0OyBpbmRleCsrKSB7XG4gICAgICAgIGlmICghZ3JpZCkge1xuICAgICAgICAgIHZhbHVlcy5wdXNoKE1hdGguYWJzKGZyb21JbmRleCAtIGluZGV4KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGZyb21YID0gIWZyb21DZW50ZXIgPyBmcm9tSW5kZXglZ3JpZFswXSA6IChncmlkWzBdLTEpLzI7XG4gICAgICAgICAgdmFyIGZyb21ZID0gIWZyb21DZW50ZXIgPyBNYXRoLmZsb29yKGZyb21JbmRleC9ncmlkWzBdKSA6IChncmlkWzFdLTEpLzI7XG4gICAgICAgICAgdmFyIHRvWCA9IGluZGV4JWdyaWRbMF07XG4gICAgICAgICAgdmFyIHRvWSA9IE1hdGguZmxvb3IoaW5kZXgvZ3JpZFswXSk7XG4gICAgICAgICAgdmFyIGRpc3RhbmNlWCA9IGZyb21YIC0gdG9YO1xuICAgICAgICAgIHZhciBkaXN0YW5jZVkgPSBmcm9tWSAtIHRvWTtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBNYXRoLnNxcnQoZGlzdGFuY2VYICogZGlzdGFuY2VYICsgZGlzdGFuY2VZICogZGlzdGFuY2VZKTtcbiAgICAgICAgICBpZiAoYXhpcyA9PT0gJ3gnKSB7IHZhbHVlID0gLWRpc3RhbmNlWDsgfVxuICAgICAgICAgIGlmIChheGlzID09PSAneScpIHsgdmFsdWUgPSAtZGlzdGFuY2VZOyB9XG4gICAgICAgICAgdmFsdWVzLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIG1heFZhbHVlID0gTWF0aC5tYXguYXBwbHkoTWF0aCwgdmFsdWVzKTtcbiAgICAgIH1cbiAgICAgIGlmIChlYXNpbmcpIHsgdmFsdWVzID0gdmFsdWVzLm1hcChmdW5jdGlvbiAodmFsKSB7IHJldHVybiBlYXNpbmcodmFsIC8gbWF4VmFsdWUpICogbWF4VmFsdWU7IH0pOyB9XG4gICAgICBpZiAoZGlyZWN0aW9uID09PSAncmV2ZXJzZScpIHsgdmFsdWVzID0gdmFsdWVzLm1hcChmdW5jdGlvbiAodmFsKSB7IHJldHVybiBheGlzID8gKHZhbCA8IDApID8gdmFsICogLTEgOiAtdmFsIDogTWF0aC5hYnMobWF4VmFsdWUgLSB2YWwpOyB9KTsgfVxuICAgIH1cbiAgICB2YXIgc3BhY2luZyA9IGlzUmFuZ2UgPyAodmFsMiAtIHZhbDEpIC8gbWF4VmFsdWUgOiB2YWwxO1xuICAgIHJldHVybiBzdGFydCArIChzcGFjaW5nICogKE1hdGgucm91bmQodmFsdWVzW2ldICogMTAwKSAvIDEwMCkpICsgdW5pdDtcbiAgfVxufVxuXG4vLyBUaW1lbGluZVxuXG5mdW5jdGlvbiB0aW1lbGluZShwYXJhbXMpIHtcbiAgaWYgKCBwYXJhbXMgPT09IHZvaWQgMCApIHBhcmFtcyA9IHt9O1xuXG4gIHZhciB0bCA9IGFuaW1lKHBhcmFtcyk7XG4gIHRsLmR1cmF0aW9uID0gMDtcbiAgdGwuYWRkID0gZnVuY3Rpb24oaW5zdGFuY2VQYXJhbXMsIHRpbWVsaW5lT2Zmc2V0KSB7XG4gICAgdmFyIHRsSW5kZXggPSBhY3RpdmVJbnN0YW5jZXMuaW5kZXhPZih0bCk7XG4gICAgdmFyIGNoaWxkcmVuID0gdGwuY2hpbGRyZW47XG4gICAgaWYgKHRsSW5kZXggPiAtMSkgeyBhY3RpdmVJbnN0YW5jZXMuc3BsaWNlKHRsSW5kZXgsIDEpOyB9XG4gICAgZnVuY3Rpb24gcGFzc1Rocm91Z2goaW5zKSB7IGlucy5wYXNzVGhyb3VnaCA9IHRydWU7IH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7IHBhc3NUaHJvdWdoKGNoaWxkcmVuW2ldKTsgfVxuICAgIHZhciBpbnNQYXJhbXMgPSBtZXJnZU9iamVjdHMoaW5zdGFuY2VQYXJhbXMsIHJlcGxhY2VPYmplY3RQcm9wcyhkZWZhdWx0VHdlZW5TZXR0aW5ncywgcGFyYW1zKSk7XG4gICAgaW5zUGFyYW1zLnRhcmdldHMgPSBpbnNQYXJhbXMudGFyZ2V0cyB8fCBwYXJhbXMudGFyZ2V0cztcbiAgICB2YXIgdGxEdXJhdGlvbiA9IHRsLmR1cmF0aW9uO1xuICAgIGluc1BhcmFtcy5hdXRvcGxheSA9IGZhbHNlO1xuICAgIGluc1BhcmFtcy5kaXJlY3Rpb24gPSB0bC5kaXJlY3Rpb247XG4gICAgaW5zUGFyYW1zLnRpbWVsaW5lT2Zmc2V0ID0gaXMudW5kKHRpbWVsaW5lT2Zmc2V0KSA/IHRsRHVyYXRpb24gOiBnZXRSZWxhdGl2ZVZhbHVlKHRpbWVsaW5lT2Zmc2V0LCB0bER1cmF0aW9uKTtcbiAgICBwYXNzVGhyb3VnaCh0bCk7XG4gICAgdGwuc2VlayhpbnNQYXJhbXMudGltZWxpbmVPZmZzZXQpO1xuICAgIHZhciBpbnMgPSBhbmltZShpbnNQYXJhbXMpO1xuICAgIHBhc3NUaHJvdWdoKGlucyk7XG4gICAgY2hpbGRyZW4ucHVzaChpbnMpO1xuICAgIHZhciB0aW1pbmdzID0gZ2V0SW5zdGFuY2VUaW1pbmdzKGNoaWxkcmVuLCBwYXJhbXMpO1xuICAgIHRsLmRlbGF5ID0gdGltaW5ncy5kZWxheTtcbiAgICB0bC5lbmREZWxheSA9IHRpbWluZ3MuZW5kRGVsYXk7XG4gICAgdGwuZHVyYXRpb24gPSB0aW1pbmdzLmR1cmF0aW9uO1xuICAgIHRsLnNlZWsoMCk7XG4gICAgdGwucmVzZXQoKTtcbiAgICBpZiAodGwuYXV0b3BsYXkpIHsgdGwucGxheSgpOyB9XG4gICAgcmV0dXJuIHRsO1xuICB9O1xuICByZXR1cm4gdGw7XG59XG5cbmFuaW1lLnZlcnNpb24gPSAnMy4yLjEnO1xuYW5pbWUuc3BlZWQgPSAxO1xuLy8gVE9ETzojcmV2aWV3OiBuYW1pbmcsIGRvY3VtZW50YXRpb25cbmFuaW1lLnN1c3BlbmRXaGVuRG9jdW1lbnRIaWRkZW4gPSB0cnVlO1xuYW5pbWUucnVubmluZyA9IGFjdGl2ZUluc3RhbmNlcztcbmFuaW1lLnJlbW92ZSA9IHJlbW92ZVRhcmdldHNGcm9tQWN0aXZlSW5zdGFuY2VzO1xuYW5pbWUuZ2V0ID0gZ2V0T3JpZ2luYWxUYXJnZXRWYWx1ZTtcbmFuaW1lLnNldCA9IHNldFRhcmdldHNWYWx1ZTtcbmFuaW1lLmNvbnZlcnRQeCA9IGNvbnZlcnRQeFRvVW5pdDtcbmFuaW1lLnBhdGggPSBnZXRQYXRoO1xuYW5pbWUuc2V0RGFzaG9mZnNldCA9IHNldERhc2hvZmZzZXQ7XG5hbmltZS5zdGFnZ2VyID0gc3RhZ2dlcjtcbmFuaW1lLnRpbWVsaW5lID0gdGltZWxpbmU7XG5hbmltZS5lYXNpbmcgPSBwYXJzZUVhc2luZ3M7XG5hbmltZS5wZW5uZXIgPSBwZW5uZXI7XG5hbmltZS5yYW5kb20gPSBmdW5jdGlvbiAobWluLCBtYXgpIHsgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47IH07XG5cbmV4cG9ydCBkZWZhdWx0IGFuaW1lO1xuIiwiLy8gSW1wb3J0c1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18gZnJvbSBcIi4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9zb3VyY2VNYXBzLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fIGZyb20gXCIuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCI7XG52YXIgX19fQ1NTX0xPQURFUl9FWFBPUlRfX18gPSBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyk7XG4vLyBNb2R1bGVcbl9fX0NTU19MT0FERVJfRVhQT1JUX19fLnB1c2goW21vZHVsZS5pZCwgXCIvKiB2YXJpYWJsZXMgKi9cXHJcXG46cm9vdCB7XFxyXFxuICAgIC0tY29sb3ItcHJpbWFyeTogIzE5NzZkMjtcXHJcXG4gICAgLS1jb2xvci1zZWNvbmRhcnk6ICMxNTMxNWQ7XFxyXFxuICAgIC0tY29sb3ItYWNjZW50OiAjZmZjNDAwO1xcclxcbiAgICAtLWNvbG9yLXdoaXRlOiAjZjlmOWY5O1xcclxcbiAgICAtLWNvbG9yLWJsYWNrOiAjMWExYTFhO1xcclxcbiAgICAtLWNvbG9yLWFoZWFkOiAjOTlmZjk5O1xcclxcbiAgICAtLWNvbG9yLWJlaGluZDogI2ZmOTk5OTtcXHJcXG5cXHJcXG4gICAgLS1jaXJjbGUtbG9nby1pbm5lci1kaWFtZXRlcjogNzBweDtcXHJcXG4gICAgLS1jaXJjbGUtbG9nby1vdXRlci1kaWFtZXRlcjogY2FsYyg3MHB4ICsgMnB0KTtcXHJcXG5cXHJcXG4gICAgLyogSSB1c2VkIG1hdGghIFRoaXMgcGVyY2VudGFnZSBpcyBiYXNlZCBvbiB0aGUgZm9sbG93aW5nOlxcclxcbiAgICAgICAgMS4gQSB3aWR0aC10by1oZWlnaHQgcmF0aW8gb2YgNyB0byAxXFxyXFxuICAgICAgICAyLiBBIHNsYW50IGFuZ2xlIG9mIDE1wrBcXHJcXG4gICAgICAgIElmIHRoZSB3aWR0aC10by1oZWlnaHQgcmF0aW8gY2hhbmdlcywgdGhpcyB3aWxsIG5lZWQgdG8gYXMgd2VsbC5cXHJcXG4gICAgICAgIFRoZSBjYWxjdWxhdGlvbiBpcyB0YW4odCkqaC93IHRvIGdldCB0aGUgcGVyY2VudGFnZSBvZiB3aWR0aCBmb3IgdGhlIHRyaWFuZ2xlLiAqL1xcclxcbiAgICAtLXRyYXBlem9pZC1yYXRpbzogMy44MyU7XFxyXFxuXFxyXFxuICAgIC8qIGFuaW1hdGlvbnMgKi9cXHJcXG4gICAgLS1jb2xvci1hbmltYXRpb24taW5mby10cmFuc2l0aW9uLWxlYWRlcjogdmFyKC0tY29sb3Itd2hpdGUpO1xcclxcbiAgICAtLWNvbG9yLWFuaW1hdGlvbi1pbmZvLXRyYW5zaXRpb24tYmc6IHZhcigtLWNvbG9yLXNlY29uZGFyeSk7XFxyXFxuICAgIC0tY29sb3ItYW5pbWF0aW9uLWluZm8tdHJhbnNpdGlvbi10ZXh0OiB2YXIoLS1jb2xvci13aGl0ZSk7XFxyXFxuICAgIC0tY29sb3ItYW5pbWF0aW9uLWdvbGQtc3BsaXQtYmc6IHZhcigtLWNvbG9yLWFjY2VudCk7XFxyXFxuICAgIC0tY29sb3ItYW5pbWF0aW9uLWdvbGQtc3BsaXQtdGV4dDogdmFyKC0tY29sb3ItYmxhY2spO1xcclxcbn1cXHJcXG5cXHJcXG4vKiBjc3MgcmVzZXQgKi9cXHJcXG4qIHtcXHJcXG4gICAgcGFkZGluZzogMDtcXHJcXG4gICAgbWFyZ2luOiAwO1xcclxcbn1cXHJcXG5cXHJcXG5ib2R5IHtcXHJcXG4gICAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XFxyXFxuICAgIGJhY2tncm91bmQ6cmdiYSgzNywgNjgsIDU2LCAwLjcwNSk7XFxyXFxufVxcclxcblxcclxcbi5tb25vc3BhY2Uge1xcclxcbiAgICBmb250LWZhbWlseTogbW9ub3NwYWNlO1xcclxcbn1cXHJcXG5cXHJcXG5oMiB7XFxyXFxuICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCByZ2JhKDAsIDAsIDAsIDAuMjA1KTtcXHJcXG59XFxyXFxuXFxyXFxubGFiZWwge1xcclxcbiAgICBmb250LXdlaWdodDogYm9sZDtcXHJcXG59XFxyXFxuXFxyXFxuLyogd2lkZ2V0ICovXFxyXFxuLndpZGdldC1jb250YWluZXIge1xcclxcbiAgICBtYXJnaW46IDUwcHggMCAwIDUwcHg7XFxyXFxuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXHJcXG59XFxyXFxuXFxyXFxuLndpZGdldC11cHBlci1ib3JkZXIge1xcclxcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XFxyXFxuICAgIHdpZHRoOiA0MjBweDtcXHJcXG4gICAgaGVpZ2h0OiA2MHB4O1xcclxcbiAgICBvdmVyZmxvdzogdmlzaWJsZTtcXHJcXG4gICAgZmlsdGVyOiBkcm9wLXNoYWRvdygwIDAgNHB4IHJnYmEoMCwgMCwgMCwgMC43NSkpO1xcclxcbn1cXHJcXG4ud2lkZ2V0LXVwcGVyLWJvcmRlcjo6YWZ0ZXIge1xcclxcbiAgICBjb250ZW50OiAnJztcXHJcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgICB0b3A6IDA7XFxyXFxuICAgIGxlZnQ6IDA7XFxyXFxuICAgIHotaW5kZXg6IC0yO1xcclxcbiAgICB3aWR0aDogMTAwJTtcXHJcXG4gICAgaGVpZ2h0OiAxMDAlO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci13aGl0ZSk7XFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwIDAsIDEwMCUgMCwgY2FsYygxMDAlIC0gdmFyKC0tdHJhcGV6b2lkLXJhdGlvKSkgMTAwJSwgdmFyKC0tdHJhcGV6b2lkLXJhdGlvKSAxMDAlKTtcXHJcXG59XFxyXFxuXFxyXFxuLndpZGdldC11cHBlciB7XFxyXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gICAgZGlzcGxheTogZmxleDtcXHJcXG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xcclxcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xcclxcbiAgICB0b3A6IDFwdDtcXHJcXG4gICAgbGVmdDogMXB0O1xcclxcbiAgICB3aWR0aDogY2FsYyg0MjBweCAtIDJwdCk7XFxyXFxuICAgIGhlaWdodDogY2FsYyg2MHB4IC0gMnB0KTtcXHJcXG4gICAgY29sb3I6IHZhcigtLWNvbG9yLXdoaXRlKTtcXHJcXG59XFxyXFxuLndpZGdldC11cHBlcjo6YWZ0ZXIge1xcclxcbiAgICBjb250ZW50OiAnJztcXHJcXG4gICAgZGlzcGxheTogYmxvY2s7XFxyXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gICAgdG9wOiAwO1xcclxcbiAgICBsZWZ0OiAwO1xcclxcbiAgICB6LWluZGV4OiAtMTtcXHJcXG4gICAgd2lkdGg6IDEwMCU7XFxyXFxuICAgIGhlaWdodDogMTAwJTtcXHJcXG4gICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCB2YXIoLS1jb2xvci1wcmltYXJ5KSwgdmFyKC0tY29sb3ItYmxhY2spLCB2YXIoLS1jb2xvci1wcmltYXJ5KSk7XFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwLjElIDAsIDk5LjklIDAsIGNhbGMoMTAwJSAtIHZhcigtLXRyYXBlem9pZC1yYXRpbykpIDEwMCUsIHZhcigtLXRyYXBlem9pZC1yYXRpbykgMTAwJSk7XFxyXFxufVxcclxcblxcclxcbi53aWRnZXQtaW5uZXItbGVmdCxcXHJcXG4ud2lkZ2V0LWlubmVyLXJpZ2h0IHtcXHJcXG4gICAgZGlzcGxheTogZmxleDtcXHJcXG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xcclxcbiAgICB3aWR0aDogNTAlO1xcclxcbiAgICBoZWlnaHQ6IDEwMCU7XFxyXFxuICAgIG1heC13aWR0aDogY2FsYygoMTAwJSAtIHZhcigtLXRyYXBlem9pZC1yYXRpbykgLSB2YXIoLS1jaXJjbGUtbG9nby1vdXRlci1kaWFtZXRlcikpIC8gMik7XFxyXFxuICAgIGZsZXgtZ3JvdzogMDtcXHJcXG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcXHJcXG59XFxyXFxuLndpZGdldC1pbm5lci1sZWZ0IHtcXHJcXG4gICAgbWFyZ2luLWxlZnQ6IGNhbGModmFyKC0tdHJhcGV6b2lkLXJhdGlvKSAvIDIpO1xcclxcbiAgICBwYWRkaW5nLXJpZ2h0OiBjYWxjKHZhcigtLWNpcmNsZS1sb2dvLW91dGVyLWRpYW1ldGVyKSAvIDIpO1xcclxcbiAgICBjbGlwLXBhdGg6IHBvbHlnb24oY2FsYygtMSAqIHZhcigtLXRyYXBlem9pZC1yYXRpbykpIDAsIDEwMCUgMCwgMTAwJSAxMDAlLCB2YXIoLS10cmFwZXpvaWQtcmF0aW8pIDEwMCUpO1xcclxcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93LXJldmVyc2U7XFxyXFxufVxcclxcbi53aWRnZXQtaW5uZXItcmlnaHQge1xcclxcbiAgICBtYXJnaW4tcmlnaHQ6IGNhbGModmFyKC0tdHJhcGV6b2lkLXJhdGlvKSAvIDIpO1xcclxcbiAgICBwYWRkaW5nLWxlZnQ6IGNhbGModmFyKC0tY2lyY2xlLWxvZ28tb3V0ZXItZGlhbWV0ZXIpIC8gMik7XFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwIDAsIGNhbGMoMTAwJSArIHZhcigtLXRyYXBlem9pZC1yYXRpbykpIDAsIGNhbGMoMTAwJSAtIHZhcigtLXRyYXBlem9pZC1yYXRpbykpIDEwMCUsIDAgMTAwJSk7XFxyXFxufVxcclxcblxcclxcbi53aWRnZXQtaW5uZXItbGVmdCA+IGRpdixcXHJcXG4ud2lkZ2V0LWlubmVyLXJpZ2h0ID4gZGl2IHtcXHJcXG4gICAgbWFyZ2luOiBhdXRvO1xcclxcbn1cXHJcXG5cXHJcXG4ud2lkZ2V0LWlubmVyLWNpcmNsZSB7XFxyXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gICAgbGVmdDogNTAlO1xcclxcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XFxyXFxuICAgIHdpZHRoOiB2YXIoLS1jaXJjbGUtbG9nby1pbm5lci1kaWFtZXRlcik7XFxyXFxuICAgIGhlaWdodDogdmFyKC0tY2lyY2xlLWxvZ28taW5uZXItZGlhbWV0ZXIpO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1zZWNvbmRhcnkpO1xcclxcbiAgICAvKiB3ZWJwYWNrLWlnbm9yZSAqL1xcclxcbiAgICBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoXFxcIi9hc3NldHMvbGl2ZXNwbGl0L2xvZ29zL2xvZ29faW52ZXJ0ZWRfMTYweDgxLnBuZ1xcXCIpO1xcclxcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBjZW50ZXI7XFxyXFxuICAgIGJhY2tncm91bmQtc2l6ZTogY29udGFpbjtcXHJcXG4gICAgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDtcXHJcXG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xcclxcbiAgICBib3JkZXI6IDJwdCBzb2xpZCB2YXIoLS1jb2xvci1ibGFjayk7XFxyXFxuICAgIGJveC1zaGFkb3c6IDAgMCAxMHB4IDAgcmdiYSgwLCAwLCAwLCAwLjc1KTtcXHJcXG59XFxyXFxuXFxyXFxuLyogd2lkZ2V0IGxvd2VyICovXFxyXFxuLndpZGdldC1sb3dlci1ib3JkZXIge1xcclxcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XFxyXFxuICAgIHdpZHRoOiAzNjBweDtcXHJcXG4gICAgaGVpZ2h0OiBjYWxjKDMwcHggKyAycHQpO1xcclxcbiAgICB6LWluZGV4OiAtMTtcXHJcXG4gICAgZmlsdGVyOiBkcm9wLXNoYWRvdygwIDAgNHB4IHJnYmEoMCwgMCwgMCwgMC43NSkpO1xcclxcbiAgICBtYXJnaW46IC0xcHQgYXV0byAwO1xcclxcbn1cXHJcXG4ud2lkZ2V0LWxvd2VyLWJvcmRlcjo6YWZ0ZXIge1xcclxcbiAgICBjb250ZW50OiAnJztcXHJcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgICB0b3A6IDA7XFxyXFxuICAgIGxlZnQ6IDA7XFxyXFxuICAgIHotaW5kZXg6IC0yO1xcclxcbiAgICB3aWR0aDogMTAwJTtcXHJcXG4gICAgaGVpZ2h0OiAxMDAlO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci13aGl0ZSk7XFxyXFxuICAgIC8qIEkgdXNlZCBtYXRoISBUaGVzZSBwZXJjZW50YWdlcyBhcmUgYmFzZWQgb24gdGhlIGZvbGxvd2luZzpcXHJcXG4gICAgICAgIDEuIEEgd2lkdGgtdG8taGVpZ2h0IHJhdGlvIG9mIDEyIHRvIDFcXHJcXG4gICAgICAgIDIuIEEgc2xhbnQgYW5nbGUgb2YgMTXCsCAob3IgODXCsClcXHJcXG4gICAgICAgIElmIHRoZSB3aWR0aC10by1oZWlnaHQgcmF0aW8gY2hhbmdlcywgdGhlc2Ugd2lsbCBuZWVkIHRvIGFzIHdlbGwuXFxyXFxuICAgICAgICBUaGUgY2FsY3VsYXRpb24gaXMgdGFuKHQpKmgvdyB0byBnZXQgdGhlIHBlcmNlbnRhZ2Ugb2Ygd2lkdGggZm9yIHBvaW50IDQuICovXFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwIDAsIDEwMCUgMCwgOTcuNzclIDEwMCUsIDIuMjMlIDEwMCUpO1xcclxcbn1cXHJcXG5cXHJcXG4ud2lkZ2V0LWxvd2VyIHtcXHJcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgICB0b3A6IDFwdDtcXHJcXG4gICAgbGVmdDogMXB0O1xcclxcbiAgICB3aWR0aDogY2FsYygzNjBweCAtIDJwdCk7XFxyXFxuICAgIGhlaWdodDogMzBweDtcXHJcXG4gICAgY29sb3I6IHZhcigtLWNvbG9yLXdoaXRlKTtcXHJcXG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xcclxcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1ibGFjayk7XFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwLjElIDAsIDk5LjklIDAsIDk3Ljc3JSAxMDAlLCAyLjIzJSAxMDAlKTtcXHJcXG59XFxyXFxuXFxyXFxuLyogdGltZXJzICovXFxyXFxuLnRpbWVyIHtcXHJcXG4gICAgZm9udC1mYW1pbHk6IHZveC1yb3VuZCwgc2Fucy1zZXJpZjtcXHJcXG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcXHJcXG4gICAgZm9udC1zdHlsZTogbm9ybWFsO1xcclxcbiAgICBmb250LXNpemU6IHh4LWxhcmdlO1xcclxcbn1cXHJcXG5cXHJcXG4udGltZXItc3ViIHtcXHJcXG4gICAgZm9udC1zaXplOiA2MCU7XFxyXFxufVxcclxcblxcclxcbi50aW1lci1haGVhZCB7XFxyXFxuICAgIGNvbG9yOiB2YXIoLS1jb2xvci1haGVhZCk7XFxyXFxufVxcclxcblxcclxcbi50aW1lci1iZWhpbmQge1xcclxcbiAgICBjb2xvcjogdmFyKC0tY29sb3ItYmVoaW5kKTtcXHJcXG59XFxyXFxuXFxyXFxuLyogaW5mb3JtYXRpb24gZGlzcGxheXMgKi9cXHJcXG4udGV4dCB7XFxyXFxuICAgIHdpZHRoOiAxMDAlO1xcclxcbiAgICBoZWlnaHQ6IDEwMCU7XFxyXFxuICAgIGZvbnQtZmFtaWx5OiBhcG90ZWstY29uZCwgc2Fucy1zZXJpZjtcXHJcXG4gICAgZm9udC13ZWlnaHQ6IDMwMDtcXHJcXG4gICAgZm9udC1zdHlsZTogbm9ybWFsO1xcclxcbiAgICBmb250LXNpemU6IDI0cHQ7XFxyXFxuICAgIGxpbmUtaGVpZ2h0OiAxZW07XFxyXFxuICAgIGRpc3BsYXk6IGZsZXg7XFxyXFxuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xcclxcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xcclxcbn1cXHJcXG5cXHJcXG4vKiBwIHRhZ3Mgd2l0aGluIHRoaXMgY2xhc3Mgd2lsbCBoYXZlIHRoZWlyIGZvbnQgc2l6ZSBhdXRvbWF0aWNhbGx5IHNjYWxlZCB0byBmaXQgKi9cXHJcXG4uc2hyaW5rLWZpdCB7XFxyXFxuICAgIGhlaWdodDogNzUlO1xcclxcbiAgICB3aWR0aDogODAlO1xcclxcbiAgICBkaXNwbGF5OiBmbGV4O1xcclxcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXHJcXG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXHJcXG59XFxyXFxuXFxyXFxuLnNocmluay1maXQgPiBwIHtcXHJcXG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcclxcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xcclxcbn1cXHJcXG5cXHJcXG4uaGlkZGVuIHtcXHJcXG4gICAgZGlzcGxheTogbm9uZTtcXHJcXG59XFxyXFxuXFxyXFxuLyogYW5pbWF0aW9ucyAqL1xcclxcbi5hbmltYXRpb24tY29udGFpbmVyIHtcXHJcXG4gICAgZGlzcGxheTogZmxleDtcXHJcXG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xcclxcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xcclxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICAgIHdpZHRoOiAxMDAlO1xcclxcbiAgICBoZWlnaHQ6IDEwMCU7XFxyXFxuICAgIHZpc2liaWxpdHk6IGhpZGRlbjtcXHJcXG59XFxyXFxuXFxyXFxuLndpZGdldC1pbm5lci1sZWZ0IC5hbmltYXRpb24tY29udGFpbmVyIHtcXHJcXG4gICAgbWFyZ2luLXJpZ2h0OiBjYWxjKCg3MHB4ICsgMnB0KSAvIC0yKTtcXHJcXG4gICAgdHJhbnNmb3JtOiBza2V3WCgxNWRlZyk7XFxyXFxuICAgIGZsZXgtZGlyZWN0aW9uOiByb3ctcmV2ZXJzZTtcXHJcXG59XFxyXFxuXFxyXFxuLndpZGdldC1pbm5lci1yaWdodCAuYW5pbWF0aW9uLWNvbnRhaW5lciB7XFxyXFxuICAgIG1hcmdpbi1sZWZ0OiBjYWxjKCg3MHB4ICsgMnB0KSAvIC0yKTtcXHJcXG4gICAgdHJhbnNmb3JtOiBza2V3WCgtMTVkZWcpO1xcclxcbn1cXHJcXG5cXHJcXG4udHJhbnNpdGlvbi1ib3gge1xcclxcbiAgICBkaXNwbGF5OiBmbGV4O1xcclxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICAgIGhlaWdodDogMTAwJTtcXHJcXG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XFxyXFxuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XFxyXFxufVxcclxcblxcclxcbiN3aWRnZXQtZnVsbC1hbmltYXRpb25zIHtcXHJcXG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XFxyXFxuICAgIG92ZXJmbG93OiBoaWRkZW47XFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwIDAsIDEwMCUgMCwgY2FsYygxMDAlIC0gdmFyKC0tdHJhcGV6b2lkLXJhdGlvKSkgMTAwJSwgdmFyKC0tdHJhcGV6b2lkLXJhdGlvKSAxMDAlKTtcXHJcXG4gICAgei1pbmRleDogMjtcXHJcXG59XFxyXFxuXFxyXFxuLnRyYW5zaXRpb24tY2lyY2xlIHtcXHJcXG4gICAgd2lkdGg6IHZhcigtLWNpcmNsZS1sb2dvLWlubmVyLWRpYW1ldGVyKTtcXHJcXG4gICAgaGVpZ2h0OiB2YXIoLS1jaXJjbGUtbG9nby1pbm5lci1kaWFtZXRlcik7XFxyXFxuICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcclxcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XFxyXFxuICAgIGJvcmRlcjogNXB4IHNvbGlkIHZhcigtLWNvbG9yLWFuaW1hdGlvbi1nb2xkLXNwbGl0LWJnKTtcXHJcXG4gICAgbWFyZ2luOiBhdXRvO1xcclxcbn1cXHJcXG5cXHJcXG4udHJhbnNpdGlvbi1jaXJjbGUtZnVsbCB7XFxyXFxuICAgIHdpZHRoOiB2YXIoLS1jaXJjbGUtbG9nby1pbm5lci1kaWFtZXRlcik7XFxyXFxuICAgIGhlaWdodDogdmFyKC0tY2lyY2xlLWxvZ28taW5uZXItZGlhbWV0ZXIpO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1hbmltYXRpb24tZ29sZC1zcGxpdC1iZyk7XFxyXFxuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcXHJcXG59XFxyXFxuXFxyXFxuLnRyYW5zaXRpb24tYm94LXNtYWxsIHtcXHJcXG4gICAgd2lkdGg6IDE1cHg7XFxyXFxuICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWNvbG9yLWFuaW1hdGlvbi1pbmZvLXRyYW5zaXRpb24tbGVhZGVyKTtcXHJcXG59XFxyXFxuXFxyXFxuLnRyYW5zaXRpb24tYm94LWxhcmdlIHtcXHJcXG4gICAgd2lkdGg6IDEwMCU7XFxyXFxuICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWNvbG9yLWFuaW1hdGlvbi1pbmZvLXRyYW5zaXRpb24tYmcpO1xcclxcbiAgICBib3JkZXI6IDVweCBzb2xpZCB2YXIoLS1jb2xvci1hbmltYXRpb24taW5mby10cmFuc2l0aW9uLWxlYWRlcik7XFxyXFxuICAgIGJvcmRlci10b3A6IG5vbmU7XFxyXFxuICAgIGJvcmRlci1ib3R0b206IG5vbmU7XFxyXFxuICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxyXFxufVxcclxcblxcclxcbi53aWRnZXQtaW5uZXItbGVmdCAudHJhbnNpdGlvbi1ib3gge1xcclxcbiAgICB0cmFuc2Zvcm0tb3JpZ2luOiByaWdodCBjZW50ZXI7XFxyXFxufVxcclxcblxcclxcbi53aWRnZXQtaW5uZXItcmlnaHQgLnRyYW5zaXRpb24tYm94IHtcXHJcXG4gICAgdHJhbnNmb3JtLW9yaWdpbjogbGVmdCBjZW50ZXI7XFxyXFxufVxcclxcblxcclxcbi50cmFuc2l0aW9uLWJveC10ZXh0IHtcXHJcXG4gICAgY29sb3I6IHZhcigtLWNvbG9yLWFuaW1hdGlvbi1pbmZvLXRyYW5zaXRpb24tdGV4dCk7XFxyXFxuICAgIGZvbnQtd2VpZ2h0OiA1MDA7XFxyXFxuICAgIGZvbnQtdmFyaWFudDogc21hbGwtY2FwcztcXHJcXG59XFxyXFxuXFxyXFxuLnRyYW5zaXRpb24tYm94LXRleHQtZ29sZCB7XFxyXFxuICAgIGNvbG9yOiB2YXIoLS1jb2xvci1hbmltYXRpb24tZ29sZC1zcGxpdC10ZXh0KTtcXHJcXG4gICAgZm9udC13ZWlnaHQ6IDUwMDtcXHJcXG4gICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcXHJcXG59XCIsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vc3JjL2dyYXBoaWNzL3dpZGdldC5jc3NcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIkFBQUEsY0FBYztBQUNkO0lBQ0ksd0JBQXdCO0lBQ3hCLDBCQUEwQjtJQUMxQix1QkFBdUI7SUFDdkIsc0JBQXNCO0lBQ3RCLHNCQUFzQjtJQUN0QixzQkFBc0I7SUFDdEIsdUJBQXVCOztJQUV2QixrQ0FBa0M7SUFDbEMsOENBQThDOztJQUU5Qzs7Ozt3RkFJb0Y7SUFDcEYsd0JBQXdCOztJQUV4QixlQUFlO0lBQ2YsNERBQTREO0lBQzVELDREQUE0RDtJQUM1RCwwREFBMEQ7SUFDMUQsb0RBQW9EO0lBQ3BELHFEQUFxRDtBQUN6RDs7QUFFQSxjQUFjO0FBQ2Q7SUFDSSxVQUFVO0lBQ1YsU0FBUztBQUNiOztBQUVBO0lBQ0ksdUJBQXVCO0lBQ3ZCLGtDQUFrQztBQUN0Qzs7QUFFQTtJQUNJLHNCQUFzQjtBQUMxQjs7QUFFQTtJQUNJLDZDQUE2QztBQUNqRDs7QUFFQTtJQUNJLGlCQUFpQjtBQUNyQjs7QUFFQSxXQUFXO0FBQ1g7SUFDSSxxQkFBcUI7SUFDckIscUJBQXFCO0FBQ3pCOztBQUVBO0lBQ0ksa0JBQWtCO0lBQ2xCLFlBQVk7SUFDWixZQUFZO0lBQ1osaUJBQWlCO0lBQ2pCLGdEQUFnRDtBQUNwRDtBQUNB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O0lBQ0ksdUJBQXVCO0lBQ3ZCLGdCQUFnQjtJQUNoQixzR0FBc0c7SUFDdEcsVUFBVTtBQUNkOztBQUVBO0lBQ0ksd0NBQXdDO0lBQ3hDLHlDQUF5QztJQUN6Qyw2QkFBNkI7SUFDN0Isa0JBQWtCO0lBQ2xCLHNEQUFzRDtJQUN0RCxZQUFZO0FBQ2hCOztBQUVBO0lBQ0ksd0NBQXdDO0lBQ3hDLHlDQUF5QztJQUN6QyxzREFBc0Q7SUFDdEQsa0JBQWtCO0FBQ3RCOztBQUVBO0lBQ0ksV0FBVztJQUNYLCtEQUErRDtBQUNuRTs7QUFFQTtJQUNJLFdBQVc7SUFDWCwyREFBMkQ7SUFDM0QsK0RBQStEO0lBQy9ELGdCQUFnQjtJQUNoQixtQkFBbUI7SUFDbkIsc0JBQXNCO0FBQzFCOztBQUVBO0lBQ0ksOEJBQThCO0FBQ2xDOztBQUVBO0lBQ0ksNkJBQTZCO0FBQ2pDOztBQUVBO0lBQ0ksa0RBQWtEO0lBQ2xELGdCQUFnQjtJQUNoQix3QkFBd0I7QUFDNUI7O0FBRUE7SUFDSSw2Q0FBNkM7SUFDN0MsZ0JBQWdCO0lBQ2hCLHlCQUF5QjtBQUM3QlwiLFwic291cmNlc0NvbnRlbnRcIjpbXCIvKiB2YXJpYWJsZXMgKi9cXHJcXG46cm9vdCB7XFxyXFxuICAgIC0tY29sb3ItcHJpbWFyeTogIzE5NzZkMjtcXHJcXG4gICAgLS1jb2xvci1zZWNvbmRhcnk6ICMxNTMxNWQ7XFxyXFxuICAgIC0tY29sb3ItYWNjZW50OiAjZmZjNDAwO1xcclxcbiAgICAtLWNvbG9yLXdoaXRlOiAjZjlmOWY5O1xcclxcbiAgICAtLWNvbG9yLWJsYWNrOiAjMWExYTFhO1xcclxcbiAgICAtLWNvbG9yLWFoZWFkOiAjOTlmZjk5O1xcclxcbiAgICAtLWNvbG9yLWJlaGluZDogI2ZmOTk5OTtcXHJcXG5cXHJcXG4gICAgLS1jaXJjbGUtbG9nby1pbm5lci1kaWFtZXRlcjogNzBweDtcXHJcXG4gICAgLS1jaXJjbGUtbG9nby1vdXRlci1kaWFtZXRlcjogY2FsYyg3MHB4ICsgMnB0KTtcXHJcXG5cXHJcXG4gICAgLyogSSB1c2VkIG1hdGghIFRoaXMgcGVyY2VudGFnZSBpcyBiYXNlZCBvbiB0aGUgZm9sbG93aW5nOlxcclxcbiAgICAgICAgMS4gQSB3aWR0aC10by1oZWlnaHQgcmF0aW8gb2YgNyB0byAxXFxyXFxuICAgICAgICAyLiBBIHNsYW50IGFuZ2xlIG9mIDE1wrBcXHJcXG4gICAgICAgIElmIHRoZSB3aWR0aC10by1oZWlnaHQgcmF0aW8gY2hhbmdlcywgdGhpcyB3aWxsIG5lZWQgdG8gYXMgd2VsbC5cXHJcXG4gICAgICAgIFRoZSBjYWxjdWxhdGlvbiBpcyB0YW4odCkqaC93IHRvIGdldCB0aGUgcGVyY2VudGFnZSBvZiB3aWR0aCBmb3IgdGhlIHRyaWFuZ2xlLiAqL1xcclxcbiAgICAtLXRyYXBlem9pZC1yYXRpbzogMy44MyU7XFxyXFxuXFxyXFxuICAgIC8qIGFuaW1hdGlvbnMgKi9cXHJcXG4gICAgLS1jb2xvci1hbmltYXRpb24taW5mby10cmFuc2l0aW9uLWxlYWRlcjogdmFyKC0tY29sb3Itd2hpdGUpO1xcclxcbiAgICAtLWNvbG9yLWFuaW1hdGlvbi1pbmZvLXRyYW5zaXRpb24tYmc6IHZhcigtLWNvbG9yLXNlY29uZGFyeSk7XFxyXFxuICAgIC0tY29sb3ItYW5pbWF0aW9uLWluZm8tdHJhbnNpdGlvbi10ZXh0OiB2YXIoLS1jb2xvci13aGl0ZSk7XFxyXFxuICAgIC0tY29sb3ItYW5pbWF0aW9uLWdvbGQtc3BsaXQtYmc6IHZhcigtLWNvbG9yLWFjY2VudCk7XFxyXFxuICAgIC0tY29sb3ItYW5pbWF0aW9uLWdvbGQtc3BsaXQtdGV4dDogdmFyKC0tY29sb3ItYmxhY2spO1xcclxcbn1cXHJcXG5cXHJcXG4vKiBjc3MgcmVzZXQgKi9cXHJcXG4qIHtcXHJcXG4gICAgcGFkZGluZzogMDtcXHJcXG4gICAgbWFyZ2luOiAwO1xcclxcbn1cXHJcXG5cXHJcXG5ib2R5IHtcXHJcXG4gICAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XFxyXFxuICAgIGJhY2tncm91bmQ6cmdiYSgzNywgNjgsIDU2LCAwLjcwNSk7XFxyXFxufVxcclxcblxcclxcbi5tb25vc3BhY2Uge1xcclxcbiAgICBmb250LWZhbWlseTogbW9ub3NwYWNlO1xcclxcbn1cXHJcXG5cXHJcXG5oMiB7XFxyXFxuICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCByZ2JhKDAsIDAsIDAsIDAuMjA1KTtcXHJcXG59XFxyXFxuXFxyXFxubGFiZWwge1xcclxcbiAgICBmb250LXdlaWdodDogYm9sZDtcXHJcXG59XFxyXFxuXFxyXFxuLyogd2lkZ2V0ICovXFxyXFxuLndpZGdldC1jb250YWluZXIge1xcclxcbiAgICBtYXJnaW46IDUwcHggMCAwIDUwcHg7XFxyXFxuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXHJcXG59XFxyXFxuXFxyXFxuLndpZGdldC11cHBlci1ib3JkZXIge1xcclxcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XFxyXFxuICAgIHdpZHRoOiA0MjBweDtcXHJcXG4gICAgaGVpZ2h0OiA2MHB4O1xcclxcbiAgICBvdmVyZmxvdzogdmlzaWJsZTtcXHJcXG4gICAgZmlsdGVyOiBkcm9wLXNoYWRvdygwIDAgNHB4IHJnYmEoMCwgMCwgMCwgMC43NSkpO1xcclxcbn1cXHJcXG4ud2lkZ2V0LXVwcGVyLWJvcmRlcjo6YWZ0ZXIge1xcclxcbiAgICBjb250ZW50OiAnJztcXHJcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgICB0b3A6IDA7XFxyXFxuICAgIGxlZnQ6IDA7XFxyXFxuICAgIHotaW5kZXg6IC0yO1xcclxcbiAgICB3aWR0aDogMTAwJTtcXHJcXG4gICAgaGVpZ2h0OiAxMDAlO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci13aGl0ZSk7XFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwIDAsIDEwMCUgMCwgY2FsYygxMDAlIC0gdmFyKC0tdHJhcGV6b2lkLXJhdGlvKSkgMTAwJSwgdmFyKC0tdHJhcGV6b2lkLXJhdGlvKSAxMDAlKTtcXHJcXG59XFxyXFxuXFxyXFxuLndpZGdldC11cHBlciB7XFxyXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gICAgZGlzcGxheTogZmxleDtcXHJcXG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xcclxcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xcclxcbiAgICB0b3A6IDFwdDtcXHJcXG4gICAgbGVmdDogMXB0O1xcclxcbiAgICB3aWR0aDogY2FsYyg0MjBweCAtIDJwdCk7XFxyXFxuICAgIGhlaWdodDogY2FsYyg2MHB4IC0gMnB0KTtcXHJcXG4gICAgY29sb3I6IHZhcigtLWNvbG9yLXdoaXRlKTtcXHJcXG59XFxyXFxuLndpZGdldC11cHBlcjo6YWZ0ZXIge1xcclxcbiAgICBjb250ZW50OiAnJztcXHJcXG4gICAgZGlzcGxheTogYmxvY2s7XFxyXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gICAgdG9wOiAwO1xcclxcbiAgICBsZWZ0OiAwO1xcclxcbiAgICB6LWluZGV4OiAtMTtcXHJcXG4gICAgd2lkdGg6IDEwMCU7XFxyXFxuICAgIGhlaWdodDogMTAwJTtcXHJcXG4gICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCB2YXIoLS1jb2xvci1wcmltYXJ5KSwgdmFyKC0tY29sb3ItYmxhY2spLCB2YXIoLS1jb2xvci1wcmltYXJ5KSk7XFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwLjElIDAsIDk5LjklIDAsIGNhbGMoMTAwJSAtIHZhcigtLXRyYXBlem9pZC1yYXRpbykpIDEwMCUsIHZhcigtLXRyYXBlem9pZC1yYXRpbykgMTAwJSk7XFxyXFxufVxcclxcblxcclxcbi53aWRnZXQtaW5uZXItbGVmdCxcXHJcXG4ud2lkZ2V0LWlubmVyLXJpZ2h0IHtcXHJcXG4gICAgZGlzcGxheTogZmxleDtcXHJcXG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xcclxcbiAgICB3aWR0aDogNTAlO1xcclxcbiAgICBoZWlnaHQ6IDEwMCU7XFxyXFxuICAgIG1heC13aWR0aDogY2FsYygoMTAwJSAtIHZhcigtLXRyYXBlem9pZC1yYXRpbykgLSB2YXIoLS1jaXJjbGUtbG9nby1vdXRlci1kaWFtZXRlcikpIC8gMik7XFxyXFxuICAgIGZsZXgtZ3JvdzogMDtcXHJcXG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcXHJcXG59XFxyXFxuLndpZGdldC1pbm5lci1sZWZ0IHtcXHJcXG4gICAgbWFyZ2luLWxlZnQ6IGNhbGModmFyKC0tdHJhcGV6b2lkLXJhdGlvKSAvIDIpO1xcclxcbiAgICBwYWRkaW5nLXJpZ2h0OiBjYWxjKHZhcigtLWNpcmNsZS1sb2dvLW91dGVyLWRpYW1ldGVyKSAvIDIpO1xcclxcbiAgICBjbGlwLXBhdGg6IHBvbHlnb24oY2FsYygtMSAqIHZhcigtLXRyYXBlem9pZC1yYXRpbykpIDAsIDEwMCUgMCwgMTAwJSAxMDAlLCB2YXIoLS10cmFwZXpvaWQtcmF0aW8pIDEwMCUpO1xcclxcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93LXJldmVyc2U7XFxyXFxufVxcclxcbi53aWRnZXQtaW5uZXItcmlnaHQge1xcclxcbiAgICBtYXJnaW4tcmlnaHQ6IGNhbGModmFyKC0tdHJhcGV6b2lkLXJhdGlvKSAvIDIpO1xcclxcbiAgICBwYWRkaW5nLWxlZnQ6IGNhbGModmFyKC0tY2lyY2xlLWxvZ28tb3V0ZXItZGlhbWV0ZXIpIC8gMik7XFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwIDAsIGNhbGMoMTAwJSArIHZhcigtLXRyYXBlem9pZC1yYXRpbykpIDAsIGNhbGMoMTAwJSAtIHZhcigtLXRyYXBlem9pZC1yYXRpbykpIDEwMCUsIDAgMTAwJSk7XFxyXFxufVxcclxcblxcclxcbi53aWRnZXQtaW5uZXItbGVmdCA+IGRpdixcXHJcXG4ud2lkZ2V0LWlubmVyLXJpZ2h0ID4gZGl2IHtcXHJcXG4gICAgbWFyZ2luOiBhdXRvO1xcclxcbn1cXHJcXG5cXHJcXG4ud2lkZ2V0LWlubmVyLWNpcmNsZSB7XFxyXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXHJcXG4gICAgbGVmdDogNTAlO1xcclxcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XFxyXFxuICAgIHdpZHRoOiB2YXIoLS1jaXJjbGUtbG9nby1pbm5lci1kaWFtZXRlcik7XFxyXFxuICAgIGhlaWdodDogdmFyKC0tY2lyY2xlLWxvZ28taW5uZXItZGlhbWV0ZXIpO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1zZWNvbmRhcnkpO1xcclxcbiAgICAvKiB3ZWJwYWNrLWlnbm9yZSAqL1xcclxcbiAgICBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoXFxcIi9hc3NldHMvbGl2ZXNwbGl0L2xvZ29zL2xvZ29faW52ZXJ0ZWRfMTYweDgxLnBuZ1xcXCIpO1xcclxcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBjZW50ZXI7XFxyXFxuICAgIGJhY2tncm91bmQtc2l6ZTogY29udGFpbjtcXHJcXG4gICAgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDtcXHJcXG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xcclxcbiAgICBib3JkZXI6IDJwdCBzb2xpZCB2YXIoLS1jb2xvci1ibGFjayk7XFxyXFxuICAgIGJveC1zaGFkb3c6IDAgMCAxMHB4IDAgcmdiYSgwLCAwLCAwLCAwLjc1KTtcXHJcXG59XFxyXFxuXFxyXFxuLyogd2lkZ2V0IGxvd2VyICovXFxyXFxuLndpZGdldC1sb3dlci1ib3JkZXIge1xcclxcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XFxyXFxuICAgIHdpZHRoOiAzNjBweDtcXHJcXG4gICAgaGVpZ2h0OiBjYWxjKDMwcHggKyAycHQpO1xcclxcbiAgICB6LWluZGV4OiAtMTtcXHJcXG4gICAgZmlsdGVyOiBkcm9wLXNoYWRvdygwIDAgNHB4IHJnYmEoMCwgMCwgMCwgMC43NSkpO1xcclxcbiAgICBtYXJnaW46IC0xcHQgYXV0byAwO1xcclxcbn1cXHJcXG4ud2lkZ2V0LWxvd2VyLWJvcmRlcjo6YWZ0ZXIge1xcclxcbiAgICBjb250ZW50OiAnJztcXHJcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgICB0b3A6IDA7XFxyXFxuICAgIGxlZnQ6IDA7XFxyXFxuICAgIHotaW5kZXg6IC0yO1xcclxcbiAgICB3aWR0aDogMTAwJTtcXHJcXG4gICAgaGVpZ2h0OiAxMDAlO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci13aGl0ZSk7XFxyXFxuICAgIC8qIEkgdXNlZCBtYXRoISBUaGVzZSBwZXJjZW50YWdlcyBhcmUgYmFzZWQgb24gdGhlIGZvbGxvd2luZzpcXHJcXG4gICAgICAgIDEuIEEgd2lkdGgtdG8taGVpZ2h0IHJhdGlvIG9mIDEyIHRvIDFcXHJcXG4gICAgICAgIDIuIEEgc2xhbnQgYW5nbGUgb2YgMTXCsCAob3IgODXCsClcXHJcXG4gICAgICAgIElmIHRoZSB3aWR0aC10by1oZWlnaHQgcmF0aW8gY2hhbmdlcywgdGhlc2Ugd2lsbCBuZWVkIHRvIGFzIHdlbGwuXFxyXFxuICAgICAgICBUaGUgY2FsY3VsYXRpb24gaXMgdGFuKHQpKmgvdyB0byBnZXQgdGhlIHBlcmNlbnRhZ2Ugb2Ygd2lkdGggZm9yIHBvaW50IDQuICovXFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwIDAsIDEwMCUgMCwgOTcuNzclIDEwMCUsIDIuMjMlIDEwMCUpO1xcclxcbn1cXHJcXG5cXHJcXG4ud2lkZ2V0LWxvd2VyIHtcXHJcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcclxcbiAgICB0b3A6IDFwdDtcXHJcXG4gICAgbGVmdDogMXB0O1xcclxcbiAgICB3aWR0aDogY2FsYygzNjBweCAtIDJwdCk7XFxyXFxuICAgIGhlaWdodDogMzBweDtcXHJcXG4gICAgY29sb3I6IHZhcigtLWNvbG9yLXdoaXRlKTtcXHJcXG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xcclxcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1ibGFjayk7XFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwLjElIDAsIDk5LjklIDAsIDk3Ljc3JSAxMDAlLCAyLjIzJSAxMDAlKTtcXHJcXG59XFxyXFxuXFxyXFxuLyogdGltZXJzICovXFxyXFxuLnRpbWVyIHtcXHJcXG4gICAgZm9udC1mYW1pbHk6IHZveC1yb3VuZCwgc2Fucy1zZXJpZjtcXHJcXG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcXHJcXG4gICAgZm9udC1zdHlsZTogbm9ybWFsO1xcclxcbiAgICBmb250LXNpemU6IHh4LWxhcmdlO1xcclxcbn1cXHJcXG5cXHJcXG4udGltZXItc3ViIHtcXHJcXG4gICAgZm9udC1zaXplOiA2MCU7XFxyXFxufVxcclxcblxcclxcbi50aW1lci1haGVhZCB7XFxyXFxuICAgIGNvbG9yOiB2YXIoLS1jb2xvci1haGVhZCk7XFxyXFxufVxcclxcblxcclxcbi50aW1lci1iZWhpbmQge1xcclxcbiAgICBjb2xvcjogdmFyKC0tY29sb3ItYmVoaW5kKTtcXHJcXG59XFxyXFxuXFxyXFxuLyogaW5mb3JtYXRpb24gZGlzcGxheXMgKi9cXHJcXG4udGV4dCB7XFxyXFxuICAgIHdpZHRoOiAxMDAlO1xcclxcbiAgICBoZWlnaHQ6IDEwMCU7XFxyXFxuICAgIGZvbnQtZmFtaWx5OiBhcG90ZWstY29uZCwgc2Fucy1zZXJpZjtcXHJcXG4gICAgZm9udC13ZWlnaHQ6IDMwMDtcXHJcXG4gICAgZm9udC1zdHlsZTogbm9ybWFsO1xcclxcbiAgICBmb250LXNpemU6IDI0cHQ7XFxyXFxuICAgIGxpbmUtaGVpZ2h0OiAxZW07XFxyXFxuICAgIGRpc3BsYXk6IGZsZXg7XFxyXFxuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xcclxcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xcclxcbn1cXHJcXG5cXHJcXG4vKiBwIHRhZ3Mgd2l0aGluIHRoaXMgY2xhc3Mgd2lsbCBoYXZlIHRoZWlyIGZvbnQgc2l6ZSBhdXRvbWF0aWNhbGx5IHNjYWxlZCB0byBmaXQgKi9cXHJcXG4uc2hyaW5rLWZpdCB7XFxyXFxuICAgIGhlaWdodDogNzUlO1xcclxcbiAgICB3aWR0aDogODAlO1xcclxcbiAgICBkaXNwbGF5OiBmbGV4O1xcclxcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXHJcXG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXHJcXG59XFxyXFxuXFxyXFxuLnNocmluay1maXQgPiBwIHtcXHJcXG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcclxcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xcclxcbn1cXHJcXG5cXHJcXG4uaGlkZGVuIHtcXHJcXG4gICAgZGlzcGxheTogbm9uZTtcXHJcXG59XFxyXFxuXFxyXFxuLyogYW5pbWF0aW9ucyAqL1xcclxcbi5hbmltYXRpb24tY29udGFpbmVyIHtcXHJcXG4gICAgZGlzcGxheTogZmxleDtcXHJcXG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xcclxcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xcclxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICAgIHdpZHRoOiAxMDAlO1xcclxcbiAgICBoZWlnaHQ6IDEwMCU7XFxyXFxuICAgIHZpc2liaWxpdHk6IGhpZGRlbjtcXHJcXG59XFxyXFxuXFxyXFxuLndpZGdldC1pbm5lci1sZWZ0IC5hbmltYXRpb24tY29udGFpbmVyIHtcXHJcXG4gICAgbWFyZ2luLXJpZ2h0OiBjYWxjKCg3MHB4ICsgMnB0KSAvIC0yKTtcXHJcXG4gICAgdHJhbnNmb3JtOiBza2V3WCgxNWRlZyk7XFxyXFxuICAgIGZsZXgtZGlyZWN0aW9uOiByb3ctcmV2ZXJzZTtcXHJcXG59XFxyXFxuXFxyXFxuLndpZGdldC1pbm5lci1yaWdodCAuYW5pbWF0aW9uLWNvbnRhaW5lciB7XFxyXFxuICAgIG1hcmdpbi1sZWZ0OiBjYWxjKCg3MHB4ICsgMnB0KSAvIC0yKTtcXHJcXG4gICAgdHJhbnNmb3JtOiBza2V3WCgtMTVkZWcpO1xcclxcbn1cXHJcXG5cXHJcXG4udHJhbnNpdGlvbi1ib3gge1xcclxcbiAgICBkaXNwbGF5OiBmbGV4O1xcclxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxyXFxuICAgIGhlaWdodDogMTAwJTtcXHJcXG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XFxyXFxuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XFxyXFxufVxcclxcblxcclxcbiN3aWRnZXQtZnVsbC1hbmltYXRpb25zIHtcXHJcXG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XFxyXFxuICAgIG92ZXJmbG93OiBoaWRkZW47XFxyXFxuICAgIGNsaXAtcGF0aDogcG9seWdvbigwIDAsIDEwMCUgMCwgY2FsYygxMDAlIC0gdmFyKC0tdHJhcGV6b2lkLXJhdGlvKSkgMTAwJSwgdmFyKC0tdHJhcGV6b2lkLXJhdGlvKSAxMDAlKTtcXHJcXG4gICAgei1pbmRleDogMjtcXHJcXG59XFxyXFxuXFxyXFxuLnRyYW5zaXRpb24tY2lyY2xlIHtcXHJcXG4gICAgd2lkdGg6IHZhcigtLWNpcmNsZS1sb2dvLWlubmVyLWRpYW1ldGVyKTtcXHJcXG4gICAgaGVpZ2h0OiB2YXIoLS1jaXJjbGUtbG9nby1pbm5lci1kaWFtZXRlcik7XFxyXFxuICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcclxcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XFxyXFxuICAgIGJvcmRlcjogNXB4IHNvbGlkIHZhcigtLWNvbG9yLWFuaW1hdGlvbi1nb2xkLXNwbGl0LWJnKTtcXHJcXG4gICAgbWFyZ2luOiBhdXRvO1xcclxcbn1cXHJcXG5cXHJcXG4udHJhbnNpdGlvbi1jaXJjbGUtZnVsbCB7XFxyXFxuICAgIHdpZHRoOiB2YXIoLS1jaXJjbGUtbG9nby1pbm5lci1kaWFtZXRlcik7XFxyXFxuICAgIGhlaWdodDogdmFyKC0tY2lyY2xlLWxvZ28taW5uZXItZGlhbWV0ZXIpO1xcclxcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1hbmltYXRpb24tZ29sZC1zcGxpdC1iZyk7XFxyXFxuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcXHJcXG59XFxyXFxuXFxyXFxuLnRyYW5zaXRpb24tYm94LXNtYWxsIHtcXHJcXG4gICAgd2lkdGg6IDE1cHg7XFxyXFxuICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWNvbG9yLWFuaW1hdGlvbi1pbmZvLXRyYW5zaXRpb24tbGVhZGVyKTtcXHJcXG59XFxyXFxuXFxyXFxuLnRyYW5zaXRpb24tYm94LWxhcmdlIHtcXHJcXG4gICAgd2lkdGg6IDEwMCU7XFxyXFxuICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWNvbG9yLWFuaW1hdGlvbi1pbmZvLXRyYW5zaXRpb24tYmcpO1xcclxcbiAgICBib3JkZXI6IDVweCBzb2xpZCB2YXIoLS1jb2xvci1hbmltYXRpb24taW5mby10cmFuc2l0aW9uLWxlYWRlcik7XFxyXFxuICAgIGJvcmRlci10b3A6IG5vbmU7XFxyXFxuICAgIGJvcmRlci1ib3R0b206IG5vbmU7XFxyXFxuICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxyXFxufVxcclxcblxcclxcbi53aWRnZXQtaW5uZXItbGVmdCAudHJhbnNpdGlvbi1ib3gge1xcclxcbiAgICB0cmFuc2Zvcm0tb3JpZ2luOiByaWdodCBjZW50ZXI7XFxyXFxufVxcclxcblxcclxcbi53aWRnZXQtaW5uZXItcmlnaHQgLnRyYW5zaXRpb24tYm94IHtcXHJcXG4gICAgdHJhbnNmb3JtLW9yaWdpbjogbGVmdCBjZW50ZXI7XFxyXFxufVxcclxcblxcclxcbi50cmFuc2l0aW9uLWJveC10ZXh0IHtcXHJcXG4gICAgY29sb3I6IHZhcigtLWNvbG9yLWFuaW1hdGlvbi1pbmZvLXRyYW5zaXRpb24tdGV4dCk7XFxyXFxuICAgIGZvbnQtd2VpZ2h0OiA1MDA7XFxyXFxuICAgIGZvbnQtdmFyaWFudDogc21hbGwtY2FwcztcXHJcXG59XFxyXFxuXFxyXFxuLnRyYW5zaXRpb24tYm94LXRleHQtZ29sZCB7XFxyXFxuICAgIGNvbG9yOiB2YXIoLS1jb2xvci1hbmltYXRpb24tZ29sZC1zcGxpdC10ZXh0KTtcXHJcXG4gICAgZm9udC13ZWlnaHQ6IDUwMDtcXHJcXG4gICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcXHJcXG59XCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vKlxuICBNSVQgTGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuICBBdXRob3IgVG9iaWFzIEtvcHBlcnMgQHNva3JhXG4qL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3NzV2l0aE1hcHBpbmdUb1N0cmluZykge1xuICB2YXIgbGlzdCA9IFtdOyAvLyByZXR1cm4gdGhlIGxpc3Qgb2YgbW9kdWxlcyBhcyBjc3Mgc3RyaW5nXG5cbiAgbGlzdC50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgdmFyIGNvbnRlbnQgPSBcIlwiO1xuICAgICAgdmFyIG5lZWRMYXllciA9IHR5cGVvZiBpdGVtWzVdICE9PSBcInVuZGVmaW5lZFwiO1xuXG4gICAgICBpZiAoaXRlbVs0XSkge1xuICAgICAgICBjb250ZW50ICs9IFwiQHN1cHBvcnRzIChcIi5jb25jYXQoaXRlbVs0XSwgXCIpIHtcIik7XG4gICAgICB9XG5cbiAgICAgIGlmIChpdGVtWzJdKSB7XG4gICAgICAgIGNvbnRlbnQgKz0gXCJAbWVkaWEgXCIuY29uY2F0KGl0ZW1bMl0sIFwiIHtcIik7XG4gICAgICB9XG5cbiAgICAgIGlmIChuZWVkTGF5ZXIpIHtcbiAgICAgICAgY29udGVudCArPSBcIkBsYXllclwiLmNvbmNhdChpdGVtWzVdLmxlbmd0aCA+IDAgPyBcIiBcIi5jb25jYXQoaXRlbVs1XSkgOiBcIlwiLCBcIiB7XCIpO1xuICAgICAgfVxuXG4gICAgICBjb250ZW50ICs9IGNzc1dpdGhNYXBwaW5nVG9TdHJpbmcoaXRlbSk7XG5cbiAgICAgIGlmIChuZWVkTGF5ZXIpIHtcbiAgICAgICAgY29udGVudCArPSBcIn1cIjtcbiAgICAgIH1cblxuICAgICAgaWYgKGl0ZW1bMl0pIHtcbiAgICAgICAgY29udGVudCArPSBcIn1cIjtcbiAgICAgIH1cblxuICAgICAgaWYgKGl0ZW1bNF0pIHtcbiAgICAgICAgY29udGVudCArPSBcIn1cIjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfSkuam9pbihcIlwiKTtcbiAgfTsgLy8gaW1wb3J0IGEgbGlzdCBvZiBtb2R1bGVzIGludG8gdGhlIGxpc3RcblxuXG4gIGxpc3QuaSA9IGZ1bmN0aW9uIGkobW9kdWxlcywgbWVkaWEsIGRlZHVwZSwgc3VwcG9ydHMsIGxheWVyKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGVzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBtb2R1bGVzID0gW1tudWxsLCBtb2R1bGVzLCB1bmRlZmluZWRdXTtcbiAgICB9XG5cbiAgICB2YXIgYWxyZWFkeUltcG9ydGVkTW9kdWxlcyA9IHt9O1xuXG4gICAgaWYgKGRlZHVwZSkge1xuICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCB0aGlzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgIHZhciBpZCA9IHRoaXNba11bMF07XG5cbiAgICAgICAgaWYgKGlkICE9IG51bGwpIHtcbiAgICAgICAgICBhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzW2lkXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBfayA9IDA7IF9rIDwgbW9kdWxlcy5sZW5ndGg7IF9rKyspIHtcbiAgICAgIHZhciBpdGVtID0gW10uY29uY2F0KG1vZHVsZXNbX2tdKTtcblxuICAgICAgaWYgKGRlZHVwZSAmJiBhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzW2l0ZW1bMF1dKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGxheWVyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaXRlbVs1XSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIGl0ZW1bNV0gPSBsYXllcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtWzFdID0gXCJAbGF5ZXJcIi5jb25jYXQoaXRlbVs1XS5sZW5ndGggPiAwID8gXCIgXCIuY29uY2F0KGl0ZW1bNV0pIDogXCJcIiwgXCIge1wiKS5jb25jYXQoaXRlbVsxXSwgXCJ9XCIpO1xuICAgICAgICAgIGl0ZW1bNV0gPSBsYXllcjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobWVkaWEpIHtcbiAgICAgICAgaWYgKCFpdGVtWzJdKSB7XG4gICAgICAgICAgaXRlbVsyXSA9IG1lZGlhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGl0ZW1bMV0gPSBcIkBtZWRpYSBcIi5jb25jYXQoaXRlbVsyXSwgXCIge1wiKS5jb25jYXQoaXRlbVsxXSwgXCJ9XCIpO1xuICAgICAgICAgIGl0ZW1bMl0gPSBtZWRpYTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc3VwcG9ydHMpIHtcbiAgICAgICAgaWYgKCFpdGVtWzRdKSB7XG4gICAgICAgICAgaXRlbVs0XSA9IFwiXCIuY29uY2F0KHN1cHBvcnRzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtWzFdID0gXCJAc3VwcG9ydHMgKFwiLmNvbmNhdChpdGVtWzRdLCBcIikge1wiKS5jb25jYXQoaXRlbVsxXSwgXCJ9XCIpO1xuICAgICAgICAgIGl0ZW1bNF0gPSBzdXBwb3J0cztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsaXN0LnB1c2goaXRlbSk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBsaXN0O1xufTsiLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXRlbSkge1xuICB2YXIgY29udGVudCA9IGl0ZW1bMV07XG4gIHZhciBjc3NNYXBwaW5nID0gaXRlbVszXTtcblxuICBpZiAoIWNzc01hcHBpbmcpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgYnRvYSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdmFyIGJhc2U2NCA9IGJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGNzc01hcHBpbmcpKSkpO1xuICAgIHZhciBkYXRhID0gXCJzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCxcIi5jb25jYXQoYmFzZTY0KTtcbiAgICB2YXIgc291cmNlTWFwcGluZyA9IFwiLyojIFwiLmNvbmNhdChkYXRhLCBcIiAqL1wiKTtcbiAgICB2YXIgc291cmNlVVJMcyA9IGNzc01hcHBpbmcuc291cmNlcy5tYXAoZnVuY3Rpb24gKHNvdXJjZSkge1xuICAgICAgcmV0dXJuIFwiLyojIHNvdXJjZVVSTD1cIi5jb25jYXQoY3NzTWFwcGluZy5zb3VyY2VSb290IHx8IFwiXCIpLmNvbmNhdChzb3VyY2UsIFwiICovXCIpO1xuICAgIH0pO1xuICAgIHJldHVybiBbY29udGVudF0uY29uY2F0KHNvdXJjZVVSTHMpLmNvbmNhdChbc291cmNlTWFwcGluZ10pLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW2NvbnRlbnRdLmpvaW4oXCJcXG5cIik7XG59OyIsIi8qKlxuICogZml0dHkgdjIuMy42IC0gU251Z2x5IHJlc2l6ZXMgdGV4dCB0byBmaXQgaXRzIHBhcmVudCBjb250YWluZXJcbiAqIENvcHlyaWdodCAoYykgMjAyMiBSaWsgU2NoZW5uaW5rIDxyaWtAcHFpbmEubmw+IChodHRwczovL3BxaW5hLm5sLylcbiAqL1xuXG52YXIgZT1mdW5jdGlvbihlKXtpZihlKXt2YXIgdD1mdW5jdGlvbihlKXtyZXR1cm5bXS5zbGljZS5jYWxsKGUpfSxuPTAsaT0xLHI9MixvPTMsYT1bXSxsPW51bGwsdT1cInJlcXVlc3RBbmltYXRpb25GcmFtZVwiaW4gZT9mdW5jdGlvbigpe2UuY2FuY2VsQW5pbWF0aW9uRnJhbWUobCksbD1lLnJlcXVlc3RBbmltYXRpb25GcmFtZSgoZnVuY3Rpb24oKXtyZXR1cm4gcyhhLmZpbHRlcigoZnVuY3Rpb24oZSl7cmV0dXJuIGUuZGlydHkmJmUuYWN0aXZlfSkpKX0pKX06ZnVuY3Rpb24oKXt9LGM9ZnVuY3Rpb24oZSl7cmV0dXJuIGZ1bmN0aW9uKCl7YS5mb3JFYWNoKChmdW5jdGlvbih0KXtyZXR1cm4gdC5kaXJ0eT1lfSkpLHUoKX19LHM9ZnVuY3Rpb24oZSl7ZS5maWx0ZXIoKGZ1bmN0aW9uKGUpe3JldHVybiFlLnN0eWxlQ29tcHV0ZWR9KSkuZm9yRWFjaCgoZnVuY3Rpb24oZSl7ZS5zdHlsZUNvbXB1dGVkPW0oZSl9KSksZS5maWx0ZXIoeSkuZm9yRWFjaCh2KTt2YXIgdD1lLmZpbHRlcihwKTt0LmZvckVhY2goZCksdC5mb3JFYWNoKChmdW5jdGlvbihlKXt2KGUpLGYoZSl9KSksdC5mb3JFYWNoKFMpfSxmPWZ1bmN0aW9uKGUpe3JldHVybiBlLmRpcnR5PW59LGQ9ZnVuY3Rpb24oZSl7ZS5hdmFpbGFibGVXaWR0aD1lLmVsZW1lbnQucGFyZW50Tm9kZS5jbGllbnRXaWR0aCxlLmN1cnJlbnRXaWR0aD1lLmVsZW1lbnQuc2Nyb2xsV2lkdGgsZS5wcmV2aW91c0ZvbnRTaXplPWUuY3VycmVudEZvbnRTaXplLGUuY3VycmVudEZvbnRTaXplPU1hdGgubWluKE1hdGgubWF4KGUubWluU2l6ZSxlLmF2YWlsYWJsZVdpZHRoL2UuY3VycmVudFdpZHRoKmUucHJldmlvdXNGb250U2l6ZSksZS5tYXhTaXplKSxlLndoaXRlU3BhY2U9ZS5tdWx0aUxpbmUmJmUuY3VycmVudEZvbnRTaXplPT09ZS5taW5TaXplP1wibm9ybWFsXCI6XCJub3dyYXBcIn0scD1mdW5jdGlvbihlKXtyZXR1cm4gZS5kaXJ0eSE9PXJ8fGUuZGlydHk9PT1yJiZlLmVsZW1lbnQucGFyZW50Tm9kZS5jbGllbnRXaWR0aCE9PWUuYXZhaWxhYmxlV2lkdGh9LG09ZnVuY3Rpb24odCl7dmFyIG49ZS5nZXRDb21wdXRlZFN0eWxlKHQuZWxlbWVudCxudWxsKTtyZXR1cm4gdC5jdXJyZW50Rm9udFNpemU9cGFyc2VGbG9hdChuLmdldFByb3BlcnR5VmFsdWUoXCJmb250LXNpemVcIikpLHQuZGlzcGxheT1uLmdldFByb3BlcnR5VmFsdWUoXCJkaXNwbGF5XCIpLHQud2hpdGVTcGFjZT1uLmdldFByb3BlcnR5VmFsdWUoXCJ3aGl0ZS1zcGFjZVwiKSwhMH0seT1mdW5jdGlvbihlKXt2YXIgdD0hMTtyZXR1cm4hZS5wcmVTdHlsZVRlc3RDb21wbGV0ZWQmJigvaW5saW5lLS8udGVzdChlLmRpc3BsYXkpfHwodD0hMCxlLmRpc3BsYXk9XCJpbmxpbmUtYmxvY2tcIiksXCJub3dyYXBcIiE9PWUud2hpdGVTcGFjZSYmKHQ9ITAsZS53aGl0ZVNwYWNlPVwibm93cmFwXCIpLGUucHJlU3R5bGVUZXN0Q29tcGxldGVkPSEwLHQpfSx2PWZ1bmN0aW9uKGUpe2UuZWxlbWVudC5zdHlsZS53aGl0ZVNwYWNlPWUud2hpdGVTcGFjZSxlLmVsZW1lbnQuc3R5bGUuZGlzcGxheT1lLmRpc3BsYXksZS5lbGVtZW50LnN0eWxlLmZvbnRTaXplPWUuY3VycmVudEZvbnRTaXplK1wicHhcIn0sUz1mdW5jdGlvbihlKXtlLmVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJmaXRcIix7ZGV0YWlsOntvbGRWYWx1ZTplLnByZXZpb3VzRm9udFNpemUsbmV3VmFsdWU6ZS5jdXJyZW50Rm9udFNpemUsc2NhbGVGYWN0b3I6ZS5jdXJyZW50Rm9udFNpemUvZS5wcmV2aW91c0ZvbnRTaXplfX0pKX0saD1mdW5jdGlvbihlLHQpe3JldHVybiBmdW5jdGlvbigpe2UuZGlydHk9dCxlLmFjdGl2ZSYmdSgpfX0sdz1mdW5jdGlvbihlKXtyZXR1cm4gZnVuY3Rpb24oKXthPWEuZmlsdGVyKChmdW5jdGlvbih0KXtyZXR1cm4gdC5lbGVtZW50IT09ZS5lbGVtZW50fSkpLGUub2JzZXJ2ZU11dGF0aW9ucyYmZS5vYnNlcnZlci5kaXNjb25uZWN0KCksZS5lbGVtZW50LnN0eWxlLndoaXRlU3BhY2U9ZS5vcmlnaW5hbFN0eWxlLndoaXRlU3BhY2UsZS5lbGVtZW50LnN0eWxlLmRpc3BsYXk9ZS5vcmlnaW5hbFN0eWxlLmRpc3BsYXksZS5lbGVtZW50LnN0eWxlLmZvbnRTaXplPWUub3JpZ2luYWxTdHlsZS5mb250U2l6ZX19LGI9ZnVuY3Rpb24oZSl7cmV0dXJuIGZ1bmN0aW9uKCl7ZS5hY3RpdmV8fChlLmFjdGl2ZT0hMCx1KCkpfX0sej1mdW5jdGlvbihlKXtyZXR1cm4gZnVuY3Rpb24oKXtyZXR1cm4gZS5hY3RpdmU9ITF9fSxGPWZ1bmN0aW9uKGUpe2Uub2JzZXJ2ZU11dGF0aW9ucyYmKGUub2JzZXJ2ZXI9bmV3IE11dGF0aW9uT2JzZXJ2ZXIoaChlLGkpKSxlLm9ic2VydmVyLm9ic2VydmUoZS5lbGVtZW50LGUub2JzZXJ2ZU11dGF0aW9ucykpfSxnPXttaW5TaXplOjE2LG1heFNpemU6NTEyLG11bHRpTGluZTohMCxvYnNlcnZlTXV0YXRpb25zOlwiTXV0YXRpb25PYnNlcnZlclwiaW4gZSYme3N1YnRyZWU6ITAsY2hpbGRMaXN0OiEwLGNoYXJhY3RlckRhdGE6ITB9fSxXPW51bGwsRT1mdW5jdGlvbigpe2UuY2xlYXJUaW1lb3V0KFcpLFc9ZS5zZXRUaW1lb3V0KGMocikseC5vYnNlcnZlV2luZG93RGVsYXkpfSxNPVtcInJlc2l6ZVwiLFwib3JpZW50YXRpb25jaGFuZ2VcIl07cmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh4LFwib2JzZXJ2ZVdpbmRvd1wiLHtzZXQ6ZnVuY3Rpb24odCl7dmFyIG49XCJcIi5jb25jYXQodD9cImFkZFwiOlwicmVtb3ZlXCIsXCJFdmVudExpc3RlbmVyXCIpO00uZm9yRWFjaCgoZnVuY3Rpb24odCl7ZVtuXSh0LEUpfSkpfX0pLHgub2JzZXJ2ZVdpbmRvdz0hMCx4Lm9ic2VydmVXaW5kb3dEZWxheT0xMDAseC5maXRBbGw9YyhvKSx4fWZ1bmN0aW9uIEMoZSx0KXt2YXIgbj1PYmplY3QuYXNzaWduKHt9LGcsdCksaT1lLm1hcCgoZnVuY3Rpb24oZSl7dmFyIHQ9T2JqZWN0LmFzc2lnbih7fSxuLHtlbGVtZW50OmUsYWN0aXZlOiEwfSk7cmV0dXJuIGZ1bmN0aW9uKGUpe2Uub3JpZ2luYWxTdHlsZT17d2hpdGVTcGFjZTplLmVsZW1lbnQuc3R5bGUud2hpdGVTcGFjZSxkaXNwbGF5OmUuZWxlbWVudC5zdHlsZS5kaXNwbGF5LGZvbnRTaXplOmUuZWxlbWVudC5zdHlsZS5mb250U2l6ZX0sRihlKSxlLm5ld2JpZT0hMCxlLmRpcnR5PSEwLGEucHVzaChlKX0odCkse2VsZW1lbnQ6ZSxmaXQ6aCh0LG8pLHVuZnJlZXplOmIodCksZnJlZXplOnoodCksdW5zdWJzY3JpYmU6dyh0KX19KSk7cmV0dXJuIHUoKSxpfWZ1bmN0aW9uIHgoZSl7dmFyIG49YXJndW1lbnRzLmxlbmd0aD4xJiZ2b2lkIDAhPT1hcmd1bWVudHNbMV0/YXJndW1lbnRzWzFdOnt9O3JldHVyblwic3RyaW5nXCI9PXR5cGVvZiBlP0ModChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGUpKSxuKTpDKFtlXSxuKVswXX19KFwidW5kZWZpbmVkXCI9PXR5cGVvZiB3aW5kb3c/bnVsbDp3aW5kb3cpO2V4cG9ydCBkZWZhdWx0IGU7XG4iLCJcbiAgICAgIGltcG9ydCBBUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanNcIjtcbiAgICAgIGltcG9ydCBkb21BUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZURvbUFQSS5qc1wiO1xuICAgICAgaW1wb3J0IGluc2VydEZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5zZXJ0QnlTZWxlY3Rvci5qc1wiO1xuICAgICAgaW1wb3J0IHNldEF0dHJpYnV0ZXMgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXMuanNcIjtcbiAgICAgIGltcG9ydCBpbnNlcnRTdHlsZUVsZW1lbnQgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRTdHlsZUVsZW1lbnQuanNcIjtcbiAgICAgIGltcG9ydCBzdHlsZVRhZ1RyYW5zZm9ybUZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVUYWdUcmFuc2Zvcm0uanNcIjtcbiAgICAgIGltcG9ydCBjb250ZW50LCAqIGFzIG5hbWVkRXhwb3J0IGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzPz9ydWxlU2V0WzFdLnJ1bGVzWzBdLnVzZVsxXSEuL3dpZGdldC5jc3NcIjtcbiAgICAgIFxuICAgICAgXG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuc3R5bGVUYWdUcmFuc2Zvcm0gPSBzdHlsZVRhZ1RyYW5zZm9ybUZuO1xub3B0aW9ucy5zZXRBdHRyaWJ1dGVzID0gc2V0QXR0cmlidXRlcztcblxuICAgICAgb3B0aW9ucy5pbnNlcnQgPSBpbnNlcnRGbi5iaW5kKG51bGwsIFwiaGVhZFwiKTtcbiAgICBcbm9wdGlvbnMuZG9tQVBJID0gZG9tQVBJO1xub3B0aW9ucy5pbnNlcnRTdHlsZUVsZW1lbnQgPSBpbnNlcnRTdHlsZUVsZW1lbnQ7XG5cbnZhciB1cGRhdGUgPSBBUEkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgKiBmcm9tIFwiISEuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcz8/cnVsZVNldFsxXS5ydWxlc1swXS51c2VbMV0hLi93aWRnZXQuY3NzXCI7XG4gICAgICAgZXhwb3J0IGRlZmF1bHQgY29udGVudCAmJiBjb250ZW50LmxvY2FscyA/IGNvbnRlbnQubG9jYWxzIDogdW5kZWZpbmVkO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBzdHlsZXNJbkRPTSA9IFtdO1xuXG5mdW5jdGlvbiBnZXRJbmRleEJ5SWRlbnRpZmllcihpZGVudGlmaWVyKSB7XG4gIHZhciByZXN1bHQgPSAtMTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0eWxlc0luRE9NLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHN0eWxlc0luRE9NW2ldLmlkZW50aWZpZXIgPT09IGlkZW50aWZpZXIpIHtcbiAgICAgIHJlc3VsdCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBtb2R1bGVzVG9Eb20obGlzdCwgb3B0aW9ucykge1xuICB2YXIgaWRDb3VudE1hcCA9IHt9O1xuICB2YXIgaWRlbnRpZmllcnMgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGxpc3RbaV07XG4gICAgdmFyIGlkID0gb3B0aW9ucy5iYXNlID8gaXRlbVswXSArIG9wdGlvbnMuYmFzZSA6IGl0ZW1bMF07XG4gICAgdmFyIGNvdW50ID0gaWRDb3VudE1hcFtpZF0gfHwgMDtcbiAgICB2YXIgaWRlbnRpZmllciA9IFwiXCIuY29uY2F0KGlkLCBcIiBcIikuY29uY2F0KGNvdW50KTtcbiAgICBpZENvdW50TWFwW2lkXSA9IGNvdW50ICsgMTtcbiAgICB2YXIgaW5kZXhCeUlkZW50aWZpZXIgPSBnZXRJbmRleEJ5SWRlbnRpZmllcihpZGVudGlmaWVyKTtcbiAgICB2YXIgb2JqID0ge1xuICAgICAgY3NzOiBpdGVtWzFdLFxuICAgICAgbWVkaWE6IGl0ZW1bMl0sXG4gICAgICBzb3VyY2VNYXA6IGl0ZW1bM10sXG4gICAgICBzdXBwb3J0czogaXRlbVs0XSxcbiAgICAgIGxheWVyOiBpdGVtWzVdXG4gICAgfTtcblxuICAgIGlmIChpbmRleEJ5SWRlbnRpZmllciAhPT0gLTEpIHtcbiAgICAgIHN0eWxlc0luRE9NW2luZGV4QnlJZGVudGlmaWVyXS5yZWZlcmVuY2VzKys7XG4gICAgICBzdHlsZXNJbkRPTVtpbmRleEJ5SWRlbnRpZmllcl0udXBkYXRlcihvYmopO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdXBkYXRlciA9IGFkZEVsZW1lbnRTdHlsZShvYmosIG9wdGlvbnMpO1xuICAgICAgb3B0aW9ucy5ieUluZGV4ID0gaTtcbiAgICAgIHN0eWxlc0luRE9NLnNwbGljZShpLCAwLCB7XG4gICAgICAgIGlkZW50aWZpZXI6IGlkZW50aWZpZXIsXG4gICAgICAgIHVwZGF0ZXI6IHVwZGF0ZXIsXG4gICAgICAgIHJlZmVyZW5jZXM6IDFcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlkZW50aWZpZXJzLnB1c2goaWRlbnRpZmllcik7XG4gIH1cblxuICByZXR1cm4gaWRlbnRpZmllcnM7XG59XG5cbmZ1bmN0aW9uIGFkZEVsZW1lbnRTdHlsZShvYmosIG9wdGlvbnMpIHtcbiAgdmFyIGFwaSA9IG9wdGlvbnMuZG9tQVBJKG9wdGlvbnMpO1xuICBhcGkudXBkYXRlKG9iaik7XG5cbiAgdmFyIHVwZGF0ZXIgPSBmdW5jdGlvbiB1cGRhdGVyKG5ld09iaikge1xuICAgIGlmIChuZXdPYmopIHtcbiAgICAgIGlmIChuZXdPYmouY3NzID09PSBvYmouY3NzICYmIG5ld09iai5tZWRpYSA9PT0gb2JqLm1lZGlhICYmIG5ld09iai5zb3VyY2VNYXAgPT09IG9iai5zb3VyY2VNYXAgJiYgbmV3T2JqLnN1cHBvcnRzID09PSBvYmouc3VwcG9ydHMgJiYgbmV3T2JqLmxheWVyID09PSBvYmoubGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhcGkudXBkYXRlKG9iaiA9IG5ld09iaik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwaS5yZW1vdmUoKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHVwZGF0ZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGxpc3QsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGxpc3QgPSBsaXN0IHx8IFtdO1xuICB2YXIgbGFzdElkZW50aWZpZXJzID0gbW9kdWxlc1RvRG9tKGxpc3QsIG9wdGlvbnMpO1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlKG5ld0xpc3QpIHtcbiAgICBuZXdMaXN0ID0gbmV3TGlzdCB8fCBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFzdElkZW50aWZpZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaWRlbnRpZmllciA9IGxhc3RJZGVudGlmaWVyc1tpXTtcbiAgICAgIHZhciBpbmRleCA9IGdldEluZGV4QnlJZGVudGlmaWVyKGlkZW50aWZpZXIpO1xuICAgICAgc3R5bGVzSW5ET01baW5kZXhdLnJlZmVyZW5jZXMtLTtcbiAgICB9XG5cbiAgICB2YXIgbmV3TGFzdElkZW50aWZpZXJzID0gbW9kdWxlc1RvRG9tKG5ld0xpc3QsIG9wdGlvbnMpO1xuXG4gICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGxhc3RJZGVudGlmaWVycy5sZW5ndGg7IF9pKyspIHtcbiAgICAgIHZhciBfaWRlbnRpZmllciA9IGxhc3RJZGVudGlmaWVyc1tfaV07XG5cbiAgICAgIHZhciBfaW5kZXggPSBnZXRJbmRleEJ5SWRlbnRpZmllcihfaWRlbnRpZmllcik7XG5cbiAgICAgIGlmIChzdHlsZXNJbkRPTVtfaW5kZXhdLnJlZmVyZW5jZXMgPT09IDApIHtcbiAgICAgICAgc3R5bGVzSW5ET01bX2luZGV4XS51cGRhdGVyKCk7XG5cbiAgICAgICAgc3R5bGVzSW5ET00uc3BsaWNlKF9pbmRleCwgMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGFzdElkZW50aWZpZXJzID0gbmV3TGFzdElkZW50aWZpZXJzO1xuICB9O1xufTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIG1lbW8gPSB7fTtcbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuXG5mdW5jdGlvbiBnZXRUYXJnZXQodGFyZ2V0KSB7XG4gIGlmICh0eXBlb2YgbWVtb1t0YXJnZXRdID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgdmFyIHN0eWxlVGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXQpOyAvLyBTcGVjaWFsIGNhc2UgdG8gcmV0dXJuIGhlYWQgb2YgaWZyYW1lIGluc3RlYWQgb2YgaWZyYW1lIGl0c2VsZlxuXG4gICAgaWYgKHdpbmRvdy5IVE1MSUZyYW1lRWxlbWVudCAmJiBzdHlsZVRhcmdldCBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MSUZyYW1lRWxlbWVudCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gVGhpcyB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBhY2Nlc3MgdG8gaWZyYW1lIGlzIGJsb2NrZWRcbiAgICAgICAgLy8gZHVlIHRvIGNyb3NzLW9yaWdpbiByZXN0cmljdGlvbnNcbiAgICAgICAgc3R5bGVUYXJnZXQgPSBzdHlsZVRhcmdldC5jb250ZW50RG9jdW1lbnQuaGVhZDtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICAgICAgc3R5bGVUYXJnZXQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1lbW9bdGFyZ2V0XSA9IHN0eWxlVGFyZ2V0O1xuICB9XG5cbiAgcmV0dXJuIG1lbW9bdGFyZ2V0XTtcbn1cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuXG5cbmZ1bmN0aW9uIGluc2VydEJ5U2VsZWN0b3IoaW5zZXJ0LCBzdHlsZSkge1xuICB2YXIgdGFyZ2V0ID0gZ2V0VGFyZ2V0KGluc2VydCk7XG5cbiAgaWYgKCF0YXJnZXQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZG4ndCBmaW5kIGEgc3R5bGUgdGFyZ2V0LiBUaGlzIHByb2JhYmx5IG1lYW5zIHRoYXQgdGhlIHZhbHVlIGZvciB0aGUgJ2luc2VydCcgcGFyYW1ldGVyIGlzIGludmFsaWQuXCIpO1xuICB9XG5cbiAgdGFyZ2V0LmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbnNlcnRCeVNlbGVjdG9yOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAgKi9cbmZ1bmN0aW9uIGluc2VydFN0eWxlRWxlbWVudChvcHRpb25zKSB7XG4gIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICBvcHRpb25zLnNldEF0dHJpYnV0ZXMoZWxlbWVudCwgb3B0aW9ucy5hdHRyaWJ1dGVzKTtcbiAgb3B0aW9ucy5pbnNlcnQoZWxlbWVudCwgb3B0aW9ucy5vcHRpb25zKTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5zZXJ0U3R5bGVFbGVtZW50OyIsIlwidXNlIHN0cmljdFwiO1xuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAgKi9cbmZ1bmN0aW9uIHNldEF0dHJpYnV0ZXNXaXRob3V0QXR0cmlidXRlcyhzdHlsZUVsZW1lbnQpIHtcbiAgdmFyIG5vbmNlID0gdHlwZW9mIF9fd2VicGFja19ub25jZV9fICE9PSBcInVuZGVmaW5lZFwiID8gX193ZWJwYWNrX25vbmNlX18gOiBudWxsO1xuXG4gIGlmIChub25jZSkge1xuICAgIHN0eWxlRWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJub25jZVwiLCBub25jZSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXM7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuZnVuY3Rpb24gYXBwbHkoc3R5bGVFbGVtZW50LCBvcHRpb25zLCBvYmopIHtcbiAgdmFyIGNzcyA9IFwiXCI7XG5cbiAgaWYgKG9iai5zdXBwb3J0cykge1xuICAgIGNzcyArPSBcIkBzdXBwb3J0cyAoXCIuY29uY2F0KG9iai5zdXBwb3J0cywgXCIpIHtcIik7XG4gIH1cblxuICBpZiAob2JqLm1lZGlhKSB7XG4gICAgY3NzICs9IFwiQG1lZGlhIFwiLmNvbmNhdChvYmoubWVkaWEsIFwiIHtcIik7XG4gIH1cblxuICB2YXIgbmVlZExheWVyID0gdHlwZW9mIG9iai5sYXllciAhPT0gXCJ1bmRlZmluZWRcIjtcblxuICBpZiAobmVlZExheWVyKSB7XG4gICAgY3NzICs9IFwiQGxheWVyXCIuY29uY2F0KG9iai5sYXllci5sZW5ndGggPiAwID8gXCIgXCIuY29uY2F0KG9iai5sYXllcikgOiBcIlwiLCBcIiB7XCIpO1xuICB9XG5cbiAgY3NzICs9IG9iai5jc3M7XG5cbiAgaWYgKG5lZWRMYXllcikge1xuICAgIGNzcyArPSBcIn1cIjtcbiAgfVxuXG4gIGlmIChvYmoubWVkaWEpIHtcbiAgICBjc3MgKz0gXCJ9XCI7XG4gIH1cblxuICBpZiAob2JqLnN1cHBvcnRzKSB7XG4gICAgY3NzICs9IFwifVwiO1xuICB9XG5cbiAgdmFyIHNvdXJjZU1hcCA9IG9iai5zb3VyY2VNYXA7XG5cbiAgaWYgKHNvdXJjZU1hcCAmJiB0eXBlb2YgYnRvYSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGNzcyArPSBcIlxcbi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsXCIuY29uY2F0KGJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHNvdXJjZU1hcCkpKSksIFwiICovXCIpO1xuICB9IC8vIEZvciBvbGQgSUVcblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgICovXG5cblxuICBvcHRpb25zLnN0eWxlVGFnVHJhbnNmb3JtKGNzcywgc3R5bGVFbGVtZW50LCBvcHRpb25zLm9wdGlvbnMpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVTdHlsZUVsZW1lbnQoc3R5bGVFbGVtZW50KSB7XG4gIC8vIGlzdGFuYnVsIGlnbm9yZSBpZlxuICBpZiAoc3R5bGVFbGVtZW50LnBhcmVudE5vZGUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdHlsZUVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzdHlsZUVsZW1lbnQpO1xufVxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgICovXG5cblxuZnVuY3Rpb24gZG9tQVBJKG9wdGlvbnMpIHtcbiAgdmFyIHN0eWxlRWxlbWVudCA9IG9wdGlvbnMuaW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMpO1xuICByZXR1cm4ge1xuICAgIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKG9iaikge1xuICAgICAgYXBwbHkoc3R5bGVFbGVtZW50LCBvcHRpb25zLCBvYmopO1xuICAgIH0sXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgICByZW1vdmVTdHlsZUVsZW1lbnQoc3R5bGVFbGVtZW50KTtcbiAgICB9XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZG9tQVBJOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAgKi9cbmZ1bmN0aW9uIHN0eWxlVGFnVHJhbnNmb3JtKGNzcywgc3R5bGVFbGVtZW50KSB7XG4gIGlmIChzdHlsZUVsZW1lbnQuc3R5bGVTaGVldCkge1xuICAgIHN0eWxlRWxlbWVudC5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3M7XG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKHN0eWxlRWxlbWVudC5maXJzdENoaWxkKSB7XG4gICAgICBzdHlsZUVsZW1lbnQucmVtb3ZlQ2hpbGQoc3R5bGVFbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgIH1cblxuICAgIHN0eWxlRWxlbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3MpKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN0eWxlVGFnVHJhbnNmb3JtOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0aWQ6IG1vZHVsZUlkLFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgJy4vd2lkZ2V0LmNzcydcclxuaW1wb3J0IGFuaW1lIGZyb20gJ2FuaW1lanMnXHJcbmltcG9ydCBmaXR0eSBmcm9tICdmaXR0eSdcclxuXHJcbi8qID09PT09PT09PT09PT09PT09PT0gVkFSSUFCTEVTICYgU0VUVVAgPT09PT09PT09PT09PT09PT09PSAqL1xyXG5jb25zdCBDT0xPUlMgPSB7XHJcbiAgICBwcmltYXJ5OiAnIzE5NzZkMicsXHJcbiAgICBzZWNvbmRhcnk6ICcjMTUzMTVkJyxcclxuICAgIGFjY2VudDogJyNmZmM0MDAnLFxyXG4gICAgd2hpdGU6ICcjZjlmOWY5JyxcclxuICAgIGJsYWNrOiAnIzFhMWExYScsXHJcbiAgICBhaGVhZDogJyM5OWZmOTknLFxyXG4gICAgYmVoaW5kOiAnI2ZmOTk5OSdcclxufVxyXG5cclxuY29uc3QgckxpdmVzcGxpdCA9IG5vZGVjZy5SZXBsaWNhbnQoJ2xpdmVzcGxpdCcpXHJcbmNvbnN0IHJMb2dvcyA9IG5vZGVjZy5SZXBsaWNhbnQoJ2Fzc2V0czpsb2dvcycpXHJcbmNvbnN0IGluZm9EaXNwbGF5cyA9IFsnZGVsdGEnLCAnYmVzdFBvc3NpYmxlVGltZScsICdmaW5hbFRpbWUnXVxyXG5jb25zdCBhbmltYXRpb25zID0gW3tcclxuICAgIHRsOiBjcmVhdGVUcmFuc2l0aW9uVGltZWxpbmUoKSxcclxuICAgIGR1cmF0aW9uOiAyODUwLFxyXG4gICAgc2FmZVRpbWU6IDI4NTAgLyAyXHJcbn0sIHtcclxuICAgIHRsOiBjcmVhdGVHb2xkU3BsaXRUaW1lbGluZSgpLFxyXG4gICAgZHVyYXRpb246IDEwMDBcclxufV1cclxuXHJcbmxldCBjdXJyZW50SW5mb0luZGV4ID0gMFxyXG5cclxuZml0dHkoJy5zaHJpbmstZml0ID4gcCcsIHtcclxuICAgIG1pblNpemU6IDEyLFxyXG4gICAgbWF4U2l6ZTogNTZcclxufSlcclxuXHJcbi8qID09PT09PT09PT09PT09PT09PT0gUkVQTElDQU5UUyA9PT09PT09PT09PT09PT09PT09ICovXHJcblxyXG5yTGl2ZXNwbGl0Lm9uKCdjaGFuZ2UnLCAobmV3VmFsdWUsIG9sZFZhbHVlKSA9PiB7XHJcbiAgICBjb25zdCBjb25uU3RhdHVzID0gbmV3VmFsdWUuY29ubmVjdGlvbi5zdGF0dXNcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25uZWN0aW9uLXN0YXR1cycpLnRleHRDb250ZW50ID0gYCR7Y29ublN0YXR1cy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKX0ke2Nvbm5TdGF0dXMuc2xpY2UoMSl9ICR7Y29ublN0YXR1cyA9PT0gJ2Nvbm5lY3RlZCcgPyAndG8nIDogJ2Zyb20nfSBMaXZlU3BsaXRgXHJcblxyXG4gICAgaWYgKG5ld1ZhbHVlLnRpbWVyKSB7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3dpZGdldC10aW1lci1jdXJyZW50IC50aW1lci1tYWluJykuaW5uZXJUZXh0ID0gbmV3VmFsdWUudGltZXIuY3VycmVudFRpbWUuc2xpY2UoMCwgLTIpXHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3dpZGdldC10aW1lci1jdXJyZW50IC50aW1lci1zdWInKS5pbm5lclRleHQgPSBuZXdWYWx1ZS50aW1lci5jdXJyZW50VGltZS5zbGljZSgtMilcclxuXHJcbiAgICAgICAgT2JqZWN0LmtleXMobmV3VmFsdWUudGltZXIpLmZvckVhY2goKGssIGkpID0+IHtcclxuICAgICAgICAgICAgaWYgKGluZm9EaXNwbGF5cy5pbmNsdWRlcyhrKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBgI3dpZGdldC10aW1lci0ke2t9YFxyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihxdWVyeSArICcgLnRpbWVyLW1haW4nKS5pbm5lclRleHQgPSBuZXdWYWx1ZS50aW1lcltrXS5zbGljZSgwLCAtMilcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocXVlcnkgKyAnIC50aW1lci1zdWInKS5pbm5lclRleHQgPSBuZXdWYWx1ZS50aW1lcltrXS5zbGljZSgtMilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmIChuZXdWYWx1ZS50aW1lci5kZWx0YSAmJiBuZXdWYWx1ZS50aW1lci5kZWx0YS5jaGFyQXQoMCkgPT09ICcrJykge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2lkZ2V0LXRpbWVyLWRlbHRhJykuY2xhc3NMaXN0LmFkZCgndGltZXItYmVoaW5kJylcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dpZGdldC10aW1lci1kZWx0YScpLmNsYXNzTGlzdC5yZW1vdmUoJ3RpbWVyLWFoZWFkJylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2lkZ2V0LXRpbWVyLWRlbHRhJykuY2xhc3NMaXN0LmFkZCgndGltZXItYWhlYWQnKVxyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2lkZ2V0LXRpbWVyLWRlbHRhJykuY2xhc3NMaXN0LnJlbW92ZSgndGltZXItYmVoaW5kJylcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pXHJcblxyXG4vKiA9PT09PT09PT09PT09PT09PT09IE1FU1NBR0VTID09PT09PT09PT09PT09PT09PT0gKi9cclxuXHJcbm5vZGVjZy5saXN0ZW5Gb3IoJ2NoYW5nZUluZm9EaXNwbGF5JywgKCkgPT4ge1xyXG4gICAgY2hhbmdlSW5mb0Rpc3BsYXkoKVxyXG59KVxyXG5cclxubm9kZWNnLmxpc3RlbkZvcignc3BsaXQnLCBzZWdtZW50ID0+IHtcclxuICAgIG9uU3BsaXQoc2VnbWVudClcclxufSlcclxuXHJcbm5vZGVjZy5saXN0ZW5Gb3IoJ3VuZG9TcGxpdCcsIHNlZ21lbnQgPT4ge1xyXG4gICAgb25VbmRvU3BsaXQoc2VnbWVudClcclxufSlcclxuXHJcbi8qID09PT09PT09PT09PT09PT09PT0gU1RBVEUgQ0hBTkdFUyA9PT09PT09PT09PT09PT09PT09ICovXHJcblxyXG5mdW5jdGlvbiBjaGFuZ2VJbmZvRGlzcGxheShwbGF5QW5pbWF0aW9uID0gdHJ1ZSkge1xyXG4gICAgY29uc3QgYW5pbWF0aW9uID0gYW5pbWF0aW9uc1swXVxyXG4gICAgY29uc3QgY3VycmVudEluZm8gPSBpbmZvRGlzcGxheXNbY3VycmVudEluZm9JbmRleF1cclxuICAgIGN1cnJlbnRJbmZvSW5kZXggPSBjdXJyZW50SW5mb0luZGV4ID09PSBpbmZvRGlzcGxheXMubGVuZ3RoIC0gMSA/IDAgOiBjdXJyZW50SW5mb0luZGV4ICsgMVxyXG4gICAgY29uc3QgbmV4dEluZm8gPSBpbmZvRGlzcGxheXNbY3VycmVudEluZm9JbmRleF1cclxuXHJcbiAgICBpZiAocGxheUFuaW1hdGlvbikge1xyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy53aWRnZXQtcmlnaHQtYW5pbWF0aW9ucycpLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSdcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2lkZ2V0LXJpZ2h0LXRyYW5zaXRpb24tdGV4dCcpLmlubmVyVGV4dCA9IG5leHRJbmZvLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbmV4dEluZm8uc2xpY2UoMSlcclxuICAgICAgICBhbmltYXRpb24udGwuZmluaXNoZWQudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy53aWRnZXQtcmlnaHQtYW5pbWF0aW9ucycpLnN0eWxlLnZpc2libGl0eSA9ICdoaWRkZW4nXHJcbiAgICAgICAgfSlcclxuICAgICAgICBhbmltYXRpb24udGwucGxheSgpXHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHdpZGdldC10aW1lci0ke2N1cnJlbnRJbmZvfWApLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpXHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHdpZGdldC10aW1lci0ke25leHRJbmZvfWApLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpXHJcbiAgICB9LCBhbmltYXRpb24uc2FmZVRpbWUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uU3BsaXQoc2VnbWVudCkge1xyXG4gICAgaWYgKHNlZ21lbnQuaXNHb2xkKSB7XHJcbiAgICAgICAgLy8gUGxheSBnb2xkIHNwbGl0IGFuaW1hdGlvblxyXG4gICAgICAgIGNvbnN0IGFuaW1hdGlvbiA9IGFuaW1hdGlvbnNbMV1cclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjd2lkZ2V0LWZ1bGwtYW5pbWF0aW9ucycpLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSdcclxuICAgICAgICBhbmltYXRpb24udGwuZmluaXNoZWQudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN3aWRnZXQtZnVsbC1hbmltYXRpb25zJykuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nXHJcbiAgICAgICAgfSlcclxuICAgICAgICBhbmltYXRpb24udGwucGxheSgpXHJcblxyXG4gICAgICAgIC8vIEFkZCBzb21lIGRlbGF5IGZvciB0aGUgbmV4dCBhbmltYXRpb25cclxuICAgIH1cclxuXHJcbiAgICAvLyBEaXNwbGF5IHNvbWUgYWRkaXRpb25hbCBpbmZvIGFib3V0IHRoZSBzZWdtZW50XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uVW5kb1NwbGl0KHNlZ21lbnQpIHtcclxuICAgIC8vIENhbmNlbCBhbnkgYW5pbWF0aW9ucyBpbiBwcm9ncmVzcywgZXhjZXB0IHRoZSBpbmZvIGRpc3BsYXkgY2hhbmdlXHJcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGFuaW1hdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBhbmltYXRpb25zW2ldLnRsLnJlc3RhcnQoKVxyXG4gICAgICAgIGFuaW1hdGlvbnNbaV0udGwucGF1c2UoKVxyXG4gICAgfVxyXG59XHJcblxyXG4vKiA9PT09PT09PT09PT09PT09PT09IEFOSU1BVElPTlMgPT09PT09PT09PT09PT09PT09PSAqL1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlVHJhbnNpdGlvblRpbWVsaW5lKCkge1xyXG4gICAgY29uc3QgZnVsbFdpZHRoID0gYW5pbWUuZ2V0KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy53aWRnZXQtcmlnaHQtYW5pbWF0aW9ucycpLCAnd2lkdGgnKVxyXG4gICAgY29uc3QgZWFzZU91dCA9ICdlYXNlT3V0Q3ViaWMnXHJcbiAgICBjb25zdCBlYXNlSW4gPSAnZWFzZUluQ3ViaWMnXHJcblxyXG4gICAgY29uc3QgdGwgPSBhbmltZS50aW1lbGluZSh7XHJcbiAgICAgICAgZWFzaW5nOiBlYXNlT3V0LFxyXG4gICAgICAgIGF1dG9wbGF5OiBmYWxzZVxyXG4gICAgfSlcclxuXHJcbiAgICBjb25zdCBzbWFsbEJveEFuaW0gPSB7XHJcbiAgICAgICAgdGFyZ2V0czogJy53aWRnZXQtcmlnaHQtYW5pbWF0aW9ucyAudHJhbnNpdGlvbi1ib3gtc21hbGwnLFxyXG4gICAgICAgIHRyYW5zbGF0ZVg6IFtcclxuICAgICAgICAgICAgeyB2YWx1ZTogZnVsbFdpZHRoLCBkdXJhdGlvbjogNTAwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IDAsIGR1cmF0aW9uOiAwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGZ1bGxXaWR0aCwgZHVyYXRpb246IDUwMCwgZGVsYXk6IDE4NTAsIGVhc2luZzogZWFzZUluIH1cclxuICAgICAgICBdXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbGFyZ2VCb3hBbmltID0ge1xyXG4gICAgICAgIHRhcmdldHM6ICcud2lkZ2V0LXJpZ2h0LWFuaW1hdGlvbnMgLnRyYW5zaXRpb24tYm94LWxhcmdlJyxcclxuICAgICAgICB3aWR0aDogW1xyXG4gICAgICAgICAgICB7IHZhbHVlOiBbMCwgJzEwMCUnXSwgZHVyYXRpb246IDUwMCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiAwLCBkdXJhdGlvbjogNTAwLCBkZWxheTogMTUwMCwgZWFzaW5nOiBlYXNlSW4gfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHRyYW5zbGF0ZVg6IFtcclxuICAgICAgICAgICAgeyB2YWx1ZTogZnVsbFdpZHRoLCBkdXJhdGlvbjogNTAwLCBkZWxheTogMjAwMCwgZWFzaW5nOiBlYXNlSW4gfVxyXG4gICAgICAgIF1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0ZXh0QW5pbSA9IHtcclxuICAgICAgICB0YXJnZXRzOiAnI3dpZGdldC1yaWdodC10cmFuc2l0aW9uLXRleHQnLFxyXG4gICAgICAgIHRyYW5zbGF0ZVg6IFtcclxuICAgICAgICAgICAgeyB2YWx1ZTogWyctMjAwJScsIDBdLCBkdXJhdGlvbjogMzMzIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IDIwLCBkdXJhdGlvbjogMTUwMCwgZWFzaW5nOiAnbGluZWFyJyB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiAnMjAwJScsIGR1cmF0aW9uOiAzMzMsIGVhc2luZzogZWFzZUluIH1cclxuICAgICAgICBdXHJcbiAgICB9XHJcblxyXG4gICAgdGwuYWRkKHNtYWxsQm94QW5pbSkuYWRkKGxhcmdlQm94QW5pbSwgMTMzKS5hZGQodGV4dEFuaW0sIDMwMClcclxuXHJcbiAgICByZXR1cm4gdGxcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlR29sZFNwbGl0VGltZWxpbmUoKSB7XHJcbiAgICBjb25zdCBlYXNlT3V0ID0gJ2Vhc2VPdXRDdWJpYydcclxuICAgIGNvbnN0IGVhc2VJbiA9ICdlYXNlSW5DdWJpYydcclxuXHJcbiAgICBjb25zdCB0bCA9IGFuaW1lLnRpbWVsaW5lKHtcclxuICAgICAgICBlYXNpbmc6IGVhc2VPdXQsXHJcbiAgICAgICAgYXV0b3BsYXk6IGZhbHNlLFxyXG4gICAgICAgIGR1cmF0aW9uOiAzMDBcclxuICAgIH0pXHJcblxyXG4gICAgY29uc3QgbG9nb091dCA9IGxvZ29FeGl0KClcclxuICAgIGNvbnN0IGxvZ29JbiA9IHtcclxuICAgICAgICB0YXJnZXRzOiAnLndpZGdldC1pbm5lci1jaXJjbGUnLFxyXG4gICAgICAgIHNjYWxlOiAxLFxyXG4gICAgICAgIGR1cmF0aW9uOiA1MDAsXHJcbiAgICAgICAgZWFzaW5nOiAnZWFzZU91dEVsYXN0aWMnXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcHVsc2UgPSB7XHJcbiAgICAgICAgdGFyZ2V0czogJyN3aWRnZXQtZnVsbC1hbmltYXRpb25zIC50cmFuc2l0aW9uLWNpcmNsZScsXHJcbiAgICAgICAgc2NhbGU6IFswLCA2XSxcclxuICAgICAgICBvcGFjaXR5OiAwLFxyXG4gICAgICAgIGRlbGF5OiBhbmltZS5zdGFnZ2VyKDIwMCwgeyBlYXNpbmc6ICdlYXNlT3V0UXVhZCcgfSlcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmaWxsQm94SW4gPSB7XHJcbiAgICAgICAgdGFyZ2V0czogJyN3aWRnZXQtZnVsbC1hbmltYXRpb25zIC50cmFuc2l0aW9uLWNpcmNsZS1mdWxsJyxcclxuICAgICAgICBzY2FsZTogWzAsIDZdXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdGV4dEluID0ge1xyXG4gICAgICAgIHRhcmdldHM6ICcjd2lkZ2V0LWZ1bGwtYW5pbWF0aW9ucyAudGV4dCcsXHJcbiAgICAgICAgc2NhbGU6IFtcclxuICAgICAgICAgICAgeyB2YWx1ZTogMCwgZHVyYXRpb246IDAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogMC45LCBkdXJhdGlvbjogMzAwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IDEsIGR1cmF0aW9uOiA1MDAwLCBlYXNpbmc6ICdsaW5lYXInIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIG9wYWNpdHk6IFswLCAxXVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRleHRBbmRGaWxsQm94T3V0ID0ge1xyXG4gICAgICAgIHRhcmdldHM6IFsnI3dpZGdldC1mdWxsLWFuaW1hdGlvbnMgLnRleHQnLCAnI3dpZGdldC1mdWxsLWFuaW1hdGlvbnMgLnRyYW5zaXRpb24tY2lyY2xlLWZ1bGwnXSxcclxuICAgICAgICBzY2FsZTogMS41LFxyXG4gICAgICAgIG9wYWNpdHk6IDAsXHJcbiAgICAgICAgZHVyYXRpb246IDEwMDAsXHJcbiAgICAgICAgZGVsYXk6IGFuaW1lLnN0YWdnZXIoNTAwKVxyXG4gICAgfVxyXG5cclxuICAgIHRsLmFkZChsb2dvT3V0KVxyXG4gICAgICAgIC5hZGQocHVsc2UsICctPTUwMCcpXHJcbiAgICAgICAgLmFkZChmaWxsQm94SW4sICctPTI1MCcpXHJcbiAgICAgICAgLmFkZCh0ZXh0SW4sICctPTEwMCcpXHJcbiAgICAgICAgLmFkZCh0ZXh0QW5kRmlsbEJveE91dClcclxuICAgICAgICAuYWRkKGxvZ29JbiwgJy09MzAwJylcclxuXHJcbiAgICByZXR1cm4gdGxcclxufVxyXG5cclxuZnVuY3Rpb24gbG9nb0V4aXQoKSB7XHJcbiAgICBhZGRNb3Rpb25CbHVyKCcud2lkZ2V0LWlubmVyLWNpcmNsZScpXHJcblxyXG4gICAgLy8gV2Ugc2V0IHRoaXMgaW4gdGhlIENTUyBjbGFzc2VzLCBidXQgdGhlIGFuaW1hdGlvbiB3aWxsIG92ZXJyaWRlIGl0IGlmIHdlIGRvbid0IHNldCBpdCBpbmxpbmVcclxuICAgIGFuaW1lLnNldCgnLndpZGdldC1pbm5lci1jaXJjbGUnLCB7XHJcbiAgICAgICAgdHJhbnNsYXRlWDogJy01MCUnXHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdGFyZ2V0czogJy53aWRnZXQtaW5uZXItY2lyY2xlJyxcclxuICAgICAgICBzY2FsZTogW1xyXG4gICAgICAgICAgICB7IHZhbHVlOiAxLCBkdXJhdGlvbjogNDAwMCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiAxLjUsIGR1cmF0aW9uOiAxMDAwLCBlYXNpbmc6ICdlYXNlSW5RdWFkJyB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiAwLCBkdXJhdGlvbjogMTAwMCwgZWFzaW5nOiAnZWFzZUluRWxhc3RpYycgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgcm90YXRlOiBbXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IDEwODAgKiAyNywgZHVyYXRpb246IDYwMDAsIGVhc2luZzogJ2Vhc2VJbkV4cG8nLCBkZWxheTogYW5pbWUuc3RhZ2dlcigxMCkgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHRyYW5zbGF0ZVg6IFtcclxuICAgICAgICAgICAgeyB2YWx1ZTogJy01MCUnLCBkdXJhdGlvbjogNDAwMCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTUxLCAtNDkpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC01MSwgLTQ5KSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtNTEsIC00OSkgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTUxLCAtNDkpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC01MSwgLTQ5KSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtNTEsIC00OSkgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTUxLCAtNDkpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC01MSwgLTQ5KSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtNTEsIC00OSkgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTUxLCAtNDkpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC01MiwgLTQ4KSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtNTIsIC00OCkgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTUyLCAtNDgpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC01MiwgLTQ4KSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtNTIsIC00OCkgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTUyLCAtNDgpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC01MiwgLTQ4KSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtNTIsIC00OCkgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTUyLCAtNDgpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC01MiwgLTQ4KSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtNTMsIC00NykgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTUzLCAtNDcpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC01MywgLTQ3KSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtNTMsIC00NykgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTUzLCAtNDcpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogJy01MCUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogJy01MCUnLCBkdXJhdGlvbjogNzAwIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIHRyYW5zbGF0ZVk6IFtcclxuICAgICAgICAgICAgeyB2YWx1ZTogMCwgZHVyYXRpb246IDQwMDAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC0xLCAxKSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtMSwgMSkgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTEsIDEpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC0xLCAxKSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtMSwgMSkgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTEsIDEpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC0xLCAxKSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtMSwgMSkgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTEsIDEpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC0xLCAxKSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtMiwgMikgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTIsIDIpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC0yLCAyKSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtMiwgMikgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTIsIDIpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC0yLCAyKSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtMiwgMikgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTIsIDIpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC0yLCAyKSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtMiwgMikgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTMsIDMpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC0zLCAzKSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IGFuaW1lLnJhbmRvbSgtMywgMykgKyAnJScsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBhbmltZS5yYW5kb20oLTMsIDMpICsgJyUnLCBkdXJhdGlvbjogNTAgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogYW5pbWUucmFuZG9tKC0zLCAzKSArICclJywgZHVyYXRpb246IDUwIH0sXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IDAsIGR1cmF0aW9uOiA1MCB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiAwLCBkdXJhdGlvbjogNzAwIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIGJvcmRlckNvbG9yOiBbXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IENPTE9SUy53aGl0ZSwgZHVyYXRpb246IDMwMDAsIGRlbGF5OiAxMDAwLCBlYXNpbmc6ICdlYXNlSW5FeHBvJyB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBDT0xPUlMuYWNjZW50LCBkdXJhdGlvbjogMTAwMCwgZGVsYXk6IDc1MCwgZWFzaW5nOiAnZWFzZUluRXhwbycgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogQ09MT1JTLmJsYWNrLCBkZWxheTogMjUwIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFtcclxuICAgICAgICAgICAgeyB2YWx1ZTogQ09MT1JTLmFjY2VudCwgZHVyYXRpb246IDEwMDAsIGRlbGF5OiA1MDAwLCBlYXNpbmc6ICdlYXNlSW5FeHBvJyB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiBDT0xPUlMuc2Vjb25kYXJ5IH1cclxuICAgICAgICBdXHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIENyZWF0ZXMgZHVwbGljYXRlIGVsZW1lbnRzIHRvIHNpbXVsYXRlIG1vdGlvbiBibHVyXHJcbmZ1bmN0aW9uIGFkZE1vdGlvbkJsdXIoc2VsZWN0b3IsIHN0ZXBzID0gMTApIHtcclxuICAgIGNvbnN0IGVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKVxyXG4gICAgY29uc3QgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ZXBzIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgZHVwZSA9IGVsZW0uY2xvbmVOb2RlKClcclxuICAgICAgICBkdXBlLnN0eWxlLm9wYWNpdHkgPSAxIC0gMS9zdGVwcyAtIGkvc3RlcHNcclxuICAgICAgICBkdXBlLnN0eWxlLmJveFNoYWRvdyA9ICdub25lJ1xyXG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChkdXBlKVxyXG4gICAgfVxyXG59Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9