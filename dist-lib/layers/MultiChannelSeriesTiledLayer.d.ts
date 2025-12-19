import { BaseShaderTiledLayer } from '../core/BaseShaderTiledLayer';
import { Colormap } from '../core/colormap';
import { LngLat } from 'maplibre-gl';
import { RemoteTileTextureManager } from '../core/RemoteTileTextureManager';
export type Bounds = [number, number, number, number];
export type SeriesElement = {
    /**
     * Pattern to load individual tiles. Assumed to be at the same location
     * as this payload, unless starting by "http://" or "https://"
     * Example: "some-tile/{z}/{x}/{y}.webp"
     */
    tileUrlPattern: string;
    /**
     * Value of this timeset along the dimension that this series defines
     * (since the element of the series are not required to be all equaly spaced)
     * Example:a unix timestamp value, an altitude elevation, etc.
     */
    seriesAxisValue: number;
    /**
     * Custom metadata the user can add and that apply to this particular tileset
     * or "position" along this series axis
     */
    metadata?: Record<string, unknown>;
};
export type RasterEncoding = {
    /**
     * The image channels to be used to obtain the raster value
     */
    channels: string;
    /**
     * If equal to 1, the raster value to compute is a scalar (can use 1, 2 or 3 `channels`)
     * If equal to 2, the raster value to compute is a 2D vector. (must use 2 `channels`)
     * If equal to 3, the raster value to compute is a 3D vector. (must use 3 `channels`)
     */
    vectorDimension?: number;
    /**
     * This is the "a" in "y = ax + b",
     * where:
     *   "x" is the raw value computed from the `channels`
     *   "y" is the value is real world unit (eg. degree celcius)
     *   "b" see below
     */
    polynomialSlope: number;
    /**
     * This is the "b" in "y = ax + b",
     * where:
     *   "x" is the raw value computed from the `channels`
     *   "y" is the value is real world unit (eg. degree celcius)
     *   "a" see above
     */
    polynomialOffset: number;
};
export type MultiChannelSeriesTiledLayerSpecification = {
    /**
     * Name of the dataset
     */
    name: string;
    /**
     * Description of the dataset
     */
    description?: string;
    /**
     * Attribution associated to the dataset
     */
    attribution?: string[];
    bounds: Bounds;
    crs?: string;
    /**
     * Minimum zoom level in which tiles are available
     */
    minZoom: number;
    /**
     * Maximum zoom level in which tiles are available
     */
    maxZoom: number;
    /**
     * Size of the tile in pixels (for both width and height)
     */
    tileSize: number;
    /**
     * File format of the tiles. Likely to be png or webp.
     * (Most likely not jpeg due to lossy compression)
     */
    rasterFormat: "png" | "webp";
    /**
     * This section is used for decoding the data
     */
    rasterEncoding: RasterEncoding;
    /**
     * The real world unit of the value computed for each pixel.
     * Could be left empty.
     */
    pixelUnit?: string;
    /**
     * Name to give to the series axis (eg. "time", "depth", "altitude", etc.)
     */
    seriesAxisName: string;
    /**
     * Real world unit of the series axis (eg. "second", "meter", etc.)
     */
    seriesAxisUnit: string;
    /**
     * Extra metadata the use can add to this tileset and that would apply to
     * the whole series
     */
    metadata?: Record<string, unknown>;
    /**
     * The series includes all the tilesets in the relevant order
     */
    series: SeriesElement[];
};
export type MultiChannelSeriesTiledLayerOptions = {
    datasetSpecification: MultiChannelSeriesTiledLayerSpecification;
    colormap: Colormap;
    /**
     * Whether the colormap should be rendered with gradient (true)
     * or with classes (false)
     * default: true
     */
    colormapGradient?: boolean;
    /**
     * Position to start with when initializing the layer.
     * If not provided, the begining of the series will be used instead
     */
    seriesAxisValue?: number;
    /**
     * Prefix to the tile url
     */
    tileUrlPrefix?: string;
    /**
     * A texture manager can be provided. This can be interesting when multiple
     * layers are using the same textures.
     * If not provided, a default one will be added internaly to this layer.
     */
    remoteTileTextureManager?: RemoteTileTextureManager;
};
export declare class MultiChannelSeriesTiledLayer extends BaseShaderTiledLayer {
    private readonly rasterEncoding;
    private readonly colormap;
    private seriesAxisValue;
    private readonly datasetSpecification;
    private seriesElementBefore;
    private indexSeriesElementBefore;
    private seriesElementAfter;
    private readonly tileUrlPrefix;
    private readonly colormapGradient;
    private readonly remoteTileTextureManager;
    constructor(id: string, options: MultiChannelSeriesTiledLayerOptions);
    /**
     * Get the range of values along the series axis.
     * It is assumed that the first element of the series has a smaller value
     * than the last.
     */
    private getSerieAxisRange;
    setSeriesAxisValue(pos: number): void;
    getSeriesAxisValue(): number;
    private defineCurrentSeriesElement;
    /**
     * Prefetch texture along the series dimensions for the same tile coverage as the curent.
     * deltaBefore is the number of series elements before the curent position and deltaAfter
     * is the number of elements after the curent position.
     */
    prefetchSeriesTexture(deltaBefore: number, deltaAfter: number): Promise<void>;
    /**
     * Get the value and unit at a given position, for the current series axis position.
     */
    pick(lngLat: LngLat): Promise<{
        value: number;
        unit: string | undefined;
    } | null>;
}
