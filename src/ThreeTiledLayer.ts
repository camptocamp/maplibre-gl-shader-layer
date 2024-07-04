import { type CustomLayerInterface, CustomRenderMethod } from "@maptiler/sdk";
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

type Mat4 =
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
 * Function to update the material of a tile Mesh
 */
type UpdateTileMaterialFunction = (tileInde: TileIndex, material: Material) => void;

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
  tileMaterialSetFunction?: SetTileMaterialFunction;

  /**
   * Function to update the material of a tile Mesh when a tile is rendered
   */
  tileMaterialUpdateFunction?: UpdateTileMaterialFunction;
};

export class ThreeTiledLayer implements CustomLayerInterface {
  public id: string;
  public readonly type = "custom";
  public renderingMode: "2d" | "3d" = "3d";
  private map!: SDKMap;
  private renderer!: WebGLRenderer;
  private camera!: Camera;
  private scene!: Scene;
  private tileContainer!: Object3D;
  private debugMaterial!: MeshBasicMaterial;
  private tileGeometry!: PlaneGeometry;
  private minZoom: number;
  private maxZoom: number;
  private showBelowMinZoom: boolean;
  private showBeyondMaxZoom: boolean;
  private shouldShowCurrent!: boolean;
  private tilePool: Tile[] = [];
  private tileMaterialSetFunction: SetTileMaterialFunction | null = null;
  private tileMaterialUpdateFunction: UpdateTileMaterialFunction | null = null;

  constructor(id: string, options?: ThreeTiledLayerOptions) {
    this.id = id;
    this.initScene();
    this.minZoom = options?.minZoom ?? 0;
    this.maxZoom = options?.maxZoom ?? 22;
    this.showBelowMinZoom = options?.showBelowMinZoom ?? false;
    this.showBeyondMaxZoom = options?.showBeyondMaxZoom ?? true;
    this.tileMaterialSetFunction = options?.tileMaterialSetFunction ?? null;
    this.tileMaterialUpdateFunction = options?.tileMaterialUpdateFunction ?? null;
  }

  private initScene() {
    this.camera = new Camera();
    this.scene = new Scene();
    this.tileContainer = new Object3D();
    this.scene.add(this.tileContainer);
    this.tileGeometry = new PlaneGeometry(1, 1);

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
  private getAppropriateZoomLevel(): number {
    const current = Math.floor(this.map.getZoom());
    if (current < this.minZoom) return this.minZoom;
    if (current > this.maxZoom) return this.maxZoom;
    return current;
  }

  private shouldShow(): boolean {
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
    });

    this.renderer.autoClear = false;
  }

  private listTilesIndicesForMapBounds() {
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

        if (this.tileMaterialUpdateFunction) {
          const m = tile.material;
          this.tileMaterialUpdateFunction(tileIndex, Array.isArray(m) ? m[0] : m);
        }
      } else {
        const material = this.tileMaterialSetFunction
          ? this.tileMaterialSetFunction(tileIndex)
          : this.debugMaterial.clone();
        tile = new Tile(this.tileGeometry, material);
        this.tilePool.push(tile);
      }

      tile.setTileIndex(tileIndex);
      this.tileContainer.add(tile);
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
