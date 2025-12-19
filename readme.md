
The library `maplibre-gl-shader-layer` provides the building blocks to easily create your own tiled layers for MaplibreGL JS using WebGL and shader code. Under the hood, it's using ThreeJS to make it even easier to get started.

## Core components
### `BaseShaderTiledLayer`
The class `BaseShaderTiledLayer` is the one to inherit from when creating a new type of layer. It contains all the logic to:
- create WebGL tile polygons for each tile visible on the viewport
- instanciate a proper layer, following the Maplibre GL JS recommandations
- hook the proper rendering functions to sync with Maplibre

In addition, it loads the default vertex shader that is compatible with both the globe and Mercator projections. Note that the library does not force you to use this specific shader and that you can write your own, based or not on `src/lib/shaders/globe-tile.v.glsl`.

### `Colormap` and `ColormapDescriptionLibrary`

### `RemoteTileTextureManager`

### Extra tools
(what's in `lib/core/tools.ts`)

## Built-in layers
### `DummyGradientTiledLayer`

### `DaylightTiledLayer`

### `RemoteTextureTiledLayer`

### `CanvasTextureTiledLayer`

### `MultiChannelSeriesTiledLayer`

## Implement your own tiled layer
