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
import fragmentShader from "./shaders/multi-channel-tile.f.glsl?raw";
import type { Colormap } from "./colormap";

type RasterEncodingInfo = {
  channels: string;
  vectorDimension?: number;
  polynomialSlope: number;
  polynomialOffset: number;
};

export type MultiChannelTiledLayerOptions = {
  minZoom: number;
  maxZoom: number;
  textureUrlPattern: string;
  rasterEncoding: RasterEncodingInfo;
  colormap: Colormap;
};

export class MultiChannelTiledLayer extends BaseShaderTiledLayer {
  private readonly textureUrlPattern: string;
  private readonly texturePool: QuickLRU<string, Texture> = new QuickLRU({
    // should be replaced by gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    maxSize: 100,

    onEviction(_key: string, value: Texture) {
      console.log("freeing texture GPU memory");
      value.dispose();
    },
  });

  // Set to store the "z_x_y" of textures that cannot be loaded, so that we don't
  // try to load them again and again
  private readonly rasterEncoding: RasterEncodingInfo;
  private readonly colormap: Colormap;

  constructor(id: string, options: MultiChannelTiledLayerOptions) {
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
            rasterEncodingPolynomialSlope: { value: this.rasterEncoding.polynomialSlope },
            rasterEncodingPolynomialOffset: { value: this.rasterEncoding.polynomialOffset },
            colormapRangeMin: { value: this.colormap.getRange().min },
            colormapRangeMax: { value: this.colormap.getRange().max },
            colormapTex: { value: this.colormap.getTexture() },
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          side: BackSide,
          transparent: true,
          depthTest: false,
          // wireframe: true,
          defines: {
            RASTER_ENCODING_CHANNELS: this.rasterEncoding.channels,
            RASTER_ENCODING_NB_CHANNELS: this.rasterEncoding.channels.length,
          },
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
    this.rasterEncoding = options.rasterEncoding;
    this.colormap = options.colormap;
  }

  private getTexture(tileIndex: TileIndex): Texture {
    const tileIndexWrapped = wrapTileIndex(tileIndex);
    const textureURL = this.textureUrlPattern
      .replace("{x}", tileIndexWrapped.x.toString())
      .replace("{y}", tileIndexWrapped.y.toString())
      .replace("{z}", tileIndexWrapped.z.toString());

    let texture: Texture;

    if (this.texturePool.has(textureURL)) {
      texture = this.texturePool.get(textureURL) as Texture;
    } else {
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
    this.texturePool.set(textureURL, texture);

    return texture;
  }
}
