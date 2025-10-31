import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import maplibregl from "maplibre-gl";
import { ShaderTiledLayer } from "./ShaderTiledLayer";
import { DummyGradientTiledLayer } from "./DummyGradientTiledLayer";
import { TextureTiledLayer } from "./TextureTiledLayer";
import { getStyle, setLayerOpacity } from "basemapkit";
import { Protocol } from "pmtiles";
import { MultiChannelTiledLayer } from "./MultiChannelTiledLayer";
import { Colormap } from "./colormap";
import { MultiChannelSeriesTiledLayer, type MultiChannelSeriesTiledLayerSpecification } from "./MultiChannelSeriesTiledLayer";


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





async function initSeries() {
  maplibregl.addProtocol("pmtiles", new Protocol().tile);

  const container = document.getElementById("map");
  if (!container) throw new Error('There is no div with the id: "map" ');

  const seriesSlider = document.getElementById("series-slider") as HTMLInputElement;
  if (!seriesSlider) throw new Error("Slider not working");

  const tileUrlPrefix = "http://127.0.0.1:8083/";
  const seriesInfoUrl = `${tileUrlPrefix}tileset_info.json`;
  const seriesInfoResponse = await fetch(seriesInfoUrl);
  const seriesInfo = await seriesInfoResponse.json() as MultiChannelSeriesTiledLayerSpecification;

  console.log(seriesInfo);

  seriesSlider.min = seriesInfo.series[0].seriesAxisValue.toString()
  seriesSlider.max = seriesInfo.series[seriesInfo.series.length - 1].seriesAxisValue.toString()

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

    const layer = new MultiChannelSeriesTiledLayer("custom-layer", {
      datasetSpecification: seriesInfo,
      colormap,
      tileUrlPrefix,
    });

    map.addLayer(layer, "water");

    seriesSlider.addEventListener("input", () => {
      const sliderTimestamp = parseFloat(seriesSlider.value);
      layer.setSeriesAxisValue(sliderTimestamp);
    })
  })

}

initSeries();

