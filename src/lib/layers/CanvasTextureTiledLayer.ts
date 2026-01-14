/**
 * This is a demo of how to extend ShaderTiledLayer
 * TextureTiledLayer is a layer that simply contains a texture per tile
 */

import { RawShaderMaterial, GLSL3, Vector3, BackSide, CanvasTexture, ShaderMaterialParameters } from "three";
import { BaseShaderTiledLayer } from "../core/BaseShaderTiledLayer";
import type { TileIndex } from "../core/tools";
import type { Tile } from "../core/Tile";
// @ts-ignore
import fragmentShader from "../shaders/texture-tile.f.glsl?raw";
import { type TextureMaker, TileTextureManager } from "../core/TileTextureManager";

export type CanvasTextureTiledLayerOptions = {
  minZoom?: number;
  maxZoom?: number;
  canvasMaker: (tileIndex: TileIndex) => Promise<HTMLCanvasElement | OffscreenCanvas>;
};

export class CanvasTextureTiledLayer extends BaseShaderTiledLayer {
  private readonly tileTextureManager: TileTextureManager;
  private readonly textureMaker: TextureMaker;

  constructor(id: string, options: CanvasTextureTiledLayerOptions) {
    const canvasMaker = options.canvasMaker;

    super(id, {
      minZoom: options.minZoom ?? 0,
      maxZoom: options.maxZoom ?? 22,
    });

    this.textureMaker = async (tileIndex: TileIndex) => {
      const canvas = await canvasMaker(tileIndex);
      return new CanvasTexture(canvas);
    };

    this.tileTextureManager = new TileTextureManager();
  }

  protected onSetTileShaderParameters(_tileIndex: TileIndex): ShaderMaterialParameters {
    return {
      uniforms: {
        tex: { value: null },
      },
      fragmentShader: fragmentShader,
    }
  }

  protected async onTileUpdate(tileIndex: TileIndex, material: RawShaderMaterial) {
    material.uniforms.tex.value = await this.tileTextureManager.getTexture(tileIndex, this.textureMaker);
  }
}
