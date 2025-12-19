import { Texture } from 'three';
import { TileIndex } from '../core/tools';
export type TextureManagerOptions = {
    cacheSize?: number;
};
export declare class RemoteTileTextureManager {
    private readonly texturePool;
    private readonly unavailableTextures;
    private readonly textureLoader;
    private readonly textureInProgress;
    constructor(options?: TextureManagerOptions);
    /**
     * Get a texture from its z/x/y index
     * If a tile is already in the cache, it will be retrieved from the cache.
     * If a texture already failed to be retrieved, it is not trying again.
     */
    getTexture(tileIndex: TileIndex, textureUrlPattern: string): Promise<Texture>;
    /**
     * Clear the texture cache
     */
    clear(): void;
}
