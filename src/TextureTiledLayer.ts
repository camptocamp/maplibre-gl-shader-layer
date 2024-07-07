/**
 * This is a demo of how to extend ThreeTiledLayer
 * TextureTiledLayer is a layer that simply contains a texture per tile
 */

import QuickLRU from "quick-lru";
import { DoubleSide, type Material, MeshBasicMaterial, type Texture, TextureLoader } from "three";
import { ThreeTiledLayer } from "./ThreeTiledLayer";
import type { TileIndex } from "./tools";

export type TextureTiledLayerOptions = {
  minZoom?: number,
  maxZoom?: number,
  textureUrlPattern: string,
}


export class TextureTiledLayer extends ThreeTiledLayer {
  private textureUrlPattern: string;
  private textureLoader: TextureLoader = new TextureLoader();
  private texturePool: QuickLRU<string, Texture> = new QuickLRU({
    // should be replaced by gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    maxSize: 50,

    onEviction(key: string, value: Texture) {
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

        const material = new MeshBasicMaterial({
          // color: 0xff0000,
          side: DoubleSide,
          // transparent: true,
          // opacity: 0.5,
          depthTest: false,
          map: texture,
        });
        return material;
      },



      onTileUpdate: (tileIndex: TileIndex, material: Material) => {
        const m = material as MeshBasicMaterial;

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

        m.map = texture;
        m.needsUpdate = true;
      }

    });

    this.textureUrlPattern = options.textureUrlPattern;
  }


}