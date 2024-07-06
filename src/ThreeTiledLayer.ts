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
import { type TileIndex, getTileBoundsUnwrapped, tileBoundsUnwrappedToTileList, splitFloat64ToFloat32, clampInt32 } from "./tools";
import { Tile } from "./Tile";

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
 * Function to update the material of a tile Mesh
 */
type UpdateTileMaterialFunction = (tileIndex: TileIndex, material: Material, matrix: Mat4) => void;

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

    this.camera.matrixAutoUpdate = false;

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
      precision: "highp",
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
          this.tileMaterialUpdateFunction(tileIndex, Array.isArray(m) ? m[0] : m, matrix);
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

      /*
      // This is for checking if the tile world mat precision suffers of
      // a numerical precision loss from the float64 to float32 conversion
      // involved in the RAM to GPU memory copy.
      // It seems that not.
      const mat64 = this.tileContainer.children[0].matrixWorld.elements
      const mat32 = new Float32Array(mat64);
      const absDiff = mat64.map((num, i) => Math.abs(num - mat32[i]));
      // console.log("mat64", mat64);
      // console.log("mat32", mat32);
      // console.log("absDiff", absDiff);
      // console.log("-------------------------------");
      */
      
      
      
    }
  }

  render(gl: WebGLRenderingContext | WebGL2RenderingContext, matrix: Mat4) {
    // Escape if not rendering
    if (!this.shouldShowCurrent) return;

    // this.camera.projectionMatrix = new Matrix4().fromArray(matrix);
    
    console.log(this.camera.modelViewMatrix.elements)
  

    // This is for checking if the tile world mat precision suffers of
    // a numerical precision loss from the float64 to float32 conversion
    // involved in the RAM to GPU memory copy.
    // YES! It if pretty big as we zoom in. Acceptable at z15, very chaotic at z20
    const mat64 = matrix
    // const mat32 = new Float32Array(mat64);
    // const absDiff = mat64.map((num, i) => Math.abs(num - mat32[i]));
    console.log("mat64", mat64);
    console.log(">>> ", this.map.transform.modelViewProjectionMatrix);
    
    // console.log("mat32", mat32);
    // console.log("absDiff", absDiff);


    // Trying to reach higher precision by chopping a f32 into two f32
    // const [h, l] = splitFloat64ToFloat32(mat64[0]);
    // const hlSumF32 = Math.fround(h + l);
    // const absDiff2 = Math.abs(hlSumF32 - mat64[0])
    // console.log("absDiff2", absDiff2);


    // const matInt32 = new Int32Array(mat64.map(el => clampInt32(el)));
    // const decimal = new Float32Array(mat64.map((el, i) => el - matInt32[i]));
    // console.log("matInt32", matInt32);
    // console.log("decimal", decimal);
    
    


    console.log("-------------------------------");



    
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    // this.map.triggerRepaint();
  }
}
