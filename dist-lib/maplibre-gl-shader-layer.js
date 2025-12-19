var $ = Object.defineProperty;
var H = (r, t, e) => t in r ? $(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[t] = e;
var c = (r, t, e) => H(r, typeof t != "symbol" ? t + "" : t, e);
import { Mesh as K, Vector3 as T, Quaternion as J, Matrix4 as j, Camera as Y, Scene as X, PlaneGeometry as q, WebGLRenderer as Q, CanvasTexture as ee, TextureLoader as te, RawShaderMaterial as b, GLSL3 as w, BackSide as S } from "three";
import y, { MercatorCoordinate as ne } from "maplibre-gl";
import R from "color";
import oe from "quick-lru";
function V(r, t, e = !0) {
  const o = 2 ** t, n = {
    z: t,
    x: r[0] * o,
    y: r[1] * o
  };
  return e && (n.x = Math.floor(n.x), n.y = Math.floor(n.y)), n;
}
function ie(r, t, e = !0) {
  const o = ne.fromLngLat(r);
  return V([o.x, o.y], t, e);
}
function re(r, t) {
  const e = r.getBounds(), o = y.MercatorCoordinate.fromLngLat(e.getNorthWest()), n = y.MercatorCoordinate.fromLngLat(e.getSouthEast()), a = 1e-6;
  o.y = Math.max(o.y, 0), o.y = Math.min(o.y, 1 - a), n.y = Math.max(n.y, 0), n.y = Math.min(n.y, 1 - a);
  const i = V([o.x, o.y], t, !0), l = V([n.x, n.y], t, !0);
  return {
    min: {
      z: t,
      x: i.x,
      y: i.y
    },
    max: {
      z: t,
      x: l.x,
      y: l.y
    }
  };
}
function ae(r) {
  const t = [], e = r.min.z;
  for (let o = r.min.y; o <= r.max.y; o += 1)
    for (let n = r.min.x; n <= r.max.x; n += 1)
      t.push({ z: e, x: n, y: o });
  return t;
}
function G(r) {
  const t = 2 ** r.z;
  let e = r.x % t;
  return e < 0 && (e = t + e), {
    x: e,
    y: r.y,
    z: r.z
  };
}
function se(r) {
  const e = 1 / 2 ** r.z, o = new y.MercatorCoordinate(r.x * e + e / 2, r.y * e + e / 2);
  return {
    mercSize: e,
    mercCenter: o
  };
}
function le(r, t, e, o) {
  const { mercCenter: n, mercSize: a } = se(r), i = e * 0.05, l = o * 0.05, s = -i, u = e + i, m = -l, d = o + l;
  let f = t.project(n.toLngLat());
  if (f.x >= s && f.x <= u && f.y >= m && f.y <= d)
    return !0;
  const h = a / 2, x = new y.MercatorCoordinate(n.x - h, n.y - h);
  if (f = t.project(x.toLngLat()), f.x >= s && f.x <= u && f.y >= m && f.y <= d)
    return !0;
  const p = new y.MercatorCoordinate(n.x + h, n.y - h);
  if (f = t.project(p.toLngLat()), f.x >= s && f.x <= u && f.y >= m && f.y <= d)
    return !0;
  const g = new y.MercatorCoordinate(n.x - h, n.y + h);
  if (f = t.project(g.toLngLat()), f.x >= s && f.x <= u && f.y >= m && f.y <= d)
    return !0;
  const A = new y.MercatorCoordinate(n.x + h, n.y + h);
  return f = t.project(A.toLngLat()), f.x >= s && f.x <= u && f.y >= m && f.y <= d;
}
function ce(r, t) {
  return t < r[0] ? r[0] : t > r[1] ? r[1] : t;
}
function z(r, t) {
  const e = document.createElement("canvas");
  e.width = r.width, e.height = r.height;
  const o = e.getContext("2d");
  if (!o) return null;
  const n = Math.floor(t[0] * r.width), a = Math.floor(t[1] * r.height);
  return o.drawImage(r, 0, 0), o.getImageData(n, a, 1, 1).data;
}
class ue extends K {
  constructor(e, o) {
    super(e == null ? void 0 : e.clone(), o);
    c(this, "tileIndex", { z: 0, x: 0, y: 0 });
    this.matrixAutoUpdate = !1, this.matrixWorldAutoUpdate = !1;
  }
  /**
   * Defines the tile index and position the tile in the mercator space
   */
  setTileIndex(e) {
    this.tileIndex.x = e.x, this.tileIndex.y = e.y, this.tileIndex.z = e.z;
  }
  /**
   * Get the tile index (a copy)
   */
  getTileIndex() {
    return {
      x: this.tileIndex.x,
      y: this.tileIndex.y,
      z: this.tileIndex.z
    };
  }
  /**
   * Get the tile index as an array
   */
  getTileIndexAsArray() {
    return [this.tileIndex.x, this.tileIndex.y, this.tileIndex.z];
  }
}
function et(r, t) {
  const e = new T(), o = new J(), n = new T();
  r.decompose(e, o, n);
  const a = new j(), i = typeof t == "number" ? new T(t, t, t) : t;
  return a.compose(e, o, i), a;
}
const me = `precision highp float;
precision highp int;

#define PI 3.14159265359
#define EARTH_RADIUS 6371008.8

uniform mat4 modelViewMatrix; // optional
uniform mat4 projectionMatrix; // optional
uniform vec3 tileIndex; // tile index
uniform bool isGlobe;
uniform float altitude;

// Both position and vPosition are in [-0.5., 0.5.]
in vec3 position;
in vec2 uv;

// This vPositionUnit is in [0., 1.] to make it easier to map textures
out vec2 vPositionUnit;

// Longitude / latitude in radians: (lon, lat)
out highp vec2 vLonLat;


vec2 mercatorToLonLat(vec2 mercator) {
  float y = mercator.y;
  float lon = mercator.x * 360.0 - 180.0;  // degrees
  float lat = (2.0 * atan(exp(PI - 2.0 * PI * y)) - PI * 0.5) * 180.0 / PI;  // degrees
  return vec2(lon, lat);
}


vec2 getMercatorCoords(vec2 uv, vec3 tileIndex) {
  float scale = 1.0 / float(1 << int(tileIndex.z));
  return vec2(
    uv.x * scale + tileIndex.x * scale,
    uv.y * scale + tileIndex.y * scale
  );
}

vec3 projectTileCoordinatesToSphere(vec2 uv, vec3 tileIndex, out vec2 lonLat) {
  vec2 mercator = getMercatorCoords(uv, tileIndex);
  lonLat = mercatorToLonLat(mercator);
  float sphericalX = mod(mercator.x * PI * 2.0 + PI, PI * 2.0);
  float sphericalY = 2.0 * atan(exp(PI - (mercator.y * PI * 2.0))) - PI * 0.5;
  float len = cos(sphericalY);

  // Add a small offset to make the vertices float above the surface
  float altitudeUnit = altitude / EARTH_RADIUS;
  return vec3(
    sin(sphericalX) * len * (1.0 + altitudeUnit),
    sin(sphericalY) * (1.0 + altitudeUnit),
    cos(sphericalX) * len * (1.0 + altitudeUnit)
  );
}

vec3 projectTileCoordinatesToMercator(vec2 uv, vec3 tileIndex, out vec2 lonLat) {
  vec2 mercator = getMercatorCoords(uv, tileIndex);
  lonLat = mercatorToLonLat(mercator);
  // Add a small offset to make the vertices float above the surface
  float altitudeUnit =  altitude / EARTH_RADIUS / (2. * PI);
  return vec3(mercator.x, mercator.y, altitudeUnit);
}

void main()	{
  vPositionUnit = position.xy + 0.5;
  vec2 lonLat;
 
  // Place the vertices of the tile planes (subdivided in many triangles)
  // directly in shader using the UV from ThreeJS
  vec3 worldPos = isGlobe ? projectTileCoordinatesToSphere(uv, tileIndex, lonLat) : projectTileCoordinatesToMercator(uv, tileIndex, lonLat);
  vLonLat = lonLat;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( worldPos, 1.0 );
}


`;
class P {
  constructor(t, e) {
    c(this, "id");
    c(this, "type", "custom");
    c(this, "renderingMode", "3d");
    c(this, "map");
    c(this, "renderer");
    c(this, "camera");
    c(this, "scene");
    // protected tileContainer!: Object3D;
    c(this, "debugMaterial");
    c(this, "tileGeometry");
    c(this, "minZoom");
    c(this, "maxZoom");
    c(this, "showBelowMinZoom");
    c(this, "showBeyondMaxZoom");
    c(this, "shouldShowCurrent");
    c(this, "tilePool", []);
    c(this, "usedTileMap", /* @__PURE__ */ new Map());
    c(this, "unusedTileList", []);
    c(this, "onSetTileMaterial");
    c(this, "onTileUpdate", null);
    c(this, "tileZoomFittingFunction", Math.floor);
    c(this, "opacity", 1);
    c(this, "altitude", 0);
    c(this, "isVisible", !0);
    c(this, "defaultVertexShader", me);
    this.id = t, this.initScene(), this.minZoom = e.minZoom ?? 0, this.maxZoom = e.maxZoom ?? 22, this.showBelowMinZoom = e.showBelowMinZoom ?? !1, this.showBeyondMaxZoom = e.showBeyondMaxZoom ?? !0, this.onSetTileMaterial = e.onSetTileMaterial, this.onTileUpdate = e.onTileUpdate ?? null, this.opacity = Math.max(0, Math.min(e.opacity ?? 1, 1)), e && e.tileZoomFitting && (e.tileZoomFitting === "CEIL" ? this.tileZoomFittingFunction = Math.ceil : e.tileZoomFitting === "ROUND" && (this.tileZoomFittingFunction = Math.round));
  }
  setVisible(t) {
    this.isVisible = t, this.map && this.map.triggerRepaint();
  }
  initScene() {
    this.camera = new Y(), this.scene = new X(), this.tileGeometry = new q(1, 1, 32, 32);
  }
  /**
   * Compute the correct zoom level based on the map zoom level and the provided options.
   * The returned value is an integer.
   */
  getAppropriateZoomLevel() {
    const t = this.tileZoomFittingFunction(this.map.getZoom());
    return t < this.minZoom ? this.minZoom : t > this.maxZoom ? this.maxZoom : t;
  }
  shouldShow() {
    const t = Math.max(0, Math.floor(this.map.getZoom()));
    return !(t < this.minZoom && !this.showBelowMinZoom || t > this.maxZoom && !this.showBeyondMaxZoom);
  }
  onAdd(t, e) {
    this.map = t, this.renderer = new Q({
      canvas: t.getCanvas(),
      context: e,
      antialias: !0,
      precision: "highp"
    }), this.renderer.autoClear = !1;
  }
  listTilesIndicesForMapBounds() {
    const t = this.map.getProjection(), e = this.map.getZoom(), o = t && t.type === "globe" && e < 12, n = this.getAppropriateZoomLevel(), a = re(this.map, n);
    let i = ae(a);
    if (o) {
      const d = /* @__PURE__ */ new Map();
      for (const f of i) {
        const h = G(f);
        d.set(`${h.x}_${h.y}_${h.z}`, h);
      }
      i = Array.from(d.values());
    }
    if (this.map.getZoom() >= n)
      return i;
    const l = this.map.getCanvas(), s = l.clientWidth, u = l.clientHeight;
    return i.filter(
      (d) => le(d, this.map, s, u)
    );
  }
  onRemove(t, e) {
    console.warn("not implemented yet");
  }
  render(t, e) {
    if (!this.isVisible || (this.shouldShowCurrent = this.shouldShow(), !this.shouldShowCurrent)) return;
    this.scene.clear();
    const o = this.listTilesIndicesForMapBounds(), n = [], a = this.usedTileMap, i = /* @__PURE__ */ new Map();
    for (const l of o) {
      const s = l, u = `${s.z}_${s.x}_${s.y}`, m = a.get(u);
      m ? (i.set(u, m), a.delete(u), this.scene.add(m), this.onTileUpdate && this.onTileUpdate(m, e.defaultProjectionData.mainMatrix)) : n.push(s);
    }
    this.unusedTileList.push(...Array.from(a.values()));
    for (const l of n) {
      const s = l, u = `${s.z}_${s.x}_${s.y}`;
      let m;
      if (this.unusedTileList.length > 0)
        m = this.unusedTileList.pop();
      else {
        const d = this.onSetTileMaterial(s);
        m = new ue(this.tileGeometry, d);
      }
      i.set(u, m), m.setTileIndex(s), this.scene.add(m), this.onTileUpdate && this.onTileUpdate(m, e.defaultProjectionData.mainMatrix);
    }
    this.usedTileMap = i, this.camera.projectionMatrix = new j().fromArray(e.defaultProjectionData.mainMatrix), this.renderer.resetState(), this.renderer.render(this.scene, this.camera);
  }
  setOpacity(t) {
    this.opacity = Math.max(0, Math.min(t, 1)), this.map && this.map.triggerRepaint();
  }
  /**
   * Set the altitude of the layer in meters.
   * (Only for globe mode)
   */
  setAltitude(t) {
    this.altitude = Math.max(t, 0), this.map && this.map.triggerRepaint();
  }
}
const U = [0, 0, 0, 0];
class v {
  /**
   * The constructor should not be used to instanciate a Colormap, use Colormap.fromColormapDescription()
   * factory function instead.
   */
  constructor(t) {
    c(this, "keyPointValues");
    c(this, "rgbColors");
    c(this, "minValue");
    c(this, "maxValue");
    this.minValue = t[0], this.maxValue = t.at(-2), this.keyPointValues = t.filter((e, o) => o % 2 === 0), this.rgbColors = t.filter((e, o) => o % 2 === 1).map(
      (e) => v.colorToRgba(e)
    );
  }
  getRgbColorAt(t, e = !0) {
    if (t <= this.minValue)
      return this.rgbColors[0];
    if (t >= this.maxValue)
      return this.rgbColors.at(-1);
    for (let o = 0; o < this.keyPointValues.length - 1; o += 1) {
      if (t === this.keyPointValues[o])
        return this.rgbColors[o];
      const n = this.keyPointValues[o], a = this.keyPointValues[o + 1];
      if (t > n && t < a) {
        const i = this.rgbColors[o];
        if (!e)
          return i;
        const l = this.rgbColors[o + 1], s = a - n, m = (t - n) / s, d = 1 - m;
        return [
          Math.trunc(i[0] * d + l[0] * m),
          Math.trunc(i[1] * d + l[1] * m),
          Math.trunc(i[2] * d + l[2] * m),
          Math.trunc(i[3] * d + l[3] * m)
        ];
      }
    }
    return U;
  }
  /**
   * Generates a canvas HTML element containing the colormap
   */
  createCanvasElement(t = {}) {
    const e = t.size ?? 250, o = document.createElement("canvas"), n = t.horizontal ?? !0, a = t.gradient ?? !0;
    o.width = n ? e : 1, o.height = n ? 1 : e;
    const i = o.getContext("2d");
    if (!i) throw new Error("Canvas context is missing");
    const l = i.getImageData(0, 0, o.width, o.height), s = l.data, m = (this.maxValue - this.minValue) / e;
    for (let d = 0; d < e; d += 1) {
      const f = this.getRgbColorAt(this.minValue + d * m, a);
      s[d * 4] = f[0], s[d * 4 + 1] = f[1], s[d * 4 + 2] = f[2], s[d * 4 + 3] = f[3];
    }
    return i.putImageData(l, 0, 0), o;
  }
  /**
   * Create a PNG image Blob that contains the colormap
   */
  async createImageBlob(t = {}) {
    const e = this.createCanvasElement(t);
    return new Promise((o, n) => {
      e.toBlob((a) => {
        a ? o(a) : n(new Error("The blob cound not be generated out of the canvas."));
      }, "image/png");
    });
  }
  /**
   * Create an ObjectURL pointing to an in-memory PNG image of the colormap
   * (convenient to use as a <img> src attribute)
   */
  async createImageObjectURL(t = {}) {
    const e = await this.createImageBlob(t);
    return URL.createObjectURL(e);
  }
  /**
   * Get range labels for the colormap.
   * The minimum is 2 (at start and finish)
   * if more than 2, then equally spaced in between
   */
  getLabels(t = {}) {
    const e = t.numberOfLabels ?? 3, o = t.round ?? !0;
    if (e < 2)
      throw new Error("At least 2 labels.");
    let n = [this.minValue, this.maxValue];
    const a = e - 2;
    if (a) {
      const l = (this.maxValue - this.minValue) / (a + 1);
      for (let s = 1; s < e - 1; s += 1)
        n.push(this.minValue + l * s);
    }
    return n.sort((i, l) => i - l), o && (n = n.map(Math.round)), n;
  }
  /**
   * Returns the range on which is defined the colormap
   */
  getRange() {
    return {
      min: this.minValue,
      max: this.maxValue
    };
  }
  /**
   * Returns a ThreeJS texture representing this colormap
   */
  getTexture(t = {}) {
    const e = this.createCanvasElement(t);
    return new ee(e);
  }
  /**
   * Splits the colormap description in two arrays: an array with only the keyPointValues,
   * and another one with only colors
   */
  static split(t) {
    return [t.filter((e, o) => o % 2 === 0), t.filter((e, o) => o % 2 === 1)];
  }
  /**
   * @returns true if the colormap description is valid, false otherwise.
   */
  static isColormapDescriptionValid(t) {
    if (!Array.isArray(t) || t.length % 2 === 1 || t.length < 4)
      return !1;
    const [e, o] = v.split(t), n = e.every((i) => typeof i == "number"), a = o.every((i) => v.isColorValid(i));
    return new Set(e).size !== e.length ? !1 : n && a;
  }
  /**
   * Factory function that performs some verification before instantiating a Colormap
   * (the Colormap constructor is private)
   */
  static fromColormapDescription(t, e) {
    if (!v.isColormapDescriptionValid(t))
      throw new Error("The provided colormap description is invalid");
    const n = [];
    for (let i = 0; i < t.length; i += 2)
      n.push([t[i], t[i + 1]]);
    if (n.sort((i, l) => i[0] - l[0]), e) {
      if (e.min > e.max)
        throw new Error("Colormap scaling min must be greater than max.");
      const i = n[0][0], s = n[n.length - 1][0] - i, u = e.max - e.min;
      if (e.reverse === !0) {
        const m = structuredClone(n);
        for (let d = 0; d < n.length; d += 1) {
          const f = n[d], h = m[m.length - 1 - d];
          f[0] = (f[0] - i) / s * u + e.min, f[1] = h[1];
        }
      } else
        for (const m of n)
          m[0] = (m[0] - i) / s * u + e.min;
    }
    const a = n.flat();
    return new v(a);
  }
  /**
   * Returns true if the color is valid, false if not
   */
  static isColorValid(t) {
    try {
      return R(t), !0;
    } catch {
      return !1;
    }
  }
  /**
   * Turns any color into a RGBA array (with alpha in [0, 255])
   */
  static colorToRgba(t) {
    try {
      const e = R(t);
      return [
        Math.floor(e.red()),
        Math.floor(e.green()),
        Math.floor(e.blue()),
        Math.floor(e.alpha() * 255)
      ];
    } catch {
      return U;
    }
  }
}
const N = [
  [
    0.18995,
    0.07176,
    0.23217
  ],
  [
    0.19483,
    0.08339,
    0.26149
  ],
  [
    0.19956,
    0.09498,
    0.29024
  ],
  [
    0.20415,
    0.10652,
    0.31844
  ],
  [
    0.2086,
    0.11802,
    0.34607
  ],
  [
    0.21291,
    0.12947,
    0.37314
  ],
  [
    0.21708,
    0.14087,
    0.39964
  ],
  [
    0.22111,
    0.15223,
    0.42558
  ],
  [
    0.225,
    0.16354,
    0.45096
  ],
  [
    0.22875,
    0.17481,
    0.47578
  ],
  [
    0.23236,
    0.18603,
    0.50004
  ],
  [
    0.23582,
    0.1972,
    0.52373
  ],
  [
    0.23915,
    0.20833,
    0.54686
  ],
  [
    0.24234,
    0.21941,
    0.56942
  ],
  [
    0.24539,
    0.23044,
    0.59142
  ],
  [
    0.2483,
    0.24143,
    0.61286
  ],
  [
    0.25107,
    0.25237,
    0.63374
  ],
  [
    0.25369,
    0.26327,
    0.65406
  ],
  [
    0.25618,
    0.27412,
    0.67381
  ],
  [
    0.25853,
    0.28492,
    0.693
  ],
  [
    0.26074,
    0.29568,
    0.71162
  ],
  [
    0.2628,
    0.30639,
    0.72968
  ],
  [
    0.26473,
    0.31706,
    0.74718
  ],
  [
    0.26652,
    0.32768,
    0.76412
  ],
  [
    0.26816,
    0.33825,
    0.7805
  ],
  [
    0.26967,
    0.34878,
    0.79631
  ],
  [
    0.27103,
    0.35926,
    0.81156
  ],
  [
    0.27226,
    0.3697,
    0.82624
  ],
  [
    0.27334,
    0.38008,
    0.84037
  ],
  [
    0.27429,
    0.39043,
    0.85393
  ],
  [
    0.27509,
    0.40072,
    0.86692
  ],
  [
    0.27576,
    0.41097,
    0.87936
  ],
  [
    0.27628,
    0.42118,
    0.89123
  ],
  [
    0.27667,
    0.43134,
    0.90254
  ],
  [
    0.27691,
    0.44145,
    0.91328
  ],
  [
    0.27701,
    0.45152,
    0.92347
  ],
  [
    0.27698,
    0.46153,
    0.93309
  ],
  [
    0.2768,
    0.47151,
    0.94214
  ],
  [
    0.27648,
    0.48144,
    0.95064
  ],
  [
    0.27603,
    0.49132,
    0.95857
  ],
  [
    0.27543,
    0.50115,
    0.96594
  ],
  [
    0.27469,
    0.51094,
    0.97275
  ],
  [
    0.27381,
    0.52069,
    0.97899
  ],
  [
    0.27273,
    0.5304,
    0.98461
  ],
  [
    0.27106,
    0.54015,
    0.9893
  ],
  [
    0.26878,
    0.54995,
    0.99303
  ],
  [
    0.26592,
    0.55979,
    0.99583
  ],
  [
    0.26252,
    0.56967,
    0.99773
  ],
  [
    0.25862,
    0.57958,
    0.99876
  ],
  [
    0.25425,
    0.5895,
    0.99896
  ],
  [
    0.24946,
    0.59943,
    0.99835
  ],
  [
    0.24427,
    0.60937,
    0.99697
  ],
  [
    0.23874,
    0.61931,
    0.99485
  ],
  [
    0.23288,
    0.62923,
    0.99202
  ],
  [
    0.22676,
    0.63913,
    0.98851
  ],
  [
    0.22039,
    0.64901,
    0.98436
  ],
  [
    0.21382,
    0.65886,
    0.97959
  ],
  [
    0.20708,
    0.66866,
    0.97423
  ],
  [
    0.20021,
    0.67842,
    0.96833
  ],
  [
    0.19326,
    0.68812,
    0.9619
  ],
  [
    0.18625,
    0.69775,
    0.95498
  ],
  [
    0.17923,
    0.70732,
    0.94761
  ],
  [
    0.17223,
    0.7168,
    0.93981
  ],
  [
    0.16529,
    0.7262,
    0.93161
  ],
  [
    0.15844,
    0.73551,
    0.92305
  ],
  [
    0.15173,
    0.74472,
    0.91416
  ],
  [
    0.14519,
    0.75381,
    0.90496
  ],
  [
    0.13886,
    0.76279,
    0.8955
  ],
  [
    0.13278,
    0.77165,
    0.8858
  ],
  [
    0.12698,
    0.78037,
    0.8759
  ],
  [
    0.12151,
    0.78896,
    0.86581
  ],
  [
    0.11639,
    0.7974,
    0.85559
  ],
  [
    0.11167,
    0.80569,
    0.84525
  ],
  [
    0.10738,
    0.81381,
    0.83484
  ],
  [
    0.10357,
    0.82177,
    0.82437
  ],
  [
    0.10026,
    0.82955,
    0.81389
  ],
  [
    0.0975,
    0.83714,
    0.80342
  ],
  [
    0.09532,
    0.84455,
    0.79299
  ],
  [
    0.09377,
    0.85175,
    0.78264
  ],
  [
    0.09287,
    0.85875,
    0.7724
  ],
  [
    0.09267,
    0.86554,
    0.7623
  ],
  [
    0.0932,
    0.87211,
    0.75237
  ],
  [
    0.09451,
    0.87844,
    0.74265
  ],
  [
    0.09662,
    0.88454,
    0.73316
  ],
  [
    0.09958,
    0.8904,
    0.72393
  ],
  [
    0.10342,
    0.896,
    0.715
  ],
  [
    0.10815,
    0.90142,
    0.70599
  ],
  [
    0.11374,
    0.90673,
    0.69651
  ],
  [
    0.12014,
    0.91193,
    0.6866
  ],
  [
    0.12733,
    0.91701,
    0.67627
  ],
  [
    0.13526,
    0.92197,
    0.66556
  ],
  [
    0.14391,
    0.9268,
    0.65448
  ],
  [
    0.15323,
    0.93151,
    0.64308
  ],
  [
    0.16319,
    0.93609,
    0.63137
  ],
  [
    0.17377,
    0.94053,
    0.61938
  ],
  [
    0.18491,
    0.94484,
    0.60713
  ],
  [
    0.19659,
    0.94901,
    0.59466
  ],
  [
    0.20877,
    0.95304,
    0.58199
  ],
  [
    0.22142,
    0.95692,
    0.56914
  ],
  [
    0.23449,
    0.96065,
    0.55614
  ],
  [
    0.24797,
    0.96423,
    0.54303
  ],
  [
    0.2618,
    0.96765,
    0.52981
  ],
  [
    0.27597,
    0.97092,
    0.51653
  ],
  [
    0.29042,
    0.97403,
    0.50321
  ],
  [
    0.30513,
    0.97697,
    0.48987
  ],
  [
    0.32006,
    0.97974,
    0.47654
  ],
  [
    0.33517,
    0.98234,
    0.46325
  ],
  [
    0.35043,
    0.98477,
    0.45002
  ],
  [
    0.36581,
    0.98702,
    0.43688
  ],
  [
    0.38127,
    0.98909,
    0.42386
  ],
  [
    0.39678,
    0.99098,
    0.41098
  ],
  [
    0.41229,
    0.99268,
    0.39826
  ],
  [
    0.42778,
    0.99419,
    0.38575
  ],
  [
    0.44321,
    0.99551,
    0.37345
  ],
  [
    0.45854,
    0.99663,
    0.3614
  ],
  [
    0.47375,
    0.99755,
    0.34963
  ],
  [
    0.48879,
    0.99828,
    0.33816
  ],
  [
    0.50362,
    0.99879,
    0.32701
  ],
  [
    0.51822,
    0.9991,
    0.31622
  ],
  [
    0.53255,
    0.99919,
    0.30581
  ],
  [
    0.54658,
    0.99907,
    0.29581
  ],
  [
    0.56026,
    0.99873,
    0.28623
  ],
  [
    0.57357,
    0.99817,
    0.27712
  ],
  [
    0.58646,
    0.99739,
    0.26849
  ],
  [
    0.59891,
    0.99638,
    0.26038
  ],
  [
    0.61088,
    0.99514,
    0.2528
  ],
  [
    0.62233,
    0.99366,
    0.24579
  ],
  [
    0.63323,
    0.99195,
    0.23937
  ],
  [
    0.64362,
    0.98999,
    0.23356
  ],
  [
    0.65394,
    0.98775,
    0.22835
  ],
  [
    0.66428,
    0.98524,
    0.2237
  ],
  [
    0.67462,
    0.98246,
    0.2196
  ],
  [
    0.68494,
    0.97941,
    0.21602
  ],
  [
    0.69525,
    0.9761,
    0.21294
  ],
  [
    0.70553,
    0.97255,
    0.21032
  ],
  [
    0.71577,
    0.96875,
    0.20815
  ],
  [
    0.72596,
    0.9647,
    0.2064
  ],
  [
    0.7361,
    0.96043,
    0.20504
  ],
  [
    0.74617,
    0.95593,
    0.20406
  ],
  [
    0.75617,
    0.95121,
    0.20343
  ],
  [
    0.76608,
    0.94627,
    0.20311
  ],
  [
    0.77591,
    0.94113,
    0.2031
  ],
  [
    0.78563,
    0.93579,
    0.20336
  ],
  [
    0.79524,
    0.93025,
    0.20386
  ],
  [
    0.80473,
    0.92452,
    0.20459
  ],
  [
    0.8141,
    0.91861,
    0.20552
  ],
  [
    0.82333,
    0.91253,
    0.20663
  ],
  [
    0.83241,
    0.90627,
    0.20788
  ],
  [
    0.84133,
    0.89986,
    0.20926
  ],
  [
    0.8501,
    0.89328,
    0.21074
  ],
  [
    0.85868,
    0.88655,
    0.2123
  ],
  [
    0.86709,
    0.87968,
    0.21391
  ],
  [
    0.8753,
    0.87267,
    0.21555
  ],
  [
    0.88331,
    0.86553,
    0.21719
  ],
  [
    0.89112,
    0.85826,
    0.2188
  ],
  [
    0.8987,
    0.85087,
    0.22038
  ],
  [
    0.90605,
    0.84337,
    0.22188
  ],
  [
    0.91317,
    0.83576,
    0.22328
  ],
  [
    0.92004,
    0.82806,
    0.22456
  ],
  [
    0.92666,
    0.82025,
    0.2257
  ],
  [
    0.93301,
    0.81236,
    0.22667
  ],
  [
    0.93909,
    0.80439,
    0.22744
  ],
  [
    0.94489,
    0.79634,
    0.228
  ],
  [
    0.95039,
    0.78823,
    0.22831
  ],
  [
    0.9556,
    0.78005,
    0.22836
  ],
  [
    0.96049,
    0.77181,
    0.22811
  ],
  [
    0.96507,
    0.76352,
    0.22754
  ],
  [
    0.96931,
    0.75519,
    0.22663
  ],
  [
    0.97323,
    0.74682,
    0.22536
  ],
  [
    0.97679,
    0.73842,
    0.22369
  ],
  [
    0.98,
    0.73,
    0.22161
  ],
  [
    0.98289,
    0.7214,
    0.21918
  ],
  [
    0.98549,
    0.7125,
    0.2165
  ],
  [
    0.98781,
    0.7033,
    0.21358
  ],
  [
    0.98986,
    0.69382,
    0.21043
  ],
  [
    0.99163,
    0.68408,
    0.20706
  ],
  [
    0.99314,
    0.67408,
    0.20348
  ],
  [
    0.99438,
    0.66386,
    0.19971
  ],
  [
    0.99535,
    0.65341,
    0.19577
  ],
  [
    0.99607,
    0.64277,
    0.19165
  ],
  [
    0.99654,
    0.63193,
    0.18738
  ],
  [
    0.99675,
    0.62093,
    0.18297
  ],
  [
    0.99672,
    0.60977,
    0.17842
  ],
  [
    0.99644,
    0.59846,
    0.17376
  ],
  [
    0.99593,
    0.58703,
    0.16899
  ],
  [
    0.99517,
    0.57549,
    0.16412
  ],
  [
    0.99419,
    0.56386,
    0.15918
  ],
  [
    0.99297,
    0.55214,
    0.15417
  ],
  [
    0.99153,
    0.54036,
    0.1491
  ],
  [
    0.98987,
    0.52854,
    0.14398
  ],
  [
    0.98799,
    0.51667,
    0.13883
  ],
  [
    0.9859,
    0.50479,
    0.13367
  ],
  [
    0.9836,
    0.49291,
    0.12849
  ],
  [
    0.98108,
    0.48104,
    0.12332
  ],
  [
    0.97837,
    0.4692,
    0.11817
  ],
  [
    0.97545,
    0.4574,
    0.11305
  ],
  [
    0.97234,
    0.44565,
    0.10797
  ],
  [
    0.96904,
    0.43399,
    0.10294
  ],
  [
    0.96555,
    0.42241,
    0.09798
  ],
  [
    0.96187,
    0.41093,
    0.0931
  ],
  [
    0.95801,
    0.39958,
    0.08831
  ],
  [
    0.95398,
    0.38836,
    0.08362
  ],
  [
    0.94977,
    0.37729,
    0.07905
  ],
  [
    0.94538,
    0.36638,
    0.07461
  ],
  [
    0.94084,
    0.35566,
    0.07031
  ],
  [
    0.93612,
    0.34513,
    0.06616
  ],
  [
    0.93125,
    0.33482,
    0.06218
  ],
  [
    0.92623,
    0.32473,
    0.05837
  ],
  [
    0.92105,
    0.31489,
    0.05475
  ],
  [
    0.91572,
    0.3053,
    0.05134
  ],
  [
    0.91024,
    0.29599,
    0.04814
  ],
  [
    0.90463,
    0.28696,
    0.04516
  ],
  [
    0.89888,
    0.27824,
    0.04243
  ],
  [
    0.89298,
    0.26981,
    0.03993
  ],
  [
    0.88691,
    0.26152,
    0.03753
  ],
  [
    0.88066,
    0.25334,
    0.03521
  ],
  [
    0.87422,
    0.24526,
    0.03297
  ],
  [
    0.8676,
    0.2373,
    0.03082
  ],
  [
    0.86079,
    0.22945,
    0.02875
  ],
  [
    0.8538,
    0.2217,
    0.02677
  ],
  [
    0.84662,
    0.21407,
    0.02487
  ],
  [
    0.83926,
    0.20654,
    0.02305
  ],
  [
    0.83172,
    0.19912,
    0.02131
  ],
  [
    0.82399,
    0.19182,
    0.01966
  ],
  [
    0.81608,
    0.18462,
    0.01809
  ],
  [
    0.80799,
    0.17753,
    0.0166
  ],
  [
    0.79971,
    0.17055,
    0.0152
  ],
  [
    0.79125,
    0.16368,
    0.01387
  ],
  [
    0.7826,
    0.15693,
    0.01264
  ],
  [
    0.77377,
    0.15028,
    0.01148
  ],
  [
    0.76476,
    0.14374,
    0.01041
  ],
  [
    0.75556,
    0.13731,
    942e-5
  ],
  [
    0.74617,
    0.13098,
    851e-5
  ],
  [
    0.73661,
    0.12477,
    769e-5
  ],
  [
    0.72686,
    0.11867,
    695e-5
  ],
  [
    0.71692,
    0.11268,
    629e-5
  ],
  [
    0.7068,
    0.1068,
    571e-5
  ],
  [
    0.6965,
    0.10102,
    522e-5
  ],
  [
    0.68602,
    0.09536,
    481e-5
  ],
  [
    0.67535,
    0.0898,
    449e-5
  ],
  [
    0.66449,
    0.08436,
    424e-5
  ],
  [
    0.65345,
    0.07902,
    408e-5
  ],
  [
    0.64223,
    0.0738,
    401e-5
  ],
  [
    0.63082,
    0.06868,
    401e-5
  ],
  [
    0.61923,
    0.06367,
    41e-4
  ],
  [
    0.60746,
    0.05878,
    427e-5
  ],
  [
    0.5955,
    0.05399,
    453e-5
  ],
  [
    0.58336,
    0.04931,
    486e-5
  ],
  [
    0.57103,
    0.04474,
    529e-5
  ],
  [
    0.55852,
    0.04028,
    579e-5
  ],
  [
    0.54583,
    0.03593,
    638e-5
  ],
  [
    0.53295,
    0.03169,
    705e-5
  ],
  [
    0.51989,
    0.02756,
    78e-4
  ],
  [
    0.50664,
    0.02354,
    863e-5
  ],
  [
    0.49321,
    0.01963,
    955e-5
  ],
  [
    0.4796,
    0.01583,
    0.01055
  ]
], fe = [
  94e3,
  "#03039c",
  99e3,
  "#5555FF",
  101300,
  "#FFFFFF",
  102500,
  "#FF5555",
  104e3,
  "#630000"
], de = [0, "#1a4d6b", 0.25, "#4a7a9a", 0.5, "#8ba8bb", 0.75, "#b5c4cd", 1, "#f5fbff"], he = [
  0,
  "rgba(255, 255, 255, 0)",
  0.25,
  "rgba(255, 255, 255, 0)",
  0.5,
  "rgba(255, 255, 255, 0.1)",
  0.75,
  "rgba(255, 255, 255, 0.2)",
  0.95,
  "rgba(255, 255, 255, 0.4)",
  1,
  "rgba(255, 255, 255, 0.8)"
], xe = [0, "#1a4d6b", 0.25, "#2d6a8f", 0.5, "#4b8bb5", 0.75, "#c9a87c", 1, "#f5e6d3"], pe = [0, "#1a3a5c", 0.2, "#2d5f7c", 0.4, "#4a8a9c", 0.6, "#7ab5ac", 0.8, "#b0d8b4", 1, "#e8f5d8"], ge = [0, "#000917", 0.07, "#001940", 0.52, "#279165", 0.76, "#5BD95B", 0.9, "#C6FA9B", 1, "#C6FA9B"], ve = [
  0,
  "#003d5c",
  0.05,
  "#004d73",
  0.1,
  "#005d8a",
  0.15,
  "#006da0",
  0.2,
  "#1e7db5",
  0.25,
  "#4a8dc9",
  0.3,
  "#759ddb",
  0.35,
  "#9eadeb",
  0.4,
  "#c5bdf8",
  0.45,
  "#e0cdf9",
  0.5,
  "#f5ddf4",
  0.55,
  "#ffdeec",
  0.6,
  "#ffdfe5",
  0.65,
  "#ffe1dd",
  0.7,
  "#ffe4d6",
  0.75,
  "#ffe8cf",
  0.8,
  "#ffecc9",
  0.85,
  "#fff0c4",
  0.9,
  "#fff4c0",
  0.95,
  "#fff8bd",
  1,
  "#fffcbb"
], ye = [0, "#2B0C47", 0.07, "#4B1370", 0.5, "#DB1616", 0.93, "#FFDDAD", 1, "#FFF9ED"], Te = [0, "#420000", 0.1, "#521303", 0.27, "#A11B1B", 0.73, "#EBD059", 0.93, "#b5ffad", 1, "#e8ffe6"], Ae = [0, [0, 0, 0], 0.3, [230, 0, 0], 0.6, [255, 210, 0], 1, [255, 255, 255]], Ce = [0, [255, 0, 255], 1, [255, 255, 0]], Me = [0, [0, 128, 102], 1, [255, 255, 102]], be = [0, [255, 0, 0], 1, [255, 255, 0]], we = [0, [0, 0, 255], 1, [0, 255, 128]], Se = [
  0,
  [128, 0, 38],
  0.125,
  [189, 0, 38],
  0.25,
  [227, 26, 28],
  0.375,
  [252, 78, 42],
  0.5,
  [253, 141, 60],
  0.625,
  [254, 178, 76],
  0.75,
  [254, 217, 118],
  0.875,
  [255, 237, 160],
  1,
  [255, 255, 204]
], Pe = [0, [0, 0, 0], 0.2, [230, 0, 0], 0.4, [230, 210, 0], 0.7, [255, 255, 255], 1, [160, 200, 255]], Ve = [
  0,
  [68, 1, 84],
  0.13,
  [71, 44, 122],
  0.25,
  [59, 81, 139],
  0.38,
  [44, 113, 142],
  0.5,
  [33, 144, 141],
  0.63,
  [39, 173, 129],
  0.75,
  [92, 200, 99],
  0.88,
  [170, 220, 50],
  1,
  [253, 231, 37]
], Ie = [
  0,
  [0, 0, 4],
  0.13,
  [31, 12, 72],
  0.25,
  [85, 15, 109],
  0.38,
  [136, 34, 106],
  0.5,
  [186, 54, 85],
  0.63,
  [227, 89, 51],
  0.75,
  [249, 140, 10],
  0.88,
  [249, 201, 50],
  1,
  [252, 255, 164]
], Ee = [
  0,
  [0, 0, 4],
  0.13,
  [28, 16, 68],
  0.25,
  [79, 18, 123],
  0.38,
  [129, 37, 129],
  0.5,
  [181, 54, 122],
  0.63,
  [229, 80, 100],
  0.75,
  [251, 135, 97],
  0.88,
  [254, 194, 135],
  1,
  [252, 253, 191]
], Le = [
  0,
  [40, 26, 44],
  0.13,
  [59, 49, 90],
  0.25,
  [64, 76, 139],
  0.38,
  [63, 110, 151],
  0.5,
  [72, 142, 158],
  0.63,
  [85, 174, 163],
  0.75,
  [120, 206, 163],
  0.88,
  [187, 230, 172],
  1,
  [253, 254, 204]
], Be = [
  0,
  [54, 14, 36],
  0.13,
  [89, 23, 80],
  0.25,
  [110, 45, 132],
  0.38,
  [120, 77, 178],
  0.5,
  [120, 113, 213],
  0.63,
  [115, 151, 228],
  0.75,
  [134, 185, 227],
  0.88,
  [177, 214, 227],
  1,
  [230, 241, 241]
], Re = [
  0,
  [42, 24, 108],
  0.13,
  [33, 50, 162],
  0.25,
  [15, 90, 145],
  0.38,
  [40, 118, 137],
  0.5,
  [59, 146, 135],
  0.63,
  [79, 175, 126],
  0.75,
  [120, 203, 104],
  0.88,
  [193, 221, 100],
  1,
  [253, 239, 154]
], ze = [
  0,
  [4, 35, 51],
  0.13,
  [23, 51, 122],
  0.25,
  [85, 59, 157],
  0.38,
  [129, 79, 143],
  0.5,
  [175, 95, 130],
  0.63,
  [222, 112, 101],
  0.75,
  [249, 146, 66],
  0.88,
  [249, 196, 65],
  1,
  [232, 250, 91]
], Ue = [
  0,
  [17, 32, 64],
  0.13,
  [35, 52, 116],
  0.25,
  [29, 81, 156],
  0.38,
  [31, 113, 162],
  0.5,
  [50, 144, 169],
  0.63,
  [87, 173, 176],
  0.75,
  [149, 196, 189],
  0.88,
  [203, 221, 211],
  1,
  [254, 251, 230]
], F = [];
for (let r = 0; r < N.length; r += 1) {
  const t = N[r];
  F.push(r / 256, [~~(t[0] * 255), ~~(t[1] * 255), ~~(t[2] * 255)]);
}
const tt = {
  presureBlueWhiteRed: fe,
  teal: de,
  cloudCoverTransparent: he,
  cream: xe,
  lagoon: pe,
  poison: ge,
  twilight: ve,
  redVelvet: ye,
  ember: Te,
  hot: Ae,
  spring: Ce,
  summer: Me,
  autumn: be,
  winter: we,
  yiorrd: Se,
  blackbody: Pe,
  viridis: Ve,
  inferno: Ie,
  magma: Ee,
  bathymetry: Le,
  density: Be,
  salinity: Re,
  temperature: ze,
  velocityBlue: Ue,
  turbo: F
};
class W {
  constructor(t = {}) {
    c(this, "texturePool");
    c(this, "unavailableTextures", /* @__PURE__ */ new Set());
    c(this, "textureLoader", new te());
    c(this, "textureInProgress", /* @__PURE__ */ new Map());
    const e = t.cacheSize ?? 1e4;
    this.texturePool = new oe({
      // should be replaced by gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      maxSize: e,
      onEviction(o, n) {
        console.log("Freeing texture from GPU memory"), n.dispose();
      }
    });
  }
  /**
   * Get a texture from its z/x/y index
   * If a tile is already in the cache, it will be retrieved from the cache.
   * If a texture already failed to be retrieved, it is not trying again.
   */
  getTexture(t, e) {
    return new Promise((o, n) => {
      const a = G(t), i = e.replace("{x}", a.x.toString()).replace("{y}", a.y.toString()).replace("{z}", a.z.toString());
      if (this.unavailableTextures.has(i))
        return n(new Error("Could not load texture."));
      if (this.texturePool.has(i)) {
        o(this.texturePool.get(i));
        return;
      }
      if (this.textureInProgress.has(i)) {
        o(this.textureInProgress.get(i));
        return;
      }
      const l = this.textureLoader.load(
        i,
        (s) => {
          s.flipY = !1, this.texturePool.set(i, s), this.textureInProgress.delete(i), o(s);
        },
        // onProgress callback currently not supported
        void 0,
        // onError callback
        (s) => {
          this.unavailableTextures.add(i), this.textureInProgress.delete(i), n(new Error("Could not load texture."));
        }
      );
      this.textureInProgress.set(i, l);
    });
  }
  /**
   * Clear the texture cache
   */
  clear() {
    this.texturePool.clear(), this.unavailableTextures.clear();
  }
}
const Ne = `precision highp float;
precision highp int;

#define PI 3.141592653589793
#define RAD (PI / 180.0)

uniform float colormapRangeMin;
uniform float colormapRangeMax;
uniform sampler2D colormapTex;
uniform float zoom;
uniform vec3 tileIndex;
uniform float opacity;
uniform float sunCoordRa;
uniform float sunCoordDec;
uniform float sideralTimeComponent;

in vec2 vPositionUnit;
in vec2 vLonLat;
out vec4 fragColor;

float getSunAltitude(vec2 lonLat) {
    float lng = lonLat.x;
    float lat = lonLat.y;
    
    float lw = RAD * -lng;
    float phi = RAD * lat;

    // Note: important to decompose this into some trigonometry annoyance so that numerical precision is kept on GPU
    // Going from:
    // float H = (sideralTimeComponent - lw) - sunCoordRa;
    // and
    // float cosH = cos(sideralTimeComponent - (lw + sunCoordRa));
    // to this:
    float cosH = cos(sideralTimeComponent) * cos(lw + sunCoordRa) + sin(sideralTimeComponent) * sin(lw + sunCoordRa);
    return asin(sin(phi) * sin(sunCoordDec) + cos(phi) * cos(sunCoordDec) * cosH);
}



// Scales a value from the colormap range (in real-world unit)
// to [0, 1]
float rescaleToTexture(float realWorldValue) {
  return (realWorldValue - colormapRangeMin) / (colormapRangeMax - colormapRangeMin);
}

// Looks up the colormaps color from a given real world unit
vec4 getTextureColor(float realWorldValue) {
  float unitPosition = rescaleToTexture(realWorldValue);
  return texture(colormapTex, vec2(unitPosition, 0.5));
}


void main()  {
  float sunAltitude = getSunAltitude(vLonLat);
  float altitudeDeg = sunAltitude * 180.0 / PI; // 90° is zenith, 0° is at horizon level
  fragColor = getTextureColor(altitudeDeg);
  fragColor.a *= opacity;
}`, De = 1e3 * 60 * 60 * 24, Ze = 2440588, _e = 2451545, C = Math.PI / 180, M = C * 23.4397;
function je(r) {
  return r * 1e3 / De - 0.5 + Ze;
}
function D(r) {
  return je(r) - _e;
}
function Ge(r) {
  return C * (357.5291 + 0.98560028 * r);
}
function Fe(r) {
  const t = C * (1.9148 * Math.sin(r) + 0.02 * Math.sin(2 * r) + 3e-4 * Math.sin(3 * r)), e = C * 102.9372;
  return r + t + e + Math.PI;
}
function We(r, t) {
  return Math.asin(Math.sin(t) * Math.cos(M) + Math.cos(t) * Math.sin(M) * Math.sin(r));
}
function ke(r, t) {
  return Math.atan2(Math.sin(r) * Math.cos(M) - Math.tan(t) * Math.sin(M), Math.cos(r));
}
function Z(r) {
  const t = Ge(r), e = Fe(t), o = We(e, 0), n = ke(e, 0);
  return { dec: o, ra: n };
}
function _(r) {
  return C * (280.16 + 360.9856235 * r);
}
class nt extends P {
  constructor(e, o = {}) {
    const n = v.fromColormapDescription([
      -20,
      "rgba(9, 14, 31, 0.9)",
      -1.5,
      "rgba(9, 14, 31, 0.9)",
      0,
      "rgba(9, 14, 31, 0.0)",
      10,
      "rgba(9, 14, 31, 0.0)"
    ]);
    super(e, {
      onSetTileMaterial: (a) => {
        const i = this.map.getProjection(), l = +this.date / 1e3, s = D(l), { dec: u, ra: m } = Z(s), d = _(s);
        return new b({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: w,
          uniforms: {
            colormapTex: { value: n.getTexture({ gradient: !0 }) },
            colormapRangeMin: { value: n.getRange().min },
            colormapRangeMax: { value: n.getRange().max },
            zoom: { value: this.map.getZoom() },
            tileIndex: { value: new T(a.x, a.y, a.z) },
            isGlobe: { value: i && i.type === "globe" },
            date: { value: l },
            opacity: { value: this.opacity },
            sunCoordRa: { value: m },
            sunCoordDec: { value: u },
            sideralTimeComponent: { value: d },
            altitude: { value: this.altitude }
          },
          vertexShader: this.defaultVertexShader,
          fragmentShader: Ne,
          side: S,
          transparent: !0,
          depthTest: !1
          // wireframe: true,
        });
      },
      onTileUpdate: (a, i) => {
        a.material.uniforms.zoom.value = this.map.getZoom();
        const l = +this.date / 1e3, s = D(l), { dec: u, ra: m } = Z(s), d = _(s), f = this.map.getProjection(), h = a.getTileIndexAsArray(), x = a.material, p = this.map.getZoom(), g = f && f.type === "globe" && p < 12;
        x.uniforms.zoom.value = p, x.uniforms.isGlobe.value = g, x.uniforms.opacity.value = this.opacity, x.uniforms.date.value = l, x.uniforms.sunCoordRa.value = m, x.uniforms.sunCoordDec.value = u, x.uniforms.sideralTimeComponent.value = d, x.uniforms.altitude.value = this.altitude, x.uniforms.tileIndex.value.set(h[0], h[1], h[2]);
      }
    });
    c(this, "date");
    this.date = o.date ?? /* @__PURE__ */ new Date(), o.opacity && this.setOpacity(o.opacity);
  }
  setDate(e) {
    this.date = e, this.map && this.map.triggerRepaint();
  }
}
const Oe = `precision highp float;
precision highp int;

uniform float zoom;
in vec3 vPosition;
in vec2 vPositionUnit;
out vec4 fragColor;

void main()  {
  vec2 tileCenter = vec2(0.5, 0.5);
  float distanceToCenter = sqrt(pow(vPositionUnit.x - tileCenter.x, 2.) + pow(vPositionUnit.y - tileCenter.y, 2.));

  fragColor = vec4(vPositionUnit.x, vPositionUnit.y, 1., 0.6);

	float radius = fract(zoom + 0.5) / 2.;

  if (distanceToCenter < radius) {
    fragColor.a = 0.0;
  }
}`;
class ot extends P {
  constructor(t) {
    super(t, {
      onSetTileMaterial: (e) => {
        const o = this.map.getProjection();
        return new b({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: w,
          uniforms: {
            zoom: { value: this.map.getZoom() },
            tileIndex: { value: new T(e.x, e.y, e.z) },
            isGlobe: { value: o && o.type === "globe" },
            altitude: { value: this.altitude }
          },
          vertexShader: this.defaultVertexShader,
          fragmentShader: Oe,
          side: S,
          transparent: !0,
          depthTest: !1
          // wireframe: true,
        });
      },
      onTileUpdate: (e, o) => {
        e.material.uniforms.zoom.value = this.map.getZoom();
        const n = this.map.getProjection(), a = e.getTileIndexAsArray(), i = e.material, l = this.map.getZoom(), s = n && n.type === "globe" && l < 12;
        i.uniforms.altitude.value = this.altitude, i.uniforms.zoom.value = l, i.uniforms.isGlobe.value = s, i.uniforms.tileIndex.value.set(a[0], a[1], a[2]);
      }
    });
  }
}
const $e = `precision highp float;
precision highp int;

uniform sampler2D texBefore;
uniform sampler2D texAfter;
uniform float opacity;
uniform float seriesAxisValueBefore;
uniform float seriesAxisValueAfter;
uniform float seriesAxisValue;
uniform float rasterEncodingPolynomialSlope;
uniform float rasterEncodingPolynomialOffset;
uniform float colormapRangeMin;
uniform float colormapRangeMax;
uniform sampler2D colormapTex;
in vec2 vPositionUnit;
out vec4 fragColor;



vec4 cubic(float v){
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 s = n * n * n;
  float x = s.x;
  float y = s.y - 4.0 * s.x;
  float z = s.z - 4.0 * s.y + 6.0 * s.x;
  float w = 6.0 - x - y - z;
  return vec4(x, y, z, w) * (1.0/6.0);
}

// This cubic interpolation was borrowed from https://stackoverflow.com/a/42179924/5885003
vec4 textureBicubic(sampler2D tex, vec2 texCoords){
  vec2 texSize = vec2(textureSize(tex, 0));
  vec2 invTexSize = 1.0 / texSize;

  texCoords = texCoords * texSize - 0.5;
  vec2 fxy = fract(texCoords);
  texCoords -= fxy;
  vec4 xcubic = cubic(fxy.x);
  vec4 ycubic = cubic(fxy.y);
  vec4 c = texCoords.xxyy + vec2 (-0.5, +1.5).xyxy;
  vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
  vec4 offset = c + vec4 (xcubic.yw, ycubic.yw) / s;
  offset *= invTexSize.xxyy;
  vec4 sample0 = texture(tex, offset.xz);
  vec4 sample1 = texture(tex, offset.yz);
  vec4 sample2 = texture(tex, offset.xw);
  vec4 sample3 = texture(tex, offset.yw);
  float sx = s.x / (s.x + s.y);
  float sy = s.z / (s.z + s.w);

  return mix(
    mix(sample3, sample2, sx), mix(sample1, sample0, sx)
  ,sy);
}



// Scales a value from the colormap range (in real-world unit)
// to [0, 1]
float rescaleToTexture(float realWorldValue) {
  return (realWorldValue - colormapRangeMin) / (colormapRangeMax - colormapRangeMin);
}

// Looks up the colormaps color from a given real world unit
vec4 getTextureColor(float realWorldValue) {
  float unitPosition = rescaleToTexture(realWorldValue);
  return texture(colormapTex, vec2(unitPosition, 0.5));
}


float getRealWorldValue(sampler2D tex, inout bool isNodata) {
  // Testing bicubic texture interpolation, but input data is too
  // pixalated to make it worth it
  // vec4 texColor = textureBicubic(tex, vPositionUnit);

  vec4 texColor = texture(tex, vPositionUnit);

  isNodata = (texColor.a == 0.0);

  // For this test, we use the define RASTER_ENCODING_CHANNELS to know on what channel
  // the value to display is encoded
  // those channels will then be addressed as relevantChannels.x .y and .z

  float x = 0.;

  #if RASTER_ENCODING_NB_CHANNELS == 1
    x = texColor.RASTER_ENCODING_CHANNELS * 255.;
  #elif RASTER_ENCODING_NB_CHANNELS == 2
    vec2 relevantChannels = texColor.RASTER_ENCODING_CHANNELS;
    x = (relevantChannels.x * 255.) * 256. + (relevantChannels.y * 255.);
  #elif RASTER_ENCODING_NB_CHANNELS == 3
    vec3 relevantChannels = texColor.RASTER_ENCODING_CHANNELS;
    x = (relevantChannels.x * 255.) * 256. * 256. + (relevantChannels.y * 255.) * 256. + (relevantChannels.z * 255.);
  #endif

  // The value in real world unit
  float y = rasterEncodingPolynomialSlope * x + rasterEncodingPolynomialOffset;
  return y;
}




void main()  {
  bool texBeforeIsNodata = false;
  bool texAfterIsNodata = false;
  float realWorldValueBefore = getRealWorldValue(texBefore, texBeforeIsNodata);
  float realWorldValueAfter = getRealWorldValue(texAfter, texAfterIsNodata);

  if (texBeforeIsNodata || texAfterIsNodata) {
    // fragColor = vec4(1., 0., 0., 0.3);
    discard;
    return;
  }

  float ratioAfter = seriesAxisValueAfter == seriesAxisValueBefore ? 0.0 : (seriesAxisValue - seriesAxisValueBefore) / (seriesAxisValueAfter - seriesAxisValueBefore);
  float interpolatedRealWorldValue = ratioAfter * realWorldValueAfter + (1. - ratioAfter) * realWorldValueBefore;
  fragColor = getTextureColor(interpolatedRealWorldValue);
  fragColor.a *= opacity; 
}`;
class it extends P {
  constructor(e, o) {
    console.log("options", o);
    super(e, {
      minZoom: o.datasetSpecification.minZoom,
      maxZoom: o.datasetSpecification.maxZoom,
      onSetTileMaterial: (n) => {
        const a = this.map.getProjection();
        return new b({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: w,
          uniforms: {
            opacity: { value: this.opacity },
            texBefore: { value: null },
            texAfter: { value: null },
            seriesAxisValueBefore: { value: this.seriesElementBefore.seriesAxisValue },
            seriesAxisValueAfter: { value: this.seriesElementAfter.seriesAxisValue },
            seriesAxisValue: { value: this.seriesAxisValue },
            zoom: { value: this.map.getZoom() },
            tileIndex: { value: new T(n.x, n.y, n.z) },
            isGlobe: { value: a && a.type === "globe" },
            rasterEncodingPolynomialSlope: { value: this.rasterEncoding.polynomialSlope },
            rasterEncodingPolynomialOffset: { value: this.rasterEncoding.polynomialOffset },
            colormapRangeMin: { value: this.colormap.getRange().min },
            colormapRangeMax: { value: this.colormap.getRange().max },
            colormapTex: {
              value: this.colormap.getTexture({
                gradient: this.colormapGradient,
                size: this.colormapGradient ? 512 : 4096
              })
            },
            altitude: { value: this.altitude }
          },
          vertexShader: this.defaultVertexShader,
          fragmentShader: $e,
          side: S,
          transparent: !0,
          depthTest: !1,
          // wireframe: true,
          defines: {
            RASTER_ENCODING_CHANNELS: this.rasterEncoding.channels,
            RASTER_ENCODING_NB_CHANNELS: this.rasterEncoding.channels.length
          }
        });
      },
      onTileUpdate: async (n, a) => {
        const i = await Promise.allSettled([
          this.remoteTileTextureManager.getTexture(
            n.getTileIndex(),
            `${this.tileUrlPrefix}${this.seriesElementBefore.tileUrlPattern}`
          ),
          this.remoteTileTextureManager.getTexture(
            n.getTileIndex(),
            `${this.tileUrlPrefix}${this.seriesElementAfter.tileUrlPattern}`
          )
        ]), l = this.map.getProjection(), s = n.getTileIndexAsArray(), u = n.material, m = this.map.getZoom();
        u.uniforms.opacity.value = this.opacity;
        const d = l && l.type === "globe" && m < 12;
        u.uniforms.texBefore.value = i[0].status === "fulfilled" ? i[0].value : null, u.uniforms.texAfter.value = i[1].status === "fulfilled" ? i[1].value : null, u.uniforms.seriesAxisValueBefore.value = this.seriesElementBefore.seriesAxisValue, u.uniforms.seriesAxisValueAfter.value = this.seriesElementAfter.seriesAxisValue, u.uniforms.seriesAxisValue.value = this.seriesAxisValue, u.uniforms.zoom.value = m, u.uniforms.isGlobe.value = d, u.uniforms.altitude.value = this.altitude, u.uniforms.tileIndex.value.set(s[0], s[1], s[2]);
      }
    });
    c(this, "rasterEncoding");
    c(this, "colormap");
    c(this, "seriesAxisValue");
    c(this, "datasetSpecification");
    c(this, "seriesElementBefore");
    c(this, "indexSeriesElementBefore", 0);
    c(this, "seriesElementAfter");
    c(this, "tileUrlPrefix");
    c(this, "colormapGradient");
    c(this, "remoteTileTextureManager");
    this.colormapGradient = o.colormapGradient ?? !0, this.tileUrlPrefix = o.tileUrlPrefix ?? "", this.datasetSpecification = o.datasetSpecification, this.rasterEncoding = o.datasetSpecification.rasterEncoding, this.colormap = o.colormap, this.setSeriesAxisValue(o.seriesAxisValue ?? this.datasetSpecification.series[0].seriesAxisValue), this.remoteTileTextureManager = o.remoteTileTextureManager ?? new W();
  }
  /**
   * Get the range of values along the series axis.
   * It is assumed that the first element of the series has a smaller value
   * than the last.
   */
  getSerieAxisRange() {
    const e = this.datasetSpecification.series;
    return e.length ? [e[0].seriesAxisValue, e[e.length - 1].seriesAxisValue] : null;
  }
  setSeriesAxisValue(e) {
    const o = this.getSerieAxisRange();
    o && (this.seriesAxisValue = ce(o, e), this.defineCurrentSeriesElement(), this.map && this.map.triggerRepaint());
  }
  getSeriesAxisValue() {
    return this.seriesAxisValue;
  }
  defineCurrentSeriesElement() {
    const e = this.datasetSpecification.series;
    if (!e.length)
      return null;
    if (e.length === 1) {
      this.indexSeriesElementBefore = 0, this.seriesElementBefore = e[0], this.seriesElementAfter = e[0];
      return;
    }
    const o = this.getSerieAxisRange();
    if (o) {
      if (this.seriesAxisValue <= o[0]) {
        this.indexSeriesElementBefore = 0, this.seriesElementBefore = e[0], this.seriesElementAfter = e[0];
        return;
      }
      if (this.seriesAxisValue >= o[1]) {
        this.indexSeriesElementBefore = e.length - 1, this.seriesElementBefore = e[e.length - 1], this.seriesElementAfter = e[e.length - 1];
        return;
      }
      for (let n = 0; n < e.length - 1; n += 1) {
        const a = e[n], i = e[n + 1];
        if (this.seriesAxisValue >= a.seriesAxisValue && this.seriesAxisValue < i.seriesAxisValue) {
          this.indexSeriesElementBefore = n, this.seriesElementBefore = a, this.seriesElementAfter = i;
          break;
        }
      }
    }
  }
  /**
   * Prefetch texture along the series dimensions for the same tile coverage as the curent.
   * deltaBefore is the number of series elements before the curent position and deltaAfter
   * is the number of elements after the curent position.
   */
  async prefetchSeriesTexture(e, o) {
    const n = Array.from(this.usedTileMap.values()).map((u) => u.getTileIndex()), a = this.datasetSpecification.series, i = [], l = Math.max(0, this.indexSeriesElementBefore + e), s = Math.min(a.length - 1, this.indexSeriesElementBefore + o);
    for (let u = l; u < s + 1; u += 1)
      if (!(u < 0)) {
        if (u >= a.length) break;
        for (const m of n)
          i.push(
            this.remoteTileTextureManager.getTexture(m, `${this.tileUrlPrefix}${a[u].tileUrlPattern}`)
          );
      }
    await Promise.allSettled(i);
  }
  /**
   * Get the value and unit at a given position, for the current series axis position.
   */
  async pick(e) {
    const n = Array.from(this.usedTileMap.values()).map((O) => O.getTileIndex())[0].z, a = ie(e, n, !1), i = {
      z: n,
      x: Math.floor(a.x),
      y: Math.floor(a.y)
    }, l = await Promise.allSettled([
      await this.remoteTileTextureManager.getTexture(
        i,
        `${this.tileUrlPrefix}${this.seriesElementBefore.tileUrlPattern}`
      ),
      await this.remoteTileTextureManager.getTexture(
        i,
        `${this.tileUrlPrefix}${this.seriesElementAfter.tileUrlPattern}`
      )
    ]);
    if (l[0].status === "rejected" || l[1].status === "rejected")
      return null;
    const s = l[0].value, u = l[1].value, m = [
      a.x - i.x,
      a.y - i.y
    ], d = z(s.image, m), f = z(u.image, m);
    if (!d || !f) return null;
    const h = Array.from(this.datasetSpecification.rasterEncoding.channels), x = {
      r: d[0],
      g: d[1],
      b: d[2],
      a: d[3]
    }, p = {
      r: f[0],
      g: f[1],
      b: f[2],
      a: f[3]
    };
    if (x.a === 0 || p.a === 0)
      return null;
    let g = 0, A = 0;
    if (h.length === 1)
      g = x[h[0]], A = p[h[0]];
    else if (h.length === 2)
      g = x[h[0]] * 256 + x[h[1]], A = p[h[0]] * 256 + p[h[1]];
    else if (h.length === 3)
      g = x[h[0]] * 256 * 256 + x[h[1]] * 256 + x[h[2]], A = p[h[0]] * 256 * 256 + p[h[1]] * 256 + p[h[2]];
    else
      return null;
    const { polynomialOffset: I, polynomialSlope: E } = this.datasetSpecification.rasterEncoding, L = g * E + I, k = A * E + I, B = this.seriesElementAfter.seriesAxisValue === this.seriesElementBefore.seriesAxisValue ? L : (this.seriesAxisValue - this.seriesElementBefore.seriesAxisValue) / (this.seriesElementAfter.seriesAxisValue - this.seriesElementBefore.seriesAxisValue);
    return {
      value: B * k + (1 - B) * L,
      unit: this.datasetSpecification.pixelUnit
    };
  }
}
const He = `precision highp float;
precision highp int;

uniform sampler2D tex;
uniform float opacity;
in vec2 vPositionUnit;
out vec4 fragColor;

void main()  {
  fragColor = texture(tex, vPositionUnit);
  fragColor.a *= opacity;

}`;
class rt extends P {
  constructor(e, o) {
    super(e, {
      minZoom: o.minZoom ?? 0,
      maxZoom: o.maxZoom ?? 22,
      onSetTileMaterial: (n) => {
        const a = this.map.getProjection();
        return new b({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: w,
          uniforms: {
            tex: { value: null },
            zoom: { value: this.map.getZoom() },
            tileIndex: { value: new T(n.x, n.y, n.z) },
            isGlobe: { value: a && a.type === "globe" },
            opacity: { value: this.opacity }
          },
          vertexShader: this.defaultVertexShader,
          fragmentShader: He,
          side: S,
          transparent: !0,
          depthTest: !1
          // wireframe: true,
        });
      },
      onTileUpdate: async (n, a) => {
        const i = this.map.getProjection(), l = n.getTileIndexAsArray(), s = n.material, u = this.map.getZoom(), m = i && i.type === "globe" && u < 12;
        s.uniforms.tex.value = await this.remoteTileTextureManager.getTexture(
          n.getTileIndex(),
          this.textureUrlPattern
        ), s.uniforms.zoom.value = u, s.uniforms.isGlobe.value = m, s.uniforms.opacity.value = this.opacity, s.uniforms.tileIndex.value.set(l[0], l[1], l[2]);
      }
    });
    c(this, "textureUrlPattern");
    c(this, "remoteTileTextureManager");
    this.remoteTileTextureManager = o.remoteTileTextureManager ?? new W(), this.textureUrlPattern = o.textureUrlPattern;
  }
}
export {
  P as BaseShaderTiledLayer,
  v as Colormap,
  tt as ColormapDescriptionLibrary,
  nt as DaylightLayer,
  ot as DummyGradientTiledLayer,
  it as MultiChannelSeriesTiledLayer,
  W as RemoteTileTextureManager,
  rt as TextureTiledLayer,
  ue as Tile,
  et as replaceMatrixScale
};
//# sourceMappingURL=maplibre-gl-shader-layer.js.map
