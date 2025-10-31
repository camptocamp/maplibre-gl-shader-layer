/**
 * This is a demo of how to extend ShaderTiledLayer
 * TextureTiledLayer is a layer that simply contains a texture per tile
 */

import QuickLRU from "quick-lru";
import { type Texture, TextureLoader, RawShaderMaterial, GLSL3, Vector3, BackSide } from "three";
import { type Mat4, ShaderTiledLayer } from "./ShaderTiledLayer";
import { clamp, wrapTileIndex, type TileIndex } from "./tools";
import type { Tile } from "./Tile";
// @ts-ignore
import vertexShader from "./shaders/texture-tile.v.glsl?raw";
// @ts-ignore
import fragmentShader from "./shaders/multi-channel-series-tile.f.glsl?raw";
import type { Colormap } from "./colormap";




export type Bounds = [number, number, number, number];
export type SeriesElement = {
  /**
   * Pattern to load individual tiles. Assumed to be at the same location
   * as this payload, unless starting by "http://" or "https://"
   * Example: "some-tile/{z}/{x}/{y}.webp"
   */
  tileUrlPattern: string,

  /**
   * Value of this timeset along the dimension that this series defines
   * (since the element of the series are not required to be all equaly spaced)
   * Example:a unix timestamp value, an altitude elevation, etc.
   */
  seriesAxisValue: number,

  /**
   * Custom metadata the user can add and that apply to this particular tileset
   * or "position" along this series axis
   */
  metadata?: Record<string, unknown>,
}

export type RasterEncoding = {
  /**
   * The image channels to be used to obtain the raster value
   */
  channels: string,

  /**
   * If equal to 1, the raster value to compute is a scalar (can use 1, 2 or 3 `channels`)
   * If equal to 2, the raster value to compute is a 2D vector. (must use 2 `channels`)
   * If equal to 3, the raster value to compute is a 3D vector. (must use 3 `channels`)
   */
  vectorDimension?: number,

  /**
   * This is the "a" in "y = ax + b",
   * where:
   *   "x" is the raw value computed from the `channels`
   *   "y" is the value is real world unit (eg. degree celcius)
   *   "b" see below
   */
  polynomialSlope: number,

  /**
   * This is the "b" in "y = ax + b",
   * where:
   *   "x" is the raw value computed from the `channels`
   *   "y" is the value is real world unit (eg. degree celcius)
   *   "a" see above
   */
  polynomialOffset: number
}



export type MultiChannelSeriesTiledLayerSpecification = {
  /**
   * Name of the dataset
   */
  name: string,

  /**
   * Description of the dataset
   */
  description?: string,

  /**
   * Attribution associated to the dataset
   */
  attribution?: string[],

  bounds: Bounds,

  crs?: string,

  /**
   * Minimum zoom level in which tiles are available
   */
  minZoom: number,

  /**
   * Maximum zoom level in which tiles are available
   */
  maxZoom: number,

  /**
   * Size of the tile in pixels (for both width and height)
   */
  tileSize: number,

  /**
   * File format of the tiles. Likely to be png or webp.
   * (Most likely not jpeg due to lossy compression)
   */
  rasterFormat: "png" | "webp",

  /**
   * This section is used for decoding the data
   */
  rasterEncoding: RasterEncoding,
  
  /**
   * The real world unit of the value computed for each pixel.
   * Could be left empty.
   */
  pixelUnit?: string,

  /**
   * Name to give to the series axis (eg. "time", "depth", "altitude", etc.)
   */
  seriesAxisName: string,

  /**
   * Real world unit of the series axis (eg. "second", "meter", etc.)
   */
  seriesAxisUnit: string,

  /**
   * Extra metadata the use can add to this tileset and that would apply to
   * the whole series
   */
  metadata?: Record<string, unknown>,

  /**
   * The series includes all the tilesets in the relevant order
   */
  series: SeriesElement[],
}



export type MultiChannelSeriesTiledLayerOptions = {
  datasetSpecification: MultiChannelSeriesTiledLayerSpecification,
  colormap: Colormap,

  /**
   * Position to start with when initializing the layer.
   * If not provided, the begining of the series will be used instead
   */
  seriesAxisValue?: number,

  tileUrlPrefix?: string,
}


export class MultiChannelSeriesTiledLayer extends ShaderTiledLayer {
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
  private nonExistingTextures: Set<string> = new Set();

  private readonly rasterEncoding: RasterEncoding;
  private readonly colormap: Colormap;
  private seriesAxisValue!: number;
  private readonly datasetSpecification: MultiChannelSeriesTiledLayerSpecification;
  private seriesElementBefore!: SeriesElement;
  private seriesElementAfter!: SeriesElement;
  private readonly tileUrlPrefix: string;

  constructor(id: string, options: MultiChannelSeriesTiledLayerOptions) {
    super(id, {
      minZoom: options.datasetSpecification.minZoom, 
      maxZoom: options.datasetSpecification.maxZoom,

      onSetTileMaterial: (tileIndex: TileIndex) => {
        const mapProjection = this.map.getProjection();

        const material = new RawShaderMaterial({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: GLSL3,

          uniforms: {
            texBefore: { value: this.getTexture(tileIndex, this.seriesElementBefore.tileUrlPattern) },
            texAfter: { value: this.getTexture(tileIndex, this.seriesElementAfter.tileUrlPattern) },
            seriesAxisValueBefore: { value: this.seriesElementBefore.seriesAxisValue },
            seriesAxisValueAfter: { value: this.seriesElementAfter.seriesAxisValue },
            seriesAxisValue: { value: this.seriesAxisValue },
            zoom: { value: this.map.getZoom() },
            tileIndex: { value: new Vector3(tileIndex.x, tileIndex.y, tileIndex.z) },
            isGlobe: { value: (mapProjection && mapProjection.type === "globe")},
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
          }
        })

        return material;
      },


      onTileUpdate: (tile: Tile, matrix: Mat4) => {
        const mapProjection = this.map.getProjection();
        const tileIndeArray = tile.getTileIndexAsArray();
        const material = tile.material as RawShaderMaterial;
        const zoom = this.map.getZoom();
        // At z12+, the globe is no longer globe in Maplibre
        const isGlobe = (mapProjection && mapProjection.type === "globe") && zoom < 12;
        material.uniforms.texBefore.value = this.getTexture(tile.getTileIndex(), this.seriesElementBefore.tileUrlPattern);
        material.uniforms.texAfter.value = this.getTexture(tile.getTileIndex(), this.seriesElementAfter.tileUrlPattern);
        material.uniforms.seriesAxisValueBefore.value = this.seriesElementBefore.seriesAxisValue;
        material.uniforms.seriesAxisValueAfter.value = this.seriesElementAfter.seriesAxisValue;
        material.uniforms.seriesAxisValue.value = this.seriesAxisValue;
        material.uniforms.zoom.value = zoom;
        material.uniforms.isGlobe.value = isGlobe;
        (material.uniforms.tileIndex.value as Vector3).set(tileIndeArray[0], tileIndeArray[1], tileIndeArray[2]);
      }
    });

    this.tileUrlPrefix = options.tileUrlPrefix ?? "";
    this.datasetSpecification = options.datasetSpecification;
    this.rasterEncoding = options.datasetSpecification.rasterEncoding;
    this.colormap = options.colormap;
    this.setSeriesAxisValue(options.seriesAxisValue ?? this.datasetSpecification.series[0].seriesAxisValue)
  }


  private getTexture(tileIndex: TileIndex, textureUrlPattern: string): Texture {
      const tileIndexWrapped = wrapTileIndex(tileIndex);
      const textureURL = this.tileUrlPrefix + textureUrlPattern.replace("{x}", tileIndexWrapped.x.toString())
        .replace("{y}", tileIndexWrapped.y.toString())
        .replace("{z}", tileIndexWrapped.z.toString());

      let texture: Texture;
      
      if (this.texturePool.has(textureURL)) {
        texture = this.texturePool.get(textureURL) as Texture;
      } else {
        
  
        // texture = this.textureLoader.load(
        texture = new TextureLoader().load(
          textureURL,
          
          ( texture ) => {
            // console.log("SUCESS");
          },
        
          // onProgress callback currently not supported
          undefined,
        
          // onError callback
          ( err ) => {
            console.error( 'An error happened.' );
          }
        );      
      }
      texture.flipY = false;
      this.texturePool.set(textureURL, texture);
  
      return texture;
    }

    /**
     * Get the range of values along the series axis.
     * It is assumed that the first element of the series has a smaller value
     * than the last.
     */
    private getSerieAxisRange(): [number, number] | null {
      const series = this.datasetSpecification.series;
      if (!series.length) {
        return null;
      }

      return [
        series[0].seriesAxisValue,
        series[series.length - 1].seriesAxisValue,
      ];
    }


    setSeriesAxisValue(pos: number) {
      const range = this.getSerieAxisRange();
      if (!range) {
        return;
      }
      this.seriesAxisValue = clamp(range, pos);
      this.defineCurrentSeriesElement();

      if (this.map) {
        this.map.triggerRepaint();
      }
    }


    private defineCurrentSeriesElement() {
      const series = this.datasetSpecification.series;
      if (!series.length) {
        return null;
      }

      if (series.length === 1) {
        this.seriesElementBefore = series[0];
        this.seriesElementAfter = series[0];
        return;
      }

      const range = this.getSerieAxisRange();
      if (!range) {
        return;
      }

      if (this.seriesAxisValue <= range[0]) {
        this.seriesElementBefore = series[0];
        this.seriesElementAfter = series[0];
        return;
      }

      if (this.seriesAxisValue >= range[1]) {
        this.seriesElementBefore = series[series.length - 1];
        this.seriesElementAfter = series[series.length - 1];
        return;
      }

      for (let i = 0; i < series.length - 1; i += 1) {
        const seriesI = series[i];
        const seriesNext = series[i + 1];
        
        if (this.seriesAxisValue >= seriesI.seriesAxisValue && 
            this.seriesAxisValue < seriesNext.seriesAxisValue) {
          this.seriesElementBefore = seriesI;
          this.seriesElementAfter = seriesNext;
          break;
        }
      }
    }

}