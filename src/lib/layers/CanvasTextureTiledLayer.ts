/**
 * This is a demo of how to extend ShaderTiledLayer
 * TextureTiledLayer is a layer that simply contains a texture per tile
 */

import { RawShaderMaterial, GLSL3, Vector3, BackSide, CanvasTexture } from "three";
import { type Mat4, BaseShaderTiledLayer } from "../core/BaseShaderTiledLayer";
import type { TileIndex } from "../core/tools";
import type { Tile } from "../core/Tile";
// @ts-ignore
import fragmentShader from "../shaders/texture-tile.f.glsl?raw";
import { type TextureMaker, TileTextureManager } from "../core/TileTextureManager";

export type CanvasTextureTiledLayerOptions = {
  minZoom?: number;
  maxZoom?: number;
  canvasMaker: (tileIndex: TileIndex) => HTMLCanvasElement;
};

export class CanvasTextureTiledLayer extends BaseShaderTiledLayer {
  private readonly tileTextureManager: TileTextureManager;

  constructor(id: string, options: CanvasTextureTiledLayerOptions) {
    const canvasMaker = options.canvasMaker;
    const textureMaker: TextureMaker = async (tileIndex: TileIndex) => {
      const canvas = canvasMaker(tileIndex);
      return new CanvasTexture(canvas);
    };

    super(id, {
      minZoom: options.minZoom ?? 0,
      maxZoom: options.maxZoom ?? 22,

      onSetTileMaterial: (tileIndex: TileIndex) => {
        const mapProjection = this.map.getProjection();

        const material = new RawShaderMaterial({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: GLSL3,

          uniforms: {
            tex: { value: null },
            zoom: { value: this.map.getZoom() },
            tileIndex: { value: new Vector3(tileIndex.x, tileIndex.y, tileIndex.z) },
            isGlobe: { value: mapProjection && mapProjection.type === "globe" },
            opacity: { value: this.opacity },
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

      onTileUpdate: async (tile: Tile, _matrix: Mat4) => {
        const mapProjection = this.map.getProjection();
        const tileIndeArray = tile.getTileIndexAsArray();
        const mat = tile.material as RawShaderMaterial;
        const zoom = this.map.getZoom();
        // At z12+, the globe is no longer globe in Maplibre
        const isGlobe = mapProjection && mapProjection.type === "globe" && zoom < 12;
        mat.uniforms.tex.value = await this.tileTextureManager.getTexture(tile.getTileIndex(), textureMaker);
        mat.uniforms.zoom.value = zoom;
        mat.uniforms.isGlobe.value = isGlobe;
        mat.uniforms.opacity.value = this.opacity;
        (mat.uniforms.tileIndex.value as Vector3).set(tileIndeArray[0], tileIndeArray[1], tileIndeArray[2]);
      },
    });

    this.tileTextureManager = new TileTextureManager();
  }
}
