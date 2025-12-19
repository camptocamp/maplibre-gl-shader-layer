/**
 * This is a demo of how to extend ShaderTiledLayer
 * RawShaderTiledLayer is a layer that simply contains a texture per tile
 */

import { BackSide, GLSL3, RawShaderMaterial, Vector3 } from "three";
import { type Mat4, BaseShaderTiledLayer } from "../core/BaseShaderTiledLayer";
// @ts-ignore
import fragmentShader from "../shaders/daylight.f.glsl?raw";
import type { TileIndex } from "../core/tools";
import type { Tile } from "../core/Tile";
import { Colormap } from "../core/colormap";

export type DaylightLayerOptions = {
  date?: Date;
  opacity?: number;
};

// The following sun calculation are borrowef from Volodymyr Agafonkin's Suncalc library:
// https://github.com/mourner/suncalc
// The reasons of not importing the whole library is because only a small part is used here
// and another part of the logic has been moved to the fragment shader

// Date/time constants
const DAY_MS = 1000.0 * 60.0 * 60.0 * 24.0;
const J1970 = 2440588.0;
const J2000 = 2451545.0;
const RAD = Math.PI / 180.0;

// Obliquity of Earth
const E = RAD * 23.4397;

// Convert timestamp (seconds) to Julian date
function toJulian(timestamp: number): number {
  const dateMs = timestamp * 1000.0;
  return dateMs / DAY_MS - 0.5 + J1970;
}

// Convert Julian date to days since J2000
function toDays(timestamp: number): number {
  return toJulian(timestamp) - J2000;
}

function solarMeanAnomaly(d: number): number {
  return RAD * (357.5291 + 0.98560028 * d);
}

function eclipticLongitude(M: number): number {
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2.0 * M) + 0.0003 * Math.sin(3.0 * M));
  const P = RAD * 102.9372;
  return M + C + P + Math.PI;
}

function declination(l: number, b: number): number {
  return Math.asin(Math.sin(b) * Math.cos(E) + Math.cos(b) * Math.sin(E) * Math.sin(l));
}

function rightAscension(l: number, b: number): number {
  return Math.atan2(Math.sin(l) * Math.cos(E) - Math.tan(b) * Math.sin(E), Math.cos(l));
}

function sunCoords(d: number): { dec: number; ra: number } {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0.0);
  const ra = rightAscension(L, 0.0);

  return { dec, ra };
}

function computeSideralTimeComponent(day2YK: number): number {
  return RAD * (280.16 + 360.9856235 * day2YK);
}

export class DaylightLayer extends BaseShaderTiledLayer {
  private date: Date;

  constructor(id: string, options: DaylightLayerOptions = {}) {
    const colormap = Colormap.fromColormapDescription([
      -20,
      "rgba(9, 14, 31, 0.9)",
      -1.5,
      "rgba(9, 14, 31, 0.9)",
      0,
      "rgba(9, 14, 31, 0.0)",
      10,
      "rgba(9, 14, 31, 0.0)",
    ]);

    super(id, {
      onSetTileMaterial: (tileIndex: TileIndex) => {
        const mapProjection = this.map.getProjection();

        const timestamp = +this.date / 1000;
        const daysJ2K = toDays(timestamp);
        const { dec, ra } = sunCoords(daysJ2K);
        const sideralTimeComponent = computeSideralTimeComponent(daysJ2K);

        const material = new RawShaderMaterial({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: GLSL3,

          uniforms: {
            colormapTex: { value: colormap.getTexture({ gradient: true }) },
            colormapRangeMin: { value: colormap.getRange().min },
            colormapRangeMax: { value: colormap.getRange().max },
            zoom: { value: this.map.getZoom() },
            tileIndex: { value: new Vector3(tileIndex.x, tileIndex.y, tileIndex.z) },
            isGlobe: { value: mapProjection && mapProjection.type === "globe" },
            date: { value: timestamp },
            opacity: { value: this.opacity },
            sunCoordRa: { value: ra },
            sunCoordDec: { value: dec },
            sideralTimeComponent: { value: sideralTimeComponent },
            altitude: { value: this.altitude },
          },

          vertexShader: this.defaultVertexShader,
          fragmentShader: fragmentShader,
          side: BackSide,
          transparent: true,
          depthTest: false,
          // wireframe: true,
        });

        return material;
      },

      onTileUpdate: (tile: Tile, _matrix: Mat4) => {
        (tile.material as RawShaderMaterial).uniforms.zoom.value = this.map.getZoom();

        const timestamp = +this.date / 1000;
        const daysJ2K = toDays(timestamp);
        const { dec, ra } = sunCoords(daysJ2K);
        const sideralTimeComponent = computeSideralTimeComponent(daysJ2K);

        const mapProjection = this.map.getProjection();
        const tileIndeArray = tile.getTileIndexAsArray();
        const mat = tile.material as RawShaderMaterial;
        const zoom = this.map.getZoom();
        // At z12+, the globe is no longer globe in Maplibre
        const isGlobe = mapProjection && mapProjection.type === "globe" && zoom < 12;
        mat.uniforms.zoom.value = zoom;
        mat.uniforms.isGlobe.value = isGlobe;
        mat.uniforms.opacity.value = this.opacity;
        mat.uniforms.date.value = timestamp;
        mat.uniforms.sunCoordRa.value = ra;
        mat.uniforms.sunCoordDec.value = dec;
        mat.uniforms.sideralTimeComponent.value = sideralTimeComponent;
        mat.uniforms.altitude.value = this.altitude;
        (mat.uniforms.tileIndex.value as Vector3).set(tileIndeArray[0], tileIndeArray[1], tileIndeArray[2]);
      },
    });

    this.date = options.date ?? new Date();

    if (options.opacity) {
      this.setOpacity(options.opacity);
    }
  }

  setDate(date: Date) {
    this.date = date;
    if (this.map) {
      this.map.triggerRepaint();
    }
  }
}
