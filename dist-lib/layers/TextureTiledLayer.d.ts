import { BaseShaderTiledLayer } from '../core/BaseShaderTiledLayer';
import { RemoteTileTextureManager } from '../core/RemoteTileTextureManager';
export type TextureTiledLayerOptions = {
    minZoom?: number;
    maxZoom?: number;
    textureUrlPattern: string;
    /**
     * A texture manager can be provided. This can be interesting when multiple
     * layers are using the same textures.
     * If not provided, a default one will be added internaly to this layer.
     */
    remoteTileTextureManager?: RemoteTileTextureManager;
};
export declare class TextureTiledLayer extends BaseShaderTiledLayer {
    private readonly textureUrlPattern;
    private readonly remoteTileTextureManager;
    constructor(id: string, options: TextureTiledLayerOptions);
}
