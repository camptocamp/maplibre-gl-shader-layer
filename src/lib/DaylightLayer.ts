/**
 * This is a demo of how to extend ShaderTiledLayer
 * RawShaderTiledLayer is a layer that simply contains a texture per tile
 */

import { BackSide, GLSL3, RawShaderMaterial, Vector3 } from "three";
import { type Mat4, BaseShaderTiledLayer } from "./BaseShaderTiledLayer";
// @ts-ignore
import vertexShader from "./shaders/globe-tile.v.glsl?raw";
// @ts-ignore
import fragmentShader from "./shaders/daylight.f.glsl?raw";
import type { TileIndex } from "./tools";
import type { Tile } from "./Tile";
import { Colormap } from "./colormap";

export type DaylightLayerOptions = {
  date?: Date;
};

export class DaylightLayer extends BaseShaderTiledLayer {
  private date: Date;

  constructor(id: string, options: DaylightLayerOptions = {}) {
    const colormap = Colormap.fromColormapDescription([
      -20,
      "rgba(21, 32, 69, 0.3)",
      -1,
      "rgba(21, 32, 69, 0.3)",
      0,
      "rgba(21, 32, 69, 0.0)",
      10,
      "rgba(21, 32, 69, 0.0)",
    ]);

    super(id, {
      onSetTileMaterial: (tileIndex: TileIndex) => {
        const mapProjection = this.map.getProjection();

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
            date: { value: +this.date / 1000 },
          },

          vertexShader: vertexShader,
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

        const mapProjection = this.map.getProjection();
        const tileIndeArray = tile.getTileIndexAsArray();
        const mat = tile.material as RawShaderMaterial;
        const zoom = this.map.getZoom();
        // At z12+, the globe is no longer globe in Maplibre
        const isGlobe = mapProjection && mapProjection.type === "globe" && zoom < 12;
        mat.uniforms.zoom.value = zoom;
        mat.uniforms.isGlobe.value = isGlobe;
        mat.uniforms.date.value = +this.date / 1000;
        (mat.uniforms.tileIndex.value as Vector3).set(tileIndeArray[0], tileIndeArray[1], tileIndeArray[2]);
      },
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
