/**
 * This is a demo of how to extend ShaderTiledLayer
 * TextureTiledLayer is a layer that simply contains a texture per tile
 */

import { RawShaderMaterial, GLSL3, Vector3, BackSide } from "three";
import { type Mat4, BaseShaderTiledLayer } from "../core/BaseShaderTiledLayer";
import type { TileIndex } from "../core/tools";
import type { Tile } from "../core/Tile";
import { RemoteTileTextureManager } from "../core/RemoteTileTextureManager";
// @ts-ignore
import fragmentShader from "../shaders/texture-tile.f.glsl?raw";

export type RemoteTextureTiledLayerOptions = {
  minZoom?: number;
  maxZoom?: number;
  textureUrlPattern: string;
  /**
   * A texture manager can be provided. This can be interesting when multiple
   * layers are using the same textures.
   * If not provided, a default one will be added internaly to this layer.
   */
  remoteTileTextureManager?: RemoteTileTextureManager;
};

export class RemoteTextureTiledLayer extends BaseShaderTiledLayer {
  private readonly textureUrlPattern: string;
  private readonly remoteTileTextureManager: RemoteTileTextureManager;

  constructor(id: string, options: RemoteTextureTiledLayerOptions) {
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
        mat.uniforms.tex.value = await this.remoteTileTextureManager.getTexture(
          tile.getTileIndex(),
          this.textureUrlPattern,
        );
        mat.uniforms.zoom.value = zoom;
        mat.uniforms.isGlobe.value = isGlobe;
        mat.uniforms.opacity.value = this.opacity;
        (mat.uniforms.tileIndex.value as Vector3).set(tileIndeArray[0], tileIndeArray[1], tileIndeArray[2]);
      },
    });

    this.remoteTileTextureManager = options.remoteTileTextureManager ?? new RemoteTileTextureManager();
    this.textureUrlPattern = options.textureUrlPattern;
  }
}
