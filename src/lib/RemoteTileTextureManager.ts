import QuickLRU from "quick-lru";
import { type Texture, TextureLoader } from "three";
import { type TileIndex, wrapTileIndex } from "./tools";

export type TextureManagerOptions = {
  cacheSize?: number;
};

export class RemoteTileTextureManager {
  private readonly texturePool: QuickLRU<string, Texture>;
  private readonly unavailableTextures = new Set();
  private readonly textureLoader = new TextureLoader();
  private readonly textureInProgress = new Map<string, Texture>();

  constructor(options: TextureManagerOptions = {}) {
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
   * Get a texture from its z/x/y index
   * If a tile is already in the cache, it will be retrieved from the cache.
   * If a texture already failed to be retrieved, it is not trying again.
   */
  getTexture(tileIndex: TileIndex, textureUrlPattern: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      const tileIndexWrapped = wrapTileIndex(tileIndex);
      const textureURL = textureUrlPattern
        .replace("{x}", tileIndexWrapped.x.toString())
        .replace("{y}", tileIndexWrapped.y.toString())
        .replace("{z}", tileIndexWrapped.z.toString());

      // The texture is not existing. An unfruitful attempt was made already
      if (this.unavailableTextures.has(textureURL)) {
        return reject(new Error("Could not load texture."));
      }

      // The texture is in the pool of already fetched textures
      if (this.texturePool.has(textureURL)) {
        resolve(this.texturePool.get(textureURL) as Texture);
        return;
      }

      // A request of this texture has already been made but is not finished yet
      if (this.textureInProgress.has(textureURL)) {
        resolve(this.textureInProgress.get(textureURL) as Texture);
        return;
      }

      const tempTexture = this.textureLoader.load(
        textureURL,

        (texture) => {
          texture.flipY = false;
          this.texturePool.set(textureURL, texture);
          this.textureInProgress.delete(textureURL);
          resolve(texture);
        },

        // onProgress callback currently not supported
        undefined,

        // onError callback
        (_err) => {
          this.unavailableTextures.add(textureURL);

          this.textureInProgress.delete(textureURL);

          reject(new Error("Could not load texture."));
        },
      );

      this.textureInProgress.set(textureURL, tempTexture);
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
