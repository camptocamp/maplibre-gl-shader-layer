precision highp float;
precision highp int;

uniform sampler2D tex;
uniform float zoom;
uniform vec3 tileIndex;
uniform float phase;

in vec2 vPositionUnit;
out vec4 fragColor;

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

  
  

  // The code of the country is a uint16 on B and A channels,
  // but this has to be read on a center-pixel way to avoid linear interpolation.
  // vec2 textureSize = vec2(1024., 1024.);
  // vec2 centerPixelCoords = floor(vPositionUnit * textureSize) * textureSize;
  // vec4 texDataCenterPixel = texture(tex, centerPixelCoords);
  // int countryCode = int((texDataCenterPixel.b * 256. + texDataCenterPixel.a) * 255.);  

  // When country code is encoded on multiple chan
  // int countryCode = int((texData.b * 256. + texData.a) * 255.);

  // When country code is encoded on a single chan
  int countryCode = int(texData.b * 255.);


  // // DEBUG COUNTRY vs WATER
  // fragColor = countryCode == 0 ? vec4(0., 0., 1., 0.25) : vec4(1., 0., 0., 0.25);
  // return;

  float zoomToTileZoomCompensation = 1. + zoom - tileIndex.z;

  float range = distance256 * 10. * zoomToTileZoomCompensation;

  // fragColor = vec4(1., 0., 0., range);
  // return;
  

  // if (range < .01) {
  //   fragColor = vec4(1., 0., 0., 0.5);
  //   return;
  // }

  if (range < .01 || range >= 1. || countryCode != 0) {
    discard;
    return;
  }

  // float shade = cos(range * 200.) * (1. - range) * 0.4;
  float shade = cos(range * 75. - phase) * (1. - range) * 0.5;

  vec3 waveColor = vec3(0., 99., 229.) / 255.;

  // if (countryCode != 0) {
  //   fragColor = vec4(0., 0., 0., 0.);
  //   return;
  // }


  fragColor = vec4(waveColor.rgb, shade);
  


  // fragColor = vec4(0., 0., 0., 0.3);
  
}