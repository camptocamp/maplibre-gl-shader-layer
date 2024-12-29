import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import maplibregl from "maplibre-gl";
// import { ShaderTiledLayer } from "./ShaderTiledLayer";
// import type { TileIndex } from "./tools";
// import { Color, type Material, type MeshBasicMaterial } from "three";
// import { TextureTiledLayer } from "./TextureTiledLayer";
// import { DummyGradientTiledLayer } from "./DummyGradientTiledLayer";
import { BorderDistanceLayer } from "./BorderDistanceLayer";
import { ShoreLayer } from "./ShoreLayer";

// async function init() {
//   const container = document.getElementById("map");

//   if (!container) throw new Error('There is no div with the id: "map" ');

//   config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
//   const map = new SDKMap({ container, hash: true, terrainControl: true });

//   await map.onReadyAsync();

//   console.log("map", map);

//   // map.showTileBoundaries = true;

//   const tiledLayer = new ShaderTiledLayer("some layer", {
//     // This function updates the tiling color and layout based on map settings and tile index
//     onTileUpdate: (tileIndex: TileIndex, material: Material) => {
//       const z = map.getZoom();
//       const pitch = map.getPitch();
//       const bearing = map.getBearing();
//       const m = material as MeshBasicMaterial;
//       m.color = new Color(z / 22, pitch / 60, (bearing + 180) / 360);

//       if ((tileIndex.x % 2 === 0 && tileIndex.y % 2 === 0) || (tileIndex.x % 2 === 1 && tileIndex.y % 2 === 1)) {
//         m.opacity = 0.8;
//       } else {
//         m.opacity = 0.4;
//       }
//     },
//   });

//   map.addLayer(tiledLayer);
// }

// init();


// async function init2() {
//   const container = document.getElementById("map");

//   if (!container) throw new Error('There is no div with the id: "map" ');

//   config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
//   const map = new maplibregl.Map({ container, hash: true, terrainControl: true });

//   await map.onReadyAsync();

//   console.log("map", map);

//   map.showTileBoundaries = true;

//   const satelliteUrlPattern = `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${config.apiKey}`;

//   const textureTiledLayer = new TextureTiledLayer("some layer", {
//     textureUrlPattern: satelliteUrlPattern,
//   });

//   map.addLayer(textureTiledLayer);
// }



// async function init3() {
//   const container = document.getElementById("map");

//   if (!container) throw new Error('There is no div with the id: "map" ');

//   config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
//   const map = new SDKMap({ container, hash: true, terrainControl: true, style: MapStyle.OUTDOOR, terrain: true, terrainExaggeration: 3 });

//   await map.onReadyAsync();

//   console.log("map", map);

//   map.showTileBoundaries = true;

//   const textureTiledLayer = new DummyGradientTiledLayer("some layer");

//   map.addLayer(textureTiledLayer);
// }


// async function init4() {
//   const container = document.getElementById("map");

//   if (!container) throw new Error('There is no div with the id: "map" ');
// ;
//   const map = new maplibregl.Map({ 
//     container, 
//     hash: true, 
//     // style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`
//     style: `https://api.maptiler.com/maps/backdrop-dark/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`
    
//   });

//   const tileUrlPattern = "http://localhost:64862/{z}/{x}/{y}.webp";
//   // map.showTileBoundaries = true;
//   console.log("map", map);

//   map.on("load", () => {
//     // map.setProjection({ type: "globe" });
//     const borderDistanceLayer = new BorderDistanceLayer("some layer", {
//       textureUrlPattern: tileUrlPattern,
//       animationSpeed: 1,
//     });
  
//     map.addLayer(borderDistanceLayer);
//   });
// }


async function init5() {
  const container = document.getElementById("map");

  if (!container) throw new Error('There is no div with the id: "map" ');
;
  const map = new maplibregl.Map({ 
    container, 
    hash: true, 
    style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`
    // style: `https://api.maptiler.com/maps/backdrop-dark/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`
    
  });

  const tileUrlPattern = "http://localhost:64862/{z}/{x}/{y}.webp";
  // map.showTileBoundaries = true;
  console.log("map", map);

  map.on("load", () => {
    // map.setProjection({ type: "globe" });
    const layer = new ShoreLayer("some layer", {
      textureUrlPattern: tileUrlPattern,
      animationSpeed: 0,
      color: {r: 255, g: 120, b: 0}
    });
  
    map.addLayer(layer);
    console.log("layer", layer);
    
  });
}

init5();

