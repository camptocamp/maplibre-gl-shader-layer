import { CanvasTexture } from "three";
import Color, { type ColorLike } from "color";

export type ColormapDescription = (number | ColorLike)[];
type RgbaArray = [number, number, number, number];
const TRANSPARENT_BLACK: RgbaArray = [0, 0, 0, 0];

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
  gradient?: boolean;
};

export class Colormap {
  private readonly keyPointValues: number[];
  private readonly rgbColors: RgbaArray[];
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
    this.rgbColors = (colormapDescription.filter((_, i) => i % 2 === 1) as string[]).map((hexColor) =>
      Colormap.colorToRgba(hexColor),
    );
  }

  /**
   * Get the RGBa color for a given value.
   * With `gradient` set to `true`(default), the colors are interpolated.
   * If `false`, the color is strictly as provided in the description.
   */
  getRgbColorAt(value: number, gradient = true): RgbaArray {
    if (value <= this.minValue) {
      return this.rgbColors[0];
    }

    if (value >= this.maxValue) {
      return this.rgbColors.at(-1) as RgbaArray;
    }

    for (let i = 0; i < this.keyPointValues.length - 1; i += 1) {
      if (value === this.keyPointValues[i]) {
        return this.rgbColors[i];
      }

      const lowerKeyPointValue = this.keyPointValues[i];
      const upperKeyPointValue = this.keyPointValues[i + 1];

      if (value > lowerKeyPointValue && value < upperKeyPointValue) {
        const lowerColor = this.rgbColors[i];
        if (!gradient) {
          return lowerColor;
        }

        const upperColor = this.rgbColors[i + 1];
        const lowerToUpperKeyPointDistance = upperKeyPointValue - lowerKeyPointValue;
        const lowerKeyPointToValueDistance = value - lowerKeyPointValue;
        const weightUpper = lowerKeyPointToValueDistance / lowerToUpperKeyPointDistance;
        const weightLower = 1 - weightUpper;

        return [
          Math.trunc(lowerColor[0] * weightLower + upperColor[0] * weightUpper),
          Math.trunc(lowerColor[1] * weightLower + upperColor[1] * weightUpper),
          Math.trunc(lowerColor[2] * weightLower + upperColor[2] * weightUpper),
          Math.trunc(lowerColor[3] * weightLower + upperColor[3] * weightUpper),
        ] as RgbaArray;
      }
    }

    // Should not happen
    return TRANSPARENT_BLACK;
  }

  /**
   * Generates a canvas HTML element containing the colormap
   */
  createCanvasElement(options: ColormapImageCreationOption = {}): HTMLCanvasElement {
    const size = options.size ?? 250;
    const canvas = document.createElement("canvas");
    const horizontal = options.horizontal ?? true;
    const gradient = options.gradient ?? true;
    canvas.width = horizontal ? size : 1;
    canvas.height = horizontal ? 1 : size;
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas context is missing");

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const imageDataArray = imageData.data;
    const valueSpan = this.maxValue - this.minValue;
    const valueStep = valueSpan / size;

    for (let i = 0; i < size; i += 1) {
      const color = this.getRgbColorAt(this.minValue + i * valueStep, gradient);
      imageDataArray[i * 4] = color[0];
      imageDataArray[i * 4 + 1] = color[1];
      imageDataArray[i * 4 + 2] = color[2];
      imageDataArray[i * 4 + 3] = color[3];
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
          reject(new Error("The blob cound not be generated out of the canvas."));
        }
      }, "image/png");
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
      throw new Error("At least 2 labels.");
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
  getRange(): { min: number; max: number } {
    return {
      min: this.minValue,
      max: this.maxValue,
    };
  }

  /**
   * Returns a ThreeJS texture representing this colormap
   */
  getTexture(options: ColormapImageCreationOption = {}): CanvasTexture {
    const canvasEl = this.createCanvasElement(options);
    return new CanvasTexture(canvasEl);
  }

  /**
   * Splits the colormap description in two arrays: an array with only the keyPointValues,
   * and another one with only colors
   */
  static split(colormapDescription: ColormapDescription): [unknown[], unknown[]] {
    return [colormapDescription.filter((_, i) => i % 2 === 0), colormapDescription.filter((_, i) => i % 2 === 1)];
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
    const allKeyPointValuesAreNumbers = keyPointValues.every((val) => typeof val === "number");

    const allColorsAreHex = colors.every((val) => Colormap.isColorValid(val));

    // Must not have duplicates in the keypoint values
    if (new Set(keyPointValues).size !== keyPointValues.length) {
      return false;
    }

    return allKeyPointValuesAreNumbers && allColorsAreHex;
  }

  /**
   * Factory function that performs some verification before instantiating a Colormap
   * (the Colormap constructor is private)
   */
  static fromColormapDescription(
    colormapDescription: ColormapDescription,
    scaling?: { min: number; max: number; reverse?: boolean },
  ): Colormap {
    const isValid = Colormap.isColormapDescriptionValid(colormapDescription);

    if (!isValid) {
      throw new Error("The provided colormap description is invalid");
    }

    const pairs: Array<[number, string]> = [];
    for (let i = 0; i < colormapDescription.length; i += 2) {
      pairs.push([colormapDescription[i] as number, colormapDescription[i + 1] as string]);
    }
    pairs.sort((a, b) => a[0] - b[0]);

    if (scaling) {
      if (scaling.min > scaling.max) {
        throw new Error("Colormap scaling min must be greater than max.");
      }

      const currentMin = pairs[0][0];
      const currentMax = pairs[pairs.length - 1][0];
      const currentSpan = currentMax - currentMin;
      const targetSpan = scaling.max - scaling.min;

      if (scaling.reverse === true) {
        const pairsClone = structuredClone(pairs);

        for (let i = 0; i < pairs.length; i += 1) {
          const pair = pairs[i];
          const pairClone = pairsClone[pairsClone.length - 1 - i];
          pair[0] = ((pair[0] - currentMin) / currentSpan) * targetSpan + scaling.min;
          pair[1] = pairClone[1];
        }
      } else {
        for (const pair of pairs) {
          pair[0] = ((pair[0] - currentMin) / currentSpan) * targetSpan + scaling.min;
        }
      }
    }

    const ordered = pairs.flat();
    return new Colormap(ordered);
  }

  /**
   * Returns true if the color is valid, false if not
   */
  static isColorValid(color: unknown): boolean {
    try {
      Color(color as ColorLike);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Turns any color into a RGBA array (with alpha in [0, 255])
   */
  static colorToRgba(color: ColorLike): RgbaArray {
    try {
      const colorObj = Color(color);
      return [
        Math.floor(colorObj.red()),
        Math.floor(colorObj.green()),
        Math.floor(colorObj.blue()),
        Math.floor(colorObj.alpha() * 255),
      ];
    } catch (e) {
      return TRANSPARENT_BLACK;
    }
  }
}
