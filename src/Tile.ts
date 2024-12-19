import { BufferAttribute, type BufferGeometry, type Material, Matrix4, Mesh, type NormalBufferAttributes, Quaternion, Vector3 } from "three";
import { projectTileCoordinatesToSphereUV, type TileIndex, tileIndexToMercatorPosition } from "./tools";
import { MercatorCoordinate } from "maplibre-gl";

export class Tile extends Mesh {
  private tileIndex: TileIndex = { z: 0, x: 0, y: 0 };

  constructor(geometry: BufferGeometry<NormalBufferAttributes> | undefined, material: Material | Material[] | undefined){
    console.log("geometry", geometry);
    
    super(geometry?.clone(), material);
    this.matrixAutoUpdate = false;
    this.matrixWorldAutoUpdate = false;
    
  }

  /**
   * Defines the tile index and position the tile in the mercator space
   */
  setTileIndex(ti: TileIndex) {
    this.tileIndex.x = ti.x;
    this.tileIndex.y = ti.y;
    this.tileIndex.z = ti.z;

    const mercatorPosition = tileIndexToMercatorPosition(ti);
    this.scale.set(mercatorPosition.size, mercatorPosition.size, mercatorPosition.size);

    this.position.set(mercatorPosition.center[0], mercatorPosition.center[1], 0);
  }

  /**
   * Defines the tile index and position the tile in the mercator space
   */
  setTileIndex2(ti: TileIndex, map: maplibregl.Map) {
    this.tileIndex.x = ti.x;
    this.tileIndex.y = ti.y;
    this.tileIndex.z = ti.z;

    console.log("----------------------------");
    console.log("tileIndex", this.tileIndex);
    
    

    const mercatorPosition = tileIndexToMercatorPosition(ti);
    // this.scale.set(mercatorPosition.size, mercatorPosition.size, mercatorPosition.size);
    console.log("mercatorPosition", mercatorPosition);
    

    const lngLat = new MercatorCoordinate(mercatorPosition.center[0], mercatorPosition.center[1], 0).toLngLat();
    console.log(lngLat);
    
    const modelMatrixData = map.transform.getMatrixForModel(lngLat, 0);
    console.log("modelMatrixData", modelMatrixData);

    const positionRotationMatrix = new Matrix4()
      .fromArray(modelMatrixData)

    console.log("positionRotationMatrix", positionRotationMatrix);

    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();
    
    
    

    const scaleMatrix = new Matrix4().makeScale(mercatorPosition.size, mercatorPosition.size, mercatorPosition.size);
    console.log("scale", scaleMatrix);
    
    // const modelMatrix = new Matrix4().multiplyMatrices(scaleMatrix, positionRotationMatrix);
    const modelMatrixWithScale = replaceMatrixScale(positionRotationMatrix, mercatorPosition.size);

    modelMatrixWithScale.decompose(pos, quat, scl);

    console.log(pos, quat, scl);

    console.log("modelMatrixWithScale", modelMatrixWithScale);
    
    
    // this.matrixWorld = modelMatrix
    this.matrixWorld = modelMatrixWithScale

    // this.updateMatrixWorld(true);

    
    

    // this.position.set(mercatorPosition.center[0], mercatorPosition.center[1], 0);
  }

  setTileIndexGlobe(ti: TileIndex) {
    this.tileIndex.x = ti.x;
    this.tileIndex.y = ti.y;
    this.tileIndex.z = ti.z;

    // Adding the custom positioning on the globe surface
    const uvAttr = this.geometry.attributes.uv;
    const nbAttr = uvAttr.count;

    const positionWorld = new Float32Array(nbAttr * 3);
    for (let i = 0; i < nbAttr; i += 1) {
      const u = uvAttr.array[i*2];
      const v = uvAttr.array[i*2 + 1];
      const globePos = projectTileCoordinatesToSphereUV(u, v, this.tileIndex.x, this.tileIndex.y, this.tileIndex.z);
      positionWorld[i*3] = globePos[0];
      positionWorld[i*3 + 1] = globePos[1];
      positionWorld[i*3 + 2] = globePos[2];
    }

    this.geometry.setAttribute('globe_pos_world', new BufferAttribute(positionWorld, 3));
  }

  /**
   * Get the tile index (a copy)
   */
  getTileIndex(): TileIndex {
    return {
      x: this.tileIndex.x,
      y: this.tileIndex.y,
      z: this.tileIndex.z,
    }
  }

}


function replaceMatrixScale(matrix: Matrix4, newScale: number) {
  // Create holders for position, quaternion, and scale
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  
  // Decompose the original matrix
  matrix.decompose(position, quaternion, scale);
  
  // Create a new matrix
  const newMatrix = new Matrix4();
  
  // If newScale is a number, convert it to Vector3
  const scaleVector = typeof newScale === 'number' 
      ? new Vector3(newScale, newScale, newScale)
      : newScale;
  
  // Compose with the new scale
  newMatrix.compose(position, quaternion, scaleVector);
  
  return newMatrix;
}