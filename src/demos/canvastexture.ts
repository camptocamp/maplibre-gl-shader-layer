import maplibregl from "maplibre-gl";
import { getStyle } from "basemapkit";
import { Protocol } from "pmtiles";

import { glyphs, lang, pmtiles, sprite } from "./constant";
import { CanvasTextureTiledLayer, type TileIndex } from "../lib";

export async function canvasTextureDemo() {
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

  const style = getStyle("journal", {
    pmtiles,
    sprite,
    glyphs,
    lang,
    hidePOIs: true,
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

  const someEmojis = [
    "😂",
    "❤️",
    "🤣",
    "👍",
    "🙏",
    "😍",
    "😭",
    "😘",
    "🥰",
    "😊",
    "😁",
    "💕",
    "😅",
    "🎉",
    "😢",
    "😎",
    "🔥",
    "🥺",
    "💯",
    "😆",
    "🤔",
    "😉",
    "🙌",
    "🤩",
    "✨",
    "🤗",
    "😇",
    "😴",
    "👌",
    "🙂",
  ];

  const layer = new CanvasTextureTiledLayer("canvas-layer", {
    canvasMaker: async (tileIndex: TileIndex) => {
      // This would equaly work with a regular HTML5 Canvas
      // instantiated by document.createElement("canvas")
      const canvas = new OffscreenCanvas(512, 512);
      canvas.width = 512;
      canvas.height = 512;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get 2D canvas context");

      const oddX = tileIndex.x % 2 === 1;
      const oddY = tileIndex.y % 2 === 1;

      const randomEmojis = (() => {
        const picked = new Set<string>();
        while (picked.size < 5) {
          picked.add(someEmojis[Math.floor(Math.random() * someEmojis.length)]);
        }
        return Array.from(picked).join(" ");
      })();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = (oddX && oddY) || (!oddX && !oddY) ? "#0A0" : "#00A";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#FFF";
      ctx.font = "30px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("canvas textures", canvas.width / 2, canvas.height / 2 - 24);
      ctx.fillText(`${tileIndex.z}/${tileIndex.x}/${tileIndex.y}`, canvas.width / 2, canvas.height / 2 + 24);
      ctx.fillText(randomEmojis, canvas.width / 2, canvas.height / 2 + 70);

      return canvas;
    },
  });

  map.addLayer(layer);

  // opacitySlider.addEventListener("input", () => {
  //   layer.setAltitude(Number.parseFloat(opacitySlider.value) * 1000000);
  // });
}
