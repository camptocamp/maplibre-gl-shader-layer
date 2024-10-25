import { type Map as SDKMap, MercatorCoordinate } from "@maptiler/sdk";
import { Mat4 } from "./ShaderTiledLayer";

export type TileIndex = {
  z: number;
  x: number;
  y: number;
};

export type TileBoundsUnwrapped = {
  min: TileIndex;
  max: TileIndex;
};

export type TileUnwrappedPosition = {
  /**
   * Position in mercator coordinate. Since it's unwrapped, x can be lower then 0 or higher than 1
   */
  center: [number, number];

  /**
   * both height and width, because tiles are square-shaped
   */
  size: number;
};

function mercatorToTileIndex(
  /**
   * Mercator coordinates (north-west is [0, 0], sourth-east is [1, 1])
   */
  position: [number, number],
  /**
   * Zoom level
   */
  zoom: number,
  /**
   * Returns integer tile indices if `true` or floating-point values if `false`
   */
  strict = true,
): TileIndex {
  const numberOfTilePerAxis = 2 ** zoom;

  const tileIndex: TileIndex = {
    z: zoom,
    x: position[0] * numberOfTilePerAxis,
    y: position[1] * numberOfTilePerAxis,
  };

  if (strict) {
    tileIndex.x = Math.floor(tileIndex.x);
    tileIndex.y = Math.floor(tileIndex.y);
  }

  return tileIndex;
}

/**
 * Get the tile index
 */
export function getTileBoundsUnwrapped(map: SDKMap, z: number): TileBoundsUnwrapped {
  const bounds = map.getBounds();
  const nwMerc = MercatorCoordinate.fromLngLat(bounds.getNorthWest());
  const seMerc = MercatorCoordinate.fromLngLat(bounds.getSouthEast());

  // Y is always in [0, 1]
  const eps = 0.000001;
  nwMerc.y = Math.max(nwMerc.y, 0);
  nwMerc.y = Math.min(nwMerc.y, 1 - eps);
  seMerc.y = Math.max(seMerc.y, 0);
  seMerc.y = Math.min(seMerc.y, 1 - eps);

  // Compute unwrapped tile indices for a given z
  const nwTile = mercatorToTileIndex([nwMerc.x, nwMerc.y], z, true);
  // nwTile[0] = Math.floor(nwTile[0]);
  // nwTile[1] = Math.floor(nwTile[1]);
  const seTile = mercatorToTileIndex([seMerc.x, seMerc.y], z, true);
  // seTile[0] = Math.floor(seTile[0]);
  // seTile[1] = Math.floor(seTile[1]);
  // console.log("nwTile", nwTile);
  // console.log("seTile", seTile);

  return {
    min: {
      z: z,
      x: nwTile.x,
      y: nwTile.y,
    },
    max: {
      z: z,
      x: seTile.x,
      y: seTile.y,
    },
  };
}

export function tileBoundsUnwrappedToTileList(tbu: TileBoundsUnwrapped): TileIndex[] {
  const allTileIndices: TileIndex[] = [];
  const z = tbu.min.z;

  for (let y = tbu.min.y; y <= tbu.max.y; y += 1) {
    for (let x = tbu.min.x; x <= tbu.max.x; x += 1) {
      allTileIndices.push({ z, x, y });
    }
  }
  return allTileIndices;
}

export function tileIndexToMercatorPosition(ti: TileIndex): TileUnwrappedPosition {
  const size = 1 / 2 ** ti.z;
  const centerX = (ti.x + 0.5) * size;
  const centerY = (ti.y + 0.5) * size;
  return {
    size,
    center: [centerX, centerY],
  };
}

export function wrapTileIndex(tileIndex: TileIndex): TileIndex {
  const nbTilePerAxis = 2 ** tileIndex.z;
  let x = tileIndex.x % nbTilePerAxis;
  if (x < 0) {
    x = nbTilePerAxis + x ;
  }
  return {
    x: x,
    y: tileIndex.y,
    z: tileIndex.z,
  } as TileIndex;
}