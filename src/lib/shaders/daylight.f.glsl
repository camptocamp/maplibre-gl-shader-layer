precision highp float;
precision highp int;

#define PI 3.141592653589793
#define RAD (PI / 180.0)

uniform float u_colormapRangeMin;
uniform float u_colormapRangeMax;
uniform sampler2D u_colormapTex;
uniform float u_zoom;
uniform float u_opacity;
uniform float u_sunCoordRa;
uniform float u_sunCoordDec;
uniform float u_sideralTimeComponent;

in vec2 v_lonLat;
out vec4 fragColor;

float getSunAltitude(vec2 lonLat) {
    float lng = lonLat.x;
    float lat = lonLat.y;
    
    float lw = RAD * -lng;
    float phi = RAD * lat;

    // Note: important to decompose this into some trigonometry annoyance so that numerical precision is kept on GPU
    // Going from:
    // float H = (u_sideralTimeComponent - lw) - u_sunCoordRa;
    // and
    // float cosH = cos(u_sideralTimeComponent - (lw + u_sunCoordRa));
    // to this:
    float cosH = cos(u_sideralTimeComponent) * cos(lw + u_sunCoordRa) + sin(u_sideralTimeComponent) * sin(lw + u_sunCoordRa);
    return asin(sin(phi) * sin(u_sunCoordDec) + cos(phi) * cos(u_sunCoordDec) * cosH);
}



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


void main()  {
  float sunAltitude = getSunAltitude(v_lonLat);
  float altitudeDeg = sunAltitude * 180.0 / PI; // 90° is zenith, 0° is at horizon level
  fragColor = getTextureColor(altitudeDeg);
  fragColor.a *= u_opacity;
}