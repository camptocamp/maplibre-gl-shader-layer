/**
 * This is a demo of how to extend ShaderTiledLayer
 * TextureTiledLayer is a layer that simply contains a texture per tile
 */

import QuickLRU from "quick-lru";
import { DoubleSide, type Texture, TextureLoader, RawShaderMaterial, GLSL3, Uniform, Vector4 } from "three";
import { type Mat4, ShaderTiledLayer } from "./ShaderTiledLayer";
import type { TileIndex } from "./tools";
import type { Tile } from "./Tile";
// @ts-ignore
import vertexShader from "./shaders/texture-tile.v.glsl?raw";
// @ts-ignore
import fragmentShader from "./shaders/texture-tile.f.glsl?raw";

export type TextureTiledLayerOptions = {
  minZoom?: number,
  maxZoom?: number,
  textureUrlPattern: string,
}


export class TextureTiledLayer extends ShaderTiledLayer {
  private textureUrlPattern: string;
  private texturePool: QuickLRU<string, Texture> = new QuickLRU({
    // should be replaced by gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    maxSize: 100,

    onEviction(_key: string, value: Texture) {
      console.log("freeing texture GPU memory");
      value.dispose();
    },
  }); 

  // Set to store the "z_x_y" of textures that cannot be loaded, so that we don't
  // try to load them again and again
  private nonExistingTextures: Set<string> = new Set();

  constructor(id: string, options: TextureTiledLayerOptions) {


    super(id, {
      minZoom: options.minZoom ?? 0, 
      maxZoom: options.maxZoom ?? 22,

      onSetTileMaterial: (tileIndex: TileIndex) => {
        
        const texture = this.getTexture(tileIndex);

        const material = new RawShaderMaterial({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: GLSL3,

          uniforms: {
            tex: { value: texture },
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          side: DoubleSide,
					transparent: true,
          depthTest: false,
          // wireframe: true,
        })

        return material;
      },


      onTileUpdate: (tile: Tile, matrix: Mat4) => {
        tile.material.uniforms.tex.value = this.getTexture(tile.getTileIndex());
      }
    });

    this.textureUrlPattern = options.textureUrlPattern;
  }


  private getTexture(tileIndex: TileIndex): Texture {
    const textureId = `${tileIndex.z}_${tileIndex.x}_${tileIndex.y}`

    let texture: Texture;
    
    if (this.texturePool.has(textureId)) {
      texture = this.texturePool.get(textureId) as Texture;
    } else {
      const textureURL = this.textureUrlPattern.replace("{x}", tileIndex.x.toString())
        .replace("{y}", tileIndex.y.toString())
        .replace("{z}", tileIndex.z.toString());

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
      texture.flipY = false;
      this.texturePool.set(textureId, texture);
    }

    return texture;
  }

}