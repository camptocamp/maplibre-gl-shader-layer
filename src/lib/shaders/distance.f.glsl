precision highp float;
precision highp int;

#define PI 3.141592653589793
#define RAD (PI / 180.0)
#define EARTH_RADIUS 6371008.8

uniform vec2 u_referencePosition;
uniform float u_colormapRangeMin;
uniform float u_colormapRangeMax;
uniform sampler2D u_colormapTex;
uniform float u_opacity;

in vec2 v_lonLat;
out vec4 fragColor;


// Scales a value from the colormap range (in real-world unit)
// to [0, 1]
float rescaleToTexture(float realWorldValue) {
  return (realWorldValue - u_colormapRangeMin) / (u_colormapRangeMax - u_colormapRangeMin);
}

// Looks up the colormaps color from a given real world unit
vec4 getTextureColor(float realWorldValue) {
  float unitPosition = rescaleToTexture(realWorldValue);
  return texture(u_colormapTex, vec2(unitPosition, 0.5));
}


// Haversine formula for distance. This version is slightly modified
// and designed specifically for float32 so that trig functions
// do not play with too small values (iow: preventing float32 truncation) 
float distanceKm(vec2 from, vec2 to) {
  float lat1 = from.y * RAD;
  float lat2 = to.y * RAD;
  float dLat = (to.y - from.y) * RAD;
  float dLon = (to.x - from.x) * RAD;
  
  // Haversine formula - more stable for short distances
  float sinHalfDLat = sin(dLat * 0.5);
  float sinHalfDLon = sin(dLon * 0.5);
  
  float a = sinHalfDLat * sinHalfDLat + 
            cos(lat1) * cos(lat2) * sinHalfDLon * sinHalfDLon;
  
  float c = 2.0 * atan(sqrt(a), sqrt(1.0 - a));
  
  return EARTH_RADIUS * c / 1000.0;
}


void main()  {
  float distance = distanceKm(u_referencePosition, v_lonLat);
  fragColor = getTextureColor(distance);
  fragColor.a *= u_opacity;
}