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
  900_00, "#000064",
  950_00, "#0000FF",
  980_00, "#0000FF",
  1000_00, "#FFFFFF",
  1020_00, "#FF0000",
  1080_00, "#640000"
];

// export const cloudCoverGray = [
//   0, "#c7edff",
//   20, "#c7edff",
//   50, "#7797a6",
//   80, "#394a52",
//   100, "#1c2124",
// ]

export const cloudCoverGray = [
  0, "#1a4d6b",      // Deep blue (clear sky)
  25, "#4a7a9a",     // Medium blue
  50, "#8ba8bb",     // Light blue-gray (transition point)
  75, "#b5c4cd",     // Light warm gray
  100, "#f5fbff",    // Very light gray (overcast)
]

// export const cloudCoverGray = [
//   0, "#1a4d6b",      // Deep blue (clear sky)
//   25, "#2d6a8f",     // Medium blue
//   50, "#4b8bb5",     // Bright blue (end of blue range)
//   75, "#c9a87c",     // Warm tan/ochre
//   100, "#f5e6d3",    // Light cream (overcast)
// ]

// export const cloudCoverGray = [
//   0, "#0066cc",      // Vibrant blue
//   15, "#1a8cff",     // Bright blue
//   30, "#4da6ff",     // Sky blue
//   45, "#80c1ff",     // Light bright blue
//   50, "#b3daff",     // Very light blue (transition)
//   55, "#ffd699",     // Light warm peach
//   70, "#ffb84d",     // Bright orange
//   85, "#ff9933",     // Vibrant orange
//   100, "#ff8800",    // Deep bright orange
// ]

// export const cloudCoverGray = [
//   0, "#440154",      // Deep purple
//   20, "#3b528b",     // Purple-blue
//   40, "#21918c",     // Teal
//   60, "#5ec962",     // Green
//   80, "#fde724",     // Yellow
//   100, "#fde724",    // Bright yellow
// ]


// export const cloudCoverGray = [
//   0, "#1a3a5c",      // Dark blue
//   20, "#2d5f7c",     // Medium blue
//   40, "#4a8a9c",     // Blue-teal
//   60, "#7ab5ac",     // Teal-green
//   80, "#b0d8b4",     // Light green
//   100, "#e8f5d8",    // Very light green/cream
// ]


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


const hundred = 100;
export const percent = [
  0.00 * hundred, "#003d5c",
  0.05 * hundred, "#004d73",
  0.10 * hundred, "#005d8a",
  0.15 * hundred, "#006da0",
  0.20 * hundred, "#1e7db5",
  0.25 * hundred, "#4a8dc9",
  0.30 * hundred, "#759ddb",
  0.35 * hundred, "#9eadeb",
  0.40 * hundred, "#c5bdf8",
  0.45 * hundred, "#e0cdf9",
  0.50 * hundred, "#f5ddf4",
  0.55 * hundred, "#ffdeec",
  0.60 * hundred, "#ffdfe5",
  0.65 * hundred, "#ffe1dd",
  0.70 * hundred, "#ffe4d6",
  0.75 * hundred, "#ffe8cf",
  0.80 * hundred, "#ffecc9",
  0.85 * hundred, "#fff0c4",
  0.90 * hundred, "#fff4c0",
  0.95 * hundred, "#fff8bd",
  1.00 * hundred, "#fffcbb"
];

export const magmaPercent = [
  0,   "#000004", // very dark purple (start)
  10,  "#140e36",
  25,  "#3b0f70",
  40,  "#731f81",
  55,  "#b73779",
  70,  "#f1605d",
  85,  "#fd9f6b",
  100, "#fcfdbf", // pale yellow (end)
];


export const infernoPercent = [
  0,   "#000004", // deep black-purple
  10,  "#1f0c48",
  25,  "#51127c",
  40,  "#832681",
  55,  "#c03a76",
  70,  "#ed6925",
  85,  "#fb9f06",
  100, "#fcffa4", // bright yellow-white
];


export const redYellowGreenPercent = [
  0, "#420000",
  27, "#A11B1B",
  73, "#EBD059",
  100, "#A2FF99",
]

export const purpleRedCreamPercent = [
  0, "#2B0C47",
  7, "#4B1370",
  50, "#DB1616",
  93, "#FFDDAD",
  100, "#FFF9ED",
]


export const blueGreenCreamPercent = [
  0, "#000917",
  7, "#001940",
  52, "#279165",
  76, "#5BD95B",
  90, "#C6FA9B",
  100, "#C6FA9B",
]


export const bluePercent = [
  0, "#08001C",
  5, "#06044D",
  35, "#090979",
  91, "#4FE2FF",
  100, "#FFFFFF",
]