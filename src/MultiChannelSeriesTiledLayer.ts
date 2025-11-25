/**
 * This is a demo of how to extend ShaderTiledLayer
 * TextureTiledLayer is a layer that simply contains a texture per tile
 */

import QuickLRU from "quick-lru";
import { type Texture, TextureLoader, RawShaderMaterial, GLSL3, Vector3, BackSide } from "three";
import { type Mat4, ShaderTiledLayer } from "./ShaderTiledLayer";
import { clamp, pickImg, wgs84ToTileIndex, wrapTileIndex, type TileIndex } from "./tools";
import type { Tile } from "./Tile";
// @ts-ignore
import vertexShader from "./shaders/globe-tile.v.glsl?raw";
// @ts-ignore
import fragmentShader from "./shaders/multi-channel-series-tile.f.glsl?raw";
import type { Colormap } from "./colormap";
import { LngLat } from "maplibre-gl";
import { RemoteTileTextureManager } from "./RemoteTileTextureManager";




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
   * Whether the colormap should be rendered with gradient (true)
   * or with classes (false)
   * default: true
   */
  colormapGradient?: boolean,

  /**
   * Position to start with when initializing the layer.
   * If not provided, the begining of the series will be used instead
   */
  seriesAxisValue?: number,

  /**
   * Prefix to the tile url
   */
  tileUrlPrefix?: string,

  /**
   * A texture manager can be provided. This can be interesting when multiple
   * layers are using the same textures.
   * If not provided, a default one will be added internaly to this layer.
   */
  remoteTileTextureManager?: RemoteTileTextureManager
}


export class MultiChannelSeriesTiledLayer extends ShaderTiledLayer {
  private readonly rasterEncoding: RasterEncoding;
  private readonly colormap: Colormap;
  private seriesAxisValue!: number;
  private readonly datasetSpecification: MultiChannelSeriesTiledLayerSpecification;
  private seriesElementBefore!: SeriesElement;
  private indexSeriesElementBefore = 0;
  private seriesElementAfter!: SeriesElement;
  private readonly tileUrlPrefix: string;
  private readonly colormapGradient;
  private readonly remoteTileTextureManager: RemoteTileTextureManager;

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
            opacity: { value: this.opacity },
            texBefore: { value: null },
            texAfter: { value: null },
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
            colormapTex: { value: this.colormap.getTexture({gradient: this.colormapGradient, size: this.colormapGradient ? 512 : 4096}) },
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


      onTileUpdate: async (tile: Tile, _matrix: Mat4) => {        
        // TODO: Add a signal to cancel the fetching of the texture in case the series axis moves too fast
        // and needs to skip/jump further.

        const texBeforeAfter = await Promise.allSettled([
          this.remoteTileTextureManager.getTexture(tile.getTileIndex(), `${this.tileUrlPrefix}${this.seriesElementBefore.tileUrlPattern}`),
          this.remoteTileTextureManager.getTexture(tile.getTileIndex(), `${this.tileUrlPrefix}${this.seriesElementAfter.tileUrlPattern}`),
        ])

        const mapProjection = this.map.getProjection();
        const tileIndeArray = tile.getTileIndexAsArray();
        const material = tile.material as RawShaderMaterial;
        const zoom = this.map.getZoom();
        material.uniforms.opacity.value = this.opacity;
        // At z12+, the globe is no longer globe in Maplibre
        const isGlobe = (mapProjection && mapProjection.type === "globe") && zoom < 12;
        material.uniforms.texBefore.value = texBeforeAfter[0].status === "fulfilled" ? texBeforeAfter[0].value : null;
        material.uniforms.texAfter.value = texBeforeAfter[1].status === "fulfilled" ? texBeforeAfter[1].value : null;
        material.uniforms.seriesAxisValueBefore.value = this.seriesElementBefore.seriesAxisValue;
        material.uniforms.seriesAxisValueAfter.value = this.seriesElementAfter.seriesAxisValue;
        material.uniforms.seriesAxisValue.value = this.seriesAxisValue;
        material.uniforms.zoom.value = zoom;
        material.uniforms.isGlobe.value = isGlobe;
        (material.uniforms.tileIndex.value as Vector3).set(tileIndeArray[0], tileIndeArray[1], tileIndeArray[2]);
      }
    });

    

    this.colormapGradient = options.colormapGradient ?? true;
    this.tileUrlPrefix = options.tileUrlPrefix ?? "";
    this.datasetSpecification = options.datasetSpecification;
    this.rasterEncoding = options.datasetSpecification.rasterEncoding;
    this.colormap = options.colormap;
    this.setSeriesAxisValue(options.seriesAxisValue ?? this.datasetSpecification.series[0].seriesAxisValue)
    this.remoteTileTextureManager = options.remoteTileTextureManager ?? new RemoteTileTextureManager();
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

  getSeriesAxisValue(): number {
    return this.seriesAxisValue;
  }


  private defineCurrentSeriesElement() {
    const series = this.datasetSpecification.series;
    if (!series.length) {
      return null;
    }

    if (series.length === 1) {
      this.indexSeriesElementBefore = 0;
      this.seriesElementBefore = series[0];
      this.seriesElementAfter = series[0];
      return;
    }

    const range = this.getSerieAxisRange();
    if (!range) {
      return;
    }

    if (this.seriesAxisValue <= range[0]) {
      this.indexSeriesElementBefore = 0;
      this.seriesElementBefore = series[0];
      this.seriesElementAfter = series[0];
      return;
    }

    if (this.seriesAxisValue >= range[1]) {
      this.indexSeriesElementBefore = series.length - 1;
      this.seriesElementBefore = series[series.length - 1];
      this.seriesElementAfter = series[series.length - 1];
      return;
    }

    for (let i = 0; i < series.length - 1; i += 1) {
      const seriesI = series[i];
      const seriesNext = series[i + 1];
      
      if (this.seriesAxisValue >= seriesI.seriesAxisValue && 
          this.seriesAxisValue < seriesNext.seriesAxisValue) {
            this.indexSeriesElementBefore = i;
        this.seriesElementBefore = seriesI;
        this.seriesElementAfter = seriesNext;
        break;
      }
    }
  }


  /**
   * Prefetch texture along the series dimensions for the same tile coverage as the curent.
   * deltaBefore is the number of series elements before the curent position and deltaAfter
   * is the number of elements after the curent position.
   */
  async prefetchSeriesTexture(deltaBefore: number, deltaAfter: number) {
    // Tile indices {x, y, z} of the current tile coverage
    const tileIndices = Array.from(this.usedTileMap.values()).map(tile => tile.getTileIndex());
    const series = this.datasetSpecification.series;
    const fetchingPromiseList = [];

    const seriesIndexStart = Math.max(0, this.indexSeriesElementBefore + deltaBefore);
    const seriesIndexEnd = Math.min(series.length - 1, this.indexSeriesElementBefore + deltaAfter);

    let counter = 0;

    for (let i = seriesIndexStart; i < seriesIndexEnd + 1; i += 1) {
      if (i < 0) continue;
      if (i >= series.length) break;

      for( const tileIndex of tileIndices) {
        counter ++
        fetchingPromiseList.push(
          this.remoteTileTextureManager.getTexture(tileIndex, `${this.tileUrlPrefix}${series[i].tileUrlPattern}`)
        );
      }
    }
    
    await Promise.allSettled(fetchingPromiseList);
  }


  /**
   * Get the value and unit at a given position, for the current series axis position.
   */
  async pick(lngLat: LngLat): Promise<{value: number, unit: string | undefined} | null> {
    const tileIndices = Array.from(this.usedTileMap.values()).map(tile => tile.getTileIndex());

    // Getting zoom level of current displayed tiles
    const z = tileIndices[0].z;

    const tileToPickUnstrict = wgs84ToTileIndex(lngLat, z, false);
    const tileIndexStrict = {
      z,
      x: Math.floor(tileToPickUnstrict.x),
      y: Math.floor(tileToPickUnstrict.y),
    } as TileIndex;

    const texturesBeforeAfter = await Promise.allSettled([
      await this.remoteTileTextureManager.getTexture(tileIndexStrict,`${this.tileUrlPrefix}${this.seriesElementBefore.tileUrlPattern}`),
      await this.remoteTileTextureManager.getTexture(tileIndexStrict,`${this.tileUrlPrefix}${this.seriesElementAfter.tileUrlPattern}`),
    ])

    if (texturesBeforeAfter[0].status === "rejected" || texturesBeforeAfter[1].status === "rejected") {
      return null;
    }

    const textureBefore = texturesBeforeAfter[0].value;
    const textureAfter = texturesBeforeAfter[1].value;

    const textureUnitPosition = [
      tileToPickUnstrict.x - tileIndexStrict.x,
      tileToPickUnstrict.y - tileIndexStrict.y
    ] as [number, number];

    const valuePixelBefore = pickImg(textureBefore.image, textureUnitPosition);
    const valuePixelAfter = pickImg(textureAfter.image, textureUnitPosition);

    if (!valuePixelBefore || !valuePixelAfter) return null;

    const channels = Array.from(this.datasetSpecification.rasterEncoding.channels);
    const valuePixelBeforeObj: Record<string, number> = {
      r: valuePixelBefore[0],
      g: valuePixelBefore[1],
      b: valuePixelBefore[2],
      a: valuePixelBefore[3],
    };

    const valuePixelAfterObj: Record<string, number> = {
      r: valuePixelAfter[0],
      g: valuePixelAfter[1],
      b: valuePixelAfter[2],
      a: valuePixelAfter[3],
    };    
    
    // Nodata
    if (valuePixelBeforeObj.a === 0 || valuePixelAfterObj.a === 0) {        
      return null;
    }

    let encodedValueBefore = 0;
    let encodedValueAfter = 0;

    if (channels.length === 1) {
      encodedValueBefore = valuePixelBeforeObj[channels[0]];
      encodedValueAfter = valuePixelAfterObj[channels[0]];
    } else
    
    if (channels.length === 2) {
      encodedValueBefore = valuePixelBeforeObj[channels[0]] * 256 + valuePixelBeforeObj[channels[1]];
      encodedValueAfter = valuePixelAfterObj[channels[0]] * 256 + valuePixelAfterObj[channels[1]];
    } else
    
    if (channels.length === 3) {
      encodedValueBefore = valuePixelBeforeObj[channels[0]] * 256 * 256 + valuePixelBeforeObj[channels[1]] * 256 + valuePixelBeforeObj[channels[2]];
      encodedValueAfter = valuePixelAfterObj[channels[0]] * 256 * 256 + valuePixelAfterObj[channels[1]] * 256 + valuePixelAfterObj[channels[2]];
    } else {
      return null;
    }

    const {polynomialOffset, polynomialSlope} = this.datasetSpecification.rasterEncoding;
    const realWorldValueBefore = encodedValueBefore * polynomialSlope + polynomialOffset;
    const realWorldValueAfter = encodedValueAfter * polynomialSlope + polynomialOffset;
    const ratioAfter = this.seriesElementAfter.seriesAxisValue === this.seriesElementBefore.seriesAxisValue ? realWorldValueBefore : (this.seriesAxisValue - this.seriesElementBefore.seriesAxisValue) / (this.seriesElementAfter.seriesAxisValue - this.seriesElementBefore.seriesAxisValue);
    const realWorldValue = ratioAfter * realWorldValueAfter + (1 - ratioAfter) * realWorldValueBefore

    return {
      value: realWorldValue,
      unit: this.datasetSpecification.pixelUnit,
    }
  }


}