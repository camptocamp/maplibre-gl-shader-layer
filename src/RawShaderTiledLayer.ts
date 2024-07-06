/**
 * This is a demo of how to extend ThreeTiledLayer
 * RawShaderTiledLayer is a layer that simply contains a texture per tile
 */


import { DoubleSide, type Material, MeshBasicMaterial, type Texture, TextureLoader, RawShaderMaterial, Uniform, Vector3, Vector4, Matrix4 } from "three";
import { type Mat4, ThreeTiledLayer } from "./ThreeTiledLayer";
// @ts-ignore
import vertexShader from "./shaders/demo.v.glsl?raw";
// @ts-ignore
import fragmentShader from "./shaders/demo.f.glsl?raw";
import { splitMatrix, type TileIndex } from "./tools";




export class RawShaderTiledLayer extends ThreeTiledLayer {


  constructor(id: string) {

    


    super(id, {

      tileMaterialSetFunction: (tileIndex: TileIndex) => {

        const shader = new RawShaderMaterial({
          uniforms: {
            color: new Uniform(new Vector4(1, 0, 0, 1)),
            highProjMatrix: new Uniform(new Matrix4()),
            lowProjMatrix: new Uniform(new Matrix4()),
            basicProjMatrix: new Uniform(new Matrix4()),
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



      tileMaterialUpdateFunction: (tileIndex: TileIndex, material: Material, matrix: Mat4) => {
        const mtl = material as RawShaderMaterial;

        // Computing high and low matrix + passing them as uniforms
        const { highMatrix, lowMatrix } = splitMatrix(matrix);
        console.log("highMatrix", highMatrix);
        console.log("lowMatrix", lowMatrix);
        

        
        mtl.uniforms.highProjMatrix.value = new Matrix4().fromArray(highMatrix);
        mtl.uniforms.lowProjMatrix.value = new Matrix4().fromArray(lowMatrix);
        mtl.uniforms.basicProjMatrix.value = new Matrix4().fromArray(matrix);
        
      }

    });

  }


}