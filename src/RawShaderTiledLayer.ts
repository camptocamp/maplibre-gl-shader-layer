/**
 * This is a demo of how to extend ThreeTiledLayer
 * RawShaderTiledLayer is a layer that simply contains a texture per tile
 */


import { DoubleSide, RawShaderMaterial, Uniform, Vector4 } from "three";
import { ThreeTiledLayer } from "./ThreeTiledLayer";
// @ts-ignore
import vertexShader from "./shaders/demo.v.glsl?raw";
// @ts-ignore
import fragmentShader from "./shaders/demo.f.glsl?raw";
import type { TileIndex } from "./tools";


export class RawShaderTiledLayer extends ThreeTiledLayer {
  constructor(id: string) {

    super(id, {

      onSetTileMaterial: (tileIndex: TileIndex) => {
        console.log("Creating material for tile at ", tileIndex);
        

        const shader = new RawShaderMaterial({
          uniforms: {
            color: new Uniform(new Vector4(1, 0, 0, 1)),
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



      // onTileUpdate: (tile: Tile, matrix: Mat4) => {

      // }

    });

  }


}