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
    0.5 + 0.5 * sin(h1 * 6.28318),
    0.5 + 0.5 * sin(h2 * 6.28318),
    0.5 + 0.5 * sin(h3 * 6.28318)
  );
}

void main()  {
  // DEBUG RED
  // fragColor = vec4(1., 0., 0., 0.5);
  // return;

  vec4 texData = texture(tex, vPositionUnit);

  // The distance is encoded on the channels R and G, composing a uint16 number
  // where the R channel is most significant uint8 and G is the least significant.
  // Then, this value must be divided by 64 to get a distance value in [0, 1023];
  float distance1024 = (texData.r * 256. + texData.g) / 64.;
  float distance256 = distance1024 / 4.;

  // Country code is encoded on the blue channel
  int countryCode = int(texData.b * 255.);


  // // DEBUG COUNTRY vs WATER
  // fragColor = countryCode == 0 ? vec4(0., 0., 1., 0.25) : vec4(1., 0., 0., 0.25);
  // return;

  float zoomToTileZoomCompensation = 1. + zoom - tileIndex.z;

  float range = distance256 * 15. * zoomToTileZoomCompensation;
  

  // Water
  if (countryCode == 0) {
    if (range < .01 || range >= 1.) {
      discard;
      return;
    }

    
    float shade = cos(range * 80. - phase) * (1. - range) * 0.5;
    vec3 waveColor = vec3(0., 99., 229.) / 255.;

    fragColor = vec4(waveColor.rgb, shade);
    return;
  }

  // non-water

  vec3 countryColor = numberToColor(float(countryCode));
  fragColor = vec4(countryColor.rgb, 1. - (range*3.));
  
}