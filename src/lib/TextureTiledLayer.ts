/**
 * This is a demo of how to extend ShaderTiledLayer
 * TextureTiledLayer is a layer that simply contains a texture per tile
 */

import QuickLRU from "quick-lru";
import { type Texture, TextureLoader, RawShaderMaterial, GLSL3, Vector3, BackSide } from "three";
import { type Mat4, BaseShaderTiledLayer } from "./BaseShaderTiledLayer";
import { wrapTileIndex, type TileIndex } from "./tools";
import type { Tile } from "./Tile";
// @ts-ignore
import vertexShader from "./shaders/globe-tile.v.glsl?raw";
// @ts-ignore
import fragmentShader from "./shaders/texture-tile.f.glsl?raw";

export type TextureTiledLayerOptions = {
  minZoom?: number;
  maxZoom?: number;
  textureUrlPattern: string;
};

export class TextureTiledLayer extends BaseShaderTiledLayer {
  private readonly textureUrlPattern: string;
  private readonly texturePool: QuickLRU<string, Texture> = new QuickLRU({
    // should be replaced by gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    maxSize: 100,

    onEviction(_key: string, value: Texture) {
      console.log("freeing texture GPU memory");
      value.dispose();
    },
  });

  constructor(id: string, options: TextureTiledLayerOptions) {
    super(id, {
      minZoom: options.minZoom ?? 0,
      maxZoom: options.maxZoom ?? 22,

      onSetTileMaterial: (tileIndex: TileIndex) => {
        const texture = this.getTexture(tileIndex);
        const mapProjection = this.map.getProjection();

        const material = new RawShaderMaterial({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: GLSL3,

          uniforms: {
            tex: { value: texture },
            zoom: { value: this.map.getZoom() },
            tileIndex: { value: new Vector3(tileIndex.x, tileIndex.y, tileIndex.z) },
            isGlobe: { value: mapProjection && mapProjection.type === "globe" },
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
        const mapProjection = this.map.getProjection();
        const tileIndeArray = tile.getTileIndexAsArray();
        const mat = tile.material as RawShaderMaterial;
        const zoom = this.map.getZoom();
        // At z12+, the globe is no longer globe in Maplibre
        const isGlobe = mapProjection && mapProjection.type === "globe" && zoom < 12;

        mat.uniforms.tex.value = this.getTexture(tile.getTileIndex());
        mat.uniforms.zoom.value = zoom;
        mat.uniforms.isGlobe.value = isGlobe;
        (mat.uniforms.tileIndex.value as Vector3).set(tileIndeArray[0], tileIndeArray[1], tileIndeArray[2]);
      },
    });

    this.textureUrlPattern = options.textureUrlPattern;
  }

  private getTexture(tileIndex: TileIndex): Texture {
    const tileIndexWrapped = wrapTileIndex(tileIndex);
    const textureId = `${tileIndexWrapped.z}_${tileIndexWrapped.x}_${tileIndexWrapped.y}`;

    let texture: Texture;

    if (this.texturePool.has(textureId)) {
      texture = this.texturePool.get(textureId) as Texture;
    } else {
      const textureURL = this.textureUrlPattern
        .replace("{x}", tileIndexWrapped.x.toString())
        .replace("{y}", tileIndexWrapped.y.toString())
        .replace("{z}", tileIndexWrapped.z.toString());

      // texture = this.textureLoader.load(
      texture = new TextureLoader().load(
        textureURL,

        (_texture) => {
          // console.log("SUCESS");
        },

        // onProgress callback currently not supported
        undefined,

        // onError callback
        (_err) => {
          console.error("An error happened.");
        },
      );
    }
    texture.flipY = false;
    this.texturePool.set(textureId, texture);

    return texture;
  }
}
