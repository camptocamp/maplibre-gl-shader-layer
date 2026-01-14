import QuickLRU from "quick-lru";
import { type Texture } from "three";
import { type TileIndex, tileIndexToString, wrapTileIndex } from "../core/tools";

export type TileTextureManagerOptions = {
  cacheSize?: number;
};

/**
 * Type of asny function that input atile index and output a ThreeJS texture
 */
export type TextureMaker = (tileIndex: TileIndex) => Promise<Texture>;

export class TileTextureManager {
  private readonly texturePool: QuickLRU<string, Texture>;
  private readonly unavailableTextures = new Set();

  constructor(options: TileTextureManagerOptions = {}) {
    const cacheSize = options.cacheSize ?? 10000;

    this.texturePool = new QuickLRU<string, Texture>({
      // should be replaced by gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      maxSize: cacheSize,

      onEviction(_key: string, value: Texture) {
        console.log("Freeing texture from GPU memory");
        value.dispose();
      },
    });
  }

  /**
   * Get a texture from its z/x/y index and a TextureMaker function
   * If a tile is already in the cache, it will be retrieved from the cache.
   * If a texture already failed to be retrieved, it is not trying again.
   */
  getTexture(tileIndex: TileIndex, textureMaker: TextureMaker): Promise<Texture> {
    return new Promise((resolve, reject) => {
      const tileIndexWrapped = wrapTileIndex(tileIndex);
      const textureId = tileIndexToString(tileIndexWrapped);

      // The texture is not existing. An unfruitful attempt was made already
      if (this.unavailableTextures.has(textureId)) {
        return reject(new Error("Could not load texture."));
      }

      // The texture is in the pool of already fetched textures
      if (this.texturePool.has(textureId)) {
        resolve(this.texturePool.get(textureId) as Texture);
        return;
      }

      textureMaker(tileIndex)
        .then((texture: Texture) => {
          if (!texture) {
            reject(new Error("Could not load texture."));
            return;
          }

          texture.flipY = false;
          this.texturePool.set(textureId, texture);
          resolve(texture);
        })
        .catch(() => {
          this.unavailableTextures.add(textureId);
          reject(new Error("Could not load texture."));
          return;
        });
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
