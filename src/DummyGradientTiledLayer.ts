/**
 * This is a demo of how to extend ShaderTiledLayer
 * RawShaderTiledLayer is a layer that simply contains a texture per tile
 */


import { DoubleSide, GLSL3, RawShaderMaterial, Uniform, Vector4 } from "three";
import { type Mat4, ShaderTiledLayer } from "./ShaderTiledLayer";
// @ts-ignore
import vertexShader from "./shaders/dummy-gradient.v.glsl?raw";
// @ts-ignore
import fragmentShader from "./shaders/dummy-gradient.f.glsl?raw";
import type { TileIndex } from "./tools";
import type { Tile } from "./Tile";


export class DummyGradientTiledLayer extends ShaderTiledLayer {
  constructor(id: string) {
    super(id, {
      onSetTileMaterial: (tileIndex: TileIndex) => {
        const shader = new RawShaderMaterial({
          // This automatically adds the top-level instruction:
          // #version 300 es
          glslVersion: GLSL3,

          uniforms: {
            color: new Uniform(new Vector4(1, 0, 0, 1)),
            zoom: { value: this.map.getZoom() },
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          side: DoubleSide,
					transparent: true,
          depthTest: false,
          // wireframe: true,
        })
        
        return shader;
      },



      onTileUpdate: (tile: Tile, matrix: Mat4) => {
        (tile.material as RawShaderMaterial).uniforms.zoom.value = this.map.getZoom();
      }

    });

  }


}