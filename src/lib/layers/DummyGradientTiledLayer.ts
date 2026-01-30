/**
 * This is a demo of how to extend ShaderTiledLayer
 * RawShaderTiledLayer is a layer that simply contains a texture per tile
 */

import type { RawShaderMaterial, ShaderMaterialParameters } from "three";
import { BaseShaderTiledLayer, type BaseShaderTiledLayerOptions } from "../core/BaseShaderTiledLayer";

// @ts-ignore
import fragmentShader from "../shaders/dummy-gradient.f.glsl?raw";
import type { TileIndex } from "../core/tools";

export type DummyGradientTiledLayerOptions = Omit<BaseShaderTiledLayerOptions, "tileZoomFitting">;

export class DummyGradientTiledLayer extends BaseShaderTiledLayer {
  constructor(id: string, options: DummyGradientTiledLayerOptions = {}) {
    super(id, options);
  }

  // Must be implemented.
  // The fragment shader for DummyGradientTiledLayer only depends on uniforms
  // initialized on the parent class BaseShaderTiledLayer such as zoom, tileIndex, etc.
  // For this reason, there is no need to pass a uniform object as part of the returned value
  onSetTileShaderParameters(_tileIndex: TileIndex): ShaderMaterialParameters {
    return {
      fragmentShader: fragmentShader,
    };
  }

  // Must be implemented
  async onTileUpdate(_tileIndex: TileIndex, _material: RawShaderMaterial) {
    // Nothing to be done here
  }
}
