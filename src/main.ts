import "@maptiler/sdk/dist/maptiler-sdk.css";
import "./style.css";
import { config, Map as SDKMap } from "@maptiler/sdk";
import { ThreeTiledLayer } from "./ThreeTiledLayer";
import type { TileIndex } from "./tools";
import { Color, type Material, type MeshBasicMaterial } from "three";

async function init() {
  const container = document.getElementById("map");

  if (!container) throw new Error('There is no div with the id: "map" ');

  config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
  const map = new SDKMap({ container, hash: true, terrainControl: true });

  await map.onReadyAsync();

  console.log("map", map);

  // map.showTileBoundaries = true;

  const tiledLayer = new ThreeTiledLayer("some layer", {
    // This function updates the tiling color and layout based on map settings and tile index
    tileMaterialUpdateFunction: (tileIndex: TileIndex, material: Material) => {
      const z = map.getZoom();
      const pitch = map.getPitch();
      const bearing = map.getBearing();
      const m = material as MeshBasicMaterial;
      m.color = new Color(z / 22, pitch / 60, (bearing + 180) / 360);

      if ((tileIndex.x % 2 === 0 && tileIndex.y % 2 === 0) || (tileIndex.x % 2 === 1 && tileIndex.y % 2 === 1)) {
        m.opacity = 0.8;
      } else {
        m.opacity = 0.4;
      }
    },
  });

  map.addLayer(tiledLayer);
}

init();
