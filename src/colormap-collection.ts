/**
 * Colormap based on TURBO
 * suitable for temperatures in °C in the range [-65, 55]
 */
export const temperatureTurbo = [
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

export const presureBlueWhiteRed = [
  900, "#000064",
  950, "#0000FF",
  980, "#0000FF",
  1000, "#FFFFFF",
  1020, "#FF0000",
  1080, "#640000"
];

export const cloudCoverGray = [
  0, "#c7edff",
  20, "#c7edff",
  50, "#7797a6",
  80, "#394a52",
  100, "#1c2124",
]

export const gradientColormap = [
  0.00, "#003d5c",
  0.05, "#004d73",
  0.10, "#005d8a",
  0.15, "#006da0",
  0.20, "#1e7db5",
  0.25, "#4a8dc9",
  0.30, "#759ddb",
  0.35, "#9eadeb",
  0.40, "#c5bdf8",
  0.45, "#e0cdf9",
  0.50, "#f5ddf4",
  0.55, "#ffdeec",
  0.60, "#ffdfe5",
  0.65, "#ffe1dd",
  0.70, "#ffe4d6",
  0.75, "#ffe8cf",
  0.80, "#ffecc9",
  0.85, "#fff0c4",
  0.90, "#fff4c0",
  0.95, "#fff8bd",
  1.00, "#fffcbb"
];


const maxWindSpeed = 22;
export const wind = [
  0.00 * maxWindSpeed, "#003d5c",
  0.05 * maxWindSpeed, "#004d73",
  0.10 * maxWindSpeed, "#005d8a",
  0.15 * maxWindSpeed, "#006da0",
  0.20 * maxWindSpeed, "#1e7db5",
  0.25 * maxWindSpeed, "#4a8dc9",
  0.30 * maxWindSpeed, "#759ddb",
  0.35 * maxWindSpeed, "#9eadeb",
  0.40 * maxWindSpeed, "#c5bdf8",
  0.45 * maxWindSpeed, "#e0cdf9",
  0.50 * maxWindSpeed, "#f5ddf4",
  0.55 * maxWindSpeed, "#ffdeec",
  0.60 * maxWindSpeed, "#ffdfe5",
  0.65 * maxWindSpeed, "#ffe1dd",
  0.70 * maxWindSpeed, "#ffe4d6",
  0.75 * maxWindSpeed, "#ffe8cf",
  0.80 * maxWindSpeed, "#ffecc9",
  0.85 * maxWindSpeed, "#fff0c4",
  0.90 * maxWindSpeed, "#fff4c0",
  0.95 * maxWindSpeed, "#fff8bd",
  1.00 * maxWindSpeed, "#fffcbb"
];