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

  // For this test, we use only the channels "gb"
  vec2 relevantChannels = texColor.gb;

  // those channels will then be addressed as relevantChannels.x and relevantChannels.y

  // The value x is the value as encoded on the multiple channels as uint:
  float x = (relevantChannels.x * 255.) * 256. + (relevantChannels.y * 255.);

  // The value in real world unit
  float y = rasterEncodingPolynomialSlope * x + rasterEncodingPolynomialOffset;

  fragColor = getTextureColor(y);
}