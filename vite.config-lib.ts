import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  mode: "production",
  build: {
    copyPublicDir: false,
    minify: true,
    sourcemap: true,
    outDir: "dist-lib",
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'maplibre-gl-shader-layer',
      fileName: (format, entryName) => "maplibre-gl-shader-layer.js",
      formats: ['es'],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled into your library
      external: [
        "basemapkit",
        "color",
        "maplibre-gl",
        "pmtiles",
        "quick-lru",
        "three",
      ],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {},
      },
    },
  },
  plugins:[
    dts({
      insertTypesEntry: true,
      entryRoot: "src/lib",
    }),
  ],
});