

import QuickLRU from "quick-lru";
import { DoubleSide, type Texture, TextureLoader, RawShaderMaterial, GLSL3, FrontSide, BackSide } from "three";
import { type Mat4, ShaderTiledLayer } from "./ShaderTiledLayer";
import { wrapTileIndex, type TileIndex } from "./tools";
import type { Tile } from "./Tile";
// @ts-ignore
import vertexShader from "./shaders/distance-tile.v.glsl?raw";
// @ts-ignore
import fragmentShader from "./shaders/distance-tile.f.glsl?raw";
import type { CustomRenderMethodInput } from "maplibre-gl";

export type BorderDistanceLayerOptions = {
  minZoom?: number,
  maxZoom?: number,
  textureUrlPattern: string,
  animationSpeed?: number;
}


export class BorderDistanceLayer extends ShaderTiledLayer {
  private textureUrlPattern: string;
  private texturePool: QuickLRU<string, Texture> = new QuickLRU({
    // should be replaced by gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    maxSize: 50,

    onEviction(_key: string, value: Texture) {
      console.log("freeing texture GPU memory");
      value.dispose();
    },
  }); 

  // Set to store the "z_x_y" of textures that cannot be loaded, so that we don't
  // try to load them again and again
  private nonExistingTextures: Set<string> = new Set();
  private animationSpeed = 0;

  constructor(id: string, options: BorderDistanceLayerOptions) {


    super(id, {
      minZoom: options.minZoom ?? 0, 
      maxZoom: 8,

      onSetTileMaterial: (tileIndex: TileIndex) => {
        
        const texture = this.getTexture(tileIndex);

        const material = new RawShaderMaterial({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: GLSL3,

          uniforms: {
            tex: { value: texture },
            zoom: { value: this.map.getZoom() },
            zoomTile: { value: tileIndex.z },
            phase: { value: 0 },
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          side: BackSide,
					transparent: true,
          depthTest: false,
          // wireframe: true,
        })

        return material;
      },


      onTileUpdate: (tile: Tile, matrix: Mat4) => {
        // console.log("tile:", tile);
        
        const mat = tile.material as RawShaderMaterial;
        mat.uniforms.tex.value = this.getTexture(tile.getTileIndex());
        mat.uniforms.zoom.value = this.map.getZoom();
        mat.uniforms.zoomTile.value = tile.getTileIndex().z;
      },
      
      tileZoomFitting: "FLOOR",
    });

    

    this.textureUrlPattern = options.textureUrlPattern;


    // enable animation, will have performance hit
    this.animationSpeed = options.animationSpeed ?? 0;
    if (this.animationSpeed > 0) {
      // Force the map to render all the time
      const animateFunction = () => {
        if (!this.map) return;
        this.map.redraw();
        requestAnimationFrame(animateFunction);
      }
      requestAnimationFrame(animateFunction);
    }
    
  }

  // onAdd(map: Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
  //   super.onAdd(map, gl);
  // }


  private getTexture(tileIndex: TileIndex): Texture {
    const tileIndexWrapped = wrapTileIndex(tileIndex);
    const textureId = `${tileIndexWrapped.z}_${tileIndexWrapped.x}_${tileIndexWrapped.y}`;

    // console.log(textureId);
    

    let texture: Texture;
    
    if (this.texturePool.has(textureId)) {
      texture = this.texturePool.get(textureId) as Texture;
    } else {
      const textureURL = this.textureUrlPattern.replace("{x}", tileIndexWrapped.x.toString())
        .replace("{y}", tileIndexWrapped.y.toString())
        .replace("{z}", tileIndexWrapped.z.toString());

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
    this.texturePool.set(textureId, texture);

    return texture;
  }


  prerender(gl: WebGLRenderingContext | WebGL2RenderingContext, options: CustomRenderMethodInput) {
    super.prerender(gl, options);
    const allTiles = this.usedTileMap.values();

    if (this.animationSpeed > 0) {
      for(const tile of allTiles) {
        (tile.material as RawShaderMaterial).uniforms.phase.value = this.animationSpeed * performance.now() / 350;
      }
    }
  }

}