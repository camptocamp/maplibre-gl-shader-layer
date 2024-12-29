

import QuickLRU from "quick-lru";
import { DoubleSide, type Texture, TextureLoader, RawShaderMaterial, GLSL3, BackSide, Vector3, Color as ThreeColor } from "three";
import { type Mat4, ShaderTiledLayer } from "./ShaderTiledLayer";
import { wrapTileIndex, type TileIndex } from "./tools";
import type { Tile } from "./Tile";
// @ts-ignore
import vertexShader from "./shaders/shore-layer.v.glsl?raw";
// @ts-ignore
import fragmentShader from "./shaders/shore-layer.f.glsl?raw";
import type { CustomRenderMethodInput } from "maplibre-gl";
import type { ColorRGB } from "./types";



export type BorderDistanceLayerOptions = {
  minZoom?: number,
  maxZoom?: number,
  textureUrlPattern: string,
  animationSpeed?: number;
  waveDensity?: number,
  shoreWidth?: number,
  color?: ColorRGB,
}


export class ShoreLayer extends ShaderTiledLayer {
  private textureUrlPattern: string;
  private texturePool: QuickLRU<string, Texture> = new QuickLRU({
    // should be replaced by gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    maxSize: 50,

    onEviction(_key: string, value: Texture) {
      console.log("freeing texture GPU memory");
      value.dispose();
    },
  }); 

  private animationSpeed = 0;
  private waveDensity: number;
  private shoreWidth: number;
  private color: ThreeColor;
  private colorNeedsUpdate = false;

  constructor(id: string, options: BorderDistanceLayerOptions) {
    const shoreWidth = options.shoreWidth ?? 1;
    const waveDensity = options.waveDensity ?? 1;
    const animationSpeed = options.animationSpeed ?? 0;
    const color = options.color ?? {r: 0, g: 99, b: 229};
    const colorThree = new ThreeColor().setRGB(color.r / 255, color.g / 255, color.b / 255);

    super(id, {
      minZoom: options.minZoom ?? 0, 
      maxZoom: 8,

      onSetTileMaterial: (tileIndex: TileIndex) => {
        const texture = this.getTexture(tileIndex);
        const mapProjection = this.map.getProjection();

        const material = new RawShaderMaterial({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: GLSL3,

          uniforms: {
            tex: { value: texture },
            zoom: { value: this.map.getZoom() },
            tileIndex: { value: new Vector3(tileIndex.x, tileIndex.y, tileIndex.z) },
            phase: { value: 0 },
            isGlobe: { value: (mapProjection && mapProjection.type === "globe")},
            shoreWidth: { value: shoreWidth },
            waveDensity: { value: waveDensity },
            color: { value: colorThree },
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


      onTileUpdate: (tile: Tile, _matrix: Mat4) => {
        const mapProjection = this.map.getProjection();
        const tileIndeArray = tile.getTileIndexAsArray();
        const mat = tile.material as RawShaderMaterial;

        mat.uniforms.tex.value = this.getTexture(tile.getTileIndex());
        mat.uniforms.zoom.value = this.map.getZoom();
        mat.uniforms.isGlobe.value = (mapProjection && mapProjection.type === "globe");
        (mat.uniforms.tileIndex.value as Vector3).set(tileIndeArray[0], tileIndeArray[1], tileIndeArray[2]);
        mat.uniforms.waveDensity.value = this.waveDensity;
        mat.uniforms.shoreWidth.value = this.shoreWidth;

        if (this.animationSpeed > 0) {
          (tile.material as RawShaderMaterial).uniforms.phase.value = this.animationSpeed * performance.now() / 350;
        }

        if (this.colorNeedsUpdate) {
          mat.uniforms.color.value = this.color;
          this.colorNeedsUpdate = false;
        }
      },
      
      tileZoomFitting: "FLOOR",
    });

    this.color = colorThree;
    this.waveDensity = waveDensity;
    this.shoreWidth = shoreWidth;
    this.animationSpeed = animationSpeed;
    
    // enable animation, will have performance hit
    this.textureUrlPattern = options.textureUrlPattern;

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

  /**
   * Set the color of the wave
   */
  setColor(color: ColorRGB) {
    this.color.setRGB(color.r / 255, color.g / 255, color.b / 255);
    this.colorNeedsUpdate = true;
    // Since there is no map interaction,
    // the render function is not going to be called automatically
    this.map.redraw();
  }

  // onAdd(map: Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
  //   super.onAdd(map, gl);
  // }


  private getTexture(tileIndex: TileIndex): Texture {
    const tileIndexWrapped = wrapTileIndex(tileIndex);
    const textureId = `${tileIndexWrapped.z}_${tileIndexWrapped.x}_${tileIndexWrapped.y}`;
    let texture: Texture;
    
    if (this.texturePool.has(textureId)) {
      texture = this.texturePool.get(textureId) as Texture;
    } else {
      const textureURL = this.textureUrlPattern.replace("{x}", tileIndexWrapped.x.toString())
        .replace("{y}", tileIndexWrapped.y.toString())
        .replace("{z}", tileIndexWrapped.z.toString());

      texture = new TextureLoader().load(
        textureURL,
        
        ( _texture ) => {
          // console.log("SUCESS");
        },
      
        // onProgress callback currently not supported
        undefined,
      
        // onError callback
        ( err ) => {
          console.error( 'An error happened while loading the texture', err );
        }
      );      
    }
    texture.flipY = false;
    this.texturePool.set(textureId, texture);
    return texture;
  }


  // prerender(gl: WebGLRenderingContext | WebGL2RenderingContext, options: CustomRenderMethodInput) {
  //   super.prerender(gl, options);
  //   // const allTiles = this.usedTileMap.values();
  // }

}