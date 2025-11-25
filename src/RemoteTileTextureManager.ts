import QuickLRU from "quick-lru";
import { type Texture, TextureLoader } from "three";
import { type TileIndex, wrapTileIndex } from "./tools";


export type TextureManagerOptions = {
  cacheSize?: number
}

export class RemoteTileTextureManager {
  private readonly texturePool: QuickLRU<string, Texture>;
  private readonly unavailableTextures = new Set();
  private readonly textureLoader = new TextureLoader();


  constructor(options: TextureManagerOptions = {}) {
    const cacheSize = options.cacheSize ?? 1000;

    this.texturePool = new QuickLRU<string, Texture>({
      // should be replaced by gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      maxSize: cacheSize,
  
      onEviction(_key: string, value: Texture) {
        console.log("freeing texture GPU memory");
        value.dispose();
      }
    });
  }

  /**
   * Get a texture from its z/x/y index
   * If a tile is already in the cache, it will be retrieved from the cache.
   * If a texture already failed to be retrieved, it is not trying again.
   */
  getTexture(tileIndex: TileIndex, textureUrlPattern: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      const tileIndexWrapped = wrapTileIndex(tileIndex);
      const textureURL = textureUrlPattern.replace("{x}", tileIndexWrapped.x.toString())
        .replace("{y}", tileIndexWrapped.y.toString())
        .replace("{z}", tileIndexWrapped.z.toString());

      if (this.unavailableTextures.has(textureURL)) {
        return reject(new Error("Could not load texture."));
      }

      if (this.texturePool.has(textureURL)) {        
        resolve(this.texturePool.get(textureURL) as Texture);
      } else {
        this.textureLoader.load(
          textureURL,
          
          ( texture ) => {
            texture.flipY = false;
            this.texturePool.set(textureURL, texture);            
            resolve(texture);
          },
        
          // onProgress callback currently not supported
          undefined,
        
          // onError callback
          ( err ) => {
            this.unavailableTextures.add(textureURL);
            reject(new Error("Could not load texture."))
          }
        );      
      }
    });
  }

  /**
   * Clear the texture cache
   */
  clear() {
    this.texturePool.clear();
    this.unavailableTextures.clear();
  }
}