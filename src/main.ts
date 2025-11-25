import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import maplibregl, { type MapMouseEvent } from "maplibre-gl";
import { getStyle, setLayerOpacity, swapLayers } from "basemapkit";
import { Protocol } from "pmtiles";
import { MultiChannelTiledLayer } from "./MultiChannelTiledLayer";
import { Colormap } from "./colormap";
import { MultiChannelSeriesTiledLayer, type MultiChannelSeriesTiledLayerSpecification } from "./MultiChannelSeriesTiledLayer";
import { DaylightLayer } from "./DaylightLayer"
import * as colormapCollection from "./colormap-collection";


async function initMono() {
  maplibregl.addProtocol("pmtiles", new Protocol().tile);

  const container = document.getElementById("map");
  
  if (!container) throw new Error('There is no div with the id: "map" ');

  const lang = "en";
  const pmtiles = "https://fsn1.your-objectstorage.com/public-map-data/pmtiles/planet.pmtiles";
  const sprite = "https://raw.githubusercontent.com/jonathanlurie/phosphor-mlgl-sprite/refs/heads/main/sprite/phosphor-diecut";
  const glyphs = "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf";

  let style = getStyle("spectre-purple", {
    pmtiles,
    sprite,
    glyphs,
    lang,
    hidePOIs: true,
  });

  style = setLayerOpacity("water", 0.3, style);

  // Webgl layer not working well with Basemakit definition of globe 
  style.projection = {type: "globe"};

  console.log(style);
  

  const map = new maplibregl.Map({ 
    container, 
    hash: true, 
    style: style,
  });


  console.log(map);
  

  // map.showTileBoundaries = true;


  map.on("load", async () => {
    const multiChannelTilesetPattern = "http://127.0.0.1:8083/temperature_2m/web/2025-10-29T06%3A00%3A00Z/{z}/{x}/{y}.webp"

    // Colormap on the temperature scale (degree Celcius)
    // using the Google Turbo colormap definition
    const colormapDefinition = [
      -65, "#30123b",
      -55, "#4040a2",
      -40, "#466be3",
      -30, "#4293ff",
      -20, "#28bbec",
      -15, "#18dcc3",
      -10, "#31f299",
      -5, "#6bfe64",
      0, "#a2fc3c",
      5, "#cced34",
      10, "#edd03a",
      15, "#fdad35",
      20, "#e76b18",
      25, "#ec520f",
      30, "#d23105",
      40, "#ac1701",
      55, "#7a0403",
    ];

    const colormap = Colormap.fromColormapDescription(colormapDefinition);

    const layer = new MultiChannelTiledLayer("custom-layer", {
      // textureUrlPattern: satelliteUrlPattern,
      textureUrlPattern: multiChannelTilesetPattern,
      minZoom: 0,
      maxZoom: 4,
      rasterEncoding: {
        channels: "gb",
        polynomialSlope: 0.01,
        polynomialOffset: -200,
      },
      colormap,
    });

    map.addLayer(layer, "water");
  })

}



const seriesConfig = {
  temperature_2m: {
    colormap: Colormap.fromColormapDescription(colormapCollection.turbo, {min: -25, max: 40, reverse: false}),
    style: "spectre-purple",
    swapWaterEarth: false,
    placelayerBeforeId: "water",
    layerOpacity: [
      {layerId: "water", opacity: 0.2},
    ]
  },

  wind_speed_10m: {
    colormap: Colormap.fromColormapDescription(colormapCollection.bathymetry, {min: 0, max: 22}),
    style: "spectre-negative",
    swapWaterEarth: true,
    placelayerBeforeId: "earth",
    layerOpacity: [
      {layerId: "earth", opacity: 0.3},
    ]
  },

  presure_msl: {
    colormap: Colormap.fromColormapDescription(colormapCollection.presureBlueWhiteRed),
    style: "spectre",
    swapWaterEarth: true,
    placelayerBeforeId: "earth_line",
  },

  // cloud_cover_low: {
  //   colormap: Colormap.fromColormapDescription(colormapCollection.cloudCoverGray),
  //   style: "spectre-red",
  //   swapWaterEarth: false,
  //   placelayerBeforeId: "earth_line",
  // },

  // // cloud_cover_low: {
  // //   colormap: Colormap.fromColormapDescription(colormapCollection.cloudCoverTransparent),
  // //   style: "avenue",
  // //   swapWaterEarth: false,
  // //   placelayerBeforeId:  undefined,
  // // },

  // relative_humidity_2m: {
  //   colormap: Colormap.fromColormapDescription(colormapCollection.magmaPercent),
  //   style: "spectre-negative",
  //   swapWaterEarth: true,
  //   placelayerBeforeId: "earth",
  //   layerOpacity: [
  //     {layerId: "water", opacity: 0.3},
  //     {layerId: "earth", opacity: 0.3},
  //   ]
  // }


  index: {
    colormap: Colormap.fromColormapDescription(colormapCollection.turbo, {min: -15, max: 25, reverse: false}),
    style: "spectre-purple",
    swapWaterEarth: false,
    placelayerBeforeId: "water",
    layerOpacity: [
      {layerId: "water", opacity: 0.1},
    ]
  },
} as const;







type WeatherVariableId = keyof typeof seriesConfig;

async function initSeries(weatherVariableId: WeatherVariableId) {
  maplibregl.addProtocol("pmtiles", new Protocol().tile);

  const container = document.getElementById("map");
  if (!container) throw new Error('There is no div with the id: "map" ');

  const seriesSlider = document.getElementById("series-slider") as HTMLInputElement;
  if (!seriesSlider) throw new Error("Slider not working");

  const opacitySlider = document.getElementById("opacity-slider") as HTMLInputElement;
  if (!opacitySlider) throw new Error("Slider not working");
  

  const pickindDisplay = document.getElementById("picking-display");
  if (!pickindDisplay) throw new Error("Picking display not working");

  const dateDisplay = document.getElementById("date-display");
  if (!dateDisplay) throw new Error("Date display not working");

  const tileUrlPrefix = "http://127.0.0.1:8083/"
  const seriesInfoUrl = `${tileUrlPrefix}${weatherVariableId}.json`;
  const seriesInfoResponse = await fetch(seriesInfoUrl);
  const seriesInfo = await seriesInfoResponse.json() as MultiChannelSeriesTiledLayerSpecification;

  console.log(seriesInfo);

  seriesSlider.min = seriesInfo.series[0].seriesAxisValue.toString()
  seriesSlider.max = seriesInfo.series[seriesInfo.series.length - 1].seriesAxisValue.toString()

  const lang = "en";
  const pmtiles = "https://fsn1.your-objectstorage.com/public-map-data/pmtiles/planet.pmtiles";
  const sprite = "https://raw.githubusercontent.com/jonathanlurie/phosphor-mlgl-sprite/refs/heads/main/sprite/phosphor-diecut";
  const glyphs = "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf";
  const pmtilesTerrain = "https://fsn1.your-objectstorage.com/public-map-data/pmtiles/terrain-mapterhorn.pmtiles";
  const terrainTileEncoding = "terrarium";

  let style = getStyle(seriesConfig[weatherVariableId].style, {
    pmtiles,
    sprite,
    glyphs,
    lang,
    hidePOIs: true,

    // globe: false,
    // terrain: {
    //   pmtiles: pmtilesTerrain,
    //   encoding: "terrarium"
    // }
  });


  if ("layerOpacity" in seriesConfig[weatherVariableId]) {
    for (const opacityInstruction of seriesConfig[weatherVariableId].layerOpacity) {
      style = setLayerOpacity(opacityInstruction.layerId , opacityInstruction.opacity, style);
    }
  }

  if (seriesConfig[weatherVariableId].swapWaterEarth) {
    style = swapLayers("earth", "water", style);
  }

  // Webgl layer not working well with Basemakit definition of globe 
  // style.projection = {type: "mercator"};

  console.log(style);
  

  const map = new maplibregl.Map({ 
    container, 
    hash: true, 
    style: style,
    maxPitch: 89,
  });


  console.log(map);

  // map.showTileBoundaries = true;

  await new Promise((resolve) => map.on("load", resolve));


  console.log("LOAD");

  const daylightLayer = new DaylightLayer("daylight")
  map.addLayer(daylightLayer, "earth_line")

  
  const layer = new MultiChannelSeriesTiledLayer("custom-layer", {
    datasetSpecification: seriesInfo,
    colormap: seriesConfig[weatherVariableId].colormap,
    colormapGradient: true,
    tileUrlPrefix,
  });

  console.log("layer", layer);
  

  if (seriesConfig[weatherVariableId].placelayerBeforeId) {
    map.addLayer(layer, seriesConfig[weatherVariableId].placelayerBeforeId);
  } else {
    map.addLayer(layer);
  }
  
  seriesSlider.addEventListener("input", () => {
    const sliderTimestamp = Number.parseFloat(seriesSlider.value);
    layer.setSeriesAxisValue(sliderTimestamp);

    // We could take the one from the slider, but the layer add a safety clapming
    const seriesAxisValue =  layer.getSeriesAxisValue();
    const sliderDate = new Date(seriesAxisValue * 1000);

    const dateStr = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(sliderDate)

    daylightLayer.setDate(sliderDate);

    dateDisplay.innerText = dateStr;
  })

  seriesSlider.addEventListener("pointerenter", () => {      
    layer.prefetchSeriesTexture(-15, 15);
  })

  opacitySlider.addEventListener("input", () => {
    layer.setOpacity(Number.parseFloat(opacitySlider.value))
  })

  map.on("mousemove", async (e: MapMouseEvent) => {    
    try{
      const pickingInfo = await layer.pick(e.lngLat)
      if (pickingInfo) {
        pickindDisplay.innerText = `${pickingInfo?.value.toFixed(2)}${pickingInfo?.unit}`;
      } else {
        pickindDisplay.innerText = "[no data]" 
      }
    } catch(err) {
      console.log(err);
      
      pickindDisplay.innerText = "-"      
    }
  })

  

}

initSeries("temperature_2m");
