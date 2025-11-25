/**
 * This is a demo of how to extend ShaderTiledLayer
 * RawShaderTiledLayer is a layer that simply contains a texture per tile
 */


import { BackSide, GLSL3, RawShaderMaterial, Vector3 } from "three";
import { type Mat4, ShaderTiledLayer } from "./ShaderTiledLayer";
// @ts-ignore
import vertexShader from "./shaders/globe-tile.v.glsl?raw";
// @ts-ignore
import fragmentShader from "./shaders/daylight.f.glsl?raw";
import type { TileIndex } from "./tools";
import type { Tile } from "./Tile";
import { Colormap } from "./colormap";

export type DaylightLayerOptions = {
  date?: Date,
}


export class DaylightLayer extends ShaderTiledLayer {
  private date: Date;

  constructor(id: string, options: DaylightLayerOptions = {}) {
    const colormap = Colormap.fromColormapDescription([
      -20, "rgba(21, 32, 69, 0.3)",
      -1, "rgba(21, 32, 69, 0.3)",
      0, "rgba(21, 32, 69, 0.0)",
      10, "rgba(21, 32, 69, 0.0)",
    ]);


    super(id, {
      onSetTileMaterial: (tileIndex: TileIndex) => {
        const mapProjection = this.map.getProjection();
        const days = toDays(this.date);
        const sunCoordsDecRa = sunCoords(days);

        const material = new RawShaderMaterial({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: GLSL3,

          uniforms: {
            colormapTex: { value: colormap.getTexture({gradient: true}) },
            colormapRangeMin: { value: colormap.getRange().min },
            colormapRangeMax: { value: colormap.getRange().max },
            zoom: { value: this.map.getZoom() },
            tileIndex: { value: new Vector3(tileIndex.x, tileIndex.y, tileIndex.z) },
            isGlobe: { value: (mapProjection && mapProjection.type === "globe")},
            date: { value: (+this.date) / 1000 },
            days: { value: days },
            sunCoordDec: { value: sunCoordsDecRa.dec },
            sunCoordRa:{ value: sunCoordsDecRa.ra },
          },
          
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          side: BackSide,
					transparent: true,
          depthTest: false,
          // wireframe: true,
        })
        
        return material;
      },


      onTileUpdate: (tile: Tile, matrix: Mat4) => {
        (tile.material as RawShaderMaterial).uniforms.zoom.value = this.map.getZoom();

        const mapProjection = this.map.getProjection();
        const tileIndeArray = tile.getTileIndexAsArray();
        const mat = tile.material as RawShaderMaterial;
        const zoom = this.map.getZoom();
        // At z12+, the globe is no longer globe in Maplibre
        const isGlobe = (mapProjection && mapProjection.type === "globe") && zoom < 12;

        const days = toDays(this.date);
        const sunCoordsDecRa = sunCoords(days);

        mat.uniforms.zoom.value = zoom;
        mat.uniforms.isGlobe.value = isGlobe;
        mat.uniforms.date.value = (+this.date) / 1000;
        mat.uniforms.days.value = days;
        mat.uniforms.sunCoordDec.value = sunCoordsDecRa.dec;
        mat.uniforms.sunCoordRa.value = sunCoordsDecRa.ra;
        (mat.uniforms.tileIndex.value as Vector3).set(tileIndeArray[0], tileIndeArray[1], tileIndeArray[2]);
      }
    });

    this.date = options.date ?? new Date();
  }


  setDate(date: Date) {
    this.date = date;
    if (this.map) {
      this.map.triggerRepaint();
    }
  }

}

























// shortcuts for easier to read formulas

const PI   = Math.PI,
    sin  = Math.sin,
    cos  = Math.cos,
    tan  = Math.tan,
    asin = Math.asin,
    atan = Math.atan2,
    acos = Math.acos,
    rad  = PI / 180;

// sun calculations are based on https://aa.quae.nl/en/reken/zonpositie.html formulas

// date/time constants and conversions

const dayMs = 1000 * 60 * 60 * 24,
    J1970 = 2440588,
    J2000 = 2451545;

function toJulian(date) { return date.valueOf() / dayMs - 0.5 + J1970; }
function fromJulian(j)  { return new Date((j + 0.5 - J1970) * dayMs); }
function toDays(date)   { return toJulian(date) - J2000; }


// general calculations for position

const e = rad * 23.4397; // obliquity of the Earth

function rightAscension(l, b) { return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l)); }
function declination(l, b)    { return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l)); }

function azimuth(H, phi, dec)  { return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)); }
function altitude(H, phi, dec) { return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H)); }

function siderealTime(d, lw) { return rad * (280.16 + 360.9856235 * d) - lw; }

function astroRefraction(h) {
    if (h < 0) // the following formula works for positive altitudes only.
        h = 0; // if h = -0.08901179 a div/0 would occur.

    // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
    // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}

// general sun calculations

function solarMeanAnomaly(d) { return rad * (357.5291 + 0.98560028 * d); }

function eclipticLongitude(M) {

    const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), // equation of center
        P = rad * 102.9372; // perihelion of the Earth

    return M + C + P + PI;
}

function sunCoords(d) {

    const M = solarMeanAnomaly(d),
        L = eclipticLongitude(M);

    return {
        dec: declination(L, 0),
        ra: rightAscension(L, 0)
    };
}


// calculates sun position for a given date and latitude/longitude

export function getPosition(date, lat, lng) {

    const lw  = rad * -lng,
        phi = rad * lat,
        d   = toDays(date),

        c  = sunCoords(d),
        H  = siderealTime(d, lw) - c.ra;

    return {
        azimuth: azimuth(H, phi, c.dec),
        altitude: altitude(H, phi, c.dec)
    };
};


// sun times configuration (angle, morning name, evening name)

export const times = [
    [-0.833, 'sunrise', 'sunset'],
    [-0.3, 'sunriseEnd', 'sunsetStart'],
    [-6, 'dawn', 'dusk'],
    [-12, 'nauticalDawn', 'nauticalDusk'],
    [-18, 'nightEnd', 'night'],
    [6, 'goldenHourEnd', 'goldenHour']
];

// adds a custom time to the times config

export function addTime(angle, riseName, setName) {
    times.push([angle, riseName, setName]);
};


// calculations for sun times

const J0 = 0.0009;

function julianCycle(d, lw) { return Math.round(d - J0 - lw / (2 * PI)); }

function approxTransit(Ht, lw, n) { return J0 + (Ht + lw) / (2 * PI) + n; }
function solarTransitJ(ds, M, L)  { return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L); }

function hourAngle(h, phi, d) { return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d))); }
function observerAngle(height) { return -2.076 * Math.sqrt(height) / 60; }

// returns set time for the given sun altitude
function getSetJ(h, lw, phi, dec, n, M, L) {

    const w = hourAngle(h, phi, dec),
        a = approxTransit(w, lw, n);
    return solarTransitJ(a, M, L);
}


// calculates sun times for a given date, latitude/longitude, and, optionally,
// the observer height (in meters) relative to the horizon

export function getTimes(date, lat, lng, height) {

    height = height || 0;

    const lw = rad * -lng,
        phi = rad * lat,
        dh = observerAngle(height),
        d = toDays(date),
        n = julianCycle(d, lw),
        ds = approxTransit(0, lw, n),
        M = solarMeanAnomaly(ds),
        L = eclipticLongitude(M),
        dec = declination(L, 0),
        Jnoon = solarTransitJ(ds, M, L);

    const result = {
        solarNoon: fromJulian(Jnoon),
        nadir: fromJulian(Jnoon - 0.5)
    };

    for (const time of times) {
        const h0 = (time[0] + dh) * rad;
        const Jset = getSetJ(h0, lw, phi, dec, n, M, L);
        const Jrise = Jnoon - (Jset - Jnoon);

        result[time[1]] = fromJulian(Jrise);
        result[time[2]] = fromJulian(Jset);
    }

    return result;
};

