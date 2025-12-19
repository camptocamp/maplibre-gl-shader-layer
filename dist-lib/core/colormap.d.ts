import { CanvasTexture } from 'three';
import { ColorLike } from 'color';
export type ColormapDescription = (number | ColorLike)[];
type RgbaArray = [number, number, number, number];
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
export declare class Colormap {
    private readonly keyPointValues;
    private readonly rgbColors;
    private readonly minValue;
    private readonly maxValue;
    /**
     * The constructor should not be used to instanciate a Colormap, use Colormap.fromColormapDescription()
     * factory function instead.
     */
    private constructor();
    getRgbColorAt(value: number, gradient?: boolean): RgbaArray;
    /**
     * Generates a canvas HTML element containing the colormap
     */
    createCanvasElement(options?: ColormapImageCreationOption): HTMLCanvasElement;
    /**
     * Create a PNG image Blob that contains the colormap
     */
    createImageBlob(options?: ColormapImageCreationOption): Promise<Blob>;
    /**
     * Create an ObjectURL pointing to an in-memory PNG image of the colormap
     * (convenient to use as a <img> src attribute)
     */
    createImageObjectURL(options?: ColormapImageCreationOption): Promise<string>;
    /**
     * Get range labels for the colormap.
     * The minimum is 2 (at start and finish)
     * if more than 2, then equally spaced in between
     */
    getLabels(options?: {
        numberOfLabels?: number;
        round?: boolean;
    }): number[];
    /**
     * Returns the range on which is defined the colormap
     */
    getRange(): {
        min: number;
        max: number;
    };
    /**
     * Returns a ThreeJS texture representing this colormap
     */
    getTexture(options?: ColormapImageCreationOption): CanvasTexture;
    /**
     * Splits the colormap description in two arrays: an array with only the keyPointValues,
     * and another one with only colors
     */
    static split(colormapDescription: ColormapDescription): [unknown[], unknown[]];
    /**
     * @returns true if the colormap description is valid, false otherwise.
     */
    static isColormapDescriptionValid(colormapDescription: ColormapDescription): boolean;
    /**
     * Factory function that performs some verification before instantiating a Colormap
     * (the Colormap constructor is private)
     */
    static fromColormapDescription(colormapDescription: ColormapDescription, scaling?: {
        min: number;
        max: number;
        reverse?: boolean;
    }): Colormap;
    /**
     * Returns true if the color is valid, false if not
     */
    static isColorValid(color: unknown): boolean;
    /**
     * Turns any color into a RGBA array (with alpha in [0, 255])
     */
    static colorToRgba(color: ColorLike): RgbaArray;
}
export {};
