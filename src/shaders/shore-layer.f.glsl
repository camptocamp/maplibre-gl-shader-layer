precision highp float;
precision highp int;

uniform sampler2D tex;
uniform float zoom;
uniform vec3 tileIndex;
uniform vec3 color;
uniform float phase;
uniform float waveDensity;
uniform float shoreWidth;

in vec2 vPositionUnit;
out vec4 fragColor;



void main()  {
  // beyond zoom level 13, nothing is displayed
  if (zoom >= 13.) {
    discard;
    return;
  }

  // DEBUG RED
  // fragColor = vec4(1., 0., 0., 0.5);
  // return;

  // Get tile texture data with distance encoded on RED+GREEN and country code encoded on BLUE
  vec4 texData = texture(tex, vPositionUnit);

  // We do not want to interpolate the country code,
  // so we want to read it at a center-pixel coordinate
  ivec2 texSize = textureSize(tex, 0); // 0 is the LOD
  ivec2 centerPixelPos = ivec2(
    int(vPositionUnit.x * float(texSize.x)),
    int(vPositionUnit.y * float(texSize.y))
  );
  vec4 texDataCenterPixelPos = texelFetch(tex, centerPixelPos, 0);

  // The distance is encoded on the channels R and G, composing a uint16 number
  // where the R channel is most significant uint8 and G is the least significant.
  // Then, this value must be divided by 64 to get a distance value in [0, 1023];
  // This was so that the encoding on 16 bits is fully leveraged for higher distance precision
  float distance1024 = (texData.r * 256. + texData.g) / 64.;
  float distance256 = distance1024 / 4.;

  // Country code is encoded on the blue channel (on the center-pixel coord)
  int countryCode = int(texDataCenterPixelPos.b * 255.);
  float zoomToTileZoomCompensation = 1. + zoom - tileIndex.z;
  float range = distance256 * 12. * zoomToTileZoomCompensation;
  range *= (1. / shoreWidth);

  // Water
  if (countryCode == 0) {
    if (range < .02 || range >= 1.) {
      discard;
      return;
    }

    float shade = cos(range * 80. * waveDensity + phase) * (1. - range) * 0.5;

    // Fading linearly from zoom level 11.5 to 12.5
    float fadeFactorWater = max(0., min(1., 12.5 - zoom));

    fragColor = vec4(color.rgb, shade * fadeFactorWater);
  } else {
    // The Shore Layer does not display country colors
    discard;
  }

}