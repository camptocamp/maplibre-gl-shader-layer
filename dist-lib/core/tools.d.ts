import { default as maplibregl, LngLat } from 'maplibre-gl';
export type TileIndex = {
    z: number;
    x: number;
    y: number;
};
export type TileBoundsUnwrapped = {
    min: TileIndex;
    max: TileIndex;
};
export type TileUnwrappedPosition = {
    /**
     * Position in mercator coordinate. Since it's unwrapped, x can be lower then 0 or higher than 1
     */
    center: [number, number];
    /**
     * both height and width, because tiles are square-shaped
     */
    size: number;
};
export declare function wgs84ToTileIndex(position: LngLat, zoom: number, strict?: boolean): TileIndex;
/**
 * Get the tile index
 */
export declare function getTileBoundsUnwrapped(map: maplibregl.Map, z: number): TileBoundsUnwrapped;
export declare function tileBoundsUnwrappedToTileList(tbu: TileBoundsUnwrapped): TileIndex[];
export declare function tileIndexToMercatorPosition(ti: TileIndex): TileUnwrappedPosition;
export declare function wrapTileIndex(tileIndex: TileIndex): TileIndex;
/**
 * Checks if the center and the corners of a tile are visible in viewport
 */
export declare function isTileInViewport(ti: TileIndex, map: maplibregl.Map, mapcanvasWidth: number, mapCanvasHeight: number): boolean;
export declare function tileBoundsUnwrappedToTileList2(map: maplibregl.Map): TileIndex[];
/**
 * Modulo function, as opposed to javascript's `%`, which is a remainder.
 * This functions will return positive values, even if the first operand is negative.
 */
export declare function mod(n: number, m: number): number;
/**
 * Projects a point within a tile to the surface of the unit sphere globe.
 * @param inTileX - X coordinate inside the tile in range [0 .. 8192].
 * @param inTileY - Y coordinate inside the tile in range [0 .. 8192].
 * @param tileIdX - Tile's X coordinate in range [0 .. 2^zoom - 1].
 * @param tileIdY - Tile's Y coordinate in range [0 .. 2^zoom - 1].
 * @param tileIdZ - Tile's zoom.
 * @returns A 3D vector - coordinates of the projected point on a unit sphere.
 */
export declare function projectTileCoordinatesToSphere(inTileX: number, inTileY: number, tileIdX: number, tileIdY: number, tileIdZ: number, nbSections: number): [number, number, number];
export declare function projectTileCoordinatesToSphereUV(u: number, v: number, tileIdX: number, tileIdY: number, tileIdZ: number): [number, number, number];
export declare function clamp(range: [number, number], value: number): number;
/**
 * Get the pixel value in an HTMLImageElement with a nearest neighbor approach.
 * unitPosition is a texture position, meaning in interval [0, 1]
 */
export declare function pickImg(img: HTMLImageElement, unitPosition: [number, number]): Uint8ClampedArray | null;
