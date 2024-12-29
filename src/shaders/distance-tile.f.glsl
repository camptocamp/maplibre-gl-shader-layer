precision highp float;
precision highp int;

uniform sampler2D tex;
uniform float zoom;
uniform vec3 tileIndex;
uniform float phase;

in vec2 vPositionUnit;
out vec4 fragColor;

vec3 numberToColor(float num) {
  // Ensure input is in range 0-255
  float n = clamp(num, 0.0, 255.0);
  
  // Use golden ratio to create well-distributed colors
  float golden_ratio = 0.618033988749895;
  
  // Generate three different offsets using the input number
  float h1 = fract(n * golden_ratio);
  float h2 = fract(h1 + golden_ratio);
  float h3 = fract(h2 + golden_ratio);
  
  // Convert to RGB - each component will be between 0 and 1
  return vec3(
    0.7 + 0.3 * sin(h1 * 6.28318),
    0.7 + 0.3 * sin(h2 * 6.28318),
    0.7 + 0.3 * sin(h3 * 6.28318)
  );
}

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


  // // DEBUG COUNTRY vs WATER
  // fragColor = countryCode == 0 ? vec4(0., 0., 1., 0.25) : vec4(1., 0., 0., 0.25);
  // return;

  float zoomToTileZoomCompensation = 1. + zoom - tileIndex.z;

  float range = distance256 * 12. * zoomToTileZoomCompensation;
  

  // Water
  if (countryCode == 0) {
    if (range < .01 || range >= 1.) {
      discard;
      return;
    }

    
    float shade = cos(range * 80. + phase) * (1. - range) * 0.5;
    vec3 waveColor = vec3(0., 99., 229.) / 255.;

    // Fading linearly from zoom level 11.5 to 12.5
    float fadeFactorWater = max(0., min(1., 12.5 - zoom));

    fragColor = vec4(waveColor.rgb, shade * fadeFactorWater);
    return;
  }

  // non-water
  // Fading linearly from zoom level 8.5 to 9.5
  float fadeFactorLand = max(0., min(1., 9.5 - zoom));
  vec3 countryColor = numberToColor(float(countryCode));
  fragColor = vec4(countryColor.rgb, 0.1 *(1. - (range * 1.5)) * fadeFactorLand);
}