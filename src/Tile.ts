import { Mesh } from "three";
import { type TileIndex, tileIndexToMercatorPosition } from "./tools";

export class Tile extends Mesh {
  private tileIndex: TileIndex = { z: 0, x: 0, y: 0 };

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
