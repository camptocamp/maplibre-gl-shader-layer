import { type CustomLayerInterface, CustomRenderMethod, MercatorCoordinate } from "@maptiler/sdk";
import type { Map as SDKMap } from "@maptiler/sdk";
import {
  Camera,
  DoubleSide,
  type Material,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from "three";
import { type TileIndex, getTileBoundsUnwrapped, tileBoundsUnwrappedToTileList } from "./tools";
import { Tile } from "./Tile";


/**
 * Tile stategy to change (integer) zoom level depending on ramping map zoom level.
 * - FLOOR: tileZ = floor(mapZ) => fairly low resolution tile, a tile can take up to most of the viewport
 * - ROUND: tileZ = round(mapZ) => medium resoltuion, tiles are smaller on screen
 * - CEIL: tileZ = ceil(mapZ) => the highest resolution, +1 Z compared to FLOOR
 */
export type TileZoomFitting = "FLOOR" | "ROUND" | "CEIL";

export type Mat4 =
  | [
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
      number,
    ]
  | Float32Array;

/**
 * Function to assign a material to a tile Mesh
 */
type SetTileMaterialFunction = (tileIndex: TileIndex) => Material;

/**
 * Function to update the material of a tile Mesh.
 * The mattrix is the one matrix provided by MapLibre
 */
type UpdateTileMaterialFunction = (tile: Tile, matrix: Mat4) => void;

export type ThreeTiledLayerOptions = {
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
  onSetTileMaterial?: SetTileMaterialFunction;

  /**
   * Function to update the material of a tile Mesh when a tile is rendered
   */
  onTileUpdate?: UpdateTileMaterialFunction;

  tileZoomFitting?: TileZoomFitting;
};

export class ThreeTiledLayer implements CustomLayerInterface {
  public id: string;
  public readonly type = "custom";
  public renderingMode: "2d" | "3d" = "3d";
  protected map!: SDKMap;
  protected renderer!: WebGLRenderer;
  protected camera!: Camera;
  protected scene!: Scene;
  protected tileContainer!: Object3D;
  protected debugMaterial!: MeshBasicMaterial;
  protected tileGeometry!: PlaneGeometry;
  protected minZoom: number;
  protected maxZoom: number;
  protected showBelowMinZoom: boolean;
  protected showBeyondMaxZoom: boolean;
  protected shouldShowCurrent!: boolean;
  protected tilePool: Tile[] = [];
  protected onSetTileMaterial: SetTileMaterialFunction | null = null;
  protected onTileUpdate: UpdateTileMaterialFunction | null = null;
  private tileZoomFittingFunction: (v: number) => number = Math.round;

  constructor(id: string, options?: ThreeTiledLayerOptions) {
    this.id = id;
    this.initScene();
    this.minZoom = options?.minZoom ?? 0;
    this.maxZoom = options?.maxZoom ?? 22;
    this.showBelowMinZoom = options?.showBelowMinZoom ?? false;
    this.showBeyondMaxZoom = options?.showBeyondMaxZoom ?? true;
    this.onSetTileMaterial = options?.onSetTileMaterial ?? null;
    this.onTileUpdate = options?.onTileUpdate ?? null;

    if (options && options.tileZoomFitting) {
      if (options.tileZoomFitting === "CEIL") {
        this.tileZoomFittingFunction = Math.ceil;
      } else if (options.tileZoomFitting === "FLOOR") {
        this.tileZoomFittingFunction = Math.floor;
      }
    }
  }

  protected initScene() {
    this.camera = new Camera();
    this.scene = new Scene();
    this.tileContainer = new Object3D();
    this.scene.add(this.tileContainer);
    this.tileGeometry = new PlaneGeometry(1, 1);

    // this.camera.matrixAutoUpdate = false;

    this.debugMaterial = new MeshBasicMaterial({
      color: 0xff0000,
      wireframe: false,
      side: DoubleSide,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
    });
  }

  /**
   * Compute the correct zoom level based on the map zoom level and the provided options.
   * The returned value is an integer.
   */
  protected getAppropriateZoomLevel(): number {
    const current = this.tileZoomFittingFunction(this.map.getZoom());
    if (current < this.minZoom) return this.minZoom;
    if (current > this.maxZoom) return this.maxZoom;
    return current;
  }

  protected shouldShow(): boolean {
    const current = Math.floor(this.map.getZoom());
    if (current < this.minZoom && !this.showBelowMinZoom) return false;
    if (current > this.maxZoom && !this.showBeyondMaxZoom) return false;
    return true;
  }

  onAdd?(map: SDKMap, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.map = map;
    this.renderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
      precision: "highp",
    });

    this.renderer.autoClear = false;
  }

  protected listTilesIndicesForMapBounds() {
    const z = this.getAppropriateZoomLevel();
    const tbu = getTileBoundsUnwrapped(this.map, z);
    return tileBoundsUnwrappedToTileList(tbu);
  }

  onRemove(map: SDKMap, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    console.warn("not implemented yet");
  }

  prerender(gl: WebGLRenderingContext | WebGL2RenderingContext, matrix: Mat4) {
    this.shouldShowCurrent = this.shouldShow();

    // Escape if not rendering
    if (!this.shouldShowCurrent) return;

    // Brutte force flush the tile container (Object3D) and refill it with tiles from the pool
    this.tileContainer.clear();
    const allTileIndices = this.listTilesIndicesForMapBounds();

    for (let i = 0; i < allTileIndices.length; i += 1) {
      const tileIndex = allTileIndices[i];

      let tile: Tile;

      if (this.tilePool.length >= i + 1) {
        tile = this.tilePool[i];

        
      } else {
        const material = this.onSetTileMaterial
          ? this.onSetTileMaterial(tileIndex)
          : this.debugMaterial.clone();
        tile = new Tile(this.tileGeometry, material);
        this.tilePool.push(tile);
      }

      tile.setTileIndex(tileIndex);
      this.tileContainer.add(tile);
      
      if (this.onTileUpdate) {
        this.onTileUpdate(tile, matrix);
      }
      
    }
  }

  render(gl: WebGLRenderingContext | WebGL2RenderingContext, matrix: Mat4) {
    // Escape if not rendering
    if (!this.shouldShowCurrent) return;

    this.camera.projectionMatrix = new Matrix4().fromArray(matrix);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    // this.map.triggerRepaint();
  }
}
