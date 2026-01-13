
The library `maplibre-gl-shader-layer` provides the building blocks to easily create your own tiled layers for MaplibreGL JS using WebGL and shader code with hooks to tune uniforms for each tile.   
Under the hood, it's using ThreeJS to make it even easier to get started.

## Core tools

### `Colormap` and `ColormapDescriptionLibrary`
The colormap module is not directly related to the layer logic and is instead a transverse component that can be handy for data visualization.  

The `Colormap` constructor is **not** to be called directly and instead, the static factory function `Colormap.fromColormapDescription(colormapDescription, scaling)` must be used. As in the foloowing:

```ts
const colormap = Colormap.fromColormapDescription(ColormapDescriptionLibrary.turbo, { min: -25, max: 40, reverse: false });
```

The module `ColormapDescriptionLibrary` contains descriptions for many popular colormaps (blackbody, viridis, inferno, etc.) that are all scaled in the interval [0, 1]. The `scaling` will adjust the provided description to new bounds and optionnaly reverse the colormap.

While this module contains already many colormaps, it's quite easy to create a custom description:
```ts
const lagoonDescription = [
  0,   "#1a3a5c",
  0.2, "#2d5f7c",
  0.4, "#4a8a9c",
  0.6, "#7ab5ac",
  0.8, "#b0d8b4",
  1,   "#e8f5d8"
];

const lagoonColormap = const colormap = Colormap.fromColormapDescription(lagoonDescription);
```

A Colormap instance exposes several methods:
- `getRgbColorAt(...)`: get a color for a specific value
- `createCanvasElement(...)`: get a Canvas representation of the colormap (handy for legend)
- `createImageBlob(...)`: get a PNG image blob of the colormap (handy for legend)
- `createImageObjectURL(...)`: get the URL to an image blob (handy for legend)
- `getLabels(...)`: get the labels (handy for legend)
- `getRange()`: get the range of the colormap
- `getTexture(...)`: get a webGL/ThreeJS texture representation of the colormap


### `RemoteTileTextureManager`
An instance of `RemoteTileTextureManager` is encapsulating the logic of fetching a tile texture based on a URL pattern such as `https://example.com/{z}/{x}/{y}.png`. In addition to the fetching, it also contains a cache and the logic to turn an image into a compatible WebGL texture. As a result, even thought it is by no means mandatory to use, it is still handy to rely on it to create a textures pool from distant tile files.

You can find a usage of it in [RemoteTextureTiledLayer](src/lib/layers/RemoteTextureTiledLayer.ts).

### `TileTextureManager`
An instance of `TileTextureManager`, is also encapsulating some texture creation and caching logic, but contrary to `RemoteTileTextureManager`, a texture-creation function (async) must be provided to the `.getTexture(...)` method to instruct how to generate the texture in case it's not already in cache.

You can find a usage of it in [CanvasTextureTiledLayer](src/lib/layers/CanvasTextureTiledLayer.ts)

### Extra tools
Some extra functions can be found in the [tool.ts](`lib/core/tools.ts`) file, for instance about coordinate conversions or tile logic. These used by core logic but can also be handy for custom layers.



## Built-in layers
### `BaseShaderTiledLayer`
The class `BaseShaderTiledLayer` is the one to inherit from when creating a new type of layer. It contains all the logic to:
- create WebGL tile polygons for each tile visible on the viewport
- instanciate a proper layer, following the Maplibre GL JS recommandations
- hook the proper rendering functions to sync with Maplibre

In addition, it loads the default vertex shader that is compatible with both the globe and Mercator projections. Note that the library does not force you to use this specific shader and that you can write your own, based or not on `src/lib/shaders/globe-tile.v.glsl`.

The class `BaseShaderTiledLayer` is designed to be extended and not to be used as is. The simplest example of an extension would be (DummyGradientTiledLayer)[src/lib/layers/DummyGradientTiledLayer.ts].


### `DummyGradientTiledLayer`
The (DummyGradientTiledLayer)[src/lib/layers/DummyGradientTiledLayer.ts] is an example of how to extend `BaseShaderTiledLayer`. An actual demo can be found at [dummy.ts](src/demos/dummy.ts). 
![dummy-demo](resources/screenshots/dummy.png)


### `DaylightTiledLayer`

### `RemoteTextureTiledLayer`

### `CanvasTextureTiledLayer`

### `MultiChannelSeriesTiledLayer`

## Implement your own tiled layer
