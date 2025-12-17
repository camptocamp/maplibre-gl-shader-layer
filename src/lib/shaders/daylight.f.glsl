precision highp float;
precision highp int;

#define PI 3.141592653589793
#define RAD (PI / 180.0)

uniform float colormapRangeMin;
uniform float colormapRangeMax;
uniform sampler2D colormapTex;
uniform float zoom;
uniform vec3 tileIndex;
uniform float opacity;
uniform float sunCoordRa;
uniform float sunCoordDec;
uniform float sideralTimeComponent;

in vec2 vPositionUnit;
in vec2 vLonLat;
out vec4 fragColor;

float getSunAltitude(vec2 lonLat) {
    float lng = lonLat.x;
    float lat = lonLat.y;
    
    float lw = RAD * -lng;
    float phi = RAD * lat;

    // Note: important to decompose this into some trigonometry annoyance so that numerical precision is kept on GPU
    // Going from:
    // float H = (sideralTimeComponent - lw) - sunCoordRa;
    // and
    // float cosH = cos(sideralTimeComponent - (lw + sunCoordRa));
    // to this:
    float cosH = cos(sideralTimeComponent) * cos(lw + sunCoordRa) + sin(sideralTimeComponent) * sin(lw + sunCoordRa);
    return asin(sin(phi) * sin(sunCoordDec) + cos(phi) * cos(sunCoordDec) * cosH);
}



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
  float sunAltitude = getSunAltitude(vLonLat);
  float altitudeDeg = sunAltitude * 180.0 / PI; // 90° is zenith, 0° is at horizon level
  fragColor = getTextureColor(altitudeDeg);
  fragColor.a *= opacity;
}