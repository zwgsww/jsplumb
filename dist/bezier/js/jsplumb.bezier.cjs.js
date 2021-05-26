'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Vectors = {
  subtract: function subtract(v1, v2) {
    return {
      x: v1.x - v2.x,
      y: v1.y - v2.y
    };
  },
  dotProduct: function dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  },
  square: function square(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },
  scale: function scale(v, s) {
    return {
      x: v.x * s,
      y: v.y * s
    };
  }
};
var maxRecursion = 64;
var flatnessTolerance = Math.pow(2.0, -maxRecursion - 1);
function distanceFromCurve(point, curve) {
  var candidates = [],
      w = _convertToBezier(point, curve),
      degree = curve.length - 1,
      higherDegree = 2 * degree - 1,
      numSolutions = _findRoots(w, higherDegree, candidates, 0),
      v = Vectors.subtract(point, curve[0]),
      dist = Vectors.square(v),
      t = 0.0,
      newDist;
  for (var i = 0; i < numSolutions; i++) {
    v = Vectors.subtract(point, _bezier(curve, degree, candidates[i], null, null));
    newDist = Vectors.square(v);
    if (newDist < dist) {
      dist = newDist;
      t = candidates[i];
    }
  }
  v = Vectors.subtract(point, curve[degree]);
  newDist = Vectors.square(v);
  if (newDist < dist) {
    dist = newDist;
    t = 1.0;
  }
  return {
    location: t,
    distance: dist
  };
}
function nearestPointOnCurve(point, curve) {
  var td = distanceFromCurve(point, curve);
  return {
    point: _bezier(curve, curve.length - 1, td.location, null, null),
    location: td.location
  };
}
function _convertToBezier(point, curve) {
  var degree = curve.length - 1,
      higherDegree = 2 * degree - 1,
      c = [],
      d = [],
      cdTable = [],
      w = [],
      z = [[1.0, 0.6, 0.3, 0.1], [0.4, 0.6, 0.6, 0.4], [0.1, 0.3, 0.6, 1.0]];
  for (var i = 0; i <= degree; i++) {
    c[i] = Vectors.subtract(curve[i], point);
  }
  for (var _i = 0; _i <= degree - 1; _i++) {
    d[_i] = Vectors.subtract(curve[_i + 1], curve[_i]);
    d[_i] = Vectors.scale(d[_i], 3.0);
  }
  for (var row = 0; row <= degree - 1; row++) {
    for (var column = 0; column <= degree; column++) {
      if (!cdTable[row]) cdTable[row] = [];
      cdTable[row][column] = Vectors.dotProduct(d[row], c[column]);
    }
  }
  for (var _i2 = 0; _i2 <= higherDegree; _i2++) {
    if (!w[_i2]) {
      w[_i2] = [];
    }
    w[_i2].y = 0.0;
    w[_i2].x = parseFloat("" + _i2) / higherDegree;
  }
  var n = degree,
      m = degree - 1;
  for (var k = 0; k <= n + m; k++) {
    var lb = Math.max(0, k - m),
        ub = Math.min(k, n);
    for (var _i3 = lb; _i3 <= ub; _i3++) {
      var j = k - _i3;
      w[_i3 + j].y += cdTable[j][_i3] * z[j][_i3];
    }
  }
  return w;
}
function _findRoots(w, degree, t, depth) {
  var left = [],
      right = [],
      left_count,
      right_count,
      left_t = [],
      right_t = [];
  switch (_getCrossingCount(w, degree)) {
    case 0:
      {
        return 0;
      }
    case 1:
      {
        if (depth >= maxRecursion) {
          t[0] = (w[0].x + w[degree].x) / 2.0;
          return 1;
        }
        if (_isFlatEnough(w, degree)) {
          t[0] = _computeXIntercept(w, degree);
          return 1;
        }
        break;
      }
  }
  _bezier(w, degree, 0.5, left, right);
  left_count = _findRoots(left, degree, left_t, depth + 1);
  right_count = _findRoots(right, degree, right_t, depth + 1);
  for (var i = 0; i < left_count; i++) {
    t[i] = left_t[i];
  }
  for (var _i4 = 0; _i4 < right_count; _i4++) {
    t[_i4 + left_count] = right_t[_i4];
  }
  return left_count + right_count;
}
function _getCrossingCount(curve, degree) {
  var n_crossings = 0,
      sign,
      old_sign;
  sign = old_sign = sgn(curve[0].y);
  for (var i = 1; i <= degree; i++) {
    sign = sgn(curve[i].y);
    if (sign != old_sign) n_crossings++;
    old_sign = sign;
  }
  return n_crossings;
}
function _isFlatEnough(curve, degree) {
  var error, intercept_1, intercept_2, left_intercept, right_intercept, a, b, c, det, dInv, a1, b1, c1, a2, b2, c2;
  a = curve[0].y - curve[degree].y;
  b = curve[degree].x - curve[0].x;
  c = curve[0].x * curve[degree].y - curve[degree].x * curve[0].y;
  var max_distance_above, max_distance_below;
  max_distance_above = max_distance_below = 0.0;
  for (var i = 1; i < degree; i++) {
    var value = a * curve[i].x + b * curve[i].y + c;
    if (value > max_distance_above) {
      max_distance_above = value;
    } else if (value < max_distance_below) {
      max_distance_below = value;
    }
  }
  a1 = 0.0;
  b1 = 1.0;
  c1 = 0.0;
  a2 = a;
  b2 = b;
  c2 = c - max_distance_above;
  det = a1 * b2 - a2 * b1;
  dInv = 1.0 / det;
  intercept_1 = (b1 * c2 - b2 * c1) * dInv;
  a2 = a;
  b2 = b;
  c2 = c - max_distance_below;
  det = a1 * b2 - a2 * b1;
  dInv = 1.0 / det;
  intercept_2 = (b1 * c2 - b2 * c1) * dInv;
  left_intercept = Math.min(intercept_1, intercept_2);
  right_intercept = Math.max(intercept_1, intercept_2);
  error = right_intercept - left_intercept;
  return error < flatnessTolerance ? 1 : 0;
}
function _computeXIntercept(curve, degree) {
  var XLK = 1.0,
      YLK = 0.0,
      XNM = curve[degree].x - curve[0].x,
      YNM = curve[degree].y - curve[0].y,
      XMK = curve[0].x - 0.0,
      YMK = curve[0].y - 0.0,
      det = XNM * YLK - YNM * XLK,
      detInv = 1.0 / det,
      S = (XNM * YMK - YNM * XMK) * detInv;
  return 0.0 + XLK * S;
}
function _bezier(curve, degree, t, left, right) {
  var temp = [[]];
  for (var j = 0; j <= degree; j++) {
    temp[0][j] = curve[j];
  }
  for (var i = 1; i <= degree; i++) {
    for (var _j = 0; _j <= degree - i; _j++) {
      if (!temp[i]) temp[i] = [];
      if (!temp[i][_j]) temp[i][_j] = {};
      temp[i][_j].x = (1.0 - t) * temp[i - 1][_j].x + t * temp[i - 1][_j + 1].x;
      temp[i][_j].y = (1.0 - t) * temp[i - 1][_j].y + t * temp[i - 1][_j + 1].y;
    }
  }
  if (left != null) {
    for (var _j2 = 0; _j2 <= degree; _j2++) {
      left[_j2] = temp[_j2][0];
    }
  }
  if (right != null) {
    for (var _j3 = 0; _j3 <= degree; _j3++) {
      right[_j3] = temp[degree - _j3][_j3];
    }
  }
  return temp[degree][0];
}
function _getLUT(steps, curve) {
  var out = [];
  steps--;
  for (var n = 0; n <= steps; n++) {
    out.push(_computeLookup(n / steps, curve));
  }
  return out;
}
function _computeLookup(e, curve) {
  var EMPTY_POINT = {
    x: 0,
    y: 0
  };
  if (e === 0) {
    return curve[0];
  }
  var degree = curve.length - 1;
  if (e === 1) {
    return curve[degree];
  }
  var o = curve;
  var s = 1 - e;
  if (degree === 0) {
    return curve[0];
  }
  if (degree === 1) {
    return {
      x: s * o[0].x + e * o[1].x,
      y: s * o[0].y + e * o[1].y
    };
  }
  if (4 > degree) {
    var l = s * s,
        h = e * e,
        u = 0,
        m,
        g,
        f;
    if (degree === 2) {
      o = [o[0], o[1], o[2], EMPTY_POINT];
      m = l;
      g = 2 * (s * e);
      f = h;
    } else if (degree === 3) {
      m = l * s;
      g = 3 * (l * e);
      f = 3 * (s * h);
      u = e * h;
    }
    return {
      x: m * o[0].x + g * o[1].x + f * o[2].x + u * o[3].x,
      y: m * o[0].y + g * o[1].y + f * o[2].y + u * o[3].y
    };
  } else {
    return EMPTY_POINT;
  }
}
function computeBezierLength(curve) {
  var length = 0;
  if (!isPoint(curve)) {
    var steps = 16;
    var lut = _getLUT(steps, curve);
    for (var i = 0; i < steps - 1; i++) {
      var a = lut[i],
          b = lut[i + 1];
      length += dist(a, b);
    }
  }
  return length;
}
var _curveFunctionCache = new Map();
function _getCurveFunctions(order) {
  var fns = _curveFunctionCache.get(order);
  if (!fns) {
    fns = [];
    var f_term = function f_term() {
      return function (t) {
        return Math.pow(t, order);
      };
    },
        l_term = function l_term() {
      return function (t) {
        return Math.pow(1 - t, order);
      };
    },
        c_term = function c_term(c) {
      return function (t) {
        return c;
      };
    },
        t_term = function t_term() {
      return function (t) {
        return t;
      };
    },
        one_minus_t_term = function one_minus_t_term() {
      return function (t) {
        return 1 - t;
      };
    },
        _termFunc = function _termFunc(terms) {
      return function (t) {
        var p = 1;
        for (var i = 0; i < terms.length; i++) {
          p = p * terms[i](t);
        }
        return p;
      };
    };
    fns.push(f_term());
    for (var i = 1; i < order; i++) {
      var terms = [c_term(order)];
      for (var j = 0; j < order - i; j++) {
        terms.push(t_term());
      }
      for (var _j4 = 0; _j4 < i; _j4++) {
        terms.push(one_minus_t_term());
      }
      fns.push(_termFunc(terms));
    }
    fns.push(l_term());
    _curveFunctionCache.set(order, fns);
  }
  return fns;
}
function pointOnCurve(curve, location) {
  var cc = _getCurveFunctions(curve.length - 1),
      _x = 0,
      _y = 0;
  for (var i = 0; i < curve.length; i++) {
    _x = _x + curve[i].x * cc[i](location);
    _y = _y + curve[i].y * cc[i](location);
  }
  return {
    x: _x,
    y: _y
  };
}
function dist(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
function isPoint(curve) {
  return curve[0].x === curve[1].x && curve[0].y === curve[1].y;
}
function pointAlongPath(curve, location, distance) {
  if (isPoint(curve)) {
    return {
      point: curve[0],
      location: location
    };
  }
  var prev = pointOnCurve(curve, location),
      tally = 0,
      curLoc = location,
      direction = distance > 0 ? 1 : -1,
      cur = null;
  while (tally < Math.abs(distance)) {
    curLoc += 0.005 * direction;
    cur = pointOnCurve(curve, curLoc);
    tally += dist(cur, prev);
    prev = cur;
  }
  return {
    point: cur,
    location: curLoc
  };
}
function pointAlongCurveFrom(curve, location, distance) {
  return pointAlongPath(curve, location, distance).point;
}
function locationAlongCurveFrom(curve, location, distance) {
  return pointAlongPath(curve, location, distance).location;
}
function gradientAtPoint(curve, location) {
  var p1 = pointOnCurve(curve, location),
      p2 = pointOnCurve(curve.slice(0, curve.length - 1), location),
      dy = p2.y - p1.y,
      dx = p2.x - p1.x;
  return dy === 0 ? Infinity : Math.atan(dy / dx);
}
function gradientAtPointAlongPathFrom(curve, location, distance) {
  var p = pointAlongPath(curve, location, distance);
  if (p.location > 1) p.location = 1;
  if (p.location < 0) p.location = 0;
  return gradientAtPoint(curve, p.location);
}
function perpendicularToPathAt(curve, location, length, distance) {
  distance = distance == null ? 0 : distance;
  var p = pointAlongPath(curve, location, distance),
      m = gradientAtPoint(curve, p.location),
      _theta2 = Math.atan(-1 / m),
      y = length / 2 * Math.sin(_theta2),
      x = length / 2 * Math.cos(_theta2);
  return [{
    x: p.point.x + x,
    y: p.point.y + y
  }, {
    x: p.point.x - x,
    y: p.point.y - y
  }];
}
function lineIntersection(x1, y1, x2, y2, curve) {
  var a = y2 - y1,
      b = x1 - x2,
      c = x1 * (y1 - y2) + y1 * (x2 - x1),
      coeffs = _computeCoefficients(curve),
      p = [a * coeffs[0][0] + b * coeffs[1][0], a * coeffs[0][1] + b * coeffs[1][1], a * coeffs[0][2] + b * coeffs[1][2], a * coeffs[0][3] + b * coeffs[1][3] + c],
      r = _cubicRoots.apply(null, p),
      intersections = [];
  if (r != null) {
    for (var i = 0; i < 3; i++) {
      var _t = r[i],
          t2 = Math.pow(_t, 2),
          t3 = Math.pow(_t, 3),
          x = {
        x: coeffs[0][0] * t3 + coeffs[0][1] * t2 + coeffs[0][2] * _t + coeffs[0][3],
        y: coeffs[1][0] * t3 + coeffs[1][1] * t2 + coeffs[1][2] * _t + coeffs[1][3]
      };
      var s = void 0;
      if (x2 - x1 !== 0) {
        s = (x[0] - x1) / (x2 - x1);
      } else {
        s = (x[1] - y1) / (y2 - y1);
      }
      if (_t >= 0 && _t <= 1.0 && s >= 0 && s <= 1.0) {
        intersections.push(x);
      }
    }
  }
  return intersections;
}
function boxIntersection(x, y, w, h, curve) {
  var i = [];
  i.push.apply(i, lineIntersection(x, y, x + w, y, curve));
  i.push.apply(i, lineIntersection(x + w, y, x + w, y + h, curve));
  i.push.apply(i, lineIntersection(x + w, y + h, x, y + h, curve));
  i.push.apply(i, lineIntersection(x, y + h, x, y, curve));
  return i;
}
function boundingBoxIntersection(boundingBox, curve) {
  var i = [];
  i.push.apply(i, lineIntersection(boundingBox.x, boundingBox.y, boundingBox.x + boundingBox.w, boundingBox.y, curve));
  i.push.apply(i, lineIntersection(boundingBox.x + boundingBox.w, boundingBox.y, boundingBox.x + boundingBox.w, boundingBox.y + boundingBox.h, curve));
  i.push.apply(i, lineIntersection(boundingBox.x + boundingBox.w, boundingBox.y + boundingBox.h, boundingBox.x, boundingBox.y + boundingBox.h, curve));
  i.push.apply(i, lineIntersection(boundingBox.x, boundingBox.y + boundingBox.h, boundingBox.x, boundingBox.y, curve));
  return i;
}
function _computeCoefficientsForAxis(curve, axis) {
  return [-curve[0][axis] + 3 * curve[1][axis] + -3 * curve[2][axis] + curve[3][axis], 3 * curve[0][axis] - 6 * curve[1][axis] + 3 * curve[2][axis], -3 * curve[0][axis] + 3 * curve[1][axis], curve[0][axis]];
}
function _computeCoefficients(curve) {
  return [_computeCoefficientsForAxis(curve, "x"), _computeCoefficientsForAxis(curve, "y")];
}
function sgn(x) {
  return x < 0 ? -1 : x > 0 ? 1 : 0;
}
function _cubicRoots(a, b, c, d) {
  var A = b / a,
      B = c / a,
      C = d / a,
      Q = (3 * B - Math.pow(A, 2)) / 9,
      R = (9 * A * B - 27 * C - 2 * Math.pow(A, 3)) / 54,
      D = Math.pow(Q, 3) + Math.pow(R, 2),
      S,
      T,
      t = [0, 0, 0];
  if (D >= 0)
    {
      S = sgn(R + Math.sqrt(D)) * Math.pow(Math.abs(R + Math.sqrt(D)), 1 / 3);
      T = sgn(R - Math.sqrt(D)) * Math.pow(Math.abs(R - Math.sqrt(D)), 1 / 3);
      t[0] = -A / 3 + (S + T);
      t[1] = -A / 3 - (S + T) / 2;
      t[2] = -A / 3 - (S + T) / 2;
      if (Math.abs(Math.sqrt(3) * (S - T) / 2) !== 0) {
        t[1] = -1;
        t[2] = -1;
      }
    } else
    {
      var th = Math.acos(R / Math.sqrt(-Math.pow(Q, 3)));
      t[0] = 2 * Math.sqrt(-Q) * Math.cos(th / 3) - A / 3;
      t[1] = 2 * Math.sqrt(-Q) * Math.cos((th + 2 * Math.PI) / 3) - A / 3;
      t[2] = 2 * Math.sqrt(-Q) * Math.cos((th + 4 * Math.PI) / 3) - A / 3;
    }
  for (var i = 0; i < 3; i++) {
    if (t[i] < 0 || t[i] > 1.0) {
      t[i] = -1;
    }
  }
  return t;
}

exports.boundingBoxIntersection = boundingBoxIntersection;
exports.boxIntersection = boxIntersection;
exports.computeBezierLength = computeBezierLength;
exports.dist = dist;
exports.distanceFromCurve = distanceFromCurve;
exports.gradientAtPoint = gradientAtPoint;
exports.gradientAtPointAlongPathFrom = gradientAtPointAlongPathFrom;
exports.isPoint = isPoint;
exports.lineIntersection = lineIntersection;
exports.locationAlongCurveFrom = locationAlongCurveFrom;
exports.nearestPointOnCurve = nearestPointOnCurve;
exports.perpendicularToPathAt = perpendicularToPathAt;
exports.pointAlongCurveFrom = pointAlongCurveFrom;
exports.pointAlongPath = pointAlongPath;
exports.pointOnCurve = pointOnCurve;
