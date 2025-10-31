import { CanvasTexture } from "three";

export type ColormapDescription = (number | string)[];
type RgbArrayColor = [number, number, number];
type ColormapImageCreationOption = {
  /**
   * Whether the canvas is a horizontal image (`true`) or vertical image (`false`).
   * Default: `true`
   */
  horizontal?: boolean;

  /**
   * Width of the canvas if horizontal, or height of the canvas if vertical.
   * The other dimension is of size 1px.
   * Default: `250`
   */
  size?: number;

  /**
   * Whether the colormap is rendered as gradient (true) or as classes (false)
   */
  gradient?: boolean,
};

export class Colormap {
  public static readonly validHexColorCharacters = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
  ];
  private readonly keyPointValues: number[];
  private readonly rgbColors: RgbArrayColor[];
  private readonly minValue: number;
  private readonly maxValue: number;

  /**
   * The constructor should not be used to instanciate a Colormap, use Colormap.fromColormapDescription()
   * factory function instead.
   */
  private constructor(colormapDescription: ColormapDescription) {
    this.minValue = colormapDescription[0] as number;
    this.maxValue = colormapDescription.at(-2) as number;
    this.keyPointValues = colormapDescription.filter((_, i) => i % 2 === 0) as number[];
    this.rgbColors = (colormapDescription.filter((_, i) => i % 2 === 1) as string[]).map(
      (hexColor) => Colormap.hexToRgb(hexColor),
    );
  }

  getRgbColorAt(value: number, gradient = true): RgbArrayColor {
    if (value <= this.minValue) {
      return this.rgbColors[0] as RgbArrayColor;
    }

    if (value >= this.maxValue) {
      return this.rgbColors.at(-1) as RgbArrayColor;
    }

    for (let i = 0; i < this.keyPointValues.length - 1; i += 1) {
      if (value === this.keyPointValues[i]) {
        return this.rgbColors[i] as RgbArrayColor;
      }

      const lowerKeyPointValue = this.keyPointValues[i] as number;
      const upperKeyPointValue = this.keyPointValues[i + 1] as number;

      if (value > lowerKeyPointValue && value < upperKeyPointValue) {
        const lowerColor = this.rgbColors[i] as RgbArrayColor;
        if (!gradient) {
          return lowerColor;
        }

        const upperColor = this.rgbColors[i + 1] as RgbArrayColor;
        const lowerToUpperKeyPointDistance = upperKeyPointValue - lowerKeyPointValue;
        const lowerKeyPointToValueDistance = value - lowerKeyPointValue;
        const weightUpper = lowerKeyPointToValueDistance / lowerToUpperKeyPointDistance;
        const weightLower = 1 - weightUpper;

        return [
          Math.trunc(lowerColor[0] * weightLower + upperColor[0] * weightUpper),
          Math.trunc(lowerColor[1] * weightLower + upperColor[1] * weightUpper),
          Math.trunc(lowerColor[2] * weightLower + upperColor[2] * weightUpper),
        ] as RgbArrayColor;
      }
    }
    // Should not happen
    return [0, 0, 0];
  }

  /**
   * Generates a canvas HTML element containing the colormap
   */
  createCanvasElement(options: ColormapImageCreationOption = {}): HTMLCanvasElement {
    const size = options.size ?? 250;
    const canvas = document.createElement('canvas');
    const horizontal = options.horizontal ?? true;
    const gradient = options.gradient ?? true;
    canvas.width = horizontal ? size : 1;
    canvas.height = horizontal ? 1 : size;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Canvas context is missing');

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const imageDataArray = imageData.data;

    const valueSpan = this.maxValue - this.minValue;
    const valueStep = valueSpan / size;

    for (let i = 0; i < size; i += 1) {
      const color = this.getRgbColorAt(this.minValue + i * valueStep, gradient);

      imageDataArray[i * 4] = color[0];
      imageDataArray[i * 4 + 1] = color[1];
      imageDataArray[i * 4 + 2] = color[2];
      imageDataArray[i * 4 + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Create a PNG image Blob that contains the colormap
   */
  async createImageBlob(options: ColormapImageCreationOption = {}): Promise<Blob> {
    const colormapCanvas = this.createCanvasElement(options);
    return new Promise((resolve, reject) => {
      colormapCanvas.toBlob((blob: Blob | null) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('The blob cound not be generated out of the canvas.'));
        }
      }, 'image/png');
    });
  }

  /**
   * Create an ObjectURL pointing to an in-memory PNG image of the colormap
   * (convenient to use as a <img> src attribute)
   */
  async createImageObjectURL(options: ColormapImageCreationOption = {}): Promise<string> {
    const colormapImageBlob = await this.createImageBlob(options);
    return URL.createObjectURL(colormapImageBlob);
  }

  /**
   * Get range labels for the colormap.
   * The minimum is 2 (at start and finish)
   * if more than 2, then equally spaced in between
   */
  getLabels(
    options: {
      numberOfLabels?: number;
      round?: boolean;
    } = {},
  ): number[] {
    const numberOfLabels = options.numberOfLabels ?? 3;
    const round = options.round ?? true;

    if (numberOfLabels < 2) {
      throw new Error('At least 2 labels.');
    }

    let labels = [this.minValue, this.maxValue];
    const remainingLabels = numberOfLabels - 2;

    if (remainingLabels) {
      const range = this.maxValue - this.minValue;
      const labelStep = range / (remainingLabels + 1);
      for (let i = 1; i < numberOfLabels - 1; i += 1) {
        labels.push(this.minValue + labelStep * i);
      }
    }

    labels.sort((a, b) => a - b);

    if (round) {
      labels = labels.map(Math.round);
    }

    return labels;
  }

  /**
   * Returns the range on which is defined the colormap
   */
  getRange(): {min: number, max: number} {
    return {
      min: this.minValue,
      max: this.maxValue,
    }
  }

  /**
   * Returns a ThreeJS texture representing this colormap
   */
  getTexture(options: ColormapImageCreationOption = {}): CanvasTexture {
    const canvasEl = this.createCanvasElement(options);
    return new CanvasTexture(canvasEl);
  }

  /**
   * @returns true if the color is a valid hex color, false otherwise.
   */
  static isValidHexColor(color: unknown): boolean {
    if (typeof color !== 'string') {
      return false;
    }

    if (!color.startsWith('#')) {
      return false;
    }

    if (!(color.length === 4 || color.length === 7)) {
      return false;
    }

    const colorCharacters = Array.from(color.slice(1).toUpperCase());
    return colorCharacters.every((char) =>
      Colormap.validHexColorCharacters.includes(char),
    );
  }

  /**
   * Splits the colormap description in two arrays: an array with only the keyPointValues,
   * and another one with only colors
   */
  static split(colormapDescription: ColormapDescription): [unknown[], unknown[]] {
    return [
      colormapDescription.filter((_, i) => i % 2 === 0),
      colormapDescription.filter((_, i) => i % 2 === 1),
    ];
  }

  /**
   * @returns true if the colormap description is valid, false otherwise.
   */
  static isColormapDescriptionValid(colormapDescription: ColormapDescription): boolean {
    // Must be an array
    if (!Array.isArray(colormapDescription)) {
      return false;
    }

    // Must have an even size
    if (colormapDescription.length % 2 === 1) {
      return false;
    }

    // Must contain at least 4 elements
    if (colormapDescription.length < 4) {
      return false;
    }

    const [keyPointValues, colors] = Colormap.split(colormapDescription);
    const allKeyPointValuesAreNumbers = keyPointValues.every(
      (val) => typeof val === 'number',
    );
    const allColorsAreHex = colors.every((val) => Colormap.isValidHexColor(val));

    // Must not have duplicates in the keypoint values
    if (new Set(keyPointValues).size !== keyPointValues.length) {
      return false;
    }

    return allKeyPointValuesAreNumbers && allColorsAreHex;
  }

  /**
   * @returns a new colormap description with the keypoint values sorted in ascending order.
   */
  static orderColormapDescription(
    colormapDescription: ColormapDescription,
  ): ColormapDescription {
    const pairs: Array<[number, string]> = [];
    for (let i = 0; i < colormapDescription.length; i += 2) {
      pairs.push([
        colormapDescription[i] as number,
        colormapDescription[i + 1] as string,
      ]);
    }
    pairs.sort((a, b) => a[0] - b[0]);
    return pairs.flat();
  }

  /**
   * Convert a hex color such as #FFF into #FFFFFF
   */
  static hexToSixHex(hexColor: string): string {
    if (hexColor.length === 7) {
      return hexColor;
    }
    return `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}`;
  }

  /**
   * Converts a hex color into [r, g, b]
   */
  static hexToRgb(hexColor: string): RgbArrayColor {
    const hexSix = Colormap.hexToSixHex(hexColor).slice(1);
    return [
      Number.parseInt(hexSix.slice(0, 2), 16),
      Number.parseInt(hexSix.slice(2, 4), 16),
      Number.parseInt(hexSix.slice(4, 6), 16),
    ];
  }

  /**
   * Converts an RGB array color into a hex color string
   */
  static rgbToHex(rgbColor: RgbArrayColor): string {
    return `#${((1 << 24) | (rgbColor[0] << 16) | (rgbColor[1] << 8) | rgbColor[2]).toString(16).slice(1)}`;
  }

  /**
   * Factory function that performs some verification before instantiating a Colormap
   * (the Colormap constructor is private)
   */
  static fromColormapDescription(colormapDescription: ColormapDescription): Colormap {
    const isValid = Colormap.isColormapDescriptionValid(colormapDescription);

    if (!isValid) {
      throw new Error('The provided colormap description is invalid');
    }

    const ordered = Colormap.orderColormapDescription(colormapDescription);
    return new Colormap(ordered);
  }
}
