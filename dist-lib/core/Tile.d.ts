import { BufferGeometry, Material, Matrix4, Mesh, NormalBufferAttributes } from 'three';
import { TileIndex } from './tools';
export declare class Tile extends Mesh {
    private readonly tileIndex;
    constructor(geometry: BufferGeometry<NormalBufferAttributes> | undefined, material: Material | Material[] | undefined);
    /**
     * Defines the tile index and position the tile in the mercator space
     */
    setTileIndex(ti: TileIndex): void;
    /**
     * Get the tile index (a copy)
     */
    getTileIndex(): TileIndex;
    /**
     * Get the tile index as an array
     */
    getTileIndexAsArray(): [number, number, number];
}
export declare function replaceMatrixScale(matrix: Matrix4, newScale: number): Matrix4;
