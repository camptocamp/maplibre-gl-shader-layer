import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import maplibregl, { MapMouseEvent } from "maplibre-gl";
import { ShaderTiledLayer } from "./ShaderTiledLayer";
import { DummyGradientTiledLayer } from "./DummyGradientTiledLayer";
import { TextureTiledLayer } from "./TextureTiledLayer";
import { getStyle, setLayerOpacity, swapLayers } from "basemapkit";
import { Protocol } from "pmtiles";
import { MultiChannelTiledLayer } from "./MultiChannelTiledLayer";
import { Colormap } from "./colormap";
import { MultiChannelSeriesTiledLayer, type MultiChannelSeriesTiledLayerSpecification } from "./MultiChannelSeriesTiledLayer";
import { temperatureTurbo, wind } from "./colormap-collection";


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
    colormap: temperatureTurbo,
    style: "spectre-purple",
    swapWaterEarth: false,
    placelayerBeforeId: "water",
  },

  wind_speed_10m_UNCLAMPED: {
    colormap: wind,
    style: "spectre-negative",
    swapWaterEarth: true,
    placelayerBeforeId: "earth",
  },
} as const;


type WeatherVariableId = keyof typeof seriesConfig;

async function initSeriesTemperatures(weatherVariableId: WeatherVariableId) {
  maplibregl.addProtocol("pmtiles", new Protocol().tile);

  const container = document.getElementById("map");
  if (!container) throw new Error('There is no div with the id: "map" ');

  const seriesSlider = document.getElementById("series-slider") as HTMLInputElement;
  if (!seriesSlider) throw new Error("Slider not working");

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

  style = setLayerOpacity("water", 0.3, style);
  style = setLayerOpacity("earth", 0.3, style);

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

  const colormap = Colormap.fromColormapDescription(seriesConfig[weatherVariableId].colormap);
  

  // map.showTileBoundaries = true;

  await new Promise((resolve) => map.on("load", resolve));

  console.log("LOAD");
  
  const layer = new MultiChannelSeriesTiledLayer("custom-layer", {
    datasetSpecification: seriesInfo,
    colormap,
    colormapGradient: true,
    tileUrlPrefix,
  });

  map.addLayer(layer, seriesConfig[weatherVariableId].placelayerBeforeId);

  seriesSlider.addEventListener("input", () => {
    const sliderTimestamp = parseFloat(seriesSlider.value);
    layer.setSeriesAxisValue(sliderTimestamp);

    // We could take the one from the slider, but the layer add a safety clapming
    const seriesAxisValue =  layer.getSeriesAxisValue();
    const sliderDate = new Date(seriesAxisValue * 1000);

    const dateStr = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(sliderDate)

    dateDisplay.innerText = dateStr;
  })

  seriesSlider.addEventListener("pointerenter", () => {      
    layer.prefetchSeriesTexture(-10, 10);
  })

  map.on("mousemove", async (e: MapMouseEvent) => {    
    try{
      const pickingInfo = await layer.pick(e.lngLat)
      pickindDisplay.innerText = `${pickingInfo?.value.toFixed(2)}${pickingInfo?.unit}`;
    } catch(err) {
      pickindDisplay.innerText = "-"      
    }
  })

}

initSeriesTemperatures("wind_speed_10m_UNCLAMPED");

