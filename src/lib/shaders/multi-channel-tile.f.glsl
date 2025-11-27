precision highp float;
precision highp int;

uniform sampler2D tex;
uniform float rasterEncodingPolynomialSlope;
uniform float rasterEncodingPolynomialOffset;
uniform float colormapRangeMin;
uniform float colormapRangeMax;
uniform sampler2D colormapTex;
in vec2 vPositionUnit;
out vec4 fragColor;

// Scales a value from the colormap range (in real-world unit)
// to [0, 1]
float rescaleToTexture(float realWorldValue) {
  return (realWorldValue - colormapRangeMin) / (colormapRangeMax - colormapRangeMin);
}

// Looks up the colormaps color from a given real world unit
vec4 getTextureColor(float realWorldValue) {
  float unitPosition = rescaleToTexture(realWorldValue);
  return texture(colormapTex, vec2(unitPosition, 0.5));
}

void main()  {
  vec4 texColor = texture(tex, vPositionUnit);

  // For this test, we use the define RASTER_ENCODING_CHANNELS to know on what channel
  // the value to display is encoded
  // those channels will then be addressed as relevantChannels.x .y and .z

  float x = 0.;

  #if RASTER_ENCODING_NB_CHANNELS == 1
    x = texColor.RASTER_ENCODING_CHANNELS * 255.;
  #elif RASTER_ENCODING_NB_CHANNELS == 2
    vec2 relevantChannels = texColor.RASTER_ENCODING_CHANNELS;
    x = (relevantChannels.x * 255.) * 256. + (relevantChannels.y * 255.);
  #elif RASTER_ENCODING_NB_CHANNELS == 3
    vec3 relevantChannels = texColor.RASTER_ENCODING_CHANNELS;
    x = (relevantChannels.x * 255.) * 256. * 256. + (relevantChannels.y * 255.) * 256. + (relevantChannels.z * 255.);
  #endif

  // The value in real world unit
  float y = rasterEncodingPolynomialSlope * x + rasterEncodingPolynomialOffset;

  fragColor = getTextureColor(y);
}