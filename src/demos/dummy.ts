import maplibregl from "maplibre-gl";
import { getStyle } from "basemapkit";
import { Protocol } from "pmtiles";

import { glyphs, lang, pmtiles, sprite } from "./constant";
import { DummyGradientTiledLayer } from "../lib";

export async function dummyDemo(globe: boolean) {
  maplibregl.addProtocol("pmtiles", new Protocol().tile);

  const container = document.getElementById("map");
  if (!container) throw new Error('There is no div with the id: "map" ');

  const seriesSlider = document.getElementById("series-slider") as HTMLInputElement;
  if (!seriesSlider) throw new Error("Slider not working");

  const opacitySlider = document.getElementById("opacity-slider") as HTMLInputElement;
  if (!opacitySlider) throw new Error("Slider not working");
  opacitySlider.value = "0";

  const pickindDisplay = document.getElementById("picking-display");
  if (!pickindDisplay) throw new Error("Picking display not working");

  const dateDisplay = document.getElementById("date-display");
  if (!dateDisplay) throw new Error("Date display not working");

  [seriesSlider, pickindDisplay, dateDisplay].forEach((el) => el.style.setProperty("display", "none"));

  const style = getStyle("avenue", {
    pmtiles,
    sprite,
    glyphs,
    lang,
    hidePOIs: true,
    globe,
  });

  const map = new maplibregl.Map({
    container,
    hash: false,
    zoom: 4,
    center: [27.35, 38.92],
    style: style,
    maxPitch: 89,
  });

  await new Promise((resolve) => map.on("load", resolve));

  const layer = new DummyGradientTiledLayer("dummy-layer");
  map.addLayer(layer);

  opacitySlider.addEventListener("input", () => {
    layer.setAltitude(Number.parseFloat(opacitySlider.value) * 100000);
  });
}
