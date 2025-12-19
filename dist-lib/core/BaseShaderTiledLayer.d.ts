import { default as maplibregl } from 'maplibre-gl';
import { Camera, MeshBasicMaterial, PlaneGeometry, Scene, WebGLRenderer, RawShaderMaterial } from 'three';
import { TileIndex } from './tools';
import { Tile } from './Tile';
/**
 * Tile stategy to change (integer) zoom level depending on ramping map zoom level.
 * - FLOOR: tileZ = floor(mapZ) => fairly low resolution tile, a tile can take up to most of the viewport
 * - ROUND: tileZ = round(mapZ) => medium resoltuion, tiles are smaller on screen
 * - CEIL: tileZ = ceil(mapZ) => the highest resolution, +1 Z compared to FLOOR
 */
export type TileZoomFitting = "FLOOR" | "ROUND" | "CEIL";
export type Mat4 = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
] | Float32Array;
/**
 * Function to assign a material to a tile Mesh
 */
type SetTileMaterialFunction = (tileIndex: TileIndex) => RawShaderMaterial;
/**
 * Function to update the material of a tile Mesh.
 * The matrix is the one matrix provided by MapLibre
 */
type UpdateTileMaterialFunction = (tile: Tile, matrix: Mat4) => void | Promise<void>;
export type BaseShaderTiledLayerOptions = {
    /**
     * Default: 0
     */
    minZoom?: number;
    /**
     * Default: 22
     */
    maxZoom?: number;
    /**
     * Default: false
     * Setting to `true` will create plenty of tiles smaller than optimal size and may
     * lead to performance issue.
     */
    showBelowMinZoom?: boolean;
    /**
     * Default: true
     * Beyond the maxZoom, tiles will show enlarged and possibly not great-looking
     * if too zoomed-in.
     */
    showBeyondMaxZoom?: boolean;
    /**
     * Function to assign a material to a tile Mesh at the moment a new Tile instance needs to be created
     */
    onSetTileMaterial: SetTileMaterialFunction;
    /**
     * Function to update the material of a tile Mesh when a tile is rendered
     */
    onTileUpdate?: UpdateTileMaterialFunction;
    tileZoomFitting?: TileZoomFitting;
    /**
     * Opacity of the layer
     */
    opacity?: number;
};
export declare class BaseShaderTiledLayer implements maplibregl.CustomLayerInterface {
    id: string;
    readonly type = "custom";
    renderingMode: "2d" | "3d";
    protected map: maplibregl.Map;
    protected renderer: WebGLRenderer;
    protected camera: Camera;
    protected scene: Scene;
    protected debugMaterial: MeshBasicMaterial;
    protected tileGeometry: PlaneGeometry;
    protected minZoom: number;
    protected maxZoom: number;
    protected showBelowMinZoom: boolean;
    protected showBeyondMaxZoom: boolean;
    protected shouldShowCurrent: boolean;
    protected tilePool: Tile[];
    protected usedTileMap: Map<string, Tile>;
    protected unusedTileList: Array<Tile>;
    protected onSetTileMaterial: SetTileMaterialFunction;
    protected onTileUpdate: UpdateTileMaterialFunction | null;
    private tileZoomFittingFunction;
    protected opacity: number;
    protected altitude: number;
    protected isVisible: boolean;
    protected readonly defaultVertexShader: any;
    constructor(id: string, options: BaseShaderTiledLayerOptions);
    setVisible(v: boolean): void;
    protected initScene(): void;
    /**
     * Compute the correct zoom level based on the map zoom level and the provided options.
     * The returned value is an integer.
     */
    protected getAppropriateZoomLevel(): number;
    protected shouldShow(): boolean;
    onAdd?(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void;
    protected listTilesIndicesForMapBounds(): TileIndex[];
    onRemove(_map: maplibregl.Map, _gl: WebGLRenderingContext | WebGL2RenderingContext): void;
    render(_gl: WebGLRenderingContext | WebGL2RenderingContext, options: maplibregl.CustomRenderMethodInput): void;
    setOpacity(opacity: number): void;
    /**
     * Set the altitude of the layer in meters.
     * (Only for globe mode)
     */
    setAltitude(altitude: number): void;
}
export {};
