import { BaseShaderTiledLayer } from '../core/BaseShaderTiledLayer';
export type DaylightLayerOptions = {
    date?: Date;
    opacity?: number;
};
export declare class DaylightLayer extends BaseShaderTiledLayer {
    private date;
    constructor(id: string, options?: DaylightLayerOptions);
    setDate(date: Date): void;
}
