import type maplibregl from "maplibre-gl";
import {
  Camera,
  Matrix4,
  type MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
  type RawShaderMaterial,
} from "three";
import { type TileIndex, getTileBoundsUnwrapped, tileBoundsUnwrappedToTileList, isTileInViewport, tileBoundsUnwrappedToTileList2 } from "./tools";
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
type SetTileMaterialFunction = (tileIndex: TileIndex) => RawShaderMaterial;

/**
 * Function to update the material of a tile Mesh.
 * The matrix is the one matrix provided by MapLibre
 */
type UpdateTileMaterialFunction = (tile: Tile, matrix: Mat4) => void | Promise<void>;

export type ShaderTiledLayerOptions = {
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
  opacity?: number,
};

export class ShaderTiledLayer implements maplibregl.CustomLayerInterface {
  public id: string;
  public readonly type = "custom";
  public renderingMode: "2d" | "3d" = "3d";
  protected map!: maplibregl.Map;
  protected renderer!: WebGLRenderer;
  protected camera!: Camera;
  protected scene!: Scene;
  // protected tileContainer!: Object3D;
  protected debugMaterial!: MeshBasicMaterial;
  protected tileGeometry!: PlaneGeometry;
  protected minZoom: number;
  protected maxZoom: number;
  protected showBelowMinZoom: boolean;
  protected showBeyondMaxZoom: boolean;
  protected shouldShowCurrent!: boolean;
  protected tilePool: Tile[] = [];
  protected usedTileMap = new Map<string, Tile>();
  protected unusedTileList: Array<Tile> = [];
  protected onSetTileMaterial: SetTileMaterialFunction;
  protected onTileUpdate: UpdateTileMaterialFunction | null = null;
  private tileZoomFittingFunction: (v: number) => number = Math.floor;
  protected opacity = 1;

  constructor(id: string, options: ShaderTiledLayerOptions) {
    this.id = id;
    this.initScene();
    this.minZoom = options.minZoom ?? 0;
    this.maxZoom = options.maxZoom ?? 22;
    this.showBelowMinZoom = options.showBelowMinZoom ?? false;
    this.showBeyondMaxZoom = options.showBeyondMaxZoom ?? true;
    this.onSetTileMaterial = options.onSetTileMaterial;
    this.onTileUpdate = options.onTileUpdate ?? null;
    this.opacity = Math.max(0, Math.min(options.opacity ?? 1, 1));

    if (options && options.tileZoomFitting) {
      if (options.tileZoomFitting === "CEIL") {
        this.tileZoomFittingFunction = Math.ceil;
      } else if (options.tileZoomFitting === "ROUND") {
        this.tileZoomFittingFunction = Math.round;
      }
    }
  }


  protected initScene() {
    this.camera = new Camera();
    this.scene = new Scene();
    // this.tileContainer = new Object3D();
    // this.scene.add(this.tileContainer);
    this.tileGeometry = new PlaneGeometry(1, 1, 32, 32);
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
    const current = Math.max(0, Math.floor(this.map.getZoom()));
    if (current < this.minZoom && !this.showBelowMinZoom) return false;
    if (current > this.maxZoom && !this.showBeyondMaxZoom) return false;
    return true;
  }

  onAdd?(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
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
    // The candidates are strictly based on axis-align bounding box, so when map is pitched and rotated,
    // the list of candidates needs to be pruned from all the tiles that are not in viewport
    const tileIndicesCandidates = tileBoundsUnwrappedToTileList(tbu);
    // const tileIndicesCandidates = tileBoundsUnwrappedToTileList2(this.map);
    
    if (this.map.getZoom() >= z) {
      return tileIndicesCandidates;
    }

    const canvas = this.map.getCanvas();
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    const tileIndicesFiltered = tileIndicesCandidates.filter(ti => isTileInViewport(ti, this.map, canvasWidth, canvasHeight));    
    return tileIndicesFiltered;
  }


  onRemove(_map: maplibregl.Map, _gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    console.warn("not implemented yet");
  }

  render(_gl: WebGLRenderingContext | WebGL2RenderingContext, options: maplibregl.CustomRenderMethodInput) {
    this.shouldShowCurrent = this.shouldShow();

    // Escape if not rendering
    if (!this.shouldShowCurrent) return;

    // Brute force flush the tile container (Object3D) and refill it with tiles from the pool
    // this.tileContainer.clear();
    this.scene.clear()
    const allTileIndices = this.listTilesIndicesForMapBounds();

    const tilesToAdd = [];
    const usedTileMapPrevious = this.usedTileMap;
    const usedTileMapNew = new Map<string, Tile>();

    for (const element of allTileIndices) {
      const tileIndex = element;
      const tileID = `${tileIndex.z}_${tileIndex.x}_${tileIndex.y}`;

      const tile = usedTileMapPrevious.get(tileID);
      if (tile) {
        // This tile is already in the pool
        usedTileMapNew.set(tileID, tile);

        // Removing it from the previous map so that only remains the unused ones
        usedTileMapPrevious.delete(tileID);
        this.scene.add(tile);

        if (this.onTileUpdate) {
          this.onTileUpdate(tile, options.defaultProjectionData.mainMatrix as Mat4);
        }
      } else {
        // This tile is not in the pool
        tilesToAdd.push(tileIndex);
      }
    }

    this.unusedTileList.push(...Array.from(usedTileMapPrevious.values()));

    for (const element of tilesToAdd) {
      const tileIndex = element;
      const tileID = `${tileIndex.z}_${tileIndex.x}_${tileIndex.y}`;

      let tile: Tile;

      if (this.unusedTileList.length > 0) {
        tile = this.unusedTileList.pop() as Tile;
      } else {
        const material = this.onSetTileMaterial(tileIndex);
        tile = new Tile(this.tileGeometry, material);
      }

      usedTileMapNew.set(tileID, tile);
      tile.setTileIndex(tileIndex);
      this.scene.add(tile);
      
      if (this.onTileUpdate) {
        this.onTileUpdate(tile, options.defaultProjectionData.mainMatrix as Mat4);
      }
    }

    this.usedTileMap = usedTileMapNew;

    // Actual rendering
    this.camera.projectionMatrix = new Matrix4().fromArray(options.defaultProjectionData.mainMatrix);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
  }

  setOpacity(opacity: number) {
    this.opacity = Math.max(0, Math.min(opacity, 1));
    if (this.map) {
      this.map.triggerRepaint();
    }
  }
}
